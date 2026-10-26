const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const sourcePath = path.resolve(__dirname, '..', 'nmtm.js');
const source = fs.readFileSync(sourcePath, 'utf8');
const actions = [];
const menuActions = [];
const registration = {};

class Action {
  constructor(id, options) {
    this.id = id;
    this.options = options;
    actions.push(this);
  }
  delete() { this.deleted = true; }
}
class Codec {
  constructor(id, options) { this.id = id; Object.assign(this, options); }
  delete() { this.deleted = true; }
}
class ModelFormat {
  constructor(id, options) { this.id = id; Object.assign(this, options); context.Formats[id] = this; }
}
class TestGroup {
  constructor(name, origin = [0, 0, 0], rotation = [0, 0, 0]) {
    this.name = name;
    this.origin = origin;
    this.rotation = rotation;
    this.scale = [1, 1, 1];
    this.parent = null;
  }
}
class TestCube {
  constructor(parent) {
    this.parent = parent;
    this.from = [-4, 16, -2];
    this.to = [4, 24, 2];
    this.inflate = 0;
    this.selected = false;
    this.export = true;
    this.faces = {
      north: { uv: [0, 16, 8, 24], texture: 'tex' },
      south: { uv: [16, 16, 24, 24], texture: 'tex' }
    };
  }
}
class TestMesh {}
class TestBone {}

const context = {
  console,
  require,
  setTimeout,
  clearTimeout,
  __NMTM_TEST__: {},
  Plugin: { register(id, options) { registration.id = id; registration.options = options; } },
  Plugins: { registered: {} },
  Codec,
  ModelFormat,
  Action,
  MenuBar: { addAction(action, menu) { menuActions.push({ action, menu }); } },
  Formats: {},
  Blockbench: {
    showQuickMessage() {},
    showMessageBox() {},
    read() {},
    export() {}
  },
  Filesystem: {},
  Project: null,
  Texture: { all: [] },
  Mesh: TestMesh,
  Cube: TestCube,
  Animation: { all: [] },
  ArmatureBone: TestBone,
  Group: TestGroup,
  Codecs: {},
  localStorage: {
    getItem() { return null; },
    setItem() {}
  }
};
TestMesh.all = [];
TestCube.all = [];
TestBone.all = [];
TestGroup.all = [];
vm.createContext(context);
vm.runInContext(source, context, { filename: sourcePath });

assert.equal(registration.id, 'nmtm');
assert.equal(registration.options.version, '0.6.0');
assert.equal(registration.options.variant, 'desktop');
assert.ok(registration.options.description.includes('EMF'));

registration.options.onload();
const ids = actions.map(action => action.id);
for (const id of [
  'nmtm_import_json',
  'nmtm_import_index',
  'nmtm_import_bin',
  'nmtm_export_java_rp',
  'nmtm_export_java_block_rp',
  'nmtm_export_emf',
  'nmtm_refresh_mc_versions',
  'nmtm_version_cache_path'
]) assert.ok(ids.includes(id), `missing action ${id}`);
assert.equal(menuActions.length, actions.length);

const api = context.__NMTM_TEST__.api;
const plain = value => JSON.parse(JSON.stringify(value));
assert.deepEqual(plain(api.fallbackPackFormat('1.8.8')), { major: 1, minor: 0 });
assert.deepEqual(plain(api.fallbackPackFormat('1.20.4')), { major: 22, minor: 0 });
assert.deepEqual(plain(api.fallbackPackFormat('26.2')), { major: 88, minor: 0 });
assert.equal(api.fallbackPackFormat('26.3-snapshot-9'), null);
assert.deepEqual(plain(api.packFormatValue({ major: 69, minor: 1 })), [69, 1]);
assert.deepEqual(plain(api.packMetadata({ major: 69, minor: 0 }, 'test')), {
  pack: { min_format: [69, 0], max_format: [69, 0], description: 'test' }
});
assert.equal(api.itemModelEra({ id: '1.13.2', type: 'release', major: 4, minor: 0 }), 'replace_item');
assert.equal(api.itemModelEra({ id: '1.14.4', type: 'release', major: 4, minor: 0 }), 'legacy_cmd');
assert.equal(api.itemModelEra({ id: '1.21.1', type: 'release', major: 34, minor: 0 }), 'component_cmd');
assert.equal(api.itemModelEra({ id: '1.21.4', type: 'release', major: 46, minor: 0 }), 'item_definition');
assert.equal(api.textureFolderForVersion({ major: 3 }), 'items');
assert.equal(api.textureFolderForVersion({ major: 4 }), 'item');
assert.equal(api.blockTextureFolderForVersion({ major: 3 }), 'blocks');
assert.equal(api.blockTextureFolderForVersion({ major: 4 }), 'block');
assert.deepEqual(plain(api.blockStateData({ major: 1 }, 'nmtm:block/demo')), {
  variants: { normal: { model: 'nmtm:block/demo' } }
});
assert.deepEqual(plain(api.blockStateData({ major: 4 }, 'nmtm:block/demo')), {
  variants: { '': { model: 'nmtm:block/demo' } }
});
assert.deepEqual(plain(api.blockItemMapping({ id: '1.20.4', type: 'release', major: 22 }, 'nmtm:block/demo')), {
  parent: 'nmtm:block/demo'
});
assert.deepEqual(plain(api.blockItemMapping({ id: '1.21.4', type: 'release', major: 46 }, 'nmtm:block/demo')), {
  model: { type: 'minecraft:model', model: 'nmtm:block/demo' }
});
assert.equal(api.safeNamespace('My Namespace/Pack'), 'my_namespace_pack');
assert.equal(api.safeResourcePath('../Fancy Block/Part', 'block'), 'fancy_block/part');
assert.deepEqual(plain(api.resourceLocation('minecraft:Diamond Block', 'nmtm', 'block')), {
  namespace: 'minecraft', resource: 'diamond_block', id: 'minecraft:diamond_block'
});
const atlasPixelPng = api.encodePngRgba(1, 1, Buffer.from([255, 0, 0, 255])).toString('base64');
const atlasTextures = [
  { uuid: 'atlas_a', source: 'data:image/png;base64,' + atlasPixelPng, nmtm_size: { width: 1, height: 1 } },
  { uuid: 'atlas_b', source: 'data:image/png;base64,' + atlasPixelPng, nmtm_size: { width: 1, height: 1 } }
];
context.Texture.all = atlasTextures;
const atlas = api.buildEmfTextureAtlas([
  { faces: { face: { texture: 'atlas_a' } } },
  { faces: { face: { texture: 'atlas_b' } } }
], atlasTextures[0]);
assert.equal(atlas.sourceCount, 2);
assert.equal(atlas.width, 2);
assert.equal(atlas.height, 1);
assert.deepEqual(plain(atlas.meshRegions), [
  { x: 0, y: 0, width: 1, height: 1 },
  { x: 1, y: 0, width: 1, height: 1 }
]);
assert.ok(Buffer.isBuffer(atlas.buffer) && atlas.buffer.length > 0);
const realTextureRoot = path.resolve(__dirname, '..', 'NetMC Assets', '[3.8.30.293955]', 'assets', 'assets', 'resource_packs', 'vanilla_netease', 'textures', 'models', '2026s8');
const realAtlasFiles = ['ss_s8lehun_skin_guajian.png', 'cs_elem_horse_style1_1.png', 'Tex_Tile_02.png'].map(name => path.join(realTextureRoot, name));
if (realAtlasFiles.every(fs.existsSync)) {
  const realAtlasTextures = realAtlasFiles.map((file, index) => ({ uuid: 'real_atlas_' + index, source: file, nmtm_source_path: file }));
  context.Texture.all = realAtlasTextures;
  const realAtlas = api.buildEmfTextureAtlas(realAtlasTextures.map(texture => ({ faces: { face: { texture: texture.uuid } } })), realAtlasTextures[0]);
  assert.equal(realAtlas.sourceCount, 3);
  assert.deepEqual([realAtlas.width, realAtlas.height], [1024, 1024]);
  assert.deepEqual(plain(realAtlas.meshRegions), [
    { x: 0, y: 0, width: 256, height: 256 },
    { x: 512, y: 0, width: 256, height: 256 },
    { x: 0, y: 512, width: 512, height: 512 }
  ]);
  const realAtlasDecoded = api.decodePngRgba(realAtlas.buffer);
  assert.deepEqual([realAtlasDecoded.width, realAtlasDecoded.height], [1024, 1024]);
}
const fittedBlock = plain(api.fitJavaBlockModel({
  elements: [{ from: [-4, 16, -2], to: [4, 24, 2], faces: { north: { uv: [0, 0, 16, 16], texture: '#layer0' } } }]
}, 0.5));
assert.deepEqual(fittedBlock.elements[0].from, [0.5, 0.5, 4.25]);
assert.deepEqual(fittedBlock.elements[0].to, [15.5, 15.5, 11.75]);
const group = new TestGroup('body', [0, 24, 0]);
const cube = new TestCube(group);
const texture = { uuid: 'tex', source: 'data:image/png;base64,AAAA', nmtm_size: { width: 64, height: 64 } };
TestGroup.all = [group];
TestCube.all = [cube];
context.Texture.all = [texture];
const emfRaw = api.emfCompatibility();
const emf = plain(emfRaw);
assert.equal(emf.compatible, true);
const jem = plain(api.emfJemData('minecraft:nmtm/demo', [64, 64], emfRaw, 'body', null));
assert.equal(jem.models.length, 1);
assert.equal(jem.models[0].part, 'body');
assert.deepEqual(jem.models[0].boxes[0].coordinates, [-4, -8, -2, 8, 8, 4]);
assert.deepEqual(jem.models[0].boxes[0].uvNorth, [0, 16, 8, 24]);
assert.equal(api.emfModelRelative('minecraft', 'wolf'), 'assets/minecraft/optifine/cem/wolf.jem');
assert.equal(api.emfModelRelative('examplemod', 'demo'), 'assets/examplemod/emf/cem/demo.jem');
cube.rotation = [0, 22.5, 0];
const rotatedEmf = plain(api.emfCompatibility());
assert.equal(rotatedEmf.compatible, false);
assert.ok(rotatedEmf.problems.some(problem => problem.includes('rotated cubes')));
cube.rotation = [0, 0, 0];
assert.equal(api.emfExpression([{ time: 0, data_points: [{ x: 0, y: 10, z: 0 }] }, { time: 1, data_points: [{ x: 0, y: 20, z: 0 }] }], 1, { length: 1, loop: 'loop' }), 'keyframe(((time*0.05%1)/1)*1,10,20)');
const sourceCorners = [
  [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
  [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]
];
const sourceCuboid = { vertices: [], indices: [] };
for (const face of [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]]) {
  const base = sourceCuboid.vertices.length;
  const uvs = [[0, 0], [0.25, 0], [0.25, 0.25], [0, 0.25]];
  face.forEach((corner, index) => sourceCuboid.vertices.push({ pos: sourceCorners[corner], uvcoord: uvs[index], weight: [['root', 1]] }));
  sourceCuboid.indices.push([base, base + 2, base + 1], [base, base + 3, base + 2]);
}
assert.equal(api.nmtmSectionComponents(sourceCuboid).length, 1);
const blockVoxels = plain(api.nmtmBlockVoxelModel(
  [{ nmtm_source_section: sourceCuboid }],
  'nmtm:blocks/demo',
  [64, 64],
  8,
  2048,
  0.5
));
assert.ok(blockVoxels.elements.length > 0 && blockVoxels.elements.length <= 2048);
assert.ok(blockVoxels.elements.every(element =>
  element.from.concat(element.to).every(Number.isFinite)
  && element.from.every(value => value >= 0.5)
  && element.to.every(value => value <= 15.5)
  && Object.values(element.faces).every(face =>
    face.texture === '#texture'
    && face.uv.length === 4
    && face.uv.every(value => value >= 0 && value <= 16)
  )
));
const adaptiveBlockVoxels = plain(api.nmtmAdaptiveBlockVoxelModel(
  [{ nmtm_source_section: sourceCuboid }],
  'nmtm:blocks/demo',
  [64, 64],
  8,
  256,
  0.5,
  true
));
assert.equal(adaptiveBlockVoxels.requestedResolution, 8);
assert.ok(adaptiveBlockVoxels.actualResolution < 8);
assert.equal(adaptiveBlockVoxels.adjusted, true);
assert.ok(adaptiveBlockVoxels.model.elements.length > 0 && adaptiveBlockVoxels.model.elements.length <= 256);
const touchingCuboids = {
  vertices: sourceCuboid.vertices.concat(sourceCuboid.vertices.map(vertex => Object.assign({}, vertex, { pos: [vertex.pos[0] + 1, vertex.pos[1], vertex.pos[2]] }))),
  indices: sourceCuboid.indices.concat(sourceCuboid.indices.map(face => face.map(index => index + sourceCuboid.vertices.length)))
};
assert.equal(api.nmtmSectionComponents(touchingCuboids).length, 2);
const sourceAnalysis = plain(api.nmtmMeshCuboidAnalysis({ nmtm_source_section: sourceCuboid }));
assert.equal(sourceAnalysis.compatible, true);
assert.equal(sourceAnalysis.components.length, 1);
assert.equal(sourceAnalysis.components[0].bone, 'root');
TestMesh.all = [{
  name: 'irregular_mesh',
  export: true,
  selected: false,
  nmtm_source_section: { vertices: [{ pos: [0, 0, 0], weight: [['root', 1]] }], indices: [] },
  nmtm_skeleton_data: { skeleton: [{ name: 'root', parent: 'root', initpos: [0, 0, 0], initquaternion: [0, 0, 0, 1], initscale: [1, 1, 1] }] },
  nmtm_bones: {}
}];
const voxelCompatibility = plain(api.emfCompatibility({ geometryMode: 'voxel', voxelSize: 0.5, maxVoxels: 512 }));
assert.equal(voxelCompatibility.mode, 'nmtm_voxels');
assert.equal(voxelCompatibility.voxelSize, 0.5);
assert.equal(voxelCompatibility.maxVoxels, 512);
assert.equal(voxelCompatibility.autoVoxelFit, true);
assert.equal(voxelCompatibility.maxAutoVoxelSize, 8);
assert.equal(api.emfCompatibility({ geometryMode: 'voxel', autoVoxelFit: false }).autoVoxelFit, false);
const multiModelTextures = [
  { uuid: 'multi_a', source: 'data:image/png;base64,' + atlasPixelPng },
  { uuid: 'multi_b', source: 'data:image/png;base64,' + atlasPixelPng }
];
context.Texture.all = multiModelTextures;
TestCube.all = [];
TestMesh.all = [
  {
    name: 'part_a', nmtm_model_name: 'model_a', export: true, selected: false,
    faces: { face: { texture: 'multi_a' } }, nmtm_source_section: sourceCuboid,
    nmtm_skeleton_data: { skeleton: [{ name: 'root', parent: 'root', initpos: [0, 0, 0], initquaternion: [0, 0, 0, 1], initscale: [1, 1, 1] }] }
  },
  {
    name: 'part_b', nmtm_model_name: 'model_b', export: true, selected: false,
    faces: { face: { texture: 'multi_b' } }, nmtm_source_section: sourceCuboid,
    nmtm_skeleton_data: { skeleton: [{ name: 'root', parent: 'root', initpos: [0, 0, 0], initquaternion: [0, 0, 0, 1], initscale: [1, 1, 1] }] }
  }
];
const multiStrict = plain(api.emfCompatibility());
const multiVoxel = plain(api.emfCompatibility({ geometryMode: 'voxel' }));
assert.equal(multiStrict.compatible, false);
assert.ok(multiStrict.problems.some(problem => problem.includes('one imported NMTM model')));
assert.equal(multiVoxel.compatible, true);
assert.equal(multiVoxel.sourceModelCount, 2);
assert.equal(multiVoxel.textures.length, 2);
TestMesh.all = [];
const rotationAnimation = api.emfAnimationForGroup({
  length: 1,
  loop: 'once',
  animators: { root: { uuid: 'root', keyframes: [
    { channel: 'rotation', time: 0, data_points: [{ x: 0, y: 0, z: 0 }] },
    { channel: 'rotation', time: 1, data_points: [{ x: 90, y: 0, z: 0 }] }
  ] } }
}, { uuid: 'root' });
assert.equal(rotationAnimation['this.rx'], 'keyframe((min(time*0.05,1)/1)*1,0,1.5708)');
const catalog = plain(api.buildVersionCatalog({
  latest: { release: '1.21.9' },
  versions: [
    { id: '1.21.9', type: 'release', releaseTime: '2025-09-30T00:00:00Z', sha1: 'same' },
    { id: '1.8.8', type: 'release', releaseTime: '2015-07-27T00:00:00Z', sha1: 'old' },
    { id: 'unknown-snapshot', type: 'snapshot', releaseTime: '2026-01-01T00:00:00Z', sha1: 'unknown' }
  ]
}, [
  { id: '1.21.9', sha1: 'same', resource_pack_version: 69, resource_pack_version_minor: 1 }
]));
assert.equal(catalog.versions.length, 2);
assert.deepEqual(catalog.versions.map(version => [version.id, version.major, version.minor]), [
  ['1.21.9', 69, 1],
  ['1.8.8', 1, 0]
]);

registration.options.onunload();
assert.ok(actions.every(action => action.deleted));

async function finish() {
  if (process.env.NMTM_LIVE_VERSION_TEST === '1') {
    let manifest;
    let metadata;
    if (process.env.NMTM_MANIFEST_FILE && process.env.NMTM_MCMETA_FILE) {
      manifest = JSON.parse(fs.readFileSync(process.env.NMTM_MANIFEST_FILE, 'utf8'));
      metadata = JSON.parse(fs.readFileSync(process.env.NMTM_MCMETA_FILE, 'utf8'));
    } else {
      const [manifestResponse, metadataResponse] = await Promise.all([
        fetch('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json'),
        fetch('https://raw.githubusercontent.com/misode/mcmeta/summary/versions/data.min.json')
      ]);
      assert.ok(manifestResponse.ok, `Mojang manifest HTTP ${manifestResponse.status}`);
      assert.ok(metadataResponse.ok, `mcmeta summary HTTP ${metadataResponse.status}`);
      manifest = await manifestResponse.json();
      metadata = await metadataResponse.json();
    }
    const live = plain(api.buildVersionCatalog(manifest, metadata));
    const latest = live.versions.find(version => version.id === live.latest.release);
    assert.ok(latest, `latest release ${live.latest.release} has no verified resource-pack format`);
    console.log(`NMTM live catalog passed (${live.versions.length} versions, latest ${latest.id} -> ${latest.major}.${latest.minor})`);
  }
  console.log(`NMTM smoke test passed (${ids.length} actions)`);
}
finish().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
