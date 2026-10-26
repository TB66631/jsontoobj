// Test-only native isolation. Never call showInactive before a verified app cloak.
const assert = require('node:assert/strict');
const path = require('node:path');

function nativeApi(koffi, desktopDll) {
  const user = koffi.load('user32.dll');
  const dwm = koffi.load('dwmapi.dll');
  const desktops = koffi.load(desktopDll);
  return {
    foreground: user.func('uintptr_t __stdcall GetForegroundWindow()'),
    visible: user.func('int __stdcall IsWindowVisible(uintptr_t hwnd)'),
    owner: user.func('uint32_t __stdcall GetWindowThreadProcessId(uintptr_t hwnd, _Out_ uint32_t *pid)'),
    title: user.func('int __stdcall GetWindowTextW(uintptr_t hwnd, _Out_ uint16_t *text, int count)'),
    position: user.func('int __stdcall SetWindowPos(uintptr_t hwnd, uintptr_t after, int x, int y, int cx, int cy, uint32_t flags)'),
    hide: user.func('int __stdcall ShowWindow(uintptr_t hwnd, int command)'),
    cloak: dwm.func('int32_t __stdcall DwmSetWindowAttribute(uintptr_t hwnd, uint32_t attribute, const uint32_t *value, uint32_t size)'),
    flags: dwm.func('int32_t __stdcall DwmGetWindowAttribute(uintptr_t hwnd, uint32_t attribute, _Out_ uint32_t *value, uint32_t size)'),
    flush: dwm.func('int32_t __stdcall DwmFlush()'),
    count: desktops.func('int __stdcall GetDesktopCount()'),
    current: desktops.func('int __stdcall GetCurrentDesktopNumber()'),
    windowDesktop: desktops.func('int __stdcall GetWindowDesktopNumber(uintptr_t hwnd)'),
    move: desktops.func('int __stdcall MoveWindowToDesktopNumber(uintptr_t hwnd, int desktop)'),
  };
}

async function isolateWindow(win, state, showInactive, options = {}) {
  const record = options.record || (() => {});
  const sleep = options.sleep || (milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)));
  const ownerPid = options.ownerPid || process.pid;
  const koffiPath = process.env.NMTM_TEST_KOFFI;
  if (!options.api) {
    assert.ok(koffiPath && /^[eE]:[\\/]/.test(path.resolve(koffiPath)), 'Koffi must be an explicitly configured E-drive test dependency');
  }
  const api = options.api || nativeApi(require(koffiPath), process.env.NMTM_TEST_DESKTOP_DLL);
  const hwnd = BigInt(state.handle), owner = [0];
  api.owner(hwnd, owner);
  assert.equal(owner[0], ownerPid, 'Native HWND must belong to this isolated Electron process');
  const count = api.count(), currentBefore = api.current();
  const foregroundBefore = String(api.foreground());
  const foregroundMetadata = handle => {
    const pid = [0], text = Buffer.alloc(1024); api.owner(BigInt(handle), pid);
    const length = api.title ? api.title(BigInt(handle), text, 512) : 0;
    return { hwnd: String(handle), pid: pid[0], title: text.subarray(0, length * 2).toString('utf16le') };
  };
  const foregroundBeforeMetadata = foregroundMetadata(foregroundBefore);
  const desktopBefore = api.windowDesktop(hwnd);
  assert.ok(count >= 2 && currentBefore === 0 && !api.visible(hwnd), 'Requires desktop 1 active, desktop 2 present, and the owned window still hidden');
  const cloakFlags = () => {
    const flags = [0], result = api.flags(hwnd, 14, flags, 4);
    assert.equal(result, 0, 'DwmGetWindowAttribute(DWMWA_CLOAKED) must succeed');
    return flags[0];
  };
  const safe = () => {
    assert.ok(cloakFlags() & 1, 'Permanent DWM app cloak must remain set');
    assert.equal(api.current(), currentBefore, 'Never switch the user desktop');
    const foreground = String(api.foreground());
    if (foreground !== foregroundBefore) record('foreground-invariant-changed', { windowId: win.id, before: foregroundBeforeMetadata, after: foregroundMetadata(foreground), ownedWindowForeground: foreground === state.handle, currentDesktop: api.current(), dwmCloakFlags: cloakFlags() });
    assert.equal(foreground, foregroundBefore, 'Never change the user foreground window');
  };
  const cloakResult = api.cloak(hwnd, 13, [1], 4);
  record('native-cloak-call', { windowId: win.id, hwnd: state.handle, cloakResult, sameProcess: true });
  assert.equal(cloakResult, 0, 'Same-process DwmSetWindowAttribute(DWMWA_CLOAK) must succeed; no showInactive was called');
  assert.equal(api.flush(), 0, 'DwmFlush must succeed before any showInactive');
  safe();
  record('native-cloak-verified-before-show', { windowId: win.id, hwnd: state.handle, dwmCloakFlags: cloakFlags(), currentDesktop: currentBefore, foreground: foregroundBefore });
  let shown = false;
  try {
    if (desktopBefore < 0) {
      assert.ok(api.position(hwnd, 0n, -100000, -100000, 1080, 720, 0x0010 | 0x0004), 'Move only the cloaked owned test window offscreen');
      safe();
      win.__nmtmDesktopCloak = { dwmAppCloaked: true, phase: 'registering', desktopAfter: desktopBefore };
      showInactive.call(win);
      shown = true;
      record('native-showInactive-under-verified-cloak', { windowId: win.id, hwnd: state.handle });
      const deadline = Date.now() + 2500;
      while (api.windowDesktop(hwnd) < 0 && Date.now() < deadline) { safe(); await sleep(25); }
      safe();
      record('native-application-view-polled', { windowId: win.id, desktop: api.windowDesktop(hwnd), dwmCloakFlags: cloakFlags() });
    }
    const moveResult = api.move(hwnd, 1);
    const deadline = Date.now() + 800;
    while (api.windowDesktop(hwnd) !== 1 && Date.now() < deadline) { safe(); await sleep(25); }
    safe();
    const desktopAfter = api.windowDesktop(hwnd);
    assert.equal(desktopAfter, 1, 'The still-cloaked HWND must have a verified desktop-2 application view');
    const result = { hwnd: state.handle, targetDesktopIndex: 1, desktopCount: count, desktopBefore, desktopAfter, currentDesktopBefore: currentBefore, currentDesktopAfter: api.current(), foregroundBefore, foregroundAfter: String(api.foreground()), foregroundUnchanged: true, switchedDesktop: false, verified: true, registeredWhileCloaked: shown, dwmAppCloaked: true, dwmCloakFlags: cloakFlags(), nativeVisible: !!api.visible(hwnd), moveResult, sameProcess: true };
    win.__nmtmDesktopCloak = result;
    return result;
  } catch (error) {
    // Never uncloak. A mapped window is hidden before the caller destroys it.
    if (shown) api.hide(hwnd, 0);
    throw error;
  }
}

module.exports = { nativeApi, isolateWindow };
