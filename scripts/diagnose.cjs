// Read-only by default. No executables are started and no network is accessed.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const json = args.includes('--json');
let destination;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--json') continue;
  if (args[i] === '--report' && args[i + 1]) { destination = path.resolve(root, args[++i]); continue; }
  throw new Error('Usage: node scripts/diagnose.cjs [--json] [--report output/diagnostics/report.json]');
}
if (destination) {
  const relative = path.relative(path.join(root, 'output'), destination);
  if (!relative || relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative))
    throw new Error('Diagnostic reports must be files under repository/output');
  // Reject links/junctions that could redirect a report outside this workspace.
  let ancestor = path.dirname(destination);
  while (ancestor !== root) {
    if (fs.existsSync(ancestor) && fs.lstatSync(ancestor).isSymbolicLink())
      throw new Error('Diagnostic report parent must not be a link/junction: ' + ancestor);
    ancestor = path.dirname(ancestor);
  }
  if (fs.existsSync(destination) && (fs.lstatSync(destination).isSymbolicLink() || !fs.statSync(destination).isFile()))
    throw new Error('Diagnostic report target must be a regular file');
}
const checks = [];
const record = (name, status, detail) => checks.push({ name, status, detail });
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const source = fs.readFileSync(path.join(root, 'nmtm.js'));
const bridge = fs.readFileSync(path.join(root, 'nmtm_blender_bridge.py'));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = (source.toString('utf8').match(/const PLUGIN_VERSION = '([^']+)'/) || [])[1];
const embedded = source.toString('utf8').match(/const BLENDER_BRIDGE_BASE64 = '([A-Za-z0-9+/=]+)'/);
record('node', Number(process.versions.node.split('.')[0]) >= 20 ? 'pass' : 'fail', process.version);
record('version', pkg.version === version ? 'pass' : 'fail', { package: pkg.version, plugin: version });
record('embedded-bridge', embedded && Buffer.from(embedded[1], 'base64').equals(bridge) ? 'pass' : 'fail', sha(bridge));
function optionalPath(name, value, kind = 'file') {
  let exists = false;
  try { const stat = fs.statSync(value); exists = kind === 'directory' ? stat.isDirectory() : stat.isFile(); } catch {}
  record(name, exists ? 'pass' : 'optional-missing', { path: value, kind });
}
optionalPath('blockbench', process.env.BLOCKBENCH_EXE || 'D:/Apps/Blockbench/Blockbench.exe');
optionalPath('blender', process.env.NMTM_BLENDER || 'D:/Program Files/Blender4.2/blender.exe');
optionalPath('desktop-guard-python', process.env.NMTM_TEST_PYTHON || 'D:/Program Files/python/python.exe');
optionalPath('private-assets', path.join(root, 'NetMC Assets/[3.8.30.293955]/assets/assets/resource_packs/vanilla_netease'), 'directory');
optionalPath('desktop-accessor', process.env.NMTM_TEST_DESKTOP_DLL_SOURCE || 'C:/Users/Administrator/AppData/Local/Temp/VirtualDesktopAccessor-2019-windows10.dll');
optionalPath('local-koffi', path.join(root, 'output/nmtm-rig-repair/native-tools/node_modules/koffi'), 'directory');
const result = {
  generatedAt: new Date().toISOString(), root, platform: process.platform, node: process.version,
  pluginVersion: version, sourceSha256: sha(source), bridgeSha256: sha(bridge),
  mode: 'read-only; no GUI, network requests, or configuration changes',
  passed: checks.every(check => check.status !== 'fail'), checks,
  next: 'See docs/TROUBLESHOOTING.md and docs/STATUS.md. Dependency presence is not runtime acceptance.'
};
const report = JSON.stringify(result, null, 2) + '\n';
if (destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, report);
}
if (json) process.stdout.write(report);
else {
  console.log('NMTM ' + version + ' — ' + root);
  for (const check of checks) console.log(check.status.toUpperCase() + ' ' + check.name + ': ' + JSON.stringify(check.detail));
  console.log('Source SHA256: ' + result.sourceSha256);
  console.log(result.next);
  if (destination) console.log('Report: ' + destination);
}
if (!result.passed) process.exitCode = 1;
