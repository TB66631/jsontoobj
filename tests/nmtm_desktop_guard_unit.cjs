// Pure mocks: no GUI, desktop movement, or native library calls.
const assert = require('node:assert/strict');
const { isolateWindow } = require('./nmtm_inprocess_desktop_guard.cjs');
function fixture(overrides = {}) {
  const state = { desktop: -1, flags: 0, shown: 0, hidden: 0, foreground: 900, visible: false };
  const api = { owner(_, output) { output[0] = 123; }, count: () => 2, current: () => 0, foreground: () => state.foreground, visible: () => state.visible, windowDesktop: () => state.desktop, cloak() { state.flags = 1; return 0; }, flags(_, attribute, output) { assert.equal(attribute, 14); output[0] = state.flags; return 0; }, flush: () => 0, position() { assert.equal(state.flags & 1, 1); return 1; }, move(_, desktop) { state.desktop = desktop; return 1; }, hide() { state.hidden++; state.visible = false; }, ...overrides };
  const win = { id: 4 };
  const show = () => { assert.equal(state.flags & 1, 1, 'Cloak exists before showInactive'); state.shown++; state.desktop = 0; state.visible = true; };
  return { state, api, win, show };
}
(async () => {
  { const f = fixture(); const result = await isolateWindow(f.win, { handle: '42' }, f.show, { api: f.api, ownerPid: 123 }); assert.equal(result.desktopAfter, 1); assert.equal(result.dwmAppCloaked, true); assert.equal(f.state.shown, 1); assert.equal(f.state.flags, 1); }
  { const f = fixture({ cloak: () => -2147024891 }); await assert.rejects(isolateWindow(f.win, { handle: '42' }, f.show, { api: f.api, ownerPid: 123 }), /no showInactive was called/); assert.equal(f.state.shown, 0); }
  { const f = fixture({ flags(_, __, output) { output[0] = 0; return 0; } }); await assert.rejects(isolateWindow(f.win, { handle: '42' }, f.show, { api: f.api, ownerPid: 123 }), /cloak must remain/); assert.equal(f.state.shown, 0); }
  { const f = fixture(); const show = () => { f.show(); f.state.foreground = 901; }; await assert.rejects(isolateWindow(f.win, { handle: '42' }, show, { api: f.api, ownerPid: 123 }), /foreground window/); assert.equal(f.state.shown, 1); assert.equal(f.state.hidden, 1); assert.equal(f.state.flags, 1); }
  console.log('PASS native guard offline: cloak-before-show, E_ACCESSDENIED fail closed, missing cloak fail closed, foreground-change hide; no GUI.');
})().catch(error => { console.error(error); process.exitCode = 1; });
