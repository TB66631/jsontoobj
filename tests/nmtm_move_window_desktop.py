"""Assign one owned hidden HWND to desktop index 1 without UI input/switching."""
import argparse
import ctypes
import json
import sys
import time


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dll', required=True)
    parser.add_argument('--hwnd', required=True, type=int)
    parser.add_argument('--desktop-index', required=True, type=int)
    parser.add_argument('--owner-pid', required=True, type=int)
    args = parser.parse_args()
    if args.desktop_index != 1 or args.hwnd <= 0:
        raise RuntimeError('Only a nonzero owned HWND and desktop index 1 are allowed')
    dll = ctypes.WinDLL(args.dll)
    dll.GetDesktopCount.argtypes = []
    dll.GetDesktopCount.restype = ctypes.c_int
    dll.GetCurrentDesktopNumber.argtypes = []
    dll.GetCurrentDesktopNumber.restype = ctypes.c_int
    dll.GetWindowDesktopNumber.argtypes = [ctypes.c_void_p]
    dll.GetWindowDesktopNumber.restype = ctypes.c_int
    dll.MoveWindowToDesktopNumber.argtypes = [ctypes.c_void_p, ctypes.c_int]
    dll.MoveWindowToDesktopNumber.restype = ctypes.c_int
    user = ctypes.WinDLL('user32', use_last_error=True)
    dwm = ctypes.WinDLL('dwmapi', use_last_error=True)
    user.GetForegroundWindow.argtypes = []
    user.GetForegroundWindow.restype = ctypes.c_void_p
    user.IsWindowVisible.argtypes = [ctypes.c_void_p]
    user.IsWindowVisible.restype = ctypes.c_int
    user.GetWindowThreadProcessId.argtypes = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_ulong)]
    user.GetWindowThreadProcessId.restype = ctypes.c_ulong
    user.ShowWindow.argtypes = [ctypes.c_void_p, ctypes.c_int]
    user.ShowWindow.restype = ctypes.c_int
    user.SetWindowPos.argtypes = [ctypes.c_void_p, ctypes.c_void_p, ctypes.c_int, ctypes.c_int, ctypes.c_int, ctypes.c_int, ctypes.c_uint]
    user.SetWindowPos.restype = ctypes.c_int
    dwm.DwmSetWindowAttribute.argtypes = [ctypes.c_void_p, ctypes.c_uint, ctypes.c_void_p, ctypes.c_uint]
    dwm.DwmSetWindowAttribute.restype = ctypes.c_long
    dwm.DwmGetWindowAttribute.argtypes = [ctypes.c_void_p, ctypes.c_uint, ctypes.c_void_p, ctypes.c_uint]
    dwm.DwmGetWindowAttribute.restype = ctypes.c_long
    dwm.DwmFlush.argtypes = []
    dwm.DwmFlush.restype = ctypes.c_long
    owner = ctypes.c_ulong()
    user.GetWindowThreadProcessId(args.hwnd, ctypes.byref(owner))
    if owner.value != args.owner_pid:
        raise RuntimeError('HWND does not belong to the owned test PID')
    count = dll.GetDesktopCount()
    current_before = dll.GetCurrentDesktopNumber()
    foreground_before = int(user.GetForegroundWindow() or 0)
    visible_before = bool(user.IsWindowVisible(args.hwnd))
    before = dll.GetWindowDesktopNumber(args.hwnd)
    if count < 2 or current_before != 0 or visible_before:
        raise RuntimeError('Requires two desktops, current desktop index 0, and a still-hidden owned window')
    def cloak_flags():
        flags = ctypes.c_uint()
        hr = dwm.DwmGetWindowAttribute(args.hwnd, 14, ctypes.byref(flags), ctypes.sizeof(flags))
        if hr != 0:
            raise RuntimeError('Cannot read DWM cloak status; HRESULT=' + str(hr))
        return flags.value
    enabled = ctypes.c_int(1)
    cloak_hr = dwm.DwmSetWindowAttribute(args.hwnd, 13, ctypes.byref(enabled), ctypes.sizeof(enabled))
    if cloak_hr != 0:
        raise RuntimeError('DWM app cloak unsupported; no ShowWindow was called; HRESULT=' + str(cloak_hr))
    if dwm.DwmFlush() != 0 or not (cloak_flags() & 1):
        raise RuntimeError('DWM app cloak not verified; no ShowWindow was called')
    registered_while_cloaked = False
    try:
        if before < 0:
            # Never map an uncloaked window. Keep it far outside all monitors
            # and use SW_SHOWNOACTIVATE only after compositor cloak is verified.
            if not user.SetWindowPos(args.hwnd, None, -100000, -100000, 1080, 720, 0x0010 | 0x0004):
                raise RuntimeError('Cannot place cloaked owned window offscreen')
            if not (cloak_flags() & 1):
                raise RuntimeError('App cloak lost before native registration')
            user.ShowWindow(args.hwnd, 4)
            registered_while_cloaked = True
            deadline = time.monotonic() + 1.8
            while dll.GetWindowDesktopNumber(args.hwnd) < 0 and time.monotonic() < deadline:
                if not (cloak_flags() & 1) or int(user.GetForegroundWindow() or 0) != foreground_before or dll.GetCurrentDesktopNumber() != current_before:
                    raise RuntimeError('Safety metadata changed during cloaked registration')
                time.sleep(0.025)
        move_result = dll.MoveWindowToDesktopNumber(args.hwnd, args.desktop_index)
        deadline = time.monotonic() + 0.5
        while dll.GetWindowDesktopNumber(args.hwnd) != args.desktop_index and time.monotonic() < deadline:
            time.sleep(0.025)
        if dll.GetWindowDesktopNumber(args.hwnd) != args.desktop_index:
            raise RuntimeError('Still-cloaked HWND has no verified desktop-2 application view')
        # Prefer hidden, but hidden windows may lose their ApplicationView.
        # If that happens, retain native visibility only under permanent app
        # cloak, still on desktop 2, with focus and show APIs suppressed.
        user.ShowWindow(args.hwnd, 0)
        if dll.GetWindowDesktopNumber(args.hwnd) != args.desktop_index:
            if not (cloak_flags() & 1):
                raise RuntimeError('App cloak lost before restoring native registration')
            user.ShowWindow(args.hwnd, 4)
            dll.MoveWindowToDesktopNumber(args.hwnd, args.desktop_index)
    except Exception:
        user.ShowWindow(args.hwnd, 0)
        raise
    after = dll.GetWindowDesktopNumber(args.hwnd)
    current_after = dll.GetCurrentDesktopNumber()
    foreground_after = int(user.GetForegroundWindow() or 0)
    cloaked_after = cloak_flags()
    result = {
        'hwnd': str(args.hwnd), 'targetDesktopIndex': args.desktop_index,
        'desktopCount': count, 'desktopBefore': before, 'desktopAfter': after,
        'currentDesktopBefore': current_before, 'currentDesktopAfter': current_after,
        'moveResult': move_result, 'verified': after == args.desktop_index,
        'switchedDesktop': current_before != current_after,
        'foregroundBefore': str(foreground_before), 'foregroundAfter': str(foreground_after),
        'foregroundUnchanged': foreground_before == foreground_after,
        'registeredWhileCloaked': registered_while_cloaked, 'dwmAppCloaked': bool(cloaked_after & 1),
        'dwmCloakFlags': cloaked_after, 'nativeVisible': bool(user.IsWindowVisible(args.hwnd)),
    }
    print(json.dumps(result, ensure_ascii=True))
    if not result['verified'] or result['switchedDesktop'] or not result['foregroundUnchanged'] or not result['dwmAppCloaked']:
        user.ShowWindow(args.hwnd, 0)
        return 2
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as error:
        print(json.dumps({'verified': False, 'error': str(error)}))
        sys.exit(3)
