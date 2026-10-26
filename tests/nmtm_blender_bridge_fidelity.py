"""Real GLB -> .blend / FBX -> Blender per-influence skin regression.

blender --factory-startup --background --python tests/nmtm_blender_bridge_fidelity.py -- REPORT INPUT.glb [...]
All generated files live beside REPORT. Independent CPU oracle is the existing
skin fidelity validator; this test never uses Blender glTF re-export as oracle.
"""
import importlib.util
import json
import math
from pathlib import Path
import sys

import bpy


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


ROOT = Path(__file__).resolve().parents[1]
oracle = module('nmtm_skin_oracle', ROOT / 'tests/nmtm_blender_skin_fidelity.py')
bridge = module('nmtm_skin_bridge', ROOT / 'nmtm_blender_bridge.py')


def validate(source, artifact, kind):
    model, binary = oracle.load_glb(source)
    bridge.convert(source, artifact, kind)
    # Inspect saved Blend as well, not just conversion's unsaved state.
    bpy.ops.wm.read_factory_settings(use_empty=True)
    static_defaults = {}
    if kind == 'fbx':
        bpy.ops.import_scene.fbx(filepath=str(artifact), use_anim=False,
                                 ignore_leaf_bones=False, automatic_bone_orientation=False)
        static_defaults = {('BONE', obj.name, bone.name): bone.matrix_basis.copy()
                           for obj in bridge.model_objects() if obj.type == 'ARMATURE'
                           for bone in obj.pose.bones}
        static_defaults.update({('OBJECT', obj.name): obj.matrix_basis.copy()
                                for obj in bridge.model_objects()})
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.fbx(filepath=str(artifact), use_anim=True,
                                 ignore_leaf_bones=False, automatic_bone_orientation=False)
    else:
        bpy.ops.wm.open_mainfile(filepath=str(artifact))
    objects = bridge.model_objects()
    clips = bridge.animation_clips(objects)
    if kind == 'fbx':
        # FBX actions are not stashed into NLA: only its last take is active.
        # The remaining takes are still real, unassigned actions in the file.
        for obj in objects:
            for action in bpy.data.actions:
                if action.name.startswith(obj.name + '|'):
                    clips.setdefault(action.name.split('|', 1)[1], []).append((obj, action))
    states = [(owner, owner.animation_data.action, owner.animation_data.use_nla)
              for owner in bridge.animation_owners(objects) if owner.animation_data]
    for owner, _action, _use_nla in states:
        owner.animation_data.action = None
        owner.animation_data.use_nla = False
    # Animation import has already evaluated a take. Restore the independently
    # imported non-animation transform properties rather than that stale pose.
    for obj in objects:
        if ('OBJECT', obj.name) in static_defaults:
            obj.matrix_basis = static_defaults['OBJECT', obj.name]
        if obj.type == 'ARMATURE':
            for bone in obj.pose.bones:
                if ('BONE', obj.name, bone.name) in static_defaults:
                    bone.matrix_basis = static_defaults['BONE', obj.name, bone.name]
    defaults = bridge.capture_defaults(objects)
    bpy.context.view_layer.update()
    result = {'artifact': str(artifact), 'kind': kind,
              'default_pose': oracle.distances(oracle.cpu_vertices(model, binary), oracle.blender_vertices()),
              'meshes': sum(o.type == 'MESH' for o in objects),
              'bones': sum(len(o.data.bones) for o in objects if o.type == 'ARMATURE'),
              'animations': []}
    fps = bpy.context.scene.render.fps / bpy.context.scene.render.fps_base
    for index, animation in enumerate(model.get('animations', [])):
        name = animation.get('name', 'Animation_' + str(index))
        bindings = clips.get(name)
        if bindings is None:
            bindings = next((binding for clip, binding in clips.items() if name in clip), None)
        if not bindings:
            raise AssertionError('No converted action for ' + name + '; available ' + str(list(clips)))
        for owner, _action, _use_nla in states:
            owner.animation_data.action = None
            owner.animation_data.use_nla = False
        for owner, matrix in defaults:
            owner.matrix_basis = matrix.copy()
        for owner, action in bindings:
            owner.animation_data.action = action
        times = [oracle.accessor(model, binary, sampler['input'])[:, 0] for sampler in animation['samplers']]
        start, end = min(float(t.min()) for t in times), max(float(t.max()) for t in times)
        action_start = min(float(action.frame_range[0]) for _, action in bindings)
        # FBX importer moves the take's first source frame to frame 1.
        offset = action_start - start*fps if kind == 'fbx' else 0
        samples = []
        for factor in [0, .125, .25, .5, .75, .875, 1]:
            time = start + (end-start)*factor
            frame = time*fps + offset
            bpy.context.scene.frame_set(math.floor(frame), subframe=frame-math.floor(frame))
            bpy.context.view_layer.update()
            samples.append({'time': time, 'frame': frame,
                            **oracle.distances(oracle.cpu_vertices(model, binary, animation, time), oracle.blender_vertices())})
        result['animations'].append({'name': name, 'samples': samples})
    result['passed'] = result['default_pose']['passed'] and all(s['passed'] for a in result['animations'] for s in a['samples'])
    return result


def main():
    args = sys.argv[sys.argv.index('--')+1:]
    report_path, inputs = Path(args[0]).resolve(), [Path(p).resolve() for p in args[1:]]
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report = {'blender': bpy.app.version_string, 'method': 'Independent original GLB CPU skinning versus reloaded Blend and round-tripped FBX', 'cases': []}
    for source in inputs:
        for kind in ['blend', 'fbx']:
            target = report_path.parent / (source.stem + '.' + kind)
            try:
                result = validate(source, target, kind)
            except Exception as exc:
                import traceback
                result = {'artifact': str(target), 'kind': kind, 'passed': False, 'error': str(exc), 'traceback': traceback.format_exc()}
            report['cases'].append({'source': str(source), **result})
            report_path.write_text(json.dumps(report, indent=2), encoding='utf-8')
            print('BRIDGE_FIDELITY', source.name, kind, result['passed'], flush=True)
    report['passed'] = all(case['passed'] for case in report['cases'])
    report_path.write_text(json.dumps(report, indent=2), encoding='utf-8')
    print('BRIDGE_REPORT', str(report_path), 'PASS' if report['passed'] else 'FAIL', flush=True)


if __name__ == '__main__':
    main()
