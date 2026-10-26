// No GUI, no production edits. Uses the installed Blockbench source-map code.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const map = require('./helpers/read-blockbench-sources.cjs')();
const source = token => {
  const index = map.sources.findIndex(name => name.endsWith(token));
  assert.ok(index >= 0 && typeof map.sourcesContent[index] === 'string', `Installed Blockbench source map is missing ${token}`);
  return map.sourcesContent[index];
};
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const root = path.resolve(__dirname, '..');
const pluginPath = path.join(root, 'nmtm.js');
const reportPath = path.join(root, 'output/nmtm-rig-repair/audit-c3-contract.json');
const plugin = fs.readFileSync(pluginPath, 'utf8');
const report = { pluginSha256: sha(plugin), source: 'Installed app.asar source map', guiLaunched: false, productionEdited: false };
Object.defineProperty(Array.prototype, 'allEqual', {value(v) { return this.every(x => x === v); }, configurable:true});
Object.defineProperty(Array.prototype, 'empty', {value() { this.length = 0; return this; }, configurable:true});
Object.defineProperty(Array.prototype, 'replace', {value(v) { this.splice(0,this.length,...v); return this; }, configurable:true});

(async () => {
  const threeSource = source('/three.module.js');
  const THREE = {...await import('data:text/javascript;base64,' + Buffer.from(threeSource).toString('base64'))};
  class Mesh { constructor(name, parent, positions) {
    this.name=name; this.uuid=name; this.export=true; this.parent=parent; this.children=[];
    this.vertices=positions.map(p=>p.slice()); this.nmtm_source_section={vertices:positions.map(p=>({pos:p.slice()}))};
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(positions.flat(),3));
    g.setAttribute('normal',new THREE.Float32BufferAttribute([0,0,1,0,0,1,0,0,1],3));
    g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,0,1],2)); g.setIndex([0,1,2]);
    this.mesh=this.scene_object=new THREE.Mesh(g,new THREE.MeshBasicMaterial()); this.mesh.name=name;
    this.faces={tri:{vertices:[0,1,2],texture:undefined,getTexture(){return null;}}};
    parent.children.push(this); parent.scene_object.add(this.mesh);
  }}
  class Armature { constructor(name,parent,rest,withSource=true) {
    this.name=name; this.uuid=name;this.export=true;this.parent=parent;this.children=[];
    this.scene_object=new THREE.Object3D();this.scene_object.no_export=true;parent.children.push(this);parent.scene_object.add(this.scene_object);
    const bone=new ArmatureBone();bone.uuid=name+'_bone';bone.name=bone.uuid;bone.parent=this;bone.children=[];
    bone.mesh=bone.scene_object=new THREE.Bone();bone.mesh.uuid=bone.uuid.toUpperCase();
    bone.mesh.position.set(2,3,-1);bone.mesh.rotation.set(.2,-.3,.4,'ZYX');bone.nmtm_rest_scale=rest;
    bone.mesh.scale.fromArray(rest);this.scene_object.add(bone.mesh);bone.mesh.updateMatrixWorld(true);
    const local=bone.mesh.matrix.clone().invert();
    bone.nmtm_binding={enabled:true,offmtx:withSource?Array.from({length:4},(_,r)=>Array.from({length:4},(_,c)=>local.elements[c*4+r])):null};
    bone.getVertexWeight=()=>1;this.children.push(bone);this.bones=[bone];
    this.getAllBones=()=>this.bones; Armature.all.push(this);ArmatureBone.all.push(bone);
  }}
  class ArmatureBone {}
  Armature.all=[];ArmatureBone.all=[];Mesh.all=[];
  const root={children:[],scene_object:new THREE.Object3D()};
  root.scene_object.position.set(120,-30,5); // Project transform must cancel.
  const parent={name:'transformed_parent',uuid:'transformed_parent',export:true,children:[],parent:root,scene_object:new THREE.Object3D()};
  parent.scene_object.name=parent.uuid;parent.scene_object.position.set(11,-7,5);parent.scene_object.rotation.set(.4,-.5,.3,'ZYX');
  root.children.push(parent);root.scene_object.add(parent.scene_object);
  const rig1=new Armature('first_rig',parent,[1.7,.6,-1.2]);
  const rig2=new Armature('second_rig',root,[.8,1.3,.7],false);
  const rig3=new Armature('excluded_rig',root,[1,1,1]);rig3.export=false;
  for(const rig of Armature.all)Mesh.all.push(new Mesh(rig.name+'_mesh',rig,[[1,2,3],[4,5,6],[7,8,9]]));
  // Live edit must win over immutable import metadata.
  Mesh.all[0].vertices[0][0]=19.25;
  const plain=new Mesh('plain_mesh',parent,[[0,0,0],[1,0,0],[0,1,0]]);Mesh.all.push(plain);
  const hidden=new Mesh('excluded_plain',root,[[0,0,0],[1,0,0],[0,1,0]]);hidden.export=false;Mesh.all.push(hidden);
  const retainedPlain=new Mesh('retained_root_plain',root,[[0,0,0],[1,0,0],[0,1,0]]);Mesh.all.push(retainedPlain);
  const mat=new THREE.MeshBasicMaterial();
  const Canvas={updateAllBones(){root.scene_object.updateMatrixWorld(true);},getEmptyMaterial(){return mat;}};
  Mesh.preview_controller={updateGeometry(m){m.mesh.geometry.attributes.position.array.set(m.vertices.flat());}};
  const gltfSource=source('/formats/standards/gltf.js');
  const builderText=gltfSource.slice(gltfSource.indexOf('export function buildSkinnedMesh(armature, scale)'),gltfSource.indexOf('var codec = new Codec(')).replace('export function','function');
  const builder=new Function('THREE','Mesh','Armature','Canvas',builderText+';return buildSkinnedMesh;')(THREE,Mesh,Armature,Canvas);
  let captured;
  THREE.GLTFExporter=class {parse(scene,resolve,options){scene.updateMatrixWorld(true);captured={scene,options};resolve(new ArrayBuffer(4));}};
  let scaleTrack;
  const makeTracks=()=>{
    scaleTrack=new THREE.VectorKeyframeTrack(rig1.bones[0].mesh.uuid+'.scale',[0,1],[1,1,1,2,3,4]);
    scaleTrack.group_uuid=rig1.bones[0].uuid;scaleTrack.channel='scale';
    const included=new THREE.VectorKeyframeTrack(rig2.bones[0].mesh.uuid+'.position',[0,1],[2,3,-1,3,4,0]);
    included.group_uuid=rig2.bones[0].uuid;included.channel='position';
    const excluded=new THREE.VectorKeyframeTrack(rig3.bones[0].mesh.uuid+'.position',[0,1],[2,3,-1,3,4,0]);
    excluded.group_uuid=rig3.bones[0].uuid;excluded.channel='position';
    return [new THREE.AnimationClip('shared_clip',1,[scaleTrack,included,excluded]),new THREE.AnimationClip('excluded_only',1,[excluded.clone()])];
  };
  const context={console,require,setTimeout,clearTimeout,THREE,Armature,ArmatureBone,Mesh,Canvas,
    __NMTM_TEST__:{},Plugin:{register(){}},Plugins:{registered:{}},Formats:{},
    Codec:class {constructor(id,o){Object.assign(this,o);}},ModelFormat:class {constructor(){}},
    Project:{model_3d:root.scene_object},Texture:{all:[]},Timeline:{time:.375},
    Animator:{showDefaultPose(){},preview(){}},Modes:{animate:false},
    Outliner:{root:root.children},Codecs:{gltf:{compile(){throw Error('Wrong fallback');},buildAnimationTracks:makeTracks}}};
  vm.createContext(context);vm.runInContext(plugin,context,{filename:pluginPath});
  context.buildSkinnedMesh=builder;
  await context.__NMTM_TEST__.api.compileRigGlb();
  const scene=captured.scene;const skins=scene.children.filter(o=>o.isSkinnedMesh);
  assert.deepEqual(skins.map(o=>o.name),['first_rig','second_rig']);
  const skin=skins[0],bone=skin.skeleton.bones[0];
  assert.equal(skin.geometry.attributes.position.array[0],19.25);
  const error=(a,b)=>Math.max(...a.elements.map((v,i)=>Math.abs(v-b.elements[i])));
  const expectedA=root.scene_object.matrixWorld.clone().invert().multiply(rig1.scene_object.matrixWorld);
  assert.ok(error(skin.matrix,expectedA)<1e-12);
  const sourceIBM=new THREE.Matrix4().set(...rig1.bones[0].nmtm_binding.offmtx.flat());
  assert.ok(error(skin.skeleton.boneInverses[0],sourceIBM)<1e-12);
  assert.ok(error(skins[1].skeleton.boneInverses[0],skins[1].skeleton.bones[0].matrix.clone().invert())<1e-12);
  const edited=new THREE.Vector3(19.25,2,3);
  const actual=edited.clone().applyMatrix4(sourceIBM).applyMatrix4(bone.matrixWorld);
  const expected=edited.clone().applyMatrix4(sourceIBM).applyMatrix4(bone.matrix).applyMatrix4(expectedA);
  assert.ok(actual.distanceTo(expected)<1e-12);
  assert.equal(context.Timeline.time,.375);
  assert.ok(scene.getObjectByName('plain_mesh'));assert.ok(!scene.getObjectByName('excluded_plain'));
  assert.ok(Math.abs(scaleTrack.values[3]-3.4)<1e-6);assert.ok(Math.abs(scaleTrack.values[4]-1.8)<1e-6);assert.ok(Math.abs(scaleTrack.values[5]+4.8)<1e-6);
  assert.equal(captured.options.animations.length,1);assert.equal(captured.options.animations[0].tracks.length,2);
  report.export={multipleArmatures:skins.length,ownArmatureExportFalsePruned:true,plainGeometryRetained:true,plainExportFalsePruned:true,liveEditedPosition:skin.geometry.attributes.position.array[0],sourcePosition:Mesh.all[0].nmtm_source_section.vertices[0].pos[0],parentMatrixMaxError:error(skin.matrix,expectedA),sourceIBMMaxError:error(skin.skeleton.boneInverses[0],sourceIBM),transformedDeformationError:actual.distanceTo(expected),missingIBMFallback:true,negativeNonuniformRestScale:true,timelineRestored:true};

  // Installed native compile inserts each skin under its source parent. The
  // installed exporter prunes Group scene objects by name->OutlinerNode export.
  parent.export=false;
  await context.__NMTM_TEST__.api.compileRigGlb();
  const ancestorLeaked=captured.scene.children.some(o=>o.isSkinnedMesh&&o.name==='first_rig');
  assert.equal(ancestorLeaked,false);
  assert.deepEqual(captured.scene.children.filter(o=>o.isSkinnedMesh).map(o=>o.name),['second_rig']);
  assert.ok(captured.scene.getObjectByName('retained_root_plain'));assert.ok(!captured.scene.getObjectByName('plain_mesh'));
  assert.equal(captured.options.animations.length,1);assert.equal(captured.options.animations[0].tracks.length,1);assert.equal(captured.options.animations[0].duration,1);
  report.ancestorExportFlag={customPathExportsPrunedParentRig:ancestorLeaked,otherRigRetained:true,rootPlainRetained:true,nestedPlainPruned:true,nativeExporterParentPruneSource:source('/lib/GLTFExporter.js').includes('if (OutlinerNode.uuids[object.name] && OutlinerNode.uuids[object.name].export == false) return null;'),nativeCompileInsertsSkinUnderParent:gltfSource.includes('armature.parent.scene_object.add(skinned_mesh)')};

  // Execute the actual installed exporter on the scene and the production-
  // filtered shared animation clip. No browser/window is started.
  class Image {constructor(){this.width=1;this.height=1;}}
  class FileReader {
    readAsArrayBuffer(blob){blob.arrayBuffer().then(x=>{this.result=x;this.onloadend?.();});}
    readAsDataURL(blob){blob.arrayBuffer().then(x=>{this.result='data:application/octet-stream;base64,'+Buffer.from(x).toString('base64');this.onloadend?.();});}
  }
  const warnings=[];
  new Function('THREE','Image','OutlinerNode','Blob','FileReader','console','appVersion','window','Canvas',source('/lib/GLTFExporter.js'))(THREE,Image,{uuids:{}},Blob,FileReader,{log(){},warn(...args){warnings.push(args.join(' '));},error(...args){warnings.push(args.join(' '));}},'5.1.4',{FileReader},Canvas);
  const actualGltf=await new Promise(resolve=>new THREE.GLTFExporter().parse(captured.scene,resolve,{...captured.options,binary:false}));
  assert.equal(actualGltf.skins.length,1);assert.equal(actualGltf.animations.length,1);assert.equal(actualGltf.animations[0].channels.length,1);
  assert.ok(actualGltf.nodes.some(n=>n.name==='retained_root_plain'));
  assert.equal(warnings.filter(x=>x.includes('Could not export animation track')).length,0);
  report.excludedTargetAnimation={actualInstalledExporter:true,sharedClipRetained:true,exportedClipCount:actualGltf.animations.length,exportedChannelCount:actualGltf.animations[0].channels.length,emptyClipRemoved:true,durationPreserved:true,missingTargetWarnings:0};
  // All NMTM rigs excluded must remain on the custom path; otherwise BB's
  // native all-armature loop would resurrect excluded data.
  rig2.export=false;
  THREE.GLTFExporter=class{parse(scene,resolve,options){captured={scene,options};resolve(new ArrayBuffer(4));}};
  await context.__NMTM_TEST__.api.compileRigGlb();
  assert.equal(captured.scene.children.filter(o=>o.isSkinnedMesh).length,0);
  assert.ok(captured.scene.getObjectByName('retained_root_plain'));assert.equal(captured.options.animations.length,0);
  report.allExcludedRigs={nativeFallbackNotCalled:true,exportedSkins:0,plainGeometryRetained:true,exportedAnimations:0};

  // Execute the production rotation wrapper with the exact interpolation
  // contract: absolute Euler minus the fixed/rest Euler.
  const wrapper=plugin.slice(plugin.indexOf('rigRotationWrapper = function')+'rigRotationWrapper = '.length,plugin.indexOf('            prototype.displayRotation = rigRotationWrapper;')).trim().replace(/;$/,'');
  const Format={euler_order:'ZYX',quaternion_interpolation:true};
  const math=Object.create(Math);math.degToRad=d=>d*Math.PI/180;
  const rotate=new Function('THREE','Format','Math','rigRotationOriginal','return ('+wrapper+');')(THREE,Format,math,()=>{});
  let maxAngle=0;
  for(let i=0;i<150;i++){
    const rest=new THREE.Quaternion().setFromEuler(new THREE.Euler(.11*i-.8,.07*i-.5,.13*i-.3,'ZYX'));
    const target=new THREE.Quaternion().setFromEuler(new THREE.Euler(.17*i+.2,-.03*i+.8,.09*i-.9,'ZYX'));
    const fix=new THREE.Euler().setFromQuaternion(rest,'ZYX');
    const absolute=new THREE.Euler().setFromQuaternion(target,'ZYX');
    const values=[absolute.x-fix.x,absolute.y-fix.y,absolute.z-fix.z].map(v=>v*180/Math.PI);
    const b={nmtm_binding:{enabled:true},scene_object:{fix_rotation:fix,quaternion:rest.clone()}};
    rotate.call({getElement(){return b;}},values);
    maxAngle=Math.max(maxAngle,b.scene_object.quaternion.angleTo(target));
  }
  assert.ok(maxAngle<1e-7);report.quaternionPreview={absoluteEulerMinusFixContractCases:150,maxAngleRadians:maxAngle};

  // Dynamic custom properties use installed merge/copy bodies exactly. This
  // tests the serializer primitive, not the desktop project-loader lifecycle.
  const ps=source('/util/property.ts');
  const mergeText=ps.slice(ps.indexOf('\tmerge(instance:'),ps.indexOf('\tcopy(instance:')).trim().replace(/^merge\([^]*?\): void/, 'function(instance,data)');
  const copyText=ps.slice(ps.indexOf('\tcopy(instance:'),ps.indexOf('\treset(instance:')).trim().replace(/^copy\([^]*?\): void/, 'function(instance,target)');
  const Merge={string(o,d,n){if(typeof d[n]==='string')o[n]=d[n];}};
  const merge=new Function('Condition','Merge','structuredClone','return ('+mergeText+');')(()=>true,Merge,structuredClone);
  const copy=new Function('Condition','structuredClone','return ('+copyText+');')(()=>true,structuredClone);
  const metadata={nmtm_binding:{enabled:true,name:'root',offmtx:[[1,0,0,2],[0,1,0,3],[0,0,1,4]]},nmtm_rest_position:[1,2,3],nmtm_rest_quaternion:[.2,.3,.1,.9],nmtm_rest_scale:[1.7,.6,-1.2],nmtm_source_section:{vertices:[{pos:[1,2,3],weight:[['root',1]]}]},nmtm_skeleton_data:{skeleton:[{name:'root'}]},nmtm_model_name:'edited_mesh'};
  const serialized={},restored={};
  for(const [name,value]of Object.entries(metadata)){const p={name,isObject:typeof value==='object'&&!Array.isArray(value),isArray:Array.isArray(value),isString:typeof value==='string'};copy.call(p,metadata,serialized);merge.call(p,restored,JSON.parse(JSON.stringify(serialized)));}
  assert.deepEqual(restored,metadata);restored.nmtm_binding.offmtx[0][0]=999;assert.equal(metadata.nmtm_binding.offmtx[0][0],1);
  report.persistencePrimitive={allSevenRegisteredPropertiesRoundTrip:true,objectMetadataDeepCloned:true,actualDesktopReload:'Not run by this no-GUI contract test'};
  fs.mkdirSync(path.dirname(reportPath), {recursive:true});
  fs.writeFileSync(reportPath,JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
