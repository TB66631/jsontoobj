const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const workspace = path.resolve(__dirname, '..');
const sourcePath = path.join(workspace, 'nmtm.js');
const source = fs.readFileSync(sourcePath, 'utf8');
const outputRoot = path.join(workspace, 'output', 'nmtm-java-block-export-test');
const allowedRoot = path.resolve(workspace, 'output') + path.sep;
assert.ok(path.resolve(outputRoot).startsWith(allowedRoot), 'Refusing to write a test pack outside workspace/output.');

class Action {
  constructor(id, options) { this.id = id; this.options = options; }
  delete() {}
}
class Codec {
  constructor(id, options) { this.id = id; Object.assign(this, options); }
  delete() {}
}
class ModelFormat {
  constructor(id, options) { this.id = id; Object.assign(this, options); }
}
class TestMesh {}
class TestCube {}
class TestBone {}
class TestGroup {}

const dialogs = [];
const dialogResults = [];
class Dialog {
  constructor(options) { this.options = options; dialogs.push(options); }
  show() {
    const result = dialogResults.shift();
    assert.ok(result, 'Unexpected export dialog without a queued result.');
    this.options.onConfirm(result);
    return this;
  }
}

const context = {
  console,
  require,
  setTimeout,
  clearTimeout,
  __NMTM_TEST__: {},
  Plugin: { register(_id, options) { context.registration = options; } },
  Plugins: { registered: {} },
  Codec,
  ModelFormat,
  Action,
  Dialog,
  MenuBar: { addAction() {} },
  Formats: {},
  Blockbench: { showQuickMessage() {}, showMessageBox(message) { throw new Error(message.message); } },
  Filesystem: {},
  Project: { name: 'nmtm_export_test' },
  Texture: { all: [] },
  Mesh: TestMesh,
  Cube: TestCube,
  Animation: { all: [] },
  ArmatureBone: TestBone,
  Group: TestGroup,
  Codecs: {},
  localStorage: { getItem() { return null; }, setItem() {} }
};
TestMesh.all = [];
TestCube.all = [];
TestBone.all = [];
TestGroup.all = [];
vm.createContext(context);
vm.runInContext(source, context, { filename: sourcePath });

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLQmwAAAABJRU5ErkJggg==',
  'base64'
);
const texture = {
  uuid: 'test_texture',
  source: `data:image/png;base64,${png.toString('base64')}`,
  nmtm_size: { width: 1, height: 1 }
};
context.Texture.all = [texture];

const corners = [
  [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
  [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]
];
const sourceSection = { vertices: [], indices: [] };
for (const face of [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]]) {
  const base = sourceSection.vertices.length;
  const uvs = [[0, 0], [1, 0], [1, 1], [0, 1]];
  face.forEach((corner, index) => sourceSection.vertices.push({ pos: corners[corner], uvcoord: uvs[index] }));
  sourceSection.indices.push([base, base + 2, base + 1], [base, base + 3, base + 2]);
}
const mesh = {
  name: 'test_mesh',
  faces: { face: { texture: 'test_texture' } },
  nmtm_source_section: sourceSection
};
const geometry = { type: 'mesh', meshes: [mesh], label: 'test Mesh' };
const catalog = {
  latest: { release: '1.21.4' },
  versions: [
    { id: '1.8.8', type: 'release', major: 1, minor: 0 },
    { id: '1.21.4', type: 'release', major: 46, minor: 0 }
  ]
};
const api = context.__NMTM_TEST__.api;

function readJson(...parts) {
  return JSON.parse(fs.readFileSync(path.join(...parts), 'utf8'));
}
function assertPack(packName, expected) {
  const root = path.join(outputRoot, packName);
  const blockstate = readJson(root, 'assets', 'minecraft', 'blockstates', 'diamond_block.json');
  const model = readJson(root, 'assets', 'nmtm', 'models', 'block', 'test_model.json');
  const descriptor = readJson(root, 'nmtm_block_export.json');
  assert.deepEqual(blockstate, expected.blockstate);
  assert.equal(descriptor.target_block, 'minecraft:diamond_block');
  assert.equal(descriptor.model, 'nmtm:block/test_model');
  assert.equal(descriptor.element_count, model.elements.length);
  assert.equal(descriptor.voxel_resolution_requested, 8);
  assert.equal(descriptor.voxel_resolution, 7);
  assert.equal(descriptor.voxel_resolution_auto_adjusted, true);
  assert.equal(descriptor.voxel_auto_fit, true);
  assert.ok(model.elements.length > 0 && model.elements.length <= 512);
  assert.ok(model.elements.every(element => element.from.concat(element.to).every(Number.isFinite)));
  assert.ok(fs.existsSync(path.join(root, 'assets', 'nmtm', 'textures', expected.textureFolder, 'test_model.png')));
  assert.deepEqual(readJson(root, ...expected.itemPath), expected.itemData);
  assert.ok(fs.existsSync(path.join(root, 'NMTM-BLOCK-README.txt')));
}

fs.rmSync(outputRoot, { recursive: true, force: true });
fs.mkdirSync(outputRoot, { recursive: true });
try {
  dialogResults.push({
    version: '1.8.8', pack: 'old_pack', description: 'old', target_block: 'minecraft:diamond_block',
    model_namespace: 'nmtm', model_name: 'test_model', voxel_resolution: 8, max_elements: 256, auto_voxel_fit: true, margin: 0.5, pack_icon: true
  });
  api.exportJavaBlockPack(outputRoot, catalog, geometry);
  assertPack('old_pack', {
    blockstate: { variants: { normal: { model: 'nmtm:block/test_model' } } },
    textureFolder: 'blocks',
    itemPath: ['assets', 'minecraft', 'models', 'item', 'diamond_block.json'],
    itemData: { parent: 'nmtm:block/test_model' }
  });

  dialogResults.push({
    version: '1.21.4', pack: 'new_pack', description: 'new', target_block: 'minecraft:diamond_block',
    model_namespace: 'nmtm', model_name: 'test_model', voxel_resolution: 8, max_elements: 256, auto_voxel_fit: true, margin: 0.5, pack_icon: true
  });
  api.exportJavaBlockPack(outputRoot, catalog, geometry);
  assertPack('new_pack', {
    blockstate: { variants: { '': { model: 'nmtm:block/test_model' } } },
    textureFolder: 'block',
    itemPath: ['assets', 'minecraft', 'items', 'diamond_block.json'],
    itemData: { model: { type: 'minecraft:model', model: 'nmtm:block/test_model' } }
  });
  assert.equal(dialogs.length, 2);
  console.log('NMTM Java block export test passed (1.8.8 and 1.21.4 pack layouts).');
} finally {
  fs.rmSync(outputRoot, { recursive: true, force: true });
}
