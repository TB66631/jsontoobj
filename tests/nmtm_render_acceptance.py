"""Read-only per-bone deformation/return render acceptance for Blender exports.

Example (all output paths should be on the project drive)::

    blender --background --python tests/nmtm_render_acceptance.py -- \
      output/nmtm-rig-repair/bridge-test/jiaolong.blend \
      --output output/nmtm-rig-repair/acceptance/jiaolong-blend \
      --ffmpeg D:/Apps/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe

Every positively weighted source control is numerically tested on all three local
axes. Exact-skin bind/deform helpers are never driven or keyed by this test.
Rendering may be limited with --render-bones, but numerical acceptance is
never limited.  Original files are only read; initial pose is captured before
muting animation and is used as the baseline instead of an assumed identity.
"""

import argparse
import hashlib
import json
import math
from pathlib import Path
import subprocess
import sys
import traceback

import bpy
import numpy as np
from mathutils import Quaternion, Vector


def digest(path):
    result = hashlib.sha256()
    with path.open('rb') as source:
        for block in iter(lambda: source.read(1024 * 1024), b''):
            result.update(block)
    return result.hexdigest()


def coordinates(mesh):
    evaluated = mesh.evaluated_get(bpy.context.evaluated_depsgraph_get())
    data = evaluated.to_mesh()
    try:
        points = np.empty(len(data.vertices) * 3, dtype=np.float64)
        data.vertices.foreach_get('co', points)
        points = points.reshape((-1, 3))
        matrix = np.array(evaluated.matrix_world, dtype=np.float64)
        return points @ matrix[:3, :3].T + matrix[:3, 3]
    finally:
        evaluated.to_mesh_clear()


def geometry(meshes):
    return {mesh.name: coordinates(mesh) for mesh in meshes}


def comparison(before, after, epsilon):
    output = {}
    for name, reference in before.items():
        points = after[name]
        finite = bool(np.isfinite(points).all())
        same_count = reference.shape == points.shape
        distance = np.linalg.norm(points - reference, axis=1) if same_count and finite else np.array([])
        output[name] = {
            'vertices': int(len(points)), 'finite': finite,
            'same_vertex_count': same_count,
            'moved_vertices': int(np.count_nonzero(distance > epsilon)),
            'max_displacement': float(distance.max()) if len(distance) else 0.0,
            'rms_displacement': float(np.sqrt(np.mean(distance ** 2))) if len(distance) else 0.0,
        }
    return output


def import_source(path):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.preferences.filepaths.use_scripts_auto_execute = False
    if path.suffix.lower() == '.blend':
        bpy.ops.wm.open_mainfile(filepath=str(path), load_ui=False, use_scripts=False)
    elif path.suffix.lower() == '.fbx':
        bpy.ops.import_scene.fbx(filepath=str(path), automatic_bone_orientation=False)
    elif path.suffix.lower() in ('.glb', '.gltf'):
        bpy.ops.import_scene.gltf(filepath=str(path), guess_original_bind_pose=False)
    else:
        raise ValueError('Expected .blend, .fbx, .glb, or .gltf')
    bpy.context.view_layer.update()


def freeze_animation(objects):
    result = []
    for obj in objects:
        animation = obj.animation_data
        if not animation:
            continue
        result.append({
            'object': obj.name,
            'action': animation.action.name if animation.action else None,
            'nla_tracks': len(animation.nla_tracks),
            'drivers': len(animation.drivers),
        })
        animation.action = None
        animation.use_nla = False
        for track in animation.nla_tracks:
            track.mute = True
        for driver in animation.drivers:
            driver.mute = True
    return result


def pose_channels(armatures):
    return {(arm.name, bone.name): {
        'rotation_mode': bone.rotation_mode,
        'location': bone.location.copy(),
        'rotation_quaternion': bone.rotation_quaternion.copy(),
        'rotation_euler': bone.rotation_euler.copy(),
        'rotation_axis_angle': tuple(bone.rotation_axis_angle),
        'scale': bone.scale.copy(),
    } for arm in armatures for bone in arm.pose.bones}


def restore_pose(armatures, initial, channels=None):
    for arm in armatures:
        for bone in arm.pose.bones:
            if channels is None:
                bone.matrix_basis = initial[(arm.name, bone.name)].copy()
                continue
            # Assigning matrix_basis decomposes transforms and introduces extra
            # float32 rounding for negative/nonuniform scale. Restore the exact
            # imported channels instead; never normalize a source pose to identity.
            saved = channels[(arm.name, bone.name)]
            bone.rotation_mode = saved['rotation_mode']
            bone.location = saved['location']
            bone.rotation_quaternion = saved['rotation_quaternion']
            bone.rotation_euler = saved['rotation_euler']
            bone.rotation_axis_angle = saved['rotation_axis_angle']
            bone.scale = saved['scale']
    bpy.context.view_layer.update()


def turn_bone(bone, initial, axis, degrees):
    translation, rotation, scale = initial.decompose()
    bone.rotation_mode = 'QUATERNION'
    bone.location = translation
    bone.rotation_quaternion = rotation @ Quaternion(Vector(axis), math.radians(degrees))
    bone.scale = scale


def bone_inventory(armatures, meshes):
    result = []
    for arm in armatures:
        linked = [mesh for mesh in meshes if any(
            modifier.type == 'ARMATURE' and modifier.object == arm and modifier.show_viewport
            for modifier in mesh.modifiers)]
        exact = bool(arm.get('nmtm_skin_method') or arm.data.get('nmtm_skin_method')
                     or any(bone.name.startswith('_NMTM_deform_') for bone in arm.data.bones))
        weighted = {}
        for mesh in linked:
            groups = {group.index: group.name for group in mesh.vertex_groups}
            for vertex in mesh.data.vertices:
                for item in vertex.groups:
                    name = groups.get(item.group)
                    if item.weight > 1e-8 and name in arm.data.bones and arm.data.bones[name].use_deform:
                        entry = weighted.setdefault(name, {'weight_sum': 0.0})
                        entry['weight_sum'] += item.weight
        helper_controls = {}
        for name in weighted:
            deform = arm.data.bones[name]
            if exact:
                if not name.startswith('_NMTM_deform_') or not deform.parent or not deform.parent.parent:
                    raise AssertionError('Exact skin weighted helper has no bind/control chain: ' + name)
                control = deform.parent.parent
                if control.name.startswith('_NMTM_'):
                    raise AssertionError('Expected original control above bind helper: ' + name)
            else:
                control = deform
            helper_controls[name] = control.name
        for control_name in sorted(set(helper_controls.values())):
            control = arm.data.bones[control_name]
            descendants = {control.name, *(bone.name for bone in control.children_recursive)}
            affected_groups = {name for name, mapped in helper_controls.items() if mapped in descendants}
            masks = {}
            weight_sum = 0.0
            for mesh in linked:
                group_names = {group.index: group.name for group in mesh.vertex_groups}
                mask = np.zeros(len(mesh.data.vertices), dtype=bool)
                for vertex in mesh.data.vertices:
                    for item in vertex.groups:
                        if item.weight > 1e-8 and group_names.get(item.group) in affected_groups:
                            mask[vertex.index] = True
                            weight_sum += item.weight
                masks[mesh.name] = mask
            result.append({'armature': arm, 'bone': arm.pose.bones[control_name], 'meshes': linked,
                           'vertices': sum(int(mask.sum()) for mask in masks.values()),
                           'weight_sum': weight_sum, 'exact_skin': exact,
                           'direct_deform_helpers': sorted(name for name, mapped in helper_controls.items() if mapped == control_name),
                           'affected_deform_helpers': sorted(affected_groups), 'expected_masks': masks})
    result.sort(key=lambda record: (-record['weight_sum'], record['armature'].name, record['bone'].name))
    return result


def influence_comparison(before, after, masks, epsilon):
    result = {}
    for name, mask in masks.items():
        if before[name].shape != after[name].shape or not np.isfinite(after[name]).all():
            result[name] = {'expected_vertices': int(mask.sum()), 'invalid_geometry': True}
            continue
        distance = np.linalg.norm(after[name] - before[name], axis=1)
        result[name] = {
            'expected_vertices': int(mask.sum()),
            'moved_expected_vertices': int(np.count_nonzero(distance[mask] > epsilon)),
            'moved_unexpected_vertices': int(np.count_nonzero(distance[~mask] > epsilon)),
            'max_expected_displacement': float(distance[mask].max()) if mask.any() else 0.0,
            'max_unexpected_displacement': float(distance[~mask].max()) if (~mask).any() else 0.0,
        }
    return result


def configure_render(scene, points, options):
    # Replace only the ephemeral loaded scene camera/lights, never save source.
    for obj in list(scene.objects):
        if obj.type in ('CAMERA', 'LIGHT'):
            bpy.data.objects.remove(obj, do_unlink=True)
    minimum, maximum = points.min(axis=0), points.max(axis=0)
    radius = max(float(np.linalg.norm(maximum - minimum)) * 0.5, 0.01)
    rotation = (-Vector((1.8, -2.8, 1.4))).to_track_quat('-Z', 'Y')
    rotation_matrix = np.array(rotation.to_matrix())
    projected = points @ rotation_matrix
    projected_min, projected_max = projected.min(axis=0), projected.max(axis=0)
    center = Vector((rotation_matrix @ ((projected_min + projected_max) * 0.5)).tolist())
    projected_span = projected_max - projected_min
    bpy.ops.object.camera_add(location=center + Vector((radius * 1.8, -radius * 2.8, radius * 1.4)))
    camera = bpy.context.object
    camera.rotation_euler = (center - camera.location).to_track_quat('-Z', 'Y').to_euler()
    camera.data.type = 'ORTHO'
    camera.data.ortho_scale = max(float(projected_span[0]), float(projected_span[1]), 1e-5) * options.camera_margin
    camera.data.clip_start, camera.data.clip_end = radius * 0.001, radius * 100
    scene.camera = camera
    for offset, energy, size in (((2, -3, 4), 1000, 3), ((-3, -1, 2), 600, 2), ((0, 3, 3), 1000, 2)):
        bpy.ops.object.light_add(type='AREA', location=center + Vector(offset) * radius)
        light = bpy.context.object
        light.rotation_euler = (center - light.location).to_track_quat('-Z', 'Y').to_euler()
        light.data.energy = energy * radius * radius
        light.data.shape = 'DISK'
        light.data.size = radius * size
    scene.world = scene.world or bpy.data.worlds.new('AcceptanceWorld')
    scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value = (0.065, 0.065, 0.065, 1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value = 0.6
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.eevee.taa_render_samples = options.samples
    scene.render.resolution_x = scene.render.resolution_y = options.resolution
    scene.render.resolution_percentage = 100
    scene.render.fps = options.fps
    scene.render.film_transparent = False
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format = 'MPEG4'
    scene.render.ffmpeg.codec = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.view_settings.view_transform = 'AgX'
    return {'method': 'Camera-plane bounds of evaluated vertices from every rendered frame',
            'margin': options.camera_margin, 'ortho_scale': camera.data.ortho_scale,
            'sampled_vertices': int(len(points)),
            'projected_extent': projected_span.tolist(),
            'projected_cell_fraction': (projected_span[:2] / camera.data.ortho_scale).tolist()}


def bake_isolated_animation(scene, armatures, initial, channels, records, options):
    restore_pose(armatures, initial, channels)
    segment = options.segment_frames
    scene.frame_start, scene.frame_end = 1, segment * len(records)
    # Static components are keyed too: no imported interpolation can move them.
    for arm in armatures:
        arm.animation_data_create()
        arm.animation_data.action = bpy.data.actions.new('AcceptanceIsolated_' + arm.name)
        arm.animation_data.use_nla = False
        for bone in arm.pose.bones:
            if bone.name.startswith(('_NMTM_bind_', '_NMTM_deform_')):
                continue
            turn_bone(bone, initial[(arm.name, bone.name)], (1, 0, 0), 0)
            for frame in (1, scene.frame_end):
                for channel in ('location', 'rotation_quaternion', 'scale'):
                    bone.keyframe_insert(channel, frame=frame, group=bone.name)
    segments = []
    for index, record in enumerate(records):
        arm, bone = record['armature'], record['bone']
        start = index * segment + 1
        keyframes = ((start, 0), (start + segment // 3, options.angle),
                     (start + segment * 2 // 3, -options.angle), (start + segment - 1, 0))
        for frame, angle in keyframes:
            turn_bone(bone, initial[(arm.name, bone.name)], record['best_axis'], angle)
            bone.keyframe_insert('rotation_quaternion', frame=frame, group=bone.name)
        segments.append({'armature': arm.name, 'bone': bone.name, 'source_control_bone': bone.name, 'start': start,
                         'end': start + segment - 1, 'axis': record['best_axis'],
                         'keyframes': [{'frame': frame, 'degrees': angle} for frame, angle in keyframes]})
    for arm in armatures:
        for curve in arm.animation_data.action.fcurves:
            for key in curve.keyframe_points:
                key.interpolation = 'LINEAR'
    scene.frame_set(scene.frame_start)
    bpy.context.view_layer.update()
    return segments


def make_contact(movie, destination, ffmpeg, segment, count, threads):
    # Four evenly spaced frames per bone, including the explicit return frame.
    columns = 4
    rows = count
    select = '+'.join('eq(mod(n\\,{})\\,{})'.format(segment, value)
                      for value in (0, segment // 3, segment * 2 // 3, segment - 1))
    command = [str(ffmpeg), '-nostdin', '-hide_banner', '-loglevel', 'error', '-threads', str(threads), '-y',
               '-i', str(movie), '-vf', 'select={},scale=240:240,tile={}x{}'.format(select, columns, rows),
               '-frames:v', '1', '-update', '1', str(destination)]
    result = subprocess.run(command, capture_output=True, text=True,
                            creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
    if result.returncode:
        raise RuntimeError('FFmpeg contact sheet: ' + result.stderr[-2000:])
    return {'path': str(destination), 'rows': rows, 'columns': columns,
            'column_meaning': ['initial pose', '+rotation', '-rotation', 'return to initial pose']}


def run(options):
    source = Path(options.source).resolve()
    output = Path(options.output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    before_hash = digest(source)
    import_source(source)
    scene = bpy.context.scene
    meshes = [obj for obj in scene.objects if obj.type == 'MESH']
    armatures = [obj for obj in scene.objects if obj.type == 'ARMATURE']
    if not meshes or not armatures:
        raise RuntimeError('Expected mesh objects and at least one armature')
    initial_frame = scene.frame_current
    initial = {(arm.name, bone.name): bone.matrix_basis.copy() for arm in armatures for bone in arm.pose.bones}
    initial_channels = pose_channels(armatures)
    initial_geometry = geometry(meshes)
    objects_initial = {obj.name: obj.matrix_world.copy() for obj in scene.objects}
    frozen = freeze_animation(list(scene.objects))
    for obj in scene.objects:
        obj.matrix_world = objects_initial[obj.name]
    restore_pose(armatures, initial, initial_channels)
    for arm in armatures:
        arm.data.pose_position = 'POSE'
    baseline = geometry(meshes)
    bounds = np.concatenate(list(baseline.values()))
    if not np.isfinite(bounds).all():
        raise AssertionError('Initial evaluated geometry contains NaN or Infinity')
    span = max(float(np.linalg.norm(bounds.max(axis=0) - bounds.min(axis=0))), 1e-6)
    epsilon, return_epsilon = span * 1e-7, span * 1e-5
    records = bone_inventory(armatures, meshes)
    if not records:
        raise AssertionError('No positively weighted deform bones found')
    report = {'source': str(source), 'source_sha256_before': before_hash, 'harness_sha256': digest(Path(__file__).resolve()),
              'schema': 'nmtm-source-control-acceptance-v3',
              'blender_version': bpy.app.version_string, 'initial_frame': initial_frame,
              'baseline_definition': 'Imported current pose, captured before action/NLA/driver isolation; never reset to identity',
              'pose_restore_method': 'Exact imported location, rotation mode/channels and scale; no matrix decomposition during restore',
              'muted_animation': frozen, 'mesh_count': len(meshes), 'armature_count': len(armatures),
              'render_threads': options.threads, 'ffmpeg_threads': options.ffmpeg_threads,
              'weighted_deform_bones_tested': sum(len(record['direct_deform_helpers']) for record in records),
              'source_control_bones_tested': len(records),
              'source_control_names': [record['bone'].name for record in records],
              'fixed_helpers_animated': False, 'movement_epsilon': epsilon,
              'return_epsilon': return_epsilon, 'freeze_pose_delta': comparison(initial_geometry, baseline, epsilon),
              'bones': [], 'failures': [], 'limitations': [
                  'Checks control isolation, finite evaluated skin and pose return, not artistic correctness or source animation semantics.',
                  'Contact rows are identified by render_segments in this JSON; source files are not modified.']}
    if options.original_source:
        original = Path(options.original_source).resolve()
        report['original_artifact'] = {'path': str(original), 'snapshot': str(source),
                                       'sha256_at_test_start': digest(original) if original.is_file() else None,
                                       'snapshot_sha256': before_hash}
    if any(value['max_displacement'] > return_epsilon for value in report['freeze_pose_delta'].values()):
        report['failures'].append({'reason': 'freezing imported animation changed initial geometry'})
    for index, record in enumerate(records):
        arm, bone = record['armature'], record['bone']
        results = []
        best_axis, best_movement = (1, 0, 0), -1
        for axis in ((1, 0, 0), (0, 1, 0), (0, 0, 1)):
            for angle in (options.angle, -options.angle):
                restore_pose(armatures, initial, initial_channels)
                turn_bone(bone, initial[(arm.name, bone.name)], axis, angle)
                bpy.context.view_layer.update()
                moved = geometry(meshes)
                sample = comparison(baseline, moved, epsilon)
                influence = influence_comparison(baseline, moved, record['expected_masks'], epsilon)
                maximum = max((value['max_displacement'] for value in sample.values()), default=0)
                if maximum > best_movement:
                    best_axis, best_movement = axis, maximum
                if any(value.get('max_unexpected_displacement', 0) > return_epsilon for value in influence.values()):
                    report['failures'].append({'bone': bone.name, 'reason': 'vertices outside descendant-weight support moved'})
                changed_basis = [other.name for rig in armatures for other in rig.pose.bones
                                 if max(abs(value) for row in (other.matrix_basis - initial[(rig.name, other.name)]) for value in row) > 1e-6]
                if changed_basis != [bone.name]:
                    report['failures'].append({'bone': bone.name, 'reason': 'nonisolated local pose basis', 'changed': changed_basis})
                finite_pose = all(math.isfinite(value) for rig in armatures for other in rig.pose.bones for row in other.matrix for value in row)
                if not finite_pose or any(not value['finite'] or not value['same_vertex_count'] for value in sample.values()):
                    report['failures'].append({'bone': bone.name, 'reason': 'nonfinite pose/mesh or topology change'})
                results.append({'axis': axis, 'degrees': angle, 'mesh_movement': sample,
                                'descendant_weight_support': influence, 'finite_pose': finite_pose})
        restore_pose(armatures, initial, initial_channels)
        closure = comparison(baseline, geometry(meshes), epsilon)
        if any(value['max_displacement'] > return_epsilon for value in closure.values()):
            report['failures'].append({'bone': bone.name, 'reason': 'failed return to initial pose'})
        if best_movement <= epsilon:
            report['failures'].append({'bone': bone.name, 'reason': 'weighted bone produces no measurable deformation'})
        record['best_axis'] = best_axis
        report['bones'].append({'armature': arm.name, 'bone': bone.name, 'source_control_bone': bone.name,
                                'exact_skin_control': record['exact_skin'],
                                'direct_deform_helpers': record['direct_deform_helpers'],
                                'affected_descendant_deform_helpers': record['affected_deform_helpers'],
                                'expected_vertices_by_mesh': {name: int(mask.sum()) for name, mask in record['expected_masks'].items()},
                                'weighted_vertices': record['vertices'], 'weight_sum': record['weight_sum'],
                                'best_axis': best_axis, 'max_displacement': best_movement,
                                'samples': results, 'return_to_initial': closure})
        print('NMTM_ACCEPTANCE_BONE ' + json.dumps({'index': index + 1, 'total': len(records), 'bone': bone.name,
                                                   'max_displacement': best_movement}), flush=True)
    render_records = records[:options.render_bones] if options.render_bones > 0 else records
    report['render_bones_count'] = len(render_records)
    if not options.no_render:
        report['render_segments'] = bake_isolated_animation(scene, armatures, initial, initial_channels, render_records, options)
        # Verify every rendered frame, not just keyframe anchors; only one local bone may deviate.
        frame_checks = []
        framing_points = []
        for frame in range(scene.frame_start, scene.frame_end + 1):
            scene.frame_set(frame)
            bpy.context.view_layer.update()
            frame_geometry = geometry(meshes)
            sample = comparison(baseline, frame_geometry, epsilon)
            framing_points.extend(points for points in frame_geometry.values() if np.isfinite(points).all())
            if any(not value['finite'] or not value['same_vertex_count'] for value in sample.values()):
                report['failures'].append({'frame': frame, 'reason': 'invalid rendered-frame geometry'})
            active = report['render_segments'][(frame - 1) // options.segment_frames]
            active_record = render_records[(frame - 1) // options.segment_frames]
            influence = influence_comparison(baseline, frame_geometry, active_record['expected_masks'], epsilon)
            if any(value.get('max_unexpected_displacement', 0) > return_epsilon for value in influence.values()):
                report['failures'].append({'frame': frame, 'reason': 'rendered vertices outside descendant-weight support moved'})
            changed = [(arm.name, bone.name) for arm in armatures for bone in arm.pose.bones
                       if max(abs(value) for row in (bone.matrix_basis - initial[(arm.name, bone.name)]) for value in row) > 1e-5]
            if any(item != (active['armature'], active['bone']) for item in changed):
                report['failures'].append({'frame': frame, 'reason': 'other bone local basis changed', 'changed': changed})
            if frame in (active['start'], active['end']) and any(value['max_displacement'] > return_epsilon for value in sample.values()):
                report['failures'].append({'frame': frame, 'reason': 'segment did not return to initial geometry'})
            frame_checks.append({'frame': frame, 'active_bone': active['bone'], 'finite': all(v['finite'] for v in sample.values()),
                                 'max_displacement': max(v['max_displacement'] for v in sample.values()),
                                 'descendant_weight_support': influence})
        report['render_frame_checks'] = frame_checks
        report['camera'] = configure_render(scene, np.concatenate(framing_points), options)
        movie = output / 'isolated-bone-motion.mp4'
        scene.render.filepath = str(movie)
        scene.render.threads_mode = 'FIXED'
        scene.render.threads = options.threads
        scene.frame_set(scene.frame_start)
        bpy.ops.render.render(animation=True)
        report['movie'] = {'path': str(movie), 'bytes': movie.stat().st_size, 'frames': scene.frame_end,
                           'fps': options.fps, 'resolution': options.resolution}
        report['contact_sheet'] = make_contact(movie, output / 'isolated-bone-contact.png', Path(options.ffmpeg),
                                               options.segment_frames, len(render_records), options.ffmpeg_threads)
    report['source_sha256_after'] = digest(source)
    if options.original_source:
        report['original_artifact']['sha256_at_test_end'] = digest(original) if original.is_file() else None
        report['original_artifact']['matches_snapshot_at_test_end'] = report['original_artifact']['sha256_at_test_end'] == before_hash
    report['source_unchanged'] = report['source_sha256_after'] == before_hash
    if not report['source_unchanged']:
        report['failures'].append({'reason': 'source file changed'})
    report['passed'] = not report['failures']
    destination = output / 'acceptance.json'
    destination.write_text(json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False), encoding='utf-8')
    print('NMTM_RENDER_ACCEPTANCE ' + json.dumps({'report': str(destination), 'passed': report['passed'],
                                                'source_controls': len(records), 'failures': len(report['failures']),
                                                'source_unchanged': report['source_unchanged']}), flush=True)
    if not report['passed']:
        raise AssertionError('Acceptance failed; inspect ' + str(destination))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source')
    parser.add_argument('--original-source', help='Optional original path when testing a read-only input snapshot')
    parser.add_argument('--output', required=True)
    parser.add_argument('--ffmpeg', default='D:/Apps/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe')
    parser.add_argument('--render-bones', type=int, default=0, help='0 renders every numerically tested bone')
    parser.add_argument('--segment-frames', type=int, default=12)
    parser.add_argument('--angle', type=float, default=30)
    parser.add_argument('--fps', type=int, default=24)
    parser.add_argument('--resolution', type=int, default=384)
    parser.add_argument('--samples', type=int, default=8)
    parser.add_argument('--camera-margin', type=float, default=1.15)
    parser.add_argument('--threads', type=int, default=2, help='Blender render worker threads')
    parser.add_argument('--ffmpeg-threads', type=int, default=2, help='FFmpeg worker threads for contact sheet')
    parser.add_argument('--no-render', action='store_true')
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    options = parser.parse_args(args)
    if options.segment_frames < 6:
        parser.error('--segment-frames must be at least 6')
    run(options)


if __name__ == '__main__':
    try:
        main()
    except Exception:
        traceback.print_exc()
        raise
