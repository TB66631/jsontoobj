// Runs only from an E-drive test-only Electron runtime. Never edits app.asar.
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { pathToFileURL } = require('node:url');
const { isolateWindow } = require('./inprocess-desktop-guard.cjs');
const electron = require('electron');
const { app, dialog, shell } = electron;

const sourceAsar = process.env.NMTM_BLOCKBENCH_SOURCE_ASAR;
const eventLog = process.env.NMTM_TEST_EVENT_LOG;
const profile = process.env.NMTM_TEST_PROFILE;
if (process.env.NMTM_ALLOW_HIDDEN_GUI !== '1' || !sourceAsar || !eventLog || !profile) {
  throw new Error('Hidden Blockbench bootstrap requires an explicitly authorized isolated test session.');
}
const record = (event, details = {}) => fs.appendFileSync(eventLog, JSON.stringify({ event, pid: process.pid, time: new Date().toISOString(), ...details }) + '\n');
const fail = (event, details) => record(event, { failure: true, ...details });
process.on('uncaughtException', error => { fail('uncaught-exception', { message: String(error.stack || error) }); app.exit(76); });
process.on('unhandledRejection', error => { fail('unhandled-rejection', { message: String(error && error.stack || error) }); app.exit(77); });

app.setPath('userData', profile);
for (const name of ['temp', 'crashDumps', 'sessionData']) {
  const directory = path.join(profile, name); fs.mkdirSync(directory, { recursive: true }); app.setPath(name, directory);
}
app.setAppPath(sourceAsar);
app.disableHardwareAcceleration();
record('bootstrap-ready', { sourceAsar, profile, executable: process.execPath });

const OriginalWindow = electron.BrowserWindow;
const guardedShowInactive = OriginalWindow.prototype.showInactive;
// These methods can map a hidden native window or steal foreground focus on
// Windows. Suppress them before the unmodified Blockbench main module loads.
for (const method of ['show', 'showInactive', 'focus', 'moveTop', 'maximize', 'minimize', 'restore', 'setFullScreen', 'setKiosk', 'setAlwaysOnTop', 'setFocusable', 'flashFrame']) {
  if (typeof OriginalWindow.prototype[method] !== 'function') continue;
  OriginalWindow.prototype[method] = function(...args) { record('suppressed-window-method', { windowId: this.id, method }); };
}
const preload = path.join(__dirname, 'renderer-preload.cjs');
const HiddenWindow = new Proxy(OriginalWindow, {
  construct(target, args, newTarget) {
    const options = args[0] || {};
    const webPreferences = { ...options.webPreferences, preload, backgroundThrottling: false };
    if (options.webPreferences && options.webPreferences.preload) throw new Error('Unexpected existing preload: refusing to discard Blockbench behavior.');
    const hidden = { ...options, show: false, focusable: false, skipTaskbar: true, fullscreen: false, kiosk: false, alwaysOnTop: false, webPreferences };
    record('construct-hidden-window', { requestedShow: options.show, enforcedShow: false, enforcedFocusable: false });
    return Reflect.construct(target, [hidden, ...args.slice(1)], target);
  }
});
// The original installed module remains byte-for-byte unchanged. Its E-drive
// adapter changes only the Electron import binding to this explicit facade.
globalThis.__NMTM_HIDDEN_ELECTRON__ = { ...electron, BrowserWindow: HiddenWindow };
record('electron-import-facade-ready', { originalMainSha256: process.env.NMTM_ORIGINAL_MAIN_SHA256 });

app.on('browser-window-created', (_, win) => {
  const handle = win.getNativeWindowHandle();
  const state = { windowId: win.id, handle: handle.length >= 8 ? handle.readBigUInt64LE(0).toString() : String(handle.readUInt32LE(0)), visible: win.isVisible(), focused: win.isFocused(), focusable: win.isFocusable() };
  record('window-created', state);
  if (state.visible || state.focused || state.focusable) { fail('unsafe-window-created', state); win.destroy(); app.exit(78); return; }
  win.webContents.setWindowOpenHandler(details => { fail('blocked-window-open', { url: details.url }); return { action: 'deny' }; });
  win.on('show', () => {
    if (win.__nmtmDesktopCloak && win.__nmtmDesktopCloak.dwmAppCloaked && (win.__nmtmDesktopCloak.phase === 'registering' || win.__nmtmDesktopCloak.desktopAfter === 1)) { record('native-show-under-permanent-cloak', { windowId: win.id }); return; }
    fail('unexpected-window-show', { windowId: win.id }); win.hide(); app.exit(79);
  });
  win.on('focus', () => { fail('unexpected-window-focus', { windowId: win.id }); win.blur(); app.exit(80); });
  win.webContents.on('console-message', (_, level, message) => {
    if (message.startsWith('NMTM_BLOCKED_DIALOG:')) fail('renderer-dialog', { message });
  });
  win.__nmtmDesktopReady = isolateWindow(win, state, guardedShowInactive, { record }).then(desktop => {
    if (!desktop.verified || desktop.desktopAfter !== 1 || desktop.switchedDesktop || !desktop.foregroundUnchanged || !desktop.dwmAppCloaked) throw new Error('Desktop-2 assignment and permanent cloak not verified');
    record('desktop-assigned', { windowId: win.id, ...desktop });
  }).catch(error => {
    fail('desktop-assignment-failed', { ...state, message: String(error.stack || error) });
    win.hide(); win.destroy(); app.exit(82);
  });
});

// A native dialog must become an auditable test failure, never an OS popup.
const optionsFrom = args => args.find(arg => arg && typeof arg === 'object' && !('webContents' in arg)) || {};
const canceled = options => Number.isInteger(options.cancelId) && options.cancelId >= 0 ? options.cancelId : 0;
for (const method of ['showMessageBox', 'showOpenDialog', 'showSaveDialog', 'showCertificateTrustDialog']) {
  dialog[method] = async (...args) => {
    const options = optionsFrom(args); fail('native-dialog', { method, title: options.title, message: options.message });
    return method === 'showMessageBox' ? { response: canceled(options), checkboxChecked: false } : { canceled: true, filePaths: [], filePath: undefined };
  };
}
dialog.showMessageBoxSync = (...args) => { const options = optionsFrom(args); fail('native-dialog', { method: 'showMessageBoxSync', title: options.title, message: options.message }); return canceled(options); };
dialog.showOpenDialogSync = (...args) => { fail('native-dialog', { method: 'showOpenDialogSync' }); return undefined; };
dialog.showSaveDialogSync = (...args) => { fail('native-dialog', { method: 'showSaveDialogSync' }); return undefined; };
dialog.showErrorBox = (title, message) => { fail('native-dialog', { method: 'showErrorBox', title, message }); };
for (const method of ['openExternal', 'openPath', 'showItemInFolder']) shell[method] = (...args) => { fail('blocked-external-open', { method, target: String(args[0]) }); return Promise.resolve('Blocked in isolated test'); };
if (electron.Notification) electron.Notification.prototype.show = function() { fail('blocked-notification', { title: this.title }); };
if (electron.Menu) electron.Menu.prototype.popup = function() { fail('blocked-native-menu', {}); };

const mainPath = path.join(sourceAsar, 'electron', 'main.js');
const sourceRequire = createRequire(mainPath);
const { autoUpdater } = sourceRequire('electron-updater');
autoUpdater.checkForUpdates = () => { record('suppressed-update-check'); return Promise.resolve(null); };
autoUpdater.downloadUpdate = () => { fail('blocked-update-download', {}); return Promise.resolve([]); };
// Import asynchronously before Electron's ready event so the original module
// retains its own app initialization and still loads the exact shipped assets.
import(pathToFileURL(path.join(__dirname, 'original-main-hidden.mjs')).href).then(() => record('original-main-loaded', { originalMainSha256: process.env.NMTM_ORIGINAL_MAIN_SHA256, adapter: 'Electron import binding and original import.meta.url only' })).catch(error => {
  fail('main-import-error', { message: String(error.stack || error) }); app.exit(81);
});
