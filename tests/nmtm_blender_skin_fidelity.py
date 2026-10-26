"""Compare evaluated Blender skin vertices against independent glTF CPU skinning.
blender --background --python tests/nmtm_blender_skin_fidelity.py -- report.json file.glb [...]
"""
import bisect
import json
import math
import struct
import sys
from pathlib import Path

import bpy
import numpy as np
from mathutils import Quaternion, Vector
from mathutils.kdtree import KDTree

GUESS_BIND_POSE = '--no-guess-bind-pose' not in sys.argv


def load_glb(path):
    data = Path(path).read_bytes()
    magic, version, length = struct.unpack_from('<III', data)
    assert magic == 0x46546C67 and version == 2 and length == len(data)
    pos = 12
    model, binary = None, None
    while pos < length:
        size, kind = struct.unpack_from('<II', data, pos)
        payload = data[pos + 8:pos + 8 + size]
        if kind == 0x4E4F534A:
            model = json.loads(payload)
        elif kind == 0x004E4942:
            binary = payload
        pos += size + 8
    return model, binary


def accessor(model, binary, index):
    a = model['accessors'][index]
    v = model['bufferViews'][a['bufferView']]
    assert not a.get('sparse') and v.get('buffer', 0) == 0
    dims = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}[a['type']]
    dtype = np.dtype({5120: 'i1', 5121: 'u1', 5122: '<i2', 5123: '<u2', 5125: '<u4', 5126: '<f4'}[a['componentType']])
    stride = v.get('byteStride', dims * dtype.itemsize)
    offset = v.get('byteOffset', 0) + a.get('byteOffset', 0)
    result = np.ndarray((a['count'], dims), dtype=dtype, buffer=binary, offset=offset, strides=(stride, dtype.itemsize)).copy()
    if a.get('normalized') and a['componentType'] != 5126:
        info = np.iinfo(dtype)
        result = result.astype(np.float64) / info.max
        if info.min < 0:
            result = np.maximum(result, -1)
    return result


def trs(t, q, s):
    q = np.array(q, dtype=float)
    q /= np.linalg.norm(q)
    x, y, z, w = q
    m = np.array([[1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w), t[0]],
                  [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w), t[1]],
                  [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y), t[2]],
                  [0, 0, 0, 1]], dtype=float)
    m[:3, :3] *= np.array(s)
    return m


def sample(model, binary, sampler, time, channel):
    times = accessor(model, binary, sampler['input'])[:, 0]
    values = accessor(model, binary, sampler['output']).astype(float)
    mode = sampler.get('interpolation', 'LINEAR')
    i = min(max(bisect.bisect_right(times, time)-1, 0), len(times)-1)
    j = min(i+1, len(times)-1)
    duration = float(times[j]-times[i])
    factor = min(max((time-times[i])/duration, 0), 1) if duration > 0 else 0
    if mode == 'CUBICSPLINE':
        if i == j:
            value = values[i*3+1]
        else:
            a, b = values[i*3+1], values[j*3+1]
            ta, tb = values[i*3+2]*duration, values[j*3]*duration
            f = factor
            value = (2*f**3-3*f*f+1)*a+(f**3-2*f*f+f)*ta+(-2*f**3+3*f*f)*b+(f**3-f*f)*tb
    elif mode == 'STEP' or i == j:
        value = values[i]
    elif channel == 'rotation':
        a, b = values[i], values[j]
        dot = float(np.dot(a, b))
        if dot < 0:
            b, dot = -b, -dot
        dot = min(max(dot, -1), 1)
        if dot > .9995:
            value = (1-factor)*a+factor*b
        else:
            angle = math.acos(dot)
            value = (math.sin((1-factor)*angle)*a+math.sin(factor*angle)*b)/math.sin(angle)
    else:
        value = (1-factor)*values[i]+factor*values[j]
    if channel == 'rotation':
        value /= np.linalg.norm(value)
    return value


def cpu_vertices(model, binary, animation=None, time=0):
    nodes = model.get('nodes', [])
    channels = {}
    if animation is not None:
        for channel in animation['channels']:
            target = channel['target']
            if target['path'] == 'weights':
                raise ValueError('Morph target animation is outside this skin-only validator')
            channels.setdefault(target['node'], {})[target['path']] = sample(model, binary, animation['samplers'][channel['sampler']], time, target['path'])
    parents = {child: i for i, node in enumerate(nodes) for child in node.get('children', [])}
    worlds = {}
    def world(i):
        if i in worlds:
            return worlds[i]
        n, c = nodes[i], channels.get(i, {})
        local = np.array(n['matrix']).reshape((4, 4)).T if 'matrix' in n else trs(c.get('translation', n.get('translation', [0, 0, 0])), c.get('rotation', n.get('rotation', [0, 0, 0, 1])), c.get('scale', n.get('scale', [1, 1, 1])))
        worlds[i] = world(parents[i]) @ local if i in parents else local
        return worlds[i]
    results = []
    for i, node in enumerate(nodes):
        if 'mesh' not in node:
            continue
        for primitive in model['meshes'][node['mesh']]['primitives']:
            attributes = primitive['attributes']
            positions = accessor(model, binary, attributes['POSITION']).astype(float)
            homogeneous = np.column_stack((positions, np.ones(len(positions))))
            if 'skin' in node:
                skin = model['skins'][node['skin']]
                ibms = accessor(model, binary, skin['inverseBindMatrices']).reshape((-1, 4, 4)).transpose((0, 2, 1)) if 'inverseBindMatrices' in skin else np.repeat(np.eye(4)[None], len(skin['joints']), axis=0)
                matrices = np.array([world(j) @ ibm for j, ibm in zip(skin['joints'], ibms)])
                joints = accessor(model, binary, attributes['JOINTS_0']).astype(int)
                weights = accessor(model, binary, attributes['WEIGHTS_0']).astype(float)
                weights /= weights.sum(axis=1, keepdims=True)
                deformed = np.zeros_like(homogeneous)
                for column in range(joints.shape[1]):
                    transformed = np.einsum('nij,nj->ni', matrices[joints[:, column]], homogeneous)
                    deformed += transformed * weights[:, column, None]
            else:
                deformed = homogeneous @ world(i).T
            results.extend(deformed[:, :3])
    gltf = np.array(results)
    # glTF Y-up -> Blender Z-up.
    return np.column_stack((gltf[:, 0], -gltf[:, 2], gltf[:, 1]))


def blender_vertices():
    depsgraph = bpy.context.evaluated_depsgraph_get()
    result = []
    for obj in bpy.context.scene.objects:
        if obj.type != 'MESH' or obj.name.startswith('_gltf') or not any(mod.type == 'ARMATURE' for mod in obj.modifiers):
            continue
        evaluated = obj.evaluated_get(depsgraph)
        mesh = evaluated.to_mesh()
        result.extend(tuple(evaluated.matrix_world @ v.co) for v in mesh.vertices)
        evaluated.to_mesh_clear()
    return np.array(result)


def distances(expected, actual):
    assert len(expected) and len(actual)
    def nearest(a, b):
        tree = KDTree(len(b))
        for i, point in enumerate(b):
            tree.insert(Vector(point), i)
        tree.balance()
        return np.array([tree.find(Vector(point))[2] for point in a])
    forward, backward = nearest(expected, actual), nearest(actual, expected)
    error = max(float(forward.max()), float(backward.max()))
    extent = max(float(np.ptp(expected, axis=0).max()), .01)
    tolerance = max(2e-5, extent*2e-5)
    return {'cpu_vertices': len(expected), 'blender_vertices': len(actual), 'max_bidirectional_error': error, 'rms_cpu_to_blender': float(np.sqrt(np.mean(forward**2))), 'tolerance': tolerance, 'passed': error <= tolerance}


def inspect(path):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.render.fps = 24
    model, binary = load_glb(path)
    # glTF import activates the first action. Import an animation-free diagnostic
    # copy for default pose so removing an action cannot leave its last pose behind.
    static_model = dict(model)
    static_model.pop('animations', None)
    encoded = json.dumps(static_model, separators=(',', ':')).encode('utf-8')
    encoded += b' ' * ((-len(encoded)) % 4)
    padded_binary = binary + b'\0' * ((-len(binary)) % 4)
    default_path = path.with_name(path.stem + '-default-pose.glb')
    total = 12 + 8 + len(encoded) + 8 + len(padded_binary)
    default_path.write_bytes(struct.pack('<III', 0x46546C67, 2, total) + struct.pack('<II', len(encoded), 0x4E4F534A) + encoded + struct.pack('<II', len(padded_binary), 0x004E4942) + padded_binary)
    bpy.ops.import_scene.gltf(filepath=str(default_path), merge_vertices=False, guess_original_bind_pose=GUESS_BIND_POSE)
    bpy.context.view_layer.update()
    default_pose = distances(cpu_vertices(model, binary), blender_vertices())
    defaults = {}
    for obj in bpy.context.scene.objects:
        defaults[obj.name] = {'location': obj.location.copy(), 'rotation_quaternion': obj.rotation_quaternion.copy(), 'rotation_euler': obj.rotation_euler.copy(), 'scale': obj.scale.copy()}
        if obj.type == 'ARMATURE':
            defaults[obj.name]['bones'] = {bone.name: (bone.location.copy(), bone.rotation_quaternion.copy(), bone.rotation_euler.copy(), bone.scale.copy()) for bone in obj.pose.bones}
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.render.fps = 24
    bpy.ops.import_scene.gltf(filepath=str(path), merge_vertices=False, guess_original_bind_pose=GUESS_BIND_POSE)
    assignments = {}
    for obj in bpy.context.scene.objects:
        ad = obj.animation_data
        if not ad:
            continue
        assignments[obj.name] = [(track.name, strip.action) for track in ad.nla_tracks for strip in track.strips]
        ad.action = None
        ad.use_nla = False
    bpy.context.view_layer.update()
    result = {'file': str(path), 'default_pose': default_pose, 'animations': []}
    for index, animation in enumerate(model.get('animations', [])):
        name = animation.get('name', 'Animation_'+str(index))
        selected = []
        for obj in bpy.context.scene.objects:
            default = defaults.get(obj.name)
            if default:
                for prop in ['location', 'rotation_quaternion', 'rotation_euler', 'scale']:
                    setattr(obj, prop, default[prop])
                for bone in obj.pose.bones if obj.type == 'ARMATURE' else []:
                    if bone.name in default.get('bones', {}):
                        bone.location, bone.rotation_quaternion, bone.rotation_euler, bone.scale = default['bones'][bone.name]
            if not obj.animation_data:
                continue
            candidates = assignments.get(obj.name, [])
            found = [a for n, a in candidates if n == name]
            if not found:
                found = [a for n, a in candidates if n.startswith(name) or a.name == name or a.name.startswith(name+'_')]
            if not found and len(candidates) == len(model.get('animations', [])):
                found = [candidates[index][1]]
            obj.animation_data.action = found[0] if found else None
            if found:
                selected.append({'object': obj.name, 'action': found[0].name})
        times = [accessor(model, binary, sampler['input'])[:, 0] for sampler in animation['samplers']]
        start, end = min(float(t.min()) for t in times), max(float(t.max()) for t in times)
        samples = []
        for time in sorted(set(start+(end-start)*factor for factor in [0, .25, .5, .75, 1])):
            frame = time*24
            bpy.context.scene.frame_set(math.floor(frame), subframe=frame-math.floor(frame))
            bpy.context.view_layer.update()
            samples.append({'time': time, 'frame': frame, **distances(cpu_vertices(model, binary, animation, time), blender_vertices())})
        result['animations'].append({'name': name, 'assigned_actions': selected, 'samples': samples})
    result['passed'] = result['default_pose']['passed'] and all(s['passed'] for a in result['animations'] for s in a['samples'])
    return result


def main():
    args = [a for a in sys.argv[sys.argv.index('--')+1:] if a != '--no-guess-bind-pose']
    report_path, inputs = Path(args[0]), [Path(p) for p in args[1:]]
    report = {'blender': bpy.app.version_string, 'guess_original_bind_pose': GUESS_BIND_POSE, 'method': 'Independent glTF TRS/slerp/skin evaluation versus Blender depsgraph; bidirectional nearest vertex distances', 'cases': []}
    for path in inputs:
        try:
            result = inspect(path)
        except Exception as exc:
            import traceback
            result = {'file': str(path), 'passed': False, 'error': str(exc), 'traceback': traceback.format_exc()}
        report['cases'].append(result)
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps(report, indent=2), encoding='utf-8')
        print('SKIN_FIDELITY', path.name, result['passed'], flush=True)
    report['passed'] = all(case['passed'] for case in report['cases'])
    report_path.write_text(json.dumps(report, indent=2), encoding='utf-8')
    print('SKIN_FIDELITY_REPORT', str(report_path), 'PASS' if report['passed'] else 'FAIL', flush=True)


if __name__ == '__main__':
    main()
