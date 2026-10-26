// Run with: node tests/nmtm_rig_regression.cjs
// Uses an isolated, creation-hidden Blockbench renderer; never alters the
// installed plugin or old audit outputs. The caller must explicitly authorize
// a GUI session with NMTM_ALLOW_HIDDEN_GUI=1 and NMTM_TEST_VIRTUAL_DESKTOP=2
// after assigning it to desktop 2.
const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const workspace = path.resolve(__dirname, '..');
const output = path.join(workspace, 'output', 'nmtm-rig-repair', 'runtime');
const pack = path.join(workspace, 'NetMC Assets', '[3.8.30.293955]', 'assets', 'assets', 'resource_packs', 'vanilla_netease');
const executable = process.env.BLOCKBENCH_EXE || 'D:/Apps/Blockbench/Blockbench.exe';
const helperSource = fs.readFileSync(path.join(__dirname, 'nmtm_blockbench_runtime.cjs'), 'utf8').split('async function main()')[0];
const { freePort, waitForPage, cdpClient, evaluate } = new Function('require', '__dirname', helperSource + '\nreturn {freePort,waitForPage,cdpClient,evaluate};')(require, __dirname);
const { createHiddenSession, validateHiddenSession, closeHiddenSession } = require('./nmtm_hidden_blockbench.cjs');
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');

function fixtureTexture(reference) {
  const clean = reference.replace(/\\/g, '/').replace(/^textures\//, '');
  const candidates = [path.join(pack, 'textures', clean), path.join(pack, 'textures', 'models', clean)];
  const file = candidates.flatMap(p => [p, p + '.png']).find(p => fs.existsSync(p) && fs.statSync(p).isFile());
  assert.ok(file, 'Missing real fixture texture: ' + reference);
  const bytes = fs.readFileSync(file);
  assert.equal(bytes.readUInt32BE(0), 0x89504e47, 'Fixture must be PNG');
  return { file, sha256: sha256(bytes), width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), dataUrl: 'data:image/png;base64,' + bytes.toString('base64') };
}

function glbAudit(bytes) {
  assert.equal(bytes.readUInt32LE(0), 0x46546c67, 'GLB magic');
  assert.equal(bytes.readUInt32LE(4), 2, 'GLB version');
  assert.equal(bytes.readUInt32LE(8), bytes.length, 'GLB length');
  let json, binary;
  for (let offset = 12; offset < bytes.length;) {
    const length = bytes.readUInt32LE(offset), type = bytes.readUInt32LE(offset + 4);
    const chunk = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === 0x4e4f534a) json = JSON.parse(chunk.toString('utf8').trim());
    if (type === 0x004e4942) binary = chunk;
    offset += length + 8;
  }
  assert.ok(json && binary, 'GLB JSON and binary chunks exist');
  const components = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
  const types = { 5121: [1, 'readUInt8'], 5123: [2, 'readUInt16LE'], 5125: [4, 'readUInt32LE'], 5126: [4, 'readFloatLE'] };
  const accessor = index => {
    const a = json.accessors[index], view = json.bufferViews[a.bufferView];
    const [size, method] = types[a.componentType], count = components[a.type];
    const stride = view.byteStride || size * count, start = (view.byteOffset || 0) + (a.byteOffset || 0);
    return Array.from({ length: a.count }, (_, row) => Array.from({ length: count }, (_, column) => {
      const v = binary[method](start + row * stride + column * size);
      return a.normalized && a.componentType !== 5126 ? v / (a.componentType === 5121 ? 255 : 65535) : v;
    }));
  };
  const nodes = json.nodes || [], skins = json.skins || [], meshes = json.meshes || [];
  const skinnedNodes = nodes.filter(node => Number.isInteger(node.mesh) && Number.isInteger(node.skin));
  let vertices = 0, triangles = 0, primitiveCount = 0, maxWeightSumError = 0, invalidJointIndices = 0, nonFiniteValues = 0;
  const inverseBindMatrices = [];
  for (const node of skinnedNodes) for (const primitive of meshes[node.mesh].primitives) {
    primitiveCount++;
    triangles += (Number.isInteger(primitive.indices) ? json.accessors[primitive.indices].count : json.accessors[primitive.attributes.POSITION].count) / 3;
    assert.ok(Number.isInteger(primitive.attributes.JOINTS_0), 'Skinned primitive JOINTS_0');
    assert.ok(Number.isInteger(primitive.attributes.WEIGHTS_0), 'Skinned primitive WEIGHTS_0');
    const joints = accessor(primitive.attributes.JOINTS_0), weights = accessor(primitive.attributes.WEIGHTS_0);
    vertices += weights.length;
    weights.forEach((row, index) => {
      maxWeightSumError = Math.max(maxWeightSumError, Math.abs(row.reduce((sum, v) => sum + v, 0) - 1));
      row.forEach((weight, component) => {
        if (!Number.isFinite(weight)) nonFiniteValues++;
        if (weight > 0 && joints[index][component] >= skins[node.skin].joints.length) invalidJointIndices++;
      });
    });
  }
  for (const skin of skins) {
    assert.equal(json.accessors[skin.inverseBindMatrices].count, skin.joints.length, 'One inverse bind matrix per joint');
    accessor(skin.inverseBindMatrices).flat().forEach(v => { if (!Number.isFinite(v)) nonFiniteValues++; });
    const matrices = accessor(skin.inverseBindMatrices);
    skin.joints.forEach((joint, index) => inverseBindMatrices.push({ name: nodes[joint].name, matrix: matrices[index] }));
  }
  const images = (json.images || []).map(image => {
    assert.ok(Number.isInteger(image.bufferView), 'Texture is embedded in GLB');
    const view = json.bufferViews[image.bufferView], data = binary.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
    assert.ok(data.length > 24, 'Embedded image is nonempty');
    return { mimeType: image.mimeType, bytes: data.length, sha256: sha256(data), width: image.mimeType === 'image/png' ? data.readUInt32BE(16) : null, height: image.mimeType === 'image/png' ? data.readUInt32BE(20) : null };
  });
  return { byteLength: bytes.length, sha256: sha256(bytes), meshCount: meshes.length, skinnedMeshNodes: skinnedNodes.length, skinnedNodes: skinnedNodes.map(node => ({ name: node.name, position: node.translation, quaternion: node.rotation, scale: node.scale })), plainMeshNodes: nodes.filter(node => Number.isInteger(node.mesh) && !Number.isInteger(node.skin)).map(node => ({ name: node.name })), positionSamples: skinnedNodes.flatMap(node => meshes[node.mesh].primitives.map(primitive => ({ name: node.name, positions: accessor(primitive.attributes.POSITION).slice(0, 8) }))), skinCount: skins.length, jointCounts: skins.map(s => s.joints.length), vertices, triangles, primitiveCount, inverseBindMatrices, maxWeightSumError, invalidJointIndices, nonFiniteValues, images, animationCount: (json.animations || []).length, animationNames: (json.animations || []).map(a => a.name) };
}

async function rendererCase(input) {
  if (typeof Project !== 'undefined' && Project) { Project.saved = true; Project.close(); }
  setupProject(Formats.nmtm);
  const api = globalThis.__NMTM_TEST__.api;
  if (input.rejectSkeleton) {
    try { api.importCustom(input.mesh, input.skeleton, [], '', input.label, null); }
    catch (error) { return { label: input.label, rejected: true, message: String(error.message || error), bonesAfter: ArmatureBone.all.length, meshesAfter: Mesh.all.length }; }
    return { label: input.label, rejected: false };
  }
  const sourceKeys = new WeakMap(), originalAddVertices = Mesh.prototype.addVertices;
  let armature;
  Mesh.prototype.addVertices = function(...vertices) {
    let keys = originalAddVertices.apply(this, vertices);
    // JavaScript enumerates integer-like object keys numerically, not in source
    // vertex order. Force that condition in one fixture; capture addVertices'
    // documented return order instead of guessing it from mesh.vertices.
    if (input.reorderVertexKeys) {
      const replacement = keys.map((_, index) => String([1000, 2, 100][index] ?? (2000 + index)));
      const positions = keys.map(key => this.vertices[key]);
      keys.forEach(key => { delete this.vertices[key]; });
      replacement.forEach((key, index) => { this.vertices[key] = positions[index]; });
      keys = replacement;
    }
    sourceKeys.set(this, keys.slice()); return keys;
  };
  try { armature = api.importCustom(input.mesh, input.skeleton, input.animations, input.source || '', input.label, null); }
  finally { Mesh.prototype.addVertices = originalAddVertices; }
  // Synthetic inputs use exact PNG fixtures; real inputs must exercise the
  // production source-path/material resolver with no image or face replacement.
  const textures = [];
  if (input.realTextureResolver) textures.push(...Texture.all);
  for (let index = 0; !input.realTextureResolver && index < input.textures.length; index++) {
    const fixture = input.textures[index];
    const texture = new Texture({ name: fixture.file.split(/[\\/]/).pop().toLowerCase(), mode: 'bitmap', keep_size: true });
    texture.fromDataURL(fixture.dataUrl).add(false);
    texture.uv_width = fixture.width; texture.uv_height = fixture.height;
    texture.nmtm_source_path = fixture.file; texture.nmtm_size = { width: fixture.width, height: fixture.height };
    textures.push(texture);
    const mesh = Mesh.all[index], keys = sourceKeys.get(mesh), section = input.mesh.mesh[index];
    const indices = new Map(keys.map((key, vertex) => [key, vertex]));
    Object.values(mesh.faces).forEach(face => {
      face.texture = texture.uuid;
      face.vertices.forEach(key => { const uv = section.vertices[indices.get(key)].uvcoord || [0, 0]; face.uv[key] = [uv[0] * fixture.width, uv[1] * fixture.height]; });
    });
  }
  await new Promise(resolve => setTimeout(resolve, 200));
  textures.forEach(texture => { texture.updateMaterial(); texture.updateChangesAfterEdit(); });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (textures.every(texture => texture.img && texture.img.complete && texture.img.naturalWidth > 0)) break;
    if (attempt === 99) throw new Error('Source fixture PNG did not decode');
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  Canvas.updateAllBones();
  Canvas.updateView({ elements: Mesh.all.concat(ArmatureBone.all), element_aspects: { geometry: true, faces: true, transform: true } });
  Project.model_3d.updateMatrixWorld(true);
  const bones = armature.getAllBones(), records = new Map(input.skeleton.skeleton.map(record => [record.name, record])), worlds = new Map();
  const world = record => {
    if (worlds.has(record.name)) return worlds.get(record.name);
    const matrix = new THREE.Matrix4().compose(new THREE.Vector3(...(record.initpos || [0, 0, 0])), new THREE.Quaternion(...(record.initquaternion || [0, 0, 0, 1])).normalize(), new THREE.Vector3(...(record.initscale || [1, 1, 1])));
    const parent = records.get(record.parent);
    if (parent && parent !== record) matrix.premultiply(world(parent));
    worlds.set(record.name, matrix); return matrix;
  };
  const boneAudit = bones.map(bone => {
    const record = records.get(bone.name), expectedRotation = new THREE.Quaternion(...(record.initquaternion || [0, 0, 0, 1])).normalize();
    const actualOrigin = new THREE.Vector3().setFromMatrixPosition(bone.scene_object.matrixWorld), expectedOrigin = new THREE.Vector3().setFromMatrixPosition(world(record));
    return { name: bone.name, parent: bone.parent && bone.parent.name, rawQuaternionNorm: Math.hypot(...(record.initquaternion || [0, 0, 0, 1])), restQuaternionNorm: Math.hypot(...bone.nmtm_rest_quaternion), localRotationErrorDegrees: Math.radToDeg(expectedRotation.angleTo(bone.scene_object.quaternion)), originError: actualOrigin.distanceTo(expectedOrigin), scaleError: bone.scene_object.scale.distanceTo(new THREE.Vector3(...(record.initscale || [1, 1, 1]))) };
  });
  let vertices = 0, missingWeights = 0, maxWeightSumError = 0, maxSourceWeightError = 0;
  const meshAudit = Mesh.all.map((mesh, sectionIndex) => {
    const source = input.mesh.mesh[sectionIndex];
    const keys = sourceKeys.get(mesh);
    keys.forEach((key, vertexIndex) => {
      vertices++;
      const expected = new Map();
      (source.vertices[vertexIndex].weight || []).forEach(([name, weight]) => { if (weight > 0) expected.set(name, (expected.get(name) || 0) + weight); });
      const total = Array.from(expected.values()).reduce((sum, value) => sum + value, 0);
      const actual = bones.map(bone => [bone.name, bone.getVertexWeight(mesh, key)]);
      const sum = actual.reduce((value, pair) => value + pair[1], 0);
      if (!sum) missingWeights++;
      maxWeightSumError = Math.max(maxWeightSumError, Math.abs(sum - 1));
      actual.forEach(([name, weight]) => { maxSourceWeightError = Math.max(maxSourceWeightError, Math.abs(weight - ((expected.get(name) || 0) / total))); });
    });
    return { name: mesh.name, vertices: keys.length, sourceKeyOrderDiffers: Object.keys(mesh.vertices).some((key, index) => key !== keys[index]) };
  });
  const animationAudit = Animation.all.map(animation => ({ name: animation.name, length: animation.length, animators: Object.values(animation.animators).filter(animator => animator.element).map(animator => ({ bone: animator.element.name, position: animator.position.length, rotation: animator.rotation.length, scale: animator.scale.length, firstPosition: animator.position[0] && animator.position[0].getFixed().toArray(), firstRotation: animator.rotation[0] && animator.rotation[0].getFixed(0, true).toArray() })) }));
  // Exercise the actual Blockbench interpolation/display path. An absolute
  // source quaternion is not the same as an additive Euler rotation when the
  // rest pose is nonidentity. Compare first/mid/last with independent slerp.
  const previewAudit = [];
  const previousTime = Timeline.time;
  let importedIndex = 0;
  for (const entry of input.animations) {
    const data = entry.data || entry, raw = data.animation || data;
    const animation = Animation.all[importedIndex++];
    if (!animation) continue;
    const candidates = (raw.tracks || []).filter(track => {
      const mask = track.chanelMask ?? track.channelMask;
      return records.has(track.bone) && (mask == null || !Number.isFinite(Number(mask)) || (Number(mask) & 2)) && (track.keyframes || track.keyFrames || []).some(frame => Array.isArray(frame.quaternion) && frame.quaternion.length >= 4);
    });
    candidates.sort((a, b) => {
      const score = track => { const rest = records.get(track.bone).initquaternion || [0, 0, 0, 1]; return (Math.abs(rest[0]) + Math.abs(rest[1]) + Math.abs(rest[2]) > 0.001 ? 2 : 0) + ((track.keyframes || track.keyFrames || []).length > 1 ? 1 : 0); };
      return score(b) - score(a);
    });
    const track = candidates[0];
    if (!track) continue;
    const animator = Object.values(animation.animators).find(item => item.element && item.element.name === track.bone);
    if (!animator) throw new Error('Missing representative rotation animator: ' + track.bone);
    const frames = (track.keyframes || track.keyFrames || []).filter(frame => Array.isArray(frame.quaternion) && frame.quaternion.length >= 4).slice().sort((a, b) => Number(a.time || 0) - Number(b.time || 0));
    const first = Number(frames[0].time || 0), last = Number(frames[frames.length - 1].time || 0);
    animation.select();
    for (const time of [first, (first + last) / 2, last]) {
      let left = frames[0], right = frames[frames.length - 1];
      for (let index = 0; index < frames.length; index++) {
        if (Number(frames[index].time || 0) <= time) left = frames[index];
        if (Number(frames[index].time || 0) >= time) { right = frames[index]; break; }
      }
      const start = Number(left.time || 0), end = Number(right.time || 0), factor = end > start ? Math.max(0, Math.min(1, (time - start) / (end - start))) : 0;
      const expected = new THREE.Quaternion(...left.quaternion).normalize().slerp(new THREE.Quaternion(...right.quaternion).normalize(), factor);
      Timeline.time = time; Animator.showDefaultPose(true);
      const values = animator.interpolate('rotation');
      animator.displayRotation(values);
      const actual = animator.element.scene_object.quaternion.clone().normalize();
      previewAudit.push({ animation: animation.name, bone: track.bone, time, expected: expected.toArray(), actual: actual.toArray(), localRotationErrorDegrees: Math.radToDeg(expected.angleTo(actual)) });
    }
  }
  Timeline.time = previousTime; Animator.showDefaultPose(true);
  const textureResolverAudit = input.realTextureResolver ? { manualTextureReplacement: false, textures: textures.map(texture => ({ uuid: texture.uuid, name: texture.name, sourcePath: texture.nmtm_source_path, width: texture.img.naturalWidth, height: texture.img.naturalHeight, uvWidth: texture.uv_width, uvHeight: texture.uv_height })), sections: Mesh.all.map((mesh, sectionIndex) => {
    const keys = sourceKeys.get(mesh), indices = new Map(keys.map((key, index) => [key, index])), source = input.mesh.mesh[sectionIndex], fixture = input.textures[sectionIndex];
    let invalidTextureIds = 0, maxUvError = 0; const uvMin = [Infinity, Infinity], uvMax = [-Infinity, -Infinity];
    for (const face of Object.values(mesh.faces)) {
      if (!textures.some(texture => texture.uuid === face.texture)) invalidTextureIds++;
      for (const key of face.vertices) for (let axis = 0; axis < 2; axis++) { const value = face.uv[key][axis], expected = source.vertices[indices.get(key)].uvcoord[axis] * (axis ? fixture.height : fixture.width); maxUvError = Math.max(maxUvError, Math.abs(value - expected)); uvMin[axis] = Math.min(uvMin[axis], value); uvMax[axis] = Math.max(uvMax[axis], value); }
    }
    return { faceCount: Object.keys(mesh.faces).length, invalidTextureIds, maxUvError, uvMin, uvMax };
  }) } : null;
  const result = { label: input.label, vertices, missingWeights, maxWeightSumError, maxSourceWeightError, meshes: meshAudit, bones: boneAudit, animations: animationAudit, previewAudit, textureResolverAudit, loadedTextures: textures.map(texture => ({ name: texture.name, width: texture.img.naturalWidth, height: texture.img.naturalHeight })), exportMethod: typeof api.compileRigGlb === 'function' ? 'NMTM.compileRigGlb' : 'Codecs.gltf.compile' };
  const glb = typeof api.compileRigGlb === 'function' ? await api.compileRigGlb() : await Codecs.gltf.compile({ encoding: 'binary', scale: 16, embed_textures: true, armature: true, animations: true });
  result.glbBytes = Array.from(new Uint8Array(glb));
  return result;
}

function verifyResult(input, result) {
  if (input.rejectSkeleton) {
    assert.equal(result.rejected, true, 'Missing skeleton must reject import');
    assert.match(result.message, /matching skeleton|skeleton JSON/i);
    assert.equal(result.bonesAfter, 0); assert.equal(result.meshesAfter, 0);
    return;
  }
  assert.equal(result.meshes.length, input.mesh.mesh.length, 'All mesh sections imported');
  assert.equal(result.bones.length, input.skeleton.skeleton.length, 'All bones imported');
  assert.equal(result.vertices, input.mesh.mesh.reduce((sum, section) => sum + section.vertices.length, 0));
  assert.equal(result.missingWeights, 0);
  assert.ok(result.maxWeightSumError < 1e-6, 'Runtime skin weights sum to one: ' + result.maxWeightSumError);
  assert.ok(result.maxSourceWeightError < 1e-6, 'Duplicate source weights are summed: ' + result.maxSourceWeightError);
  for (const bone of result.bones) {
    assert.ok(Math.abs(bone.restQuaternionNorm - 1) < 1e-8, 'Normalized rest quaternion: ' + bone.name);
    assert.ok(bone.localRotationErrorDegrees < 0.001, 'Rest quaternion orientation: ' + bone.name + ' error=' + bone.localRotationErrorDegrees);
    assert.ok(bone.originError < 0.001, 'Rest world origin: ' + bone.name + ' error=' + bone.originError);
    assert.ok(bone.scaleError < 1e-6, 'Rest scale: ' + bone.name + ' error=' + bone.scaleError);
  }
  for (const sample of result.previewAudit || []) assert.ok(sample.localRotationErrorDegrees < 0.01, 'Runtime quaternion preview ' + sample.animation + ':' + sample.bone + '@' + sample.time + ' error=' + sample.localRotationErrorDegrees);
  if (input.reorderVertexKeys) assert.ok(result.meshes.every(mesh => mesh.sourceKeyOrderDiffers), 'Fixture exercises non-source object-key enumeration order');
  // Blockbench renames duplicate animation names (e.g. two "Take 001" clips
  // become "Take 001" and "Take 2"). Imported animations retain source order;
  // a name-based find would compare the second source clip with the first one.
  const expectedAnimations = input.animations.filter(entry => {
    const data = entry.data || entry, raw = data.animation || data;
    return (raw.tracks || []).some(track => input.skeleton.skeleton.some(bone => bone.name === track.bone) && (track.keyframes || track.keyFrames || []).some(frame => {
      const mask = track.chanelMask ?? track.channelMask;
      const enabled = bit => mask == null || !Number.isFinite(Number(mask)) || (Number(mask) & bit) !== 0;
      return (enabled(1) && Array.isArray(frame.pos)) || (enabled(2) && (Array.isArray(frame.quaternion) || Array.isArray(frame.rotation))) || (enabled(4) && Array.isArray(frame.scale));
    }));
  });
  assert.equal(result.animations.length, expectedAnimations.length, 'Every nonempty source animation imported once');
  for (const [animationIndex, entry] of expectedAnimations.entries()) {
    const data = entry.data || entry, raw = data.animation || data;
    const actual = result.animations[animationIndex];
    assert.ok(actual, 'Imported animation ' + (raw.name || entry.name));
    const expectedByBone = new Map();
    for (const track of raw.tracks || []) {
      if (!input.skeleton.skeleton.some(bone => bone.name === track.bone)) continue;
      const expectedCounts = expectedByBone.get(track.bone) || { position: 0, rotation: 0, scale: 0 };
      const frames = track.keyframes || track.keyFrames || [], mask = track.chanelMask ?? track.channelMask;
      const enabled = bit => mask == null || !Number.isFinite(Number(mask)) || (Number(mask) & bit) !== 0;
      for (const [channel, field, bit] of [['position', 'pos', 1], ['rotation', 'quaternion', 2], ['scale', 'scale', 4]]) {
        const expected = enabled(bit) ? frames.filter(frame => Array.isArray(frame[field]) || (channel === 'rotation' && Array.isArray(frame.rotation))).length : 0;
        expectedCounts[channel] += expected;
      }
      expectedByBone.set(track.bone, expectedCounts);
    }
    for (const [bone, counts] of expectedByBone) {
      const animator = actual.animators.find(item => item.bone === bone);
      assert.ok(animator, 'Animator for ' + bone);
      for (const channel of ['position', 'rotation', 'scale']) assert.equal(animator[channel], counts[channel], 'Mask channel ' + animationIndex + ':' + bone + '.' + channel);
    }
  }
  assert.ok(result.glb.skinnedMeshNodes > 0, 'GLB has skinned geometry');
  assert.equal(result.glb.triangles, input.mesh.mesh.reduce((sum, section) => sum + section.indices.reduce((count, face) => count + face.length - 2, 0), 0), 'All sections preserve triangle count even when merged by the GLB codec');
  assert.ok(result.glb.skinCount > 0);
  assert.equal(result.glb.invalidJointIndices, 0); assert.equal(result.glb.nonFiniteValues, 0);
  assert.ok(result.glb.maxWeightSumError < 1e-5, 'GLB weights normalized');
  assert.ok(result.glb.images.length > 0, 'Source textures embedded');
  assert.equal(result.glb.animationCount, result.animations.length, 'All animations exported');
  input.textures.forEach(texture => assert.ok(result.glb.images.some(image => image.width === texture.width && image.height === texture.height), 'Embedded source texture dimensions'));
  if (input.realTextureResolver) {
    assert.equal(result.textureResolverAudit.manualTextureReplacement, false);
    assert.ok(result.textureResolverAudit.textures.length > 0, 'Production texture resolver created readable images');
    input.textures.forEach(texture => {
      const actual = result.textureResolverAudit.textures.find(item => item.sourcePath && path.resolve(item.sourcePath).toLowerCase() === path.resolve(texture.file).toLowerCase());
      assert.ok(actual, 'Production source material resolves expected PNG: ' + texture.file);
      assert.equal(actual.width, texture.width); assert.equal(actual.height, texture.height);
      assert.equal(actual.uvWidth, texture.width); assert.equal(actual.uvHeight, texture.height);
      assert.ok(result.glb.images.some(image => image.sha256 === texture.sha256), 'Embedded original source PNG bytes retain their SHA256');
    });
    for (const section of result.textureResolverAudit.sections) { assert.ok(section.faceCount > 0); assert.equal(section.invalidTextureIds, 0, 'Production face texture UUID resolves in this project'); assert.ok(section.maxUvError < 1e-6, 'Production UV pixel coordinates preserve source bounds'); }
  }
}

async function main() {
  assert.ok(fs.existsSync(executable), 'Blockbench executable missing: ' + executable);
  const pluginSource = fs.readFileSync(path.join(workspace, 'nmtm.js'), 'utf8');
  assert.ok(pluginSource.includes('compileRigGlb,'), 'Production opt-in test hook includes compileRigGlb');
  assert.equal(path.parse(output).root.toLowerCase(), path.parse(workspace).root.toLowerCase(), 'Profiles must remain on workspace drive');
  fs.mkdirSync(output, { recursive: true });
  const profile = fs.mkdtempSync(path.join(output, 'profile-'));
  process.env.NMTM_TEST_CDP_PIPE = '1';
  const port = null;
  const session = createHiddenSession(executable, profile, port);
  const child = session.child;
  let client;
  const report = { startedAt: new Date().toISOString(), pluginSha256: sha256(pluginSource), productionFileModifiedByTest: false, output, textureFixtureMode: 'Synthetic cases inject exact PNG fixtures. All seven real cases use actual source paths/material references through the production resolver without texture or face replacement; source dimensions, UUIDs, UVs and embedded original PNG SHA256 are verified.', cases: [] };
  const save = () => fs.writeFileSync(path.join(output, 'rig-regression.json'), JSON.stringify(report, null, 2));
  try {
    console.log('START owned Blockbench ' + child.pid + ', inherited CDP pipe (no TCP listener)');
    client = await Promise.race([require('./nmtm_cdp_pipe.cjs').pipeClient(child).renderer(), new Promise((_, reject) => setTimeout(() => reject(new Error('Blockbench CDP startup timed out')), 30000))]); await client.opened;
    console.log('CONNECTED Blockbench renderer');
    report.ownedTestPid = child.pid;
    report.cdpTransport = session.cdpTransport;
    for (let attempt = 0; attempt < 100; attempt++) {
      const events = fs.existsSync(session.eventLog) ? fs.readFileSync(session.eventLog, 'utf8').trim().split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line)) : [];
      assert.ok(!events.some(event => event.failure), 'Isolated native guard failed: ' + JSON.stringify(events.filter(event => event.failure)));
      if (events.some(event => event.event === 'desktop-assigned')) break;
      if (attempt === 99) throw new Error('No verified desktop-2 assignment before renderer testing');
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    for (let attempt = 0; attempt < 80; attempt++) {
      if (await evaluate(client, 'typeof Plugin === "function" && typeof THREE === "object"')) break;
      if (attempt === 79) throw new Error('Renderer API did not finish loading');
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    await evaluate(client, 'globalThis.__NMTM_TEST__ = {}; globalThis.__NMTM_MESSAGES__ = []; Blockbench.showMessageBox = function(options, callback) { globalThis.__NMTM_MESSAGES__.push(options); if (typeof callback === "function") callback(0); return Promise.resolve({response:0, checkboxChecked:false}); }; true');
    console.log('LOADING actual nmtm.js file');
    report.loader = await evaluate(client, '(async () => { const plugin = new Plugin(); await plugin.loadFromFile({path:' + JSON.stringify(path.join(workspace, 'nmtm.js')) + '}, false); return {id:plugin.id,version:plugin.version,installed:plugin.installed,source:plugin.source,hookReady:!!globalThis.__NMTM_TEST__.api,registered:Plugins.registered.nmtm === plugin,messages:globalThis.__NMTM_MESSAGES__}; })()');
    save();
    assert.equal(report.loader.id, 'nmtm'); assert.equal(report.loader.registered, true); assert.equal(report.loader.hookReady, true);
    assert.equal(report.loader.messages.length, 0, 'Real plugin file loader must not show error dialogs');
    report.blockbench = await evaluate(client, 'Blockbench.version');
    report.windowIsolation = validateHiddenSession(session);
    const run = async input => {
      let result;
      try {
        result = await evaluate(client, '(' + rendererCase.toString() + ')(' + JSON.stringify(input) + ')');
        if (result.glbBytes) {
          const bytes = Buffer.from(result.glbBytes); delete result.glbBytes;
          result.glbPath = path.join(output, input.label + '.glb');
          fs.writeFileSync(result.glbPath, bytes);
          result.glb = glbAudit(bytes);
          result.textureSources = input.textures.map(({ dataUrl, ...metadata }) => metadata);
        }
        verifyResult(input, result); result.passed = true;
      } catch (error) { result = { ...result, label: input.label, passed: false, error: String(error.stack || error) }; }
      report.cases.push(result); save();
      console.log((result.passed ? 'PASS ' : 'FAIL ') + input.label + ' ' + JSON.stringify({ vertices: result.vertices, maxWeightError: result.maxSourceWeightError, maxBoneOriginError: Math.max(0, ...(result.bones || []).map(bone => bone.originError)), skins: result.glb && result.glb.skinCount, skinnedSections: result.glb && result.glb.skinnedMeshNodes, images: result.glb && result.glb.images.length, error: result.error }));
    };
    const texture = fixtureTexture('2026s8/ss_s8Time_Craft');
    const triangle = (weights = [['child', 1]]) => ({ vertices: [[1, 0, 0], [2, 0, 0], [1, 1, 0]].map((pos, index) => ({ pos, uvcoord: [[0, 0], [1, 0], [0, 1]][index], weight: weights })), indices: [[0, 1, 2]] });
    const skeleton = { skeleton: [{ name: 'root', parent: 'root', initpos: [0, 0, 0], initquaternion: [0, 0, 0, 1], initscale: [1, 1, 1] }, { name: 'child', parent: 'root', initpos: [1, 0, 0], initquaternion: [0, 0, 0, 1], initscale: [1, 1, 1] }] };
    await run({ label: 'missing-skeleton', rejectSkeleton: true, mesh: { mesh: [triangle()] }, skeleton: null });
    const nonUnit = JSON.parse(JSON.stringify(skeleton)); nonUnit.skeleton[1].initquaternion = [0.8, -0.4, 1.2, 1.6];
    await run({ label: 'initial-quaternion-normalization', mesh: { mesh: [triangle()] }, skeleton: nonUnit, animations: [], textures: [texture] });
    const duplicateTriangle = triangle();
    duplicateTriangle.vertices.forEach((vertex, index) => { vertex.weight = [[['root', 0.2], ['root', 0.4], ['child', 1.4]], [['root', 1.5], ['child', 0.25], ['child', 0.25]], [['child', 0.7], ['child', 0.3]]][index]; });
    await run({ label: 'duplicate-weights-summed', reorderVertexKeys: true, mesh: { mesh: [duplicateTriangle] }, skeleton, animations: [], textures: [texture] });
    const frames = [0, 1].map(time => ({ time, pos: [1 + time, 0, 0], quaternion: [0, 0, 0, 1], scale: [1, 1, 1] }));
    const animations = [{ data: { name: 'both_mask_spellings', length: 1, tracks: [{ bone: 'root', chanelMask: 2, keyframes: frames }, { bone: 'child', channelMask: 1, keyframes: frames }] } }];
    const nonuniform = JSON.parse(JSON.stringify(nonUnit));
    nonuniform.skeleton[0].initscale = [1.7, 0.6, 1.2]; nonuniform.skeleton[1].initscale = [0.8, 1.3, 0.7];
    const scaledAnimations = fixture => [{ data: { name: 'scaled_bind_pose', length: 1, tracks: fixture.skeleton.map(record => ({ bone: record.name, channelMask: 7, keyframes: [0, 1].map(time => ({ time, pos: record.initpos.map((value, axis) => value + (axis === 1 ? time * 0.2 : 0)), quaternion: time ? [0.1, 0.3, -0.2, 0.9] : record.initquaternion.slice(), scale: record.initscale.map((value, axis) => value * (1 + time * (axis + 1) * 0.1)) })) })) } }];
    await run({ label: 'nonuniform-rest-scale', mesh: { mesh: [triangle()] }, skeleton: nonuniform, animations: scaledAnimations(nonuniform), textures: [texture] });
    const negative = JSON.parse(JSON.stringify(nonuniform)); negative.skeleton[0].initscale[0] *= -1; negative.skeleton[1].initscale[2] *= -1;
    await run({ label: 'negative-rest-scale', mesh: { mesh: [triangle()] }, skeleton: negative, animations: scaledAnimations(negative), textures: [texture] });
    await run({ label: 'channel-mask-spellings', mesh: { mesh: [triangle()] }, skeleton, animations, textures: [texture] });
    await run({ label: 'two-mesh-sections', mesh: { mesh: [triangle(), triangle([['root', 1]])] }, skeleton, animations, textures: [texture, texture] });
    for (const [folder, name] of [['2026s8', 'ss_s8Time_Craft'], ['2025s6', 'cs_s6Cyber_skin_guajian_back'], ['2025s7', 'cs_s7NiuMoWang_skin_guajian_pifeng'], ['2025s6', 'cs_s6Jiaolong_horse'], ['2025s6', 'cs_s6FlowerDragon_skin_guajian_weiba'], ['2026s8', 'ss_s8Galaxy_horse'], ['2025s7', 'cs_s7WuKong_horse']]) {
      const base = path.join(pack, 'models', folder), source = path.join(base, 'mesh', name + '_mesh.json'), mesh = readJson(source);
      const animationFiles = fs.readdirSync(path.join(base, 'animation')).filter(file => file.startsWith(name + '_animation_') && /_(idle|skin)\.json$/.test(file)).sort();
      const animations = animationFiles.map(file => ({ name: path.basename(file, '.json'), data: readJson(path.join(base, 'animation', file)) }));
      await run({ label: name, source, mesh, skeleton: readJson(path.join(base, 'skeleton', name + '_skeleton.json')), animations, realTextureResolver: true, textures: mesh.mesh.map(section => fixtureTexture(section.material || section.texture)) });
    }
    report.lifecycle = await require('./nmtm_rig_lifecycle.cjs')({ client, evaluate, rendererCase, glbAudit, output, texture, triangle, skeleton: nonuniform, animations: scaledAnimations(nonuniform), save });
    report.finishedAt = new Date().toISOString();
    report.passed = report.cases.every(result => result.passed) && report.lifecycle.passed; save();
    assert.equal(report.passed, true, report.cases.filter(result => !result.passed).map(result => result.label + ': ' + result.error).join('\n'));
    console.log('NMTM rig regression passed: ' + report.cases.length + ' cases; outputs: ' + output);
  } finally {
    if (client) client.close();
    await closeHiddenSession(session);
    const resolved = path.resolve(profile);
    assert.ok(resolved.startsWith(path.resolve(output) + path.sep), 'Refusing profile deletion outside owned output');
    fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
