const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function prepareSave() {
  const fields = ['nmtm_binding', 'nmtm_rest_position', 'nmtm_rest_quaternion', 'nmtm_rest_scale'];
  const boneSnapshot = ArmatureBone.all.map(bone => ({ uuid: bone.uuid, name: bone.name, properties: Object.fromEntries(fields.map(key => [key, JSON.parse(JSON.stringify(bone[key]))])) }));
  const meshSnapshot = Mesh.all.map(mesh => ({ uuid: mesh.uuid, vertices: JSON.parse(JSON.stringify(mesh.vertices)), source: JSON.parse(JSON.stringify(mesh.nmtm_source_section)), skeleton: JSON.parse(JSON.stringify(mesh.nmtm_skeleton_data)), modelName: mesh.nmtm_model_name, weights: ArmatureBone.all.map(bone => ({ name: bone.name, values: Object.keys(mesh.vertices).map(key => bone.getVertexWeight(mesh, key)) })) }));
  return { model: Codecs.project.compile({ raw: true, bitmaps: true }), expected: { bones: boneSnapshot, meshes: meshSnapshot, animationCount: Animation.all.length } };
}

async function reloadAndExport(input) {
  Project.saved = true; Project.close(); setupProject(Formats.nmtm);
  Codecs.project.parse(input.model, input.file);
  const mismatches = [], same = (actual, expected, label) => { if (JSON.stringify(actual) !== JSON.stringify(expected)) mismatches.push(label); };
  for (const expected of input.expected.bones) {
    const bone = ArmatureBone.all.find(item => item.uuid === expected.uuid);
    if (!bone) { mismatches.push('Missing reloaded bone ' + expected.name); continue; }
    for (const [key, value] of Object.entries(expected.properties)) same(bone[key], value, expected.name + ':' + key);
  }
  for (const expected of input.expected.meshes) {
    const mesh = Mesh.all.find(item => item.uuid === expected.uuid);
    if (!mesh) { mismatches.push('Missing reloaded mesh ' + expected.uuid); continue; }
    same(mesh.vertices, expected.vertices, 'Live vertices');
    same(mesh.nmtm_source_section, expected.source, 'Source section metadata');
    same(mesh.nmtm_skeleton_data, expected.skeleton, 'Skeleton metadata');
    same(mesh.nmtm_model_name, expected.modelName, 'Model name metadata');
    for (const record of expected.weights) { const bone = ArmatureBone.all.find(item => item.name === record.name); same(Object.keys(mesh.vertices).map(key => bone.getVertexWeight(mesh, key)), record.values, 'Reloaded weight ' + record.name); }
  }
  same(Animation.all.length, input.expected.animationCount, 'Animation count');
  for (let attempt = 0; attempt < 100; attempt++) {
    if (Texture.all.length && Texture.all.every(texture => texture.img.complete && texture.img.naturalWidth > 0)) break;
    if (attempt === 99) throw new Error('Native bbmodel embedded textures did not decode');
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  Canvas.updateAllBones(); Animator.showDefaultPose(true);
  const preview = [], animation = Animation.all[0]; animation.select();
  const sourceAnimation = input.fixture.animations[0].data;
  for (const track of sourceAnimation.tracks) {
    const animator = Object.values(animation.animators).find(item => item.getElement && item.getElement() && item.getElement().name === track.bone);
    if (!animator) { mismatches.push('Missing reloaded animator ' + track.bone); continue; }
    const frames = track.keyframes;
    for (const time of [0, 0.5, 1]) {
      const expected = new THREE.Quaternion(...frames[0].quaternion).normalize().slerp(new THREE.Quaternion(...frames[1].quaternion).normalize(), time);
      Timeline.time = time; Animator.showDefaultPose(true); animator.displayRotation(animator.interpolate('rotation'));
      preview.push({ bone: track.bone, time, errorDegrees: Math.radToDeg(expected.angleTo(animator.getElement().scene_object.quaternion)) });
    }
  }
  Timeline.time = 0; Animator.showDefaultPose(true);
  const glb = await globalThis.__NMTM_TEST__.api.compileRigGlb();
  return { mismatches, preview, bones: ArmatureBone.all.length, meshes: Mesh.all.length, animations: Animation.all.length, glbBytes: Array.from(new Uint8Array(glb)) };
}

async function groupedExport(input) {
  const api = globalThis.__NMTM_TEST__.api, rig = Armature.all[0], mesh = Mesh.all[0];
  const group = new Group({ name: 'audit_parent', origin: [11, -7, 5], rotation: [23, -31, 17] }).addTo().init();
  rig.addTo(group);
  const key = Object.keys(mesh.vertices)[0], originalVertex = mesh.vertices[key].slice(); mesh.vertices[key][0] += 0.25;
  Mesh.preview_controller.updateGeometry(mesh);
  const secondaryAnimations = JSON.parse(JSON.stringify(input.animations)); secondaryAnimations[0].data.name = 'secondary_motion';
  const secondary = api.importCustom(input.mesh, input.skeleton, secondaryAnimations, '', 'secondary_rig', null);
  const plain = new Mesh({ name: 'plain_survivor' }).addTo().init(); plain.vertices = {}; plain.faces = {};
  const keys = plain.addVertices([5, 0, 0], [6, 0, 0], [5, 1, 0]);
  plain.addFaces(new MeshFace(plain, { vertices: keys, uv: Object.fromEntries(keys.map((key, index) => [key, [[0, 0], [1, 0], [0, 1]][index]])) })); plain.init();
  Canvas.updateAllBones(); Canvas.updateView({ elements: Mesh.all.concat(ArmatureBone.all), element_aspects: { geometry: true, faces: true, transform: true } }); Project.model_3d.updateMatrixWorld(true);
  const a = Project.model_3d.matrixWorld.clone().invert().multiply(rig.scene_object.matrixWorld);
  const position = new THREE.Vector3(), quaternion = new THREE.Quaternion(), scale = new THREE.Vector3(); a.decompose(position, quaternion, scale); position.multiplyScalar(1 / 16);
  const expectedInverseBinds = input.skeleton.skeleton.map(record => { const m = new THREE.Matrix4().set(...(record.offmtx.length === 12 ? record.offmtx.concat([0, 0, 0, 1]) : record.offmtx)); m.elements[12] /= 16; m.elements[13] /= 16; m.elements[14] /= 16; return { name: record.name, matrix: m.toArray() }; });
  const exports = {};
  const compile = async label => { const data = await api.compileRigGlb(); exports[label] = Array.from(new Uint8Array(data)); };
  await compile('grouped-two-rigs');
  group.export = false; await compile('excluded-parent-group'); group.export = true;
  rig.export = false; await compile('excluded-first-rig'); rig.export = true;
  mesh.export = false; await compile('excluded-first-mesh'); mesh.export = true;
  group.export = false; secondary.export = false; await compile('plain-only-all-rigs-excluded');
  return { firstRigName: rig.name, secondRigName: secondary.name, originalVertex, editedVertex: mesh.vertices[key].slice(), expectedEditedGlbPosition: mesh.vertices[key].map(value => value / 16), expectedTransform: { position: position.toArray(), quaternion: quaternion.toArray(), scale: scale.toArray() }, expectedInverseBinds, exports };
}

module.exports = async function lifecycle({ client, evaluate, rendererCase, glbAudit, output, texture, triangle, skeleton, animations }) {
  const fixture = { label: 'lifecycle-source', mesh: { mesh: [triangle()] }, skeleton: JSON.parse(JSON.stringify(skeleton)), animations: JSON.parse(JSON.stringify(animations)), textures: [texture] };
  fixture.skeleton.skeleton[0].initscale[0] *= -1;
  fixture.skeleton.skeleton[0].offmtx = [0.5, 0, 0, 3, 0, 1.2, 0, -2, 0, 0, 0.8, 1];
  fixture.skeleton.skeleton[1].offmtx = [1, 0.1, 0, -1, 0, 0.9, 0, 2, 0, 0, 1.3, -3];
  const result = { passed: false, nativeProjectCodec: 'Codecs.project.compile({raw:true,bitmaps:true}) -> E-drive file -> JSON.parse -> Codecs.project.parse', productionFileModifiedByTest: false };
  const saveGlb = (label, bytes) => { const data = Buffer.from(bytes), file = path.join(output, 'lifecycle-' + label + '.glb'); fs.writeFileSync(file, data); return { file, ...glbAudit(data) }; };
  try {
    await evaluate(client, '(' + rendererCase.toString() + ')(' + JSON.stringify(fixture) + ')');
    const saved = await evaluate(client, '(' + prepareSave.toString() + ')()');
    const file = path.join(output, 'lifecycle-roundtrip.bbmodel'); fs.writeFileSync(file, JSON.stringify(saved.model));
    result.projectPath = file;
    const reload = await evaluate(client, '(' + reloadAndExport.toString() + ')(' + JSON.stringify({ file, model: JSON.parse(fs.readFileSync(file, 'utf8')), expected: saved.expected, fixture }) + ')');
    const bytes = reload.glbBytes; delete reload.glbBytes; result.reload = reload; result.reload.glb = saveGlb('reloaded', bytes);
    assert.deepEqual(reload.mismatches, [], 'Native project reload preserves all registered NMTM metadata, vertices, weights and animations');
    assert.ok(reload.preview.length >= 6); for (const sample of reload.preview) assert.ok(sample.errorDegrees < 0.01, 'Reloaded quaternion preview ' + sample.bone + '@' + sample.time + ' error=' + sample.errorDegrees);
    const grouped = await evaluate(client, '(' + groupedExport.toString() + ')(' + JSON.stringify(fixture) + ')');
    const exports = grouped.exports; delete grouped.exports; result.grouped = grouped; result.grouped.glbs = {};
    for (const [label, data] of Object.entries(exports)) result.grouped.glbs[label] = saveGlb(label, data);
    const full = result.grouped.glbs['grouped-two-rigs']; assert.equal(full.skinCount, 2);
    assert.ok(full.plainMeshNodes.some(node => node.name === 'plain_survivor'), 'Mixed plain geometry survives custom two-rig export');
    const node = full.skinnedNodes.find(item => item.name === grouped.firstRigName); assert.ok(node, 'Moved parent rig node exported');
    for (const [key, expected] of Object.entries(grouped.expectedTransform)) { const actual = node[key] || (key === 'quaternion' ? [0, 0, 0, 1] : key === 'scale' ? [1, 1, 1] : [0, 0, 0]); assert.ok(Math.max(...actual.map((value, index) => Math.abs(value - expected[index]))) < 1e-5, 'Moved-parent rig ' + key + ' preserved'); }
    for (const expected of grouped.expectedInverseBinds) { const actual = full.inverseBindMatrices.find(item => item.name === expected.name); assert.ok(actual); assert.ok(Math.max(...actual.matrix.map((value, index) => Math.abs(value - expected.matrix[index]))) < 1e-5, 'Source inverse bind is unchanged by parent transform: ' + expected.name); }
    assert.ok(full.positionSamples.some(sample => sample.name === grouped.firstRigName && sample.positions.some(position => Math.max(...position.map((value, index) => Math.abs(value - grouped.expectedEditedGlbPosition[index]))) < 1e-6)), 'GLB reads edited live vertices rather than stale source section');
    for (const label of ['excluded-parent-group', 'excluded-first-rig', 'excluded-first-mesh']) { const glb = result.grouped.glbs[label]; assert.equal(glb.skinCount, 1, label + ' suppresses first rig geometry'); assert.ok(glb.plainMeshNodes.some(node => node.name === 'plain_survivor')); assert.ok(glb.animationCount >= 1, 'Remaining rig retains its animation after exclusions'); }
    const plainOnly = result.grouped.glbs['plain-only-all-rigs-excluded']; assert.equal(plainOnly.skinCount, 0); assert.ok(plainOnly.plainMeshNodes.some(node => node.name === 'plain_survivor'));
    result.passed = true; console.log('PASS native bbmodel disk/reload metadata, quaternion preview, moved parent, two rigs, live edit, plain mesh and four exclusion paths');
  } catch (error) { result.error = String(error.stack || error); console.log('FAIL native lifecycle ' + result.error); }
  fs.writeFileSync(path.join(output, 'rig-lifecycle.json'), JSON.stringify(result, null, 2));
  return result;
};
