// Check the committed Git tree and reachable blobs before publishing.
'use strict';
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function git(args, binary = false) {
  const result = spawnSync('git', args, { cwd: root, encoding: binary ? null : 'utf8', maxBuffer: 64 * 1024 * 1024, windowsHide: true });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || ('git ' + args.join(' ') + ' failed'));
  return result.stdout;
}
const paths = git(['ls-files', '-z'], true).toString('utf8').split('\0').filter(Boolean);
const allowed = new Set(['.github', '.gitignore', '.gitattributes', '.npmrc', 'AGENTS.md', 'CONTRIBUTING.md', 'LICENSE', 'NMTM_README.md', 'README.md', 'docs', 'nmtm.js', 'nmtm_blender_bridge.py', 'package.json', 'scripts', 'tests', 'tools']);
const unexpected = paths.filter(file => !allowed.has(file.split(/[\\/]/)[0]));
if (!paths.length) throw new Error('Git index is empty; commit the intended project files first.');
if (unexpected.length) throw new Error('Unexpected tracked paths (local inputs/output must remain untracked):\n' + unexpected.slice(0, 40).join('\n'));
const forbidden = paths.filter(file => /(^|\/)(?:node_modules|__pycache__)(?:\/|$)|\.(?:exe|dll|jar|mp4|pyc|blend\d*|fbx|glb)$/i.test(file));
if (forbidden.length) throw new Error('Generated dependencies/binaries must remain untracked:\n' + forbidden.slice(0, 40).join('\n'));
const objects = git(['rev-list', '--objects', '--all']).split(/\r?\n/).filter(Boolean);
const chunks = [];
for (let start = 0; start < objects.length; start += 10000) {
  const result = spawnSync('git', ['cat-file', '--batch-check=%(objecttype) %(objectsize) %(rest)'], {
    cwd: root, input: objects.slice(start, start + 10000).join('\n') + '\n', encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024, windowsHide: true
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || 'git cat-file failed');
  chunks.push(...result.stdout.split(/\r?\n/).filter(Boolean));
}
const blobs = chunks.map(line => {
  const match = line.match(/^blob (\d+)\s*(.*)$/);
  return match ? { bytes: Number(match[1]), path: match[2] } : null;
}).filter(Boolean).sort((a, b) => b.bytes - a.bytes);
const largest = blobs[0] || {bytes:0,path:'(none)'};
const oversized = blobs.filter(blob => blob.bytes > 25 * 1024 * 1024);
console.log('Tracked paths:', paths.length);
console.log('Reachable objects:', objects.length, 'blobs:', blobs.length);
console.log('Largest blob:', largest.bytes, 'bytes', largest.path);
if (oversized.length) throw new Error('History has blobs larger than 25 MiB:\n' + oversized.slice(0, 20).map(blob => blob.bytes + ' bytes ' + blob.path).join('\n'));
console.log('PASS repository source scope and reachable blob-size check.');
