const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function asarFile(archive, filename) {
  const fd = fs.openSync(archive, 'r');
  try {
    const prefix = Buffer.alloc(16); fs.readSync(fd, prefix, 0, prefix.length, 0);
    const bytes = Buffer.alloc(prefix.readUInt32LE(12)); fs.readSync(fd, bytes, 0, bytes.length, 16);
    let record = JSON.parse(bytes.toString('utf8'));
    for (const part of filename.split('/')) record = record.files[part];
    const data = Buffer.alloc(record.size); fs.readSync(fd, data, 0, data.length, 8 + prefix.readUInt32LE(4) + Number(record.offset));
    return data.toString('utf8');
  } finally { fs.closeSync(fd); }
}
function asarPackage(archive) { return JSON.parse(asarFile(archive, 'package.json')); }

function createHiddenSession(executable, profile, port) {
  assert.equal(process.env.NMTM_ALLOW_HIDDEN_GUI, '1', 'GUI tests are paused. Confirm desktop-2 isolation and explicitly set NMTM_ALLOW_HIDDEN_GUI=1 before running.');
  assert.equal(process.env.NMTM_TEST_VIRTUAL_DESKTOP, '2', 'Refusing to start until the parent runner confirms virtual desktop 2.');
  const sourceExecutable = fs.realpathSync(executable), sourceRoot = path.dirname(sourceExecutable);
  assert.equal(path.basename(sourceExecutable).toLowerCase(), 'blockbench.exe', 'Only the named Blockbench executable may be cloned for this session');
  const sourceAsar = path.join(sourceRoot, 'resources', 'app.asar');
  const python = process.env.NMTM_TEST_PYTHON || 'D:/Program Files/python/python.exe';
  const desktopDllSource = process.env.NMTM_TEST_DESKTOP_DLL_SOURCE || 'C:/Users/Administrator/AppData/Local/Temp/VirtualDesktopAccessor-2019-windows10.dll';
  assert.ok(fs.existsSync(python), 'Configured desktop-guard Python executable must exist');
  assert.ok(fs.existsSync(desktopDllSource), 'Verified desktop accessor DLL must exist');
  const runtimeRoot = path.join(profile, 'isolated-electron-runtime');
  assert.equal(path.parse(runtimeRoot).root.toLowerCase(), path.parse(profile).root.toLowerCase(), 'Isolated Electron runtime must stay on the workspace drive');
  fs.mkdirSync(runtimeRoot, { recursive: true });
  for (const entry of fs.readdirSync(sourceRoot, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const source = path.join(sourceRoot, entry.name), target = path.join(runtimeRoot, entry.name);
    if (!fs.existsSync(target) || fs.statSync(target).size !== fs.statSync(source).size) fs.copyFileSync(source, target);
  }
  const locales = path.join(sourceRoot, 'locales');
  if (fs.existsSync(locales)) fs.cpSync(locales, path.join(runtimeRoot, 'locales'), { recursive: true, force: false, errorOnExist: false });
  const sourceResources = path.join(sourceRoot, 'resources'), runtimeResources = path.join(runtimeRoot, 'resources');
  fs.mkdirSync(runtimeResources, { recursive: true });
  // Copy the shipped unpacked native dependencies and metadata, but omit the
  // shipped app.asar: Electron must resolve our test-only resources/app shim
  // first, while that shim imports the original app.asar by absolute path.
  for (const entry of fs.readdirSync(sourceResources, { withFileTypes: true })) {
    if (entry.name === 'app.asar' || entry.name === 'app') continue;
    const source = path.join(sourceResources, entry.name), target = path.join(runtimeResources, entry.name);
    if (entry.isDirectory()) fs.cpSync(source, target, { recursive: true, force: false, errorOnExist: false });
    else if (!fs.existsSync(target)) fs.copyFileSync(source, target);
  }
  const appRoot = path.join(runtimeRoot, 'resources', 'app'); fs.mkdirSync(appRoot, { recursive: true });
  const sourcePackage = asarPackage(sourceAsar);
  fs.writeFileSync(path.join(appRoot, 'package.json'), JSON.stringify({ name: 'nmtm-hidden-blockbench-test', version: sourcePackage.version, main: 'main.cjs' }));
  fs.copyFileSync(path.join(__dirname, 'nmtm_isolated_electron_main.cjs'), path.join(appRoot, 'main.cjs'));
  fs.copyFileSync(path.join(__dirname, 'nmtm_isolated_renderer_preload.cjs'), path.join(appRoot, 'renderer-preload.cjs'));
  fs.copyFileSync(path.join(__dirname, 'nmtm_inprocess_desktop_guard.cjs'), path.join(appRoot, 'inprocess-desktop-guard.cjs'));
  // Electron's BrowserWindow export is non-configurable in the shipped build.
  // Adapt only the original main module's electron import to our facade; all
  // original module-relative paths/require resolution retain its original URL.
  const originalMain = asarFile(sourceAsar, sourcePackage.main);
  const importLine = "import {app, BrowserWindow, Menu, ipcMain, shell} from 'electron'";
  assert.equal(originalMain.split(importLine).length, 2, 'Exact shipped Electron import must be present once');
  const mainUrl = require('node:url').pathToFileURL(path.join(sourceAsar, sourcePackage.main)).href;
  const adaptedMain = originalMain.replace(importLine, 'const {app, BrowserWindow, Menu, ipcMain, shell} = globalThis.__NMTM_HIDDEN_ELECTRON__;').replaceAll('import.meta.url', JSON.stringify(mainUrl));
  fs.writeFileSync(path.join(appRoot, 'original-main-hidden.mjs'), adaptedMain);
  fs.copyFileSync(path.join(__dirname, 'nmtm_move_window_desktop.py'), path.join(appRoot, 'move-window-desktop.py'));
  const toolsRoot = path.join(runtimeRoot, 'tools'); fs.mkdirSync(toolsRoot, { recursive: true });
  const desktopDll = path.join(toolsRoot, 'VirtualDesktopAccessor.dll'); fs.copyFileSync(desktopDllSource, desktopDll);
  const isolatedExecutable = path.join(runtimeRoot, path.basename(sourceExecutable)), eventLog = profile + '-windows.jsonl';
  // A copied executable loads the copied resources directory. Keep source
  // app.asar explicitly in the environment so the shim can import the exact
  // shipped renderer/main files without ever modifying the installation.
  const koffi = path.join(__dirname, '..', 'output', 'nmtm-rig-repair', 'native-tools', 'node_modules', 'koffi');
  assert.ok(fs.existsSync(path.join(koffi, 'package.json')), 'Approved E-drive Koffi dependency must be installed before a GUI retry');
  const env = { ...process.env, NMTM_BLOCKBENCH_SOURCE_ASAR: sourceAsar, NMTM_TEST_PROFILE: profile, NMTM_TEST_EVENT_LOG: eventLog, NMTM_TEST_PYTHON: python, NMTM_TEST_DESKTOP_DLL: desktopDll, NMTM_TEST_KOFFI: koffi, NMTM_ORIGINAL_MAIN_SHA256: crypto.createHash('sha256').update(originalMain).digest('hex') };
  delete env.ELECTRON_RUN_AS_NODE;
  const pipe = process.env.NMTM_TEST_CDP_PIPE === '1';
  const child = childProcess.spawn(isolatedExecutable, [pipe ? '--remote-debugging-pipe' : '--remote-debugging-port=' + port, '--user-data-dir=' + profile, '--disable-gpu'], { cwd: runtimeRoot, env, windowsHide: true, stdio: pipe ? ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] : 'ignore' });
  return { child, sourceExecutable, isolatedExecutable, sourceVersion: sourcePackage.version, sourceAsar, profile, eventLog, cdpTransport: pipe ? 'inherited-pipe-no-tcp' : 'tcp' };
}

function validateHiddenSession(session) {
  const events = fs.existsSync(session.eventLog) ? fs.readFileSync(session.eventLog, 'utf8').trim().split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line)) : [];
  assert.ok(events.some(event => event.event === 'bootstrap-ready'), 'Isolated main bootstrap ran before loading Blockbench');
  assert.ok(events.some(event => event.event === 'original-main-loaded'), 'Original shipped main module loaded');
  assert.ok(events.some(event => event.event === 'construct-hidden-window'), 'BrowserWindow constructor forced show:false/focusable:false');
  const windows = events.filter(event => event.event === 'window-created');
  assert.ok(windows.length > 0, 'Hidden renderer window was created');
  assert.ok(windows.every(window => !window.visible && !window.focused && !window.focusable), 'No visible/focusable test windows');
  const desktopAssignments = events.filter(event => event.event === 'desktop-assigned');
  assert.equal(desktopAssignments.length, windows.length, 'Every owned hidden window was assigned to desktop 2');
  assert.ok(desktopAssignments.every(event => event.verified && event.desktopAfter === 1 && !event.switchedDesktop), 'Desktop-2 assignment is independently verified without switching');
  assert.deepEqual(events.filter(event => event.failure), [], 'No native dialogs, focus changes, or external application launches');
  return { sourceExecutable: session.sourceExecutable, isolatedExecutable: session.isolatedExecutable, sourceVersion: session.sourceVersion, eventLog: session.eventLog, windowCount: windows.length, windows, desktopAssignments, suppressedWindowMethods: events.filter(event => event.event === 'suppressed-window-method').map(event => event.method) };
}

async function closeHiddenSession(session) {
  if (session.child.exitCode === null && session.child.signalCode === null) {
    // Restrict termination to this exact owned root and its child tree.
    childProcess.spawnSync('taskkill.exe', ['/PID', String(session.child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
  }
  await new Promise(resolve => setTimeout(resolve, 250));
}

module.exports = { asarFile, asarPackage, createHiddenSession, validateHiddenSession, closeHiddenSession };
