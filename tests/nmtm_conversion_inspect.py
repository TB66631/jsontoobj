"""Inspect files produced by the actual renderer blenderConvert contract.

Blender 4.2 --background --threads 2 --python-exit-code 1 --python this.py
    -- inspection-input.json inspection.json
No conversion function is imported or executed here. Artifacts are reopened or
reimported independently; source-GLB CPU skinning is the geometry oracle.
"""
import importlib.util
import json
import math
from pathlib import Path
import sys
import traceback

import bpy

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    'nmtm_conversion_cpu_oracle', ROOT / 'tests/nmtm_blender_skin_fidelity.py')
oracle = importlib.util.module_from_spec(spec)
spec.loader.exec_module(oracle)


def object_matrices():
    values = {('OBJECT', obj.name): obj.matrix_basis.copy()
              for obj in bpy.context.scene.objects}
    values.update({('BONE', obj.name, bone.name): bone.matrix_basis.copy()
                   for obj in bpy.context.scene.objects if obj.type == 'ARMATURE'
                   for bone in obj.pose.bones})
    return values


def restore_matrices(values):
    for obj in bpy.context.scene.objects:
        if ('OBJECT', obj.name) in values:
            obj.matrix_basis = values['OBJECT', obj.name]
        if obj.type == 'ARMATURE':
            for bone in obj.pose.bones:
                if ('BONE', obj.name, bone.name) in values:
                    bone.matrix_basis = values['BONE', obj.name, bone.name]


def detach_actions():
    for obj in bpy.context.scene.objects:
        if obj.animation_data:
            obj.animation_data.action = None
            obj.animation_data.use_nla = False


def fbx_embedded_payloads(path):
    from io_scene_fbx import parse_fbx
    root, _version = parse_fbx.parse(str(path), use_namedtuple=True)
    result = []

    def walk(element):
        if element.id == b'Content':
            result.extend(len(value) for value in element.props
                          if isinstance(value, (bytes, bytearray)) and value)
        for child in element.elems:
            walk(child)
    walk(root)
    return result


def inspect(case):
    source, artifact, kind = Path(case['source']), Path(case['artifact']), case['kind']
    model, binary = oracle.load_glb(source)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    if kind == 'fbx':
        bpy.ops.import_scene.fbx(filepath=str(artifact), use_anim=False,
                                 ignore_leaf_bones=False, automatic_bone_orientation=False)
        defaults = object_matrices()
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.fbx(filepath=str(artifact), use_anim=True,
                                 ignore_leaf_bones=False, automatic_bone_orientation=False)
    else:
        bpy.ops.wm.open_mainfile(filepath=str(artifact))
        defaults = object_matrices()
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    rigs = [obj for obj in bpy.context.scene.objects if obj.type == 'ARMATURE']
    assert meshes and rigs, 'real mesh and editable armature objects must survive reopening'
    assert not any(obj.name.startswith('Icosphere') for obj in meshes), 'no display-only bone mesh'
    bones = {bone.name for rig in rigs for bone in rig.data.bones}
    source_joints = {joint for skin in model.get('skins', []) for joint in skin['joints']}
    source_names = {model['nodes'][joint].get('name', 'Node_' + str(joint)) for joint in source_joints}
    missing = sorted(source_names - bones)
    assert not missing, 'source control bones missing: ' + str(missing)
    helpers = [name for name in bones if name.startswith('_NMTM_bind_') or name.startswith('_NMTM_deform_')]
    assert len(helpers) >= 2 * len(source_joints), 'affine IBM helper chain missing'
    weights = []
    for obj in meshes:
        modifiers = [modifier for modifier in obj.modifiers if modifier.type == 'ARMATURE']
        assert modifiers and all(modifier.object in rigs for modifier in modifiers), 'invalid armature modifier: ' + obj.name
        assert len(obj.vertex_groups), 'no vertex groups: ' + obj.name
        deform_bones = {bone.name for modifier in modifiers for bone in modifier.object.data.bones}
        invalid = [group.name for group in obj.vertex_groups if group.name not in deform_bones]
        assert not invalid, 'vertex group has no bone: ' + str(invalid)
        sums = [sum(group.weight for group in vertex.groups) for vertex in obj.data.vertices]
        assert sums and all(math.isfinite(value) and value > 0 for value in sums), 'unweighted or invalid vertex'
        error = max(abs(value - 1) for value in sums)
        assert error <= 2e-5, 'vertex weights are not normalized: ' + str(error)
        assert all(group.weight >= 0 for vertex in obj.data.vertices for group in vertex.groups), 'negative vertex influence'
        weights.append({'mesh': obj.name, 'vertices': len(sums), 'groups': len(obj.vertex_groups),
                        'weightedVertices': sum(value > 0 for value in sums), 'maxWeightSumError': error})
    images = [image for image in bpy.data.images if image.type not in {'RENDER_RESULT', 'COMPOSITING'}]
    assert len(images) >= len(model.get('images', [])), 'source textures missing'
    image_results = []
    for image in images:
        packed = len(image.packed_file.data) if image.packed_file else 0
        assert min(image.size) > 0 and len(image.pixels) > 0, 'texture pixels unreadable: ' + image.name
        if kind == 'blend':
            assert packed > 0, 'saved .blend texture is not packed: ' + image.name
        image_results.append({'name': image.name, 'size': list(image.size), 'packedBytes': packed,
                              'pixelsReadable': True, 'filepath': image.filepath})
    embedded_payloads = fbx_embedded_payloads(artifact) if kind == 'fbx' else []
    if kind == 'fbx':
        assert len(embedded_payloads) >= len(model.get('images', [])), 'FBX embedded image payload missing'

    clips = {}
    for obj in bpy.context.scene.objects:
        if not obj.animation_data:
            continue
        for track in obj.animation_data.nla_tracks:
            for strip in track.strips:
                if strip.action:
                    clips.setdefault(track.name, []).append((obj, strip.action))
        if kind == 'fbx':
            for action in bpy.data.actions:
                if action.name.startswith(obj.name + '|'):
                    clips.setdefault(action.name.split('|', 1)[1], []).append((obj, action))
    detach_actions()
    restore_matrices(defaults)
    bpy.context.view_layer.update()
    default_pose = oracle.distances(oracle.cpu_vertices(model, binary), oracle.blender_vertices())
    assert default_pose['passed'], 'default pose changed: ' + str(default_pose)
    animation_results = []
    fps = bpy.context.scene.render.fps / bpy.context.scene.render.fps_base
    for index, animation in enumerate(model.get('animations', [])):
        name = animation.get('name', 'Animation_' + str(index))
        bindings = clips.get(name)
        assert bindings, 'source clip missing after reopening: ' + name + '; got ' + str(list(clips))
        detach_actions()
        restore_matrices(defaults)
        for owner, action in bindings:
            owner.animation_data.action = action
            assert len(action.fcurves) > 0 and any(len(curve.keyframe_points) > 0 for curve in action.fcurves), 'empty action: ' + name
        times = [oracle.accessor(model, binary, sampler['input'])[:, 0] for sampler in animation['samplers']]
        start, end = min(float(values.min()) for values in times), max(float(values.max()) for values in times)
        action_start = min(float(action.frame_range[0]) for _, action in bindings)
        offset = action_start - start * fps if kind == 'fbx' else 0
        samples = []
        for factor in [0, .37, 1]:
            time = start + (end - start) * factor
            frame = time * fps + offset
            bpy.context.scene.frame_set(math.floor(frame), subframe=frame - math.floor(frame))
            bpy.context.view_layer.update()
            sample = {'time': time, 'frame': frame,
                      **oracle.distances(oracle.cpu_vertices(model, binary, animation, time), oracle.blender_vertices())}
            assert sample['passed'], 'animated deformation changed: ' + name + ' ' + str(sample)
            samples.append(sample)
        animation_results.append({'name': name, 'actions': sorted({action.name for _, action in bindings}),
                                  'fcurves': sum(len(action.fcurves) for _, action in bindings), 'samples': samples})
    return {**case, 'passed': True, 'bytes': artifact.stat().st_size,
            'meshes': len(meshes), 'armatures': len(rigs), 'bones': len(bones),
            'sourceControlBones': len(source_names), 'affineHelperBones': len(helpers),
            'weights': weights, 'images': image_results,
            'fbxEmbeddedImagePayloadBytes': embedded_payloads,
            'defaultPose': default_pose, 'animations': animation_results}


def main():
    args = sys.argv[sys.argv.index('--') + 1:]
    manifest, report_path = Path(args[0]), Path(args[1])
    report = {'blender': bpy.app.version_string,
              'method': 'reopened Blend/reimported FBX, original GLB CPU skinning, true bones and weights, packed Blend/embedded FBX textures',
              'cases': []}
    for case in json.loads(manifest.read_text(encoding='utf-8'))['cases']:
        try:
            result = inspect(case)
        except Exception as error:
            result = {**case, 'passed': False, 'error': str(error), 'traceback': traceback.format_exc()}
        report['cases'].append(result)
        report_path.write_text(json.dumps(report, indent=2), encoding='utf-8')
        print('CONTRACT_ARTIFACT', Path(case['artifact']).name, 'PASS' if result['passed'] else 'FAIL', result.get('error', ''), flush=True)
    report['passed'] = len(report['cases']) == 6 and all(case['passed'] for case in report['cases'])
    report_path.write_text(json.dumps(report, indent=2), encoding='utf-8')
    print('CONTRACT_ARTIFACT_REPORT', str(report_path), 'PASS' if report['passed'] else 'FAIL', flush=True)
    if not report['passed']:
        raise RuntimeError('One or more conversion artifacts failed independent reopening checks')


if __name__ == '__main__':
    main()
