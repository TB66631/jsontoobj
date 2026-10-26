// Offline defaults only. Do not add GUI, networking, or private-asset tests here.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const packageInfo = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const plugin = fs.readFileSync(path.join(root, 'nmtm.js'), 'utf8');
const version = (plugin.match(/const PLUGIN_VERSION = '([^']+)'/) || [])[1];
if (packageInfo.version !== version) throw new Error('package.json version must match nmtm.js');
if (Number(process.versions.node.split('.')[0]) < 20) throw new Error('Node.js 20 or newer is required');

function jsFiles(directory) {
  return fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap(entry => {
    const relative = path.join(directory, entry.name);
    return entry.isDirectory() && entry.name !== '__pycache__' ? jsFiles(relative)
      : entry.isFile() && /\.(cjs|js)$/.test(entry.name) ? [relative] : [];
  });
}
function run(args) {
  const child = spawnSync(process.execPath, args, {
    cwd: root, stdio: 'inherit', windowsHide: true, timeout: 120000,
    env: { ...process.env, NMTM_LIVE_VERSION_TEST: '0', PYTHONDONTWRITEBYTECODE: '1' }
  });
  if (child.error) throw child.error;
  if (child.status !== 0) throw new Error('Check failed: node ' + args.join(' '));
}
const syntaxFiles = ['nmtm.js', ...jsFiles('scripts'), ...jsFiles('tests')];
for (const file of syntaxFiles) run(['--check', file]);
console.log('PASS JavaScript syntax (' + syntaxFiles.length + ' files), package/plugin version ' + version);
for (const args of [
  ['tests/build_nmtm_bridge.cjs', '--check'],
  ['tests/nmtm_plugin_smoke.cjs'],
  ['tests/nmtm_java_block_export.cjs'],
  ['tests/nmtm_hidden_bootstrap_unit.cjs'],
  ['tests/nmtm_desktop_guard_unit.cjs'],
  ['tests/nmtm_cdp_pipe_unit.cjs']
]) run(args);
console.log('PASS offline NMTM checks. Local Blockbench/Blender/visual acceptance runs separately.');
