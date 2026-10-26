// Pure Node mocks only. Does not start Electron, create windows, or change desktops.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');
const events = [];
const app = new EventEmitter();
Object.assign(app, { setPath() {}, setAppPath() {}, disableHardwareAcceleration() {}, exit(code) { events.push({ event: 'mock-exit', code }); } });
class MockWindow extends EventEmitter {
  constructor(options) {
    super(); this.options = options; this.id = 1; this.visible = options.show !== false; this.focused = false;
    this.webContents = new EventEmitter(); this.webContents.setWindowOpenHandler = handler => { this.openHandler = handler; };
    app.emit('browser-window-created', {}, this);
  }
  getNativeWindowHandle() { const bytes = Buffer.alloc(8); bytes.writeBigUInt64LE(42n); return bytes; }
  isVisible() { return this.visible; }
  isFocused() { return this.focused; }
  isFocusable() { return this.options.focusable !== false; }
  hide() { this.visible = false; }
  blur() { this.focused = false; }
  destroy() { this.destroyed = true; }
}
for (const method of ['show', 'showInactive', 'focus', 'moveTop', 'maximize', 'minimize', 'restore', 'setFullScreen', 'setKiosk', 'setAlwaysOnTop', 'setFocusable', 'flashFrame']) MockWindow.prototype[method] = function() { throw new Error('Unsafe native method reached: ' + method); };
const electron = { app, BrowserWindow: MockWindow, dialog: {}, shell: {}, Notification: class {}, Menu: class {} };
const source = fs.readFileSync(path.join(__dirname, 'nmtm_isolated_electron_main.cjs'), 'utf8');
const importStart = source.indexOf('import(pathToFileURL(path.join(__dirname,');
assert.ok(importStart > 0, 'Original main import anchor');
const scopedSource = source.slice(0, importStart) + 'record("original-main-loaded");';
const mockProcess = new EventEmitter();
Object.assign(mockProcess, { env: { NMTM_ALLOW_HIDDEN_GUI: '1', NMTM_BLOCKBENCH_SOURCE_ASAR: 'source/app.asar', NMTM_TEST_EVENT_LOG: 'in-memory', NMTM_TEST_PROFILE: 'E:/in-memory-profile' }, pid: 123, execPath: 'E:/test/Blockbench.exe' });
const updater = {};
const globals = {
  require(name) {
    if (name === 'electron') return electron;
    if (name === 'node:fs') return { mkdirSync() {}, appendFileSync(_, value) { events.push(JSON.parse(value)); } };
    if (name === 'node:module') return { createRequire() { return () => ({ autoUpdater: updater }); } };
    if (name === './inprocess-desktop-guard.cjs') return { async isolateWindow() { return { verified: true, desktopAfter: 1, switchedDesktop: false, foregroundUnchanged: true, dwmAppCloaked: true }; } };
    return require(name);
  },
  __dirname, process: mockProcess, Buffer, console
};
vm.runInNewContext(scopedSource, globals, { filename: 'nmtm-isolated-main-mock.cjs' });
const win = new globals.__NMTM_HIDDEN_ELECTRON__.BrowserWindow({ show: true, focusable: true, alwaysOnTop: true, webPreferences: { nodeIntegration: true, contextIsolation: false } });
assert.equal(win.options.show, false); assert.equal(win.options.focusable, false); assert.equal(win.options.skipTaskbar, true); assert.equal(win.options.alwaysOnTop, false);
assert.equal(win.options.webPreferences.nodeIntegration, true); assert.equal(win.options.webPreferences.contextIsolation, false);
assert.ok(win.options.webPreferences.preload.endsWith('renderer-preload.cjs'));
for (const method of ['show', 'showInactive', 'focus', 'maximize', 'restore', 'setFullScreen']) win[method]();
assert.equal(win.isVisible(), false); assert.equal(win.isFocused(), false);
assert.equal(events.filter(event => event.failure).length, 0);
electron.dialog.showErrorBox('expected mock error', 'must not display');
assert.ok(events.some(event => event.event === 'native-dialog' && event.failure));
assert.equal(win.openHandler({ url: 'https://example.invalid' }).action, 'deny');
assert.ok(events.some(event => event.event === 'blocked-window-open' && event.failure));
assert.equal(typeof updater.checkForUpdates, 'function');
console.log('PASS offline hidden-bootstrap mocks: construction, focus/show suppression, dialogs, popups, updater. No GUI launched.');
