"""Read-only artifact audit; never reconverts or modifies the input artifacts.
Run Blender background --threads 2 --python this.py -- report.json audit.json.
"""
import collections
import base64
import hashlib
import importlib.util
import json
import math
import os
import re
from pathlib import Path
import sys

import bpy
import numpy as np
from mathutils import Vector
from mathutils.kdtree import KDTree

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('audit_source_oracle', ROOT / 'tests/nmtm_blender_skin_fidelity.py')
oracle = importlib.util.module_from_spec(spec)
spec.loader.exec_module(oracle)


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def source_inventory(path):
    model, binary = oracle.load_glb(path)
    triangles, used_vertices, vertices = [], [], []
    primitive_records = []
    for ni, node in enumerate(model.get('nodes', [])):
        if 'mesh' not in node:
            continue
        for pi, primitive in enumerate(model['meshes'][node['mesh']]['primitives']):
            attrs = primitive['attributes']
            positions = oracle.accessor(model, binary, attrs['POSITION']).astype(float)
            converted = np.column_stack((positions[:, 0], -positions[:, 2], positions[:, 1]))
            uv = oracle.accessor(model, binary, attrs['TEXCOORD_0']).astype(float) if 'TEXCOORD_0' in attrs else None
            joints = oracle.accessor(model, binary, attrs['JOINTS_0']).astype(int) if 'JOINTS_0' in attrs else None
            weights = oracle.accessor(model, binary, attrs['WEIGHTS_0']).astype(float) if 'WEIGHTS_0' in attrs else None
            records = []
            for vi, position in enumerate(converted):
                influence = {}
                if joints is not None:
                    total = float(weights[vi].sum())
                    for joint, weight in zip(joints[vi], weights[vi]):
                        if weight > 1e-8:
                            key = '_NMTM_deform_%d_%d' % (node['skin'], joint)
                            influence[key] = influence.get(key, 0) + float(weight / total)
                records.append({'p': position.tolist(), 'uv': uv[vi].tolist() if uv is not None else None, 'w': influence, 'cpu': len(vertices)+vi, 'material': primitive.get('material')})
            indices = oracle.accessor(model, binary, primitive['indices']).reshape(-1).astype(int) if 'indices' in primitive else np.arange(len(records))
            mode = primitive.get('mode', 4)
            if mode != 4 or len(indices) % 3:
                raise AssertionError('Audit only handles triangle primitives: ' + str((mode, len(indices))))
            local_tris = [[records[int(i)] for i in indices[start:start+3]] for start in range(0, len(indices), 3)]
            triangles.extend(local_tris)
            used_vertices.extend(records[int(i)] for i in sorted(set(indices)))
            vertices.extend(records)
            primitive_records.append({'node': ni, 'mesh': node['mesh'], 'primitive': pi, 'material': primitive.get('material'), 'vertices': len(records), 'used_vertices': len(set(indices)), 'triangles': len(local_tris), 'attributes': sorted(attrs)})
    images = []
    for image in model.get('images', []):
        view = model['bufferViews'][image['bufferView']]
        start = view.get('byteOffset', 0)
        payload = binary[start:start+view['byteLength']]
        images.append({'name': image.get('name'), 'sha256': hashlib.sha256(payload).hexdigest(), 'bytes': len(payload)})
    animations = []
    for index, animation in enumerate(model.get('animations', [])):
        samplers = animation['samplers']
        times = [oracle.accessor(model, binary, item['input']).reshape(-1) for item in samplers]
        animations.append({'index': index, 'name': animation.get('name', 'Animation_'+str(index)), 'start': min(float(t.min()) for t in times), 'end': max(float(t.max()) for t in times), 'paths': dict(collections.Counter(channel['target']['path'] for channel in animation['channels'])), 'interpolations': dict(collections.Counter(sampler.get('interpolation', 'LINEAR') for sampler in samplers)), 'key_count': sum(len(t) for t in times)})
    bind_provenance = None
    folders = {'cs_s6Jiaolong_horse': '2025s6', 'cs_s6Cyber_skin_guajian_back': '2025s6', 'ss_s8Time_Craft': '2026s8'}
    if path.stem in folders:
        skeleton_path = ROOT / 'NetMC Assets/[3.8.30.293955]/assets/assets/resource_packs/vanilla_netease/models' / folders[path.stem] / 'skeleton' / (path.stem+'_skeleton.json')
        skeleton = json.loads(skeleton_path.read_text(encoding='utf-8'))
        source_bones = {b['name']: b for b in skeleton['skeleton']}
        errors, f32_errors, scaled_errors, scaled_f32_errors, names = [], [], [], [], []
        for skin in model.get('skins', []):
            matrices = oracle.accessor(model, binary, skin['inverseBindMatrices']).reshape((-1,4,4)).transpose((0,2,1))
            for joint, matrix in zip(skin['joints'], matrices):
                name = model['nodes'][joint]['name']
                raw = np.array(source_bones[name]['offmtx'], dtype=float)
                expected = np.vstack((raw, [0,0,0,1])) if raw.shape == (3,4) else raw.reshape((4,4))
                errors.append(float(np.max(np.abs(matrix-expected))))
                f32_errors.append(float(np.max(np.abs(matrix-expected.astype(np.float32)))))
                scaled = expected.copy()
                scaled[:3,3] /= 16
                scaled_errors.append(float(np.max(np.abs(matrix-scaled))))
                scaled_f32_errors.append(float(np.max(np.abs(matrix-scaled.astype(np.float32)))))
                names.append(name)
        bind_provenance = {'skeleton_path': str(skeleton_path), 'skeleton_sha256': sha(skeleton_path), 'joint_names_checked': names, 'joints_checked': len(names), 'max_error_to_original_json_unscaled': max(errors), 'max_error_to_original_float32_unscaled': max(f32_errors), 'coordinate_conversion': 'D * sourceIBM * inverse(D), D=diag(1/16,1/16,1/16,1); translations divided by 16, linear terms unchanged', 'max_error_to_original_json_export_units': max(scaled_errors), 'max_error_to_original_float32_export_units': max(scaled_f32_errors), 'source_ibms_preserved_float32_exact_after_export_units': max(scaled_f32_errors) == 0}
    return model, binary, {'path': str(path), 'sha256': sha(path), 'primitives': primitive_records, 'vertices': len(vertices), 'used_vertices': len(used_vertices), 'triangles': len(triangles), 'images': images, 'animations': animations, 'skins': len(model.get('skins', [])), 'joints': [len(s['joints']) for s in model.get('skins', [])], 'has_morphs': any('targets' in p for m in model.get('meshes', []) for p in m['primitives']), 'extra_joint_sets': any('JOINTS_1' in p['attributes'] for m in model.get('meshes', []) for p in m['primitives']), 'original_bind_provenance': bind_provenance}, triangles, used_vertices


def actual_inventory(path, kind):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    if kind == 'fbx':
        bpy.ops.import_scene.fbx(filepath=str(path), use_anim=False, ignore_leaf_bones=False, automatic_bone_orientation=False)
    else:
        bpy.ops.wm.open_mainfile(filepath=str(path))
    triangles, records, meshes = [], [], []
    for obj in bpy.context.scene.objects:
        if obj.type != 'MESH' or not any(mod.type == 'ARMATURE' for mod in obj.modifiers):
            continue
        mesh = obj.data
        mesh.calc_loop_triangles()
        group_names = {group.index: group.name for group in obj.vertex_groups}
        layer = mesh.uv_layers.active
        vertex_records = []
        for vertex in mesh.vertices:
            weights = {group_names[g.group]: float(g.weight) for g in vertex.groups if g.weight > 1e-8}
            position = obj.matrix_world @ vertex.co
            vertex_records.append({'p': list(position), 'w': weights, 'object': obj.name, 'vertex': vertex.index})
        for triangle in mesh.loop_triangles:
            corners = []
            for li in triangle.loops:
                record = dict(vertex_records[mesh.loops[li].vertex_index])
                # Blender import changes glTF UV v origin.
                record['uv'] = [float(layer.data[li].uv.x), 1-float(layer.data[li].uv.y)] if layer else None
                record['material'] = triangle.material_index if len(mesh.materials) else None
                corners.append(record)
            triangles.append(corners)
        records.extend(vertex_records)
        meshes.append({'name': obj.name, 'vertices': len(mesh.vertices), 'triangles': len(mesh.loop_triangles), 'polygons': len(mesh.polygons), 'materials': [m.name if m else None for m in mesh.materials], 'uv_layers': len(mesh.uv_layers)})
    images = []
    for image in bpy.data.images:
        if image.type in {'RENDER_RESULT', 'COMPOSITING'}:
            continue
        payload = image.packed_file.data if image.packed_file else None
        images.append({'name': image.name, 'size': list(image.size), 'packed': bool(payload), 'sha256': hashlib.sha256(payload).hexdigest() if payload else None})
    return {'path': str(path), 'sha256': sha(path), 'meshes': meshes, 'vertices': len(records), 'triangles': len(triangles), 'images': images}, triangles, records


def corner_equal(a, b, tolerance=3e-6):
    if 'material' in a and a['material'] != b.get('material'):
        return False
    if np.max(np.abs(np.array(a['p'])-b['p'])) > tolerance:
        return False
    if a.get('uv') is not None:
        if b.get('uv') is None or np.max(np.abs(np.array(a['uv'])-b['uv'])) > tolerance:
            return False
    names = set(a['w']) | set(b['w'])
    return all(abs(a['w'].get(n, 0)-b['w'].get(n, 0)) <= 2e-6 for n in names)


def structural_compare(expected, actual, correspondence=None):
    # Query position centroids, then require one-to-one triangle/corner
    # correspondence with position, UV and actual joint-influence weights.
    # Distinct UV seam duplicates may share one mesh vertex; face multiplicity
    # must still match. This deliberately does not require equal vertex counts.
    tree = KDTree(len(actual))
    for index, triangle in enumerate(actual):
        center = np.mean([c['p'] for c in triangle], axis=0)
        tree.insert(Vector(center), index)
    tree.balance()
    unmatched = set(range(len(actual)))
    missing = []
    permutations = [(0,1,2), (1,2,0), (2,0,1), (0,2,1), (2,1,0), (1,0,2)]
    for index, triangle in enumerate(expected):
        center = np.mean([c['p'] for c in triangle], axis=0)
        candidates = [j for _point, j, _distance in tree.find_range(Vector(center), 6e-6)]
        match = next(((j, p) for j in candidates if j in unmatched for p in permutations if all(corner_equal(triangle[k], actual[j][p[k]]) for k in range(3))), None)
        if match is None:
            missing.append(index)
        else:
            j, permutation = match
            unmatched.remove(j)
            if correspondence is not None:
                correspondence.extend((triangle[k]['cpu'], actual[j][permutation[k]]['object'], actual[j][permutation[k]]['vertex']) for k in range(3))
    return {'passed': not missing and not unmatched, 'missing_expected_triangle_count': len(missing), 'extra_actual_triangle_count': len(unmatched), 'first_missing_triangle_indices': missing[:8], 'coordinate_tolerance': 3e-6, 'weight_tolerance': 2e-6, 'checks': 'one-to-one triangle corner position + UV + original joint ordinal weight + material slot; allows seam vertex dedup, counts all repeated faces'}


def indexed_motion_audit(model, binary, artifact, kind, correspondence):
    """Use structural one-to-one mappings, never nearest geometry distances."""
    static = {}
    for obj in bpy.context.scene.objects:
        if obj.type not in {'MESH', 'ARMATURE', 'EMPTY'}:
            continue
        static[(obj.name, None)] = obj.matrix_basis.copy()
        if obj.type == 'ARMATURE':
            static.update({(obj.name, bone.name): bone.matrix_basis.copy() for bone in obj.pose.bones})
    if kind == 'fbx':
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.fbx(filepath=str(artifact), use_anim=True, ignore_leaf_bones=False, automatic_bone_orientation=False)
    owners = [obj for obj in bpy.context.scene.objects if obj.type in {'MESH', 'ARMATURE', 'EMPTY'}]
    clips = collections.defaultdict(list)
    for obj in owners:
        if not obj.animation_data:
            continue
        if kind == 'fbx':
            for action in bpy.data.actions:
                prefix = obj.name+'|'
                if action.name.startswith(prefix):
                    clips[action.name[len(prefix):]].append((obj, action))
        else:
            for track in obj.animation_data.nla_tracks:
                for strip in track.strips:
                    if strip.action:
                        clips[track.name].append((obj, strip.action))
    def restore():
        for obj in owners:
            if obj.animation_data:
                obj.animation_data.action = None
                obj.animation_data.use_nla = False
            if (obj.name, None) in static:
                obj.matrix_basis = static[obj.name, None].copy()
            if obj.type == 'ARMATURE':
                for bone in obj.pose.bones:
                    if (obj.name, bone.name) in static:
                        bone.matrix_basis = static[obj.name, bone.name].copy()
    def measure(animation=None, time=0):
        cpu = oracle.cpu_vertices(model, binary, animation, time)
        depsgraph = bpy.context.evaluated_depsgraph_get()
        actual = {}
        for name in {name for _, name, _ in correspondence}:
            evaluated = bpy.context.scene.objects[name].evaluated_get(depsgraph)
            mesh = evaluated.to_mesh()
            actual[name] = np.array([tuple(evaluated.matrix_world @ v.co) for v in mesh.vertices])
            evaluated.to_mesh_clear()
        errors = np.array([np.linalg.norm(cpu[ci]-actual[name][vi]) for ci, name, vi in correspondence])
        extent = max(float(np.ptp(cpu, axis=0).max()), .01)
        tolerance = max(2e-5, extent*2e-5)
        return {'max_indexed_error': float(errors.max()), 'rms_indexed_error': float(np.sqrt(np.mean(errors**2))), 'tolerance': tolerance, 'passed': bool(errors.max() <= tolerance)}
    restore()
    bpy.context.view_layer.update()
    result = {'default_pose': measure(), 'matched_source_vertices': len({ci for ci, _, _ in correspondence}), 'source_clips': len(model.get('animations', [])), 'artifact_clip_names': list(clips), 'animations': []}
    fps = bpy.context.scene.render.fps / bpy.context.scene.render.fps_base
    selected_ids = set()
    for index, animation in enumerate(model.get('animations', [])):
        name = animation.get('name', 'Animation_'+str(index))
        bindings = clips.get(name)
        if not bindings:
            raise AssertionError('No EXACT artifact clip for '+name+'; available='+str(list(clips)))
        signature = tuple(sorted((o.name, a.name) for o,a in bindings))
        if signature in selected_ids:
            raise AssertionError('Two source clips selected the same artifact binding: '+name)
        selected_ids.add(signature)
        restore()
        for owner, action in bindings:
            owner.animation_data.action = action
        times = [oracle.accessor(model, binary, s['input']).reshape(-1) for s in animation['samplers']]
        start, end = min(float(t.min()) for t in times), max(float(t.max()) for t in times)
        offset = min(float(action.frame_range[0]) for _, action in bindings)-start*fps if kind == 'fbx' else 0
        samples = []
        for time in sorted({start+(end-start)*factor for factor in (.1732050807568877, .3713906763541037, .6180339887498948, .911389831237123)}):
            frame = time*fps+offset
            bpy.context.scene.frame_set(math.floor(frame), subframe=frame-math.floor(frame))
            bpy.context.view_layer.update()
            samples.append({'time': time, 'frame': frame, **measure(animation, time)})
        result['animations'].append({'index': index, 'name': name, 'assigned': [{'object': o.name, 'action': a.name} for o,a in bindings], 'samples': samples})
    result['clip_set_exact'] = {a.get('name', 'Animation_'+str(i)) for i,a in enumerate(model.get('animations', []))} == set(clips)
    result['passed'] = result['clip_set_exact'] and result['default_pose']['passed'] and all(s['passed'] for a in result['animations'] for s in a['samples'])
    return result


def main():
    args = sys.argv[sys.argv.index('--')+1:]
    fidelity_path, out = map(Path, args)
    fidelity = json.loads(fidelity_path.read_text(encoding='utf-8'))
    result = {'blender': bpy.app.version_string, 'input_report_sha256': sha(fidelity_path), 'cases': [], 'sources': {}}
    plugin_text = (ROOT / 'nmtm.js').read_text(encoding='utf-8')
    embedded = re.search(r"BLENDER_BRIDGE_BASE64\s*=\s*['\"]([^'\"]+)", plugin_text)
    result['implementation_hashes'] = {name: sha(ROOT/name) for name in ['nmtm.js', 'nmtm_blender_bridge.py', 'tests/nmtm_blender_skin_fidelity.py', 'tests/nmtm_blender_bridge_fidelity.py', 'tests/nmtm_fidelity_independent_audit.py']}
    result['implementation_hashes']['embedded_bridge'] = hashlib.sha256(base64.b64decode(embedded.group(1))).hexdigest() if embedded else None
    cache = {}
    for case in fidelity['cases']:
        source = case['source']
        if source not in cache:
            cache[source] = source_inventory(Path(source))
            result['sources'][source] = cache[source][2]
        model, binary, inv, triangles, vertices = cache[source]
        try:
            actual, actual_triangles, actual_vertices = actual_inventory(Path(case['artifact']), case['kind'])
            correspondence = []
            check = structural_compare(triangles, actual_triangles, correspondence)
            actual['structural'] = check
            expected_images = {i['sha256'] for i in inv['images']}
            actual_images = {i['sha256'] for i in actual['images']}
            actual['embedded_image_payloads_preserved'] = expected_images <= actual_images
            actual['source'] = source
            actual['kind'] = case['kind']
            if check['passed']:
                actual['indexed_motion'] = indexed_motion_audit(model, binary, Path(case['artifact']), case['kind'], correspondence)
            result['cases'].append(actual)
            print('AUDIT_STRUCTURAL', Path(source).name, case['kind'], check['passed'], 'triangles', len(triangles), len(actual_triangles), 'images', actual['embedded_image_payloads_preserved'], 'indexed_motion', actual.get('indexed_motion', {}).get('passed'), flush=True)
        except Exception as exc:
            import traceback
            result['cases'].append({'source': source, 'kind': case['kind'], 'error': str(exc), 'traceback': traceback.format_exc()})
        out.write_text(json.dumps(result, indent=2), encoding='utf-8')
    # Demonstrate the old distance metric's known multiplicity blind spot.
    points = np.array([[0.,0.,0.], [1.,0.,0.], [0.,1.,0.]])
    result['negative_control_missing_duplicate_triangle'] = oracle.distances(np.vstack((points, points)), points)
    result['negative_control_topology_result'] = structural_compare([[{'p': p.tolist(), 'uv': None, 'w': {}} for p in points]]*2, [[{'p': p.tolist(), 'uv': None, 'w': {}} for p in points]])
    result['passed'] = all(c.get('structural', {}).get('passed') and c.get('embedded_image_payloads_preserved') and c.get('indexed_motion', {}).get('passed') for c in result['cases']) and all(s['original_bind_provenance'] is None or s['original_bind_provenance']['source_ibms_preserved_float32_exact_after_export_units'] for s in result['sources'].values())
    out.write_text(json.dumps(result, indent=2), encoding='utf-8')
    print('AUDIT_DONE', result['passed'], flush=True)


if __name__ == '__main__':
    main()
