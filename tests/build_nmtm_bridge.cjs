// Emit an apply_patch payload; file mutation is performed by apply_patch.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'nmtm.js'), 'utf8');
const python = fs.readFileSync(path.join(root, 'nmtm_blender_bridge.py'));
const pattern = /^    const BLENDER_BRIDGE_BASE64 = '[A-Za-z0-9+/=]*';$/m;
const previous = source.match(pattern);
assert.ok(previous, 'Exactly one bridge payload marker must exist');
const next = "    const BLENDER_BRIDGE_BASE64 = '" + python.toString('base64') + "';";
if (process.argv.includes('--check')) {
  assert.equal(previous[0], next, 'Embedded Python must match the checked-in bridge');
  console.log('Embedded Blender bridge matches source (' + python.length + ' bytes)');
} else {
  assert.ok(process.argv.includes('--patch'), 'Use --patch or --check');
  process.stdout.write('*** Begin Patch\n*** Update File: ' + path.join(root, 'nmtm.js').replace(/\\/g, '/') + '\n@@\n-' + previous[0] + '\n+' + next + '\n*** End Patch\n');
}
