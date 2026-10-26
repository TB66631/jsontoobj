const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');

const workspace = path.resolve(__dirname, '..');
const blockbench = String(process.env.BLOCKBENCH_EXE || 'D:\\Apps\\Blockbench\\Blockbench.exe');
// This test is also creation-hidden; NMTM_ALLOW_HIDDEN_GUI=1 is an explicit
// gate because the parent runner owns desktop-2 assignment.
const profile = path.join(workspace, 'output', 'nmtm-blockbench-runtime-profile');
const { createHiddenSession, validateHiddenSession, closeHiddenSession } = require('./nmtm_hidden_blockbench.cjs');

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(error => error ? reject(error) : resolve(port));
    });
  });
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, response => {
      let data = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { data += chunk; });
      response.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (error) { reject(error); }
      });
    }).on('error', reject);
  });
}

async function waitForPage(port) {
  let lastError;
  for (let attempt = 0; attempt < 80; attempt++) {
    try {
      const pages = await getJson(`http://127.0.0.1:${port}/json`);
      const page = pages.find(item => item.type === 'page' && item.webSocketDebuggerUrl);
      if (page) return page;
    } catch (error) { lastError = error; }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw lastError || new Error('Blockbench did not expose a renderer page.');
}

function cdpClient(url) {
  const socket = new WebSocket(url);
  let nextId = 1;
  const pending = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(String(event.data));
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  });
  const opened = new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  return {
    opened,
    call(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = nextId++;
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    close() { socket.close(); }
  };
}

async function evaluate(client, expression) {
  const response = await client.call('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: false
  });
  if (response.exceptionDetails) {
    const detail = response.exceptionDetails.exception && response.exceptionDetails.exception.description;
    throw new Error(detail || response.exceptionDetails.text || 'Blockbench runtime evaluation failed.');
  }
  return response.result && response.result.value;
}

async function main() {
  assert.ok(fs.existsSync(blockbench), `Blockbench executable not found: ${blockbench}`);
  const resolvedProfile = path.resolve(profile);
  const outputRoot = path.resolve(workspace, 'output') + path.sep;
  assert.ok(resolvedProfile.startsWith(outputRoot), 'Refusing to use a runtime profile outside workspace/output.');
  fs.rmSync(resolvedProfile, { recursive: true, force: true });
  fs.mkdirSync(resolvedProfile, { recursive: true });

  const port = await freePort();
  const session = createHiddenSession(blockbench, resolvedProfile, port);
  const child = session.child;

  let client;
  try {
    const page = await waitForPage(port);
    client = cdpClient(page.webSocketDebuggerUrl);
    await client.opened;
    for (let attempt = 0; attempt < 80; attempt++) {
      if (await evaluate(client, 'typeof Plugin === "function" && typeof THREE === "object"')) break;
      if (attempt === 79) throw new Error('Blockbench renderer API did not finish loading.');
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    await evaluate(client, 'globalThis.__NMTM_TEST__ = {}; globalThis.__NMTM_MESSAGES__ = []; Blockbench.showMessageBox = function(options, callback) { globalThis.__NMTM_MESSAGES__.push(options); if (typeof callback === "function") callback(0); return Promise.resolve({response:0, checkboxChecked:false}); }; true');
    const loader = await evaluate(client, '(async () => { const plugin = new Plugin(); await plugin.loadFromFile({path:' + JSON.stringify(path.join(workspace, 'nmtm.js')) + '}, false); return {id:plugin.id, version:plugin.version, registered:Plugins.registered.nmtm === plugin, hookReady:!!globalThis.__NMTM_TEST__.api, messages:globalThis.__NMTM_MESSAGES__}; })()');
    assert.equal(loader.id, 'nmtm');
    assert.equal(loader.registered, true);
    assert.equal(loader.hookReady, true);
    assert.deepEqual(loader.messages, []);
    const isolation = validateHiddenSession(session);
    assert.equal(isolation.sourceVersion, '5.1.4');
    const result = await evaluate(client, `(() => {
      const api = globalThis.__NMTM_TEST__.api;
      const positions = [
        [0,0,0], [1,0,0], [1,1,0], [0,1,0],
        [0,0,1], [1,0,1], [1,1,1], [0,1,1]
      ];
      const section = { vertices: [], indices: [] };
      const faceUvs = [[0,0], [0.25,0], [0.25,0.25], [0,0.25]];
      for (const face of [[0,3,2,1], [4,5,6,7], [0,1,5,4], [1,2,6,5], [2,3,7,6], [3,0,4,7]]) {
        const base = section.vertices.length;
        face.forEach((corner, index) => section.vertices.push({ pos: positions[corner], uvcoord: faceUvs[index], weight: [['root',1]] }));
        section.indices.push([base,base+2,base+1], [base,base+3,base+2]);
      }
      const mesh = {
        nmtm_source_section: section,
        nmtm_skeleton_data: { skeleton: [{
          name: 'root', parent: 'root', initpos: [0,0,0],
          initquaternion: [0,0,0,1], initscale: [1,1,1]
        }] },
        nmtm_bones: {}
      };
      const analysis = api.nmtmMeshCuboidAnalysis(mesh);
      const compatibility = {
        compatible: analysis.compatible,
        problems: [], mode: 'nmtm_cuboids', meshes: [mesh],
        meshComponents: analysis.components, cubes: [], groups: new Set(), textures: [], bones: []
      };
      const jem = api.emfJemData('minecraft:nmtm/runtime_test', [64,64], compatibility, 'body', null);
      const rootBone = jem.models[0].submodels[0];
      const boxModel = rootBone.submodels[0];
      return {
        apiReady: typeof api.emfJemData === 'function',
        compatible: analysis.compatible,
        part: jem.models[0].part,
        bone: rootBone.id,
        coordinates: boxModel.boxes[0].coordinates,
        uvFaces: Object.keys(boxModel.boxes[0]).filter(key => /^uv/.test(key)).sort()
      };
    })()`);

    assert.equal(result.apiReady, true);
    assert.equal(result.compatible, true);
    assert.equal(result.part, 'body');
    assert.equal(result.bone, 'root');
    assert.deepEqual(result.coordinates, [-0.5, -0.5, -0.5, 1, 1, 1]);
    assert.deepEqual(result.uvFaces, ['uvDown', 'uvEast', 'uvNorth', 'uvSouth', 'uvUp', 'uvWest']);

    const realBase = path.join(workspace, 'NetMC Assets', '[3.8.30.293955]', 'assets', 'assets', 'resource_packs', 'vanilla_netease', 'models', '2026s8');
    const realMeshPath = path.join(realBase, 'mesh', 'xy_s8lehun_skin_guajian_rightarm_mesh.json');
    const realSkeletonPath = path.join(realBase, 'skeleton', 'xy_s8lehun_skin_guajian_rightarm_skeleton.json');
    if (fs.existsSync(realMeshPath) && fs.existsSync(realSkeletonPath)) {
      const realMesh = JSON.parse(fs.readFileSync(realMeshPath, 'utf8'));
      const realSkeleton = JSON.parse(fs.readFileSync(realSkeletonPath, 'utf8'));
      const realResult = await evaluate(client, `(() => {
        const api = globalThis.__NMTM_TEST__.api;
        const mesh = {
          nmtm_source_section: ${JSON.stringify(realMesh.mesh[0])},
          nmtm_skeleton_data: ${JSON.stringify(realSkeleton)},
          nmtm_bones: {}
        };
        const analysis = api.nmtmMeshCuboidAnalysis(mesh);
        const jem = api.emfJemData('minecraft:nmtm/real_sample', [64,64], {
          compatible: true,
          problems: [], mode: 'nmtm_voxels', meshes: [mesh],
          meshComponents: [], cubes: [], groups: new Set(), textures: [], bones: [],
          voxelSize: 1, maxVoxels: 2048
        }, 'right_arm', null);
        const boxes = [];
        const visit = model => {
          if (Array.isArray(model.boxes)) boxes.push(...model.boxes);
          if (Array.isArray(model.submodels)) model.submodels.forEach(visit);
        };
        jem.models.forEach(visit);
        return {
          strictCompatible: analysis.compatible,
          componentCount: analysis.components.length,
          boxCount: boxes.length,
          finite: boxes.every(box => box.coordinates.every(Number.isFinite)),
          validUvs: boxes.every(box => {
            const faces = Object.keys(box).filter(name => /^uv/.test(name));
            return faces.length > 0 && faces.every(name => Array.isArray(box[name]) && box[name].length === 4);
          })
        };
      })()`);
      assert.equal(realResult.strictCompatible, false);
      assert.ok(realResult.boxCount > 0);
      assert.equal(realResult.finite, true);
      assert.equal(realResult.validUvs, true);
    }

    const adaptiveMeshPath = path.join(realBase, 'mesh', 'ss_s8Time_Craft_mesh.json');
    const adaptiveSkeletonPath = path.join(realBase, 'skeleton', 'ss_s8Time_Craft_skeleton.json');
    if (fs.existsSync(adaptiveMeshPath) && fs.existsSync(adaptiveSkeletonPath)) {
      const adaptiveMesh = JSON.parse(fs.readFileSync(adaptiveMeshPath, 'utf8'));
      const adaptiveSkeleton = JSON.parse(fs.readFileSync(adaptiveSkeletonPath, 'utf8'));
      const adaptiveResult = await evaluate(client, `(() => {
        const api = globalThis.__NMTM_TEST__.api;
        const mesh = {
          nmtm_source_section: ${JSON.stringify(adaptiveMesh.mesh[0])},
          nmtm_skeleton_data: ${JSON.stringify(adaptiveSkeleton)},
          nmtm_bones: {}
        };
        const compatibility = {
          compatible: true, problems: [], mode: 'nmtm_voxels', meshes: [mesh],
          meshComponents: [], cubes: [], groups: new Set(), textures: [], bones: [],
          voxelSize: 1, maxVoxels: 2048, autoVoxelFit: true
        };
        const jem = api.emfJemData('minecraft:nmtm/ss_s8time_craft', [256,256], compatibility, 'body', null);
        const block = api.nmtmAdaptiveBlockVoxelModel([mesh], 'nmtm:block/ss_s8time_craft', [256,256], 22, 2048, 0.25, true);
        const boxes = [];
        const visit = model => {
          if (Array.isArray(model.boxes)) boxes.push(...model.boxes);
          if (Array.isArray(model.submodels)) model.submodels.forEach(visit);
        };
        jem.models.forEach(visit);
        return {
          requestedSize: compatibility.voxelSize,
          actualSize: compatibility.actualVoxelSize,
          adjusted: compatibility.voxelWasAdapted,
          voxelCount: compatibility.voxelCount,
          boxCount: boxes.length,
          finite: boxes.every(box => box.coordinates.every(Number.isFinite)),
          blockRequestedResolution: block.requestedResolution,
          blockActualResolution: block.actualResolution,
          blockAdjusted: block.adjusted,
          blockElements: block.model.elements.length,
          blockFinite: block.model.elements.every(element => element.from.concat(element.to).every(Number.isFinite))
        };
      })()`);
      assert.equal(adaptiveResult.requestedSize, 1);
      assert.equal(adaptiveResult.adjusted, true);
      assert.ok(adaptiveResult.actualSize > 1);
      assert.ok(adaptiveResult.voxelCount > 0 && adaptiveResult.voxelCount <= 2048);
      assert.equal(adaptiveResult.boxCount, adaptiveResult.voxelCount);
      assert.equal(adaptiveResult.finite, true);
      assert.ok(adaptiveResult.blockElements > 0 && adaptiveResult.blockElements <= 2048);
      assert.equal(adaptiveResult.blockRequestedResolution, 22);
      assert.ok(adaptiveResult.blockActualResolution < 22);
      assert.equal(adaptiveResult.blockAdjusted, true);
      assert.equal(adaptiveResult.blockFinite, true);
      console.log(`NMTM adaptive voxel test passed (ss_s8Time_Craft: EMF size ${adaptiveResult.actualSize}/${adaptiveResult.voxelCount} boxes; Java block resolution ${adaptiveResult.blockActualResolution}/${adaptiveResult.blockElements} elements)`);

      const strictVoxelResult = await evaluate(client, `(() => {
        const api = globalThis.__NMTM_TEST__.api;
        const mesh = {
          nmtm_source_section: ${JSON.stringify(adaptiveMesh.mesh[0])},
          nmtm_skeleton_data: ${JSON.stringify(adaptiveSkeleton)},
          nmtm_bones: {}
        };
        try {
          api.emfJemData('minecraft:nmtm/ss_s8time_craft_strict', [256,256], {
            compatible: true, problems: [], mode: 'nmtm_voxels', meshes: [mesh],
            meshComponents: [], cubes: [], groups: new Set(), textures: [], bones: [],
            voxelSize: 1, maxVoxels: 2048, autoVoxelFit: false
          }, 'body', null);
          return { threw: false };
        } catch (error) {
          return { threw: true, code: error.code || null };
        }
      })()`);
      assert.equal(strictVoxelResult.threw, true);
      assert.equal(strictVoxelResult.code, 'NMTM_VOXEL_LIMIT');

      const cappedResult = await evaluate(client, `(() => {
        const api = globalThis.__NMTM_TEST__.api;
        const mesh = {
          nmtm_source_section: ${JSON.stringify(adaptiveMesh.mesh[0])},
          nmtm_skeleton_data: ${JSON.stringify(adaptiveSkeleton)},
          nmtm_bones: {}
        };
        try {
          api.emfJemData('minecraft:nmtm/ss_s8time_craft_capped', [256,256], {
            compatible: true, problems: [], mode: 'nmtm_voxels', meshes: [mesh],
            meshComponents: [], cubes: [], groups: new Set(), textures: [], bones: [],
            voxelSize: 1, maxVoxels: 2048, maxAutoVoxelSize: 1, autoVoxelFit: true
          }, 'body', null);
          return { threw: false };
        } catch (error) {
          return { threw: true, code: error.code || null, message: String(error.message || error) };
        }
      })()`);
      assert.equal(cappedResult.threw, true);
      assert.match(cappedResult.message, /configured maximum 1/);
    }

    const multiFiles = [
      {
        name: 'ss_s8lehun_skin_guajian_leftarm',
        mesh: path.join(realBase, 'mesh', 'ss_s8lehun_skin_guajian_leftarm_mesh.json'),
        skeleton: path.join(realBase, 'skeleton', 'ss_s8lehun_skin_guajian_leftarm_skeleton.json')
      },
      {
        name: 'ss_s8lehun_skin_guajian_head',
        mesh: path.join(realBase, 'mesh', 'ss_s8lehun_skin_guajian_head_mesh.json'),
        skeleton: path.join(realBase, 'skeleton', 'ss_s8lehun_skin_guajian_head_skeleton.json')
      }
    ];
    if (multiFiles.every(item => fs.existsSync(item.mesh) && fs.existsSync(item.skeleton))) {
      const multiData = multiFiles.map(item => ({
        name: item.name,
        mesh: JSON.parse(fs.readFileSync(item.mesh, 'utf8')).mesh[0],
        skeleton: JSON.parse(fs.readFileSync(item.skeleton, 'utf8'))
      }));
      const multiResult = await evaluate(client, `(() => {
        const api = globalThis.__NMTM_TEST__.api;
        const meshes = ${JSON.stringify(multiData)}.map(item => ({
          name: item.name + '_Mesh_0', nmtm_model_name: item.name,
          nmtm_source_section: item.mesh, nmtm_skeleton_data: item.skeleton, nmtm_bones: {}
        }));
        const compatibility = {
          compatible: true, problems: [], mode: 'nmtm_voxels', meshes,
          meshComponents: [], cubes: [], groups: new Set(), textures: [], bones: [],
          voxelSize: 1, maxVoxels: 2048, autoVoxelFit: true, maxAutoVoxelSize: 8,
          textureRegions: [
            {x:0,y:0,width:256,height:256},
            {x:256,y:0,width:256,height:256}
          ]
        };
        const jem = api.emfJemData('minecraft:nmtm/multi_part', [512,256], compatibility, 'body', null);
        const branches = jem.models[0].submodels || [];
        const boxes = [];
        const ids = [];
        const visit = model => {
          if (model.id) ids.push(model.id);
          if (Array.isArray(model.boxes)) boxes.push(...model.boxes);
          if (Array.isArray(model.submodels)) model.submodels.forEach(visit);
        };
        branches.forEach(visit);
        return {
          branchCount: branches.length,
          idsUnique: new Set(ids).size === ids.length,
          ids,
          boxCount: boxes.length,
          voxelCount: compatibility.voxelCount,
          finite: boxes.every(box => box.coordinates.every(Number.isFinite)),
          uvInAtlas: boxes.every(box => Object.entries(box).filter(([key]) => /^uv/.test(key)).every(([,uv]) =>
            Array.isArray(uv) && uv.length === 4 && uv[0] >= 0 && uv[1] >= 0 && uv[2] <= 512 && uv[3] <= 256
          ))
        };
      })()`);
      assert.equal(multiResult.branchCount, 2);
      assert.equal(multiResult.idsUnique, true);
      assert.ok(multiResult.ids.some(id => id.includes('leftarm')));
      assert.ok(multiResult.ids.some(id => id.includes('head')));
      assert.ok(multiResult.boxCount > 0 && multiResult.boxCount <= 2048);
      assert.equal(multiResult.boxCount, multiResult.voxelCount);
      assert.equal(multiResult.finite, true);
      assert.equal(multiResult.uvInAtlas, true);
      console.log(`NMTM multi-model EMF voxel test passed (${multiResult.branchCount} isolated branches, ${multiResult.boxCount} boxes)`);
    }

    const voxelResult = await evaluate(client, `(() => {
      const api = globalThis.__NMTM_TEST__.api;
      const section = {
        vertices: [
          {pos:[0,0,0],uvcoord:[0,0],weight:[['root',1]]},
          {pos:[4,0,0],uvcoord:[1,0],weight:[['root',1]]},
          {pos:[2,4,0],uvcoord:[0.5,1],weight:[['root',1]]}
        ],
        indices: [[0,1,2]]
      };
      const mesh = {
        nmtm_source_section: section,
        nmtm_skeleton_data: {skeleton:[{name:'root',parent:'root',initpos:[0,0,0],initquaternion:[0,0,0,1],initscale:[1,1,1]}]},
        nmtm_bones: {}
      };
      const compatibility = {compatible:true,problems:[],mode:'nmtm_voxels',meshes:[mesh],meshComponents:[],cubes:[],groups:new Set(),textures:[],bones:[],voxelSize:1,maxVoxels:128};
      const jem = api.emfJemData('minecraft:nmtm/voxel_test',[64,64],compatibility,'body',null);
      const boxes=[]; const visit=model=>{if(Array.isArray(model.boxes))boxes.push(...model.boxes);if(Array.isArray(model.submodels))model.submodels.forEach(visit)}; jem.models.forEach(visit);
      const block = api.nmtmBlockVoxelModel([mesh], 'nmtm:block/voxel_test', [64,64], 8, 512, 0.5);
      return {boxCount:boxes.length, complete:boxes.every(box=>{
        const faces=Object.keys(box).filter(name=>/^uv/.test(name));
        return box.coordinates.length===6 && faces.length>0 && faces.every(name=>Array.isArray(box[name])&&box[name].length===4);
      }), blockElements:block.elements.length, blockComplete:block.elements.every(element=>
        element.from.concat(element.to).every(Number.isFinite)
        && Object.values(element.faces).every(face=>face.texture==='#texture'&&Array.isArray(face.uv)&&face.uv.length===4)
      )};
    })()`);
    assert.ok(voxelResult.boxCount > 0);
    assert.equal(voxelResult.complete, true);
    assert.ok(voxelResult.blockElements > 0 && voxelResult.blockElements <= 512);
    assert.equal(voxelResult.blockComplete, true);
    console.log('NMTM Blockbench runtime test passed (strict cuboids, EMF voxels, and Java block voxels)');
  } finally {
    if (client) client.close();
    await closeHiddenSession(session);
    fs.rmSync(resolvedProfile, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
