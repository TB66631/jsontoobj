"""NMTM GLB -> Blender/FBX bridge for Blender 4.2.

This file is embeddable: execute its source, then call convert(source, target, kind).
No files other than the requested destination are written during conversion.
"""
import math
from pathlib import Path
import re

import bpy
import numpy as np
from mathutils import Euler, Matrix, Quaternion, Vector


def exact_skin_import(source):
    """Keep glTF's per-influence IBM, never bake its weighted sum into vertices.

    Blender rest bones are orthogonal and cannot store an arbitrary inverse bind
    matrix.  Driver bones reproduce the source node hierarchy; two fixed helper
    bones factor each affine IBM as T*R*S*R using SVD.  All rest matrices are the
    identity, hence the Armature modifier evaluates sum(w * worldJoint * IBM * p)
    directly, including shear, negative scale, and genuinely mixed weights.
    Materials, normals, UVs, morph targets and indices still use Blender's glTF
    importer.  Its lossy skin_into_bind_pose stage alone is disabled locally.
    """
    from io_scene_gltf2.blender.imp import gltf2_blender_mesh as mesh_module
    from io_scene_gltf2.blender.imp import gltf2_blender_node as node_module
    from io_scene_gltf2.io.imp.gltf2_io_binary import BinaryData

    captured, mesh_nodes = {}, []
    originals = (mesh_module.import_user_extensions, node_module.import_user_extensions)

    def mesh_hook(hook, gltf, *args):
        originals[0](hook, gltf, *args)
        captured['gltf'] = gltf
        if hook == 'gather_import_mesh_options':
            args[0].skin_into_bind_pose = False

    def node_hook(hook, gltf, *args):
        originals[1](hook, gltf, *args)
        if hook == 'gather_import_node_after_hook':
            vnode, _node, obj = args
            if obj.type == 'MESH' and vnode.mesh_node_idx is not None:
                node = gltf.data.nodes[vnode.mesh_node_idx]
                if node.skin is not None:
                    mesh_nodes.append((obj, node.skin))

    mesh_module.import_user_extensions, node_module.import_user_extensions = mesh_hook, node_hook
    try:
        bpy.ops.import_scene.gltf(filepath=str(source), disable_bone_shape=True,
                                  merge_vertices=False, guess_original_bind_pose=False)
    finally:
        mesh_module.import_user_extensions, node_module.import_user_extensions = originals
    if not mesh_nodes:
        return
    gltf = captured['gltf']
    nodes = gltf.data.nodes
    parents = {child: i for i, node in enumerate(nodes) for child in (node.children or [])}
    skin_indices = sorted({skin for _, skin in mesh_nodes})
    needed = set()
    for skin_index in skin_indices:
        for joint in gltf.data.skins[skin_index].joints:
            while joint not in needed:
                needed.add(joint)
                if joint not in parents:
                    break
                joint = parents[joint]
    old_armatures = [obj for obj in bpy.context.scene.objects if obj.type == 'ARMATURE']
    group_names = {(s, j): gltf.vnodes[j].blender_bone_name
                   for s in skin_indices for j in gltf.data.skins[s].joints}
    data = bpy.data.armatures.new('NMTM_ExactSkin')
    rig = bpy.data.objects.new('NMTM_ExactSkin', data)
    bpy.context.scene.collection.objects.link(rig)
    rig['nmtm_skin_method'] = 'identity-rest affine IBM helper chains'
    # FBX stores Euler curves. Dense quarter-tick sampling keeps the exported
    # Euler interpolation within the source quaternion curve to sub-pixel error.
    rig['nmtm_animation_sample_step'] = 0.0625
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    drivers, deform, fixed = {}, {}, {}

    def new_bone(name, parent=None, deforming=False):
        bone = data.edit_bones.new(name)
        bone.head, bone.tail = (0, 0, 0), (0, .1, 0)
        bone.use_deform = deforming
        bone.inherit_scale = 'FULL'
        if parent:
            bone.parent = data.edit_bones[parent]
        return bone.name

    for index in sorted(needed):
        drivers[index] = new_bone(nodes[index].name or ('Node_' + str(index)))
    for index in sorted(needed):
        if parents.get(index) in drivers:
            data.edit_bones[drivers[index]].parent = data.edit_bones[drivers[parents[index]]]
    conversion = np.array([[1, 0, 0, 0], [0, 0, -1, 0], [0, 1, 0, 0], [0, 0, 0, 1]], float)

    def affine_factors(matrix):
        if not np.isfinite(matrix).all() or abs(np.linalg.det(matrix[:3, :3])) < 1e-12:
            raise ValueError('NMTM skin contains a nonfinite or singular affine bind matrix')
        u, scale, vt = np.linalg.svd(matrix[:3, :3])
        if np.linalg.det(u) < 0:
            u[:, -1] *= -1
            scale[-1] *= -1
        if np.linalg.det(vt) < 0:
            vt[-1, :] *= -1
            scale[-1] *= -1
        first, second = np.eye(4), np.eye(4)
        first[:3, :3] = u * scale
        first[:3, 3] = matrix[:3, 3]
        second[:3, :3] = vt
        return Matrix(first.tolist()), Matrix(second.tolist())

    for skin_index in skin_indices:
        skin = gltf.data.skins[skin_index]
        ibms = BinaryData.decode_accessor(gltf, skin.inverse_bind_matrices).reshape((-1, 4, 4)).transpose((0, 2, 1)) if skin.inverse_bind_matrices is not None else np.repeat(np.eye(4)[None], len(skin.joints), axis=0)
        for ordinal, (joint, ibm) in enumerate(zip(skin.joints, ibms)):
            first, second = affine_factors(conversion @ ibm @ conversion.T)
            helper = new_bone('_NMTM_bind_%d_%d' % (skin_index, ordinal), drivers[joint])
            final = new_bone('_NMTM_deform_%d_%d' % (skin_index, ordinal), helper, True)
            fixed[helper], fixed[final] = first, second
            deform[skin_index, joint] = final
    bpy.ops.object.mode_set(mode='OBJECT')
    for bone in rig.pose.bones:
        bone.rotation_mode = 'QUATERNION'
    for name, matrix in fixed.items():
        rig.pose.bones[name].matrix_basis = matrix

    def set_trs(bone, node, overrides=None):
        overrides = overrides or {}
        if node.matrix is not None:
            matrix = conversion @ np.array(node.matrix).reshape((4, 4)).T @ conversion.T
            # glTF matrix nodes cannot be animation targets.  A matrix containing
            # shear is rejected instead of silently losing it in decomposition.
            basis = Matrix(matrix.tolist())
            bone.matrix_basis = basis
            if np.max(np.abs(np.array(bone.matrix_basis) - matrix)) > 2e-6:
                raise ValueError('A source node matrix has shear; use source TRS nodes')
            return
        t = overrides.get('translation', node.translation or [0, 0, 0])
        q = overrides.get('rotation', node.rotation or [0, 0, 0, 1])
        s = overrides.get('scale', node.scale or [1, 1, 1])
        bone.location = (t[0], -t[2], t[1])
        quat = Quaternion((q[3], q[0], -q[2], q[1])).normalized()
        bone.rotation_quaternion = quat
        bone.scale = (s[0], s[2], s[1])

    for index, name in drivers.items():
        set_trs(rig.pose.bones[name], nodes[index])
    for obj, skin_index in mesh_nodes:
        obj.parent = None
        obj.matrix_world = Matrix.Identity(4)
        for modifier in list(obj.modifiers):
            if modifier.type == 'ARMATURE':
                obj.modifiers.remove(modifier)
        skin = gltf.data.skins[skin_index]
        for joint in skin.joints:
            group = obj.vertex_groups.get(group_names[skin_index, joint])
            if group:
                group.name = deform[skin_index, joint]
        modifier = obj.modifiers.new('NMTM exact linear skin', 'ARMATURE')
        modifier.object = rig
        modifier.use_deform_preserve_volume = False
    for obj in old_armatures:
        bpy.data.objects.remove(obj, do_unlink=True)

    def sampler_value(sampler, time, path):
        times = BinaryData.decode_accessor(gltf, sampler.input).reshape(-1)
        values = BinaryData.decode_accessor(gltf, sampler.output).astype(float)
        i = min(max(int(np.searchsorted(times, time, side='right')) - 1, 0), len(times)-1)
        j = min(i+1, len(times)-1)
        duration = float(times[j]-times[i])
        f = min(max((time-times[i])/duration, 0), 1) if duration else 0
        mode = sampler.interpolation or 'LINEAR'
        if mode == 'CUBICSPLINE':
            a, b = values[i*3+1], values[j*3+1]
            value = (2*f**3-3*f*f+1)*a + (f**3-2*f*f+f)*duration*values[i*3+2] + (-2*f**3+3*f*f)*b + (f**3-f*f)*duration*values[j*3]
        elif mode == 'STEP' or i == j:
            value = values[i]
        elif path == 'rotation':
            a, b = values[i], values[j]
            dot = float(np.dot(a, b))
            if dot < 0:
                b, dot = -b, -dot
            dot = min(max(dot, -1), 1)
            angle = math.acos(dot)
            value = ((1-f)*a+f*b) if dot > .9995 else (math.sin((1-f)*angle)*a+math.sin(f*angle)*b)/math.sin(angle)
        else:
            value = (1-f)*values[i]+f*values[j]
        return value / np.linalg.norm(value) if path == 'rotation' else value

    fps = bpy.context.scene.render.fps / bpy.context.scene.render.fps_base
    for ordinal, animation in enumerate(gltf.data.animations or []):
        channels = [channel for channel in animation.channels if channel.target.node in drivers and channel.target.path in {'translation', 'rotation', 'scale'}]
        if not channels:
            continue
        name = animation.name or ('Animation_' + str(ordinal))
        action = bpy.data.actions.new(name + '_NMTM_ExactSkin')
        action.use_fake_user = True
        rig.animation_data_create().action = action
        for channel in channels:
            index, path = channel.target.node, channel.target.path
            sampler = animation.samplers[channel.sampler]
            source_times = BinaryData.decode_accessor(gltf, sampler.input).reshape(-1).astype(float)
            start, end = source_times[0]*fps, source_times[-1]*fps
            frames = set(float(t*fps) for t in source_times)
            sample_step = float(rig.get('nmtm_animation_sample_step', 0.0625))
            frames.update(float(frame)*sample_step for frame in range(math.ceil(start/sample_step), math.floor(end/sample_step)+1))
            bone = rig.pose.bones[drivers[index]]
            property_name = {'translation': 'location', 'rotation': 'rotation_quaternion', 'scale': 'scale'}[path]
            for frame in sorted(frames):
                value = sampler_value(sampler, frame/fps, path)
                set_trs(bone, nodes[index], {path: value})
                bone.keyframe_insert(property_name, frame=frame, group=bone.name)
            data_path = bone.path_from_id(property_name)
            for curve in action.fcurves:
                if curve.data_path == data_path:
                    for key in curve.keyframe_points:
                        key.interpolation = 'CONSTANT' if sampler.interpolation == 'STEP' else 'LINEAR'
        track = rig.animation_data.nla_tracks.new()
        track.name = name
        track.strips.new(name, math.floor(action.frame_range[0]), action)
    if rig.animation_data:
        rig.animation_data.action = None
        rig.animation_data.use_nla = False
    for index, name in drivers.items():
        set_trs(rig.pose.bones[name], nodes[index])
    bpy.context.view_layer.update()


def model_objects():
    """Exclude glTF's display-only bone shapes, including linked helpers."""
    scene_objects = list(bpy.context.scene.objects)
    shapes = {bone.custom_shape for obj in scene_objects if obj.type == 'ARMATURE'
              for bone in obj.pose.bones if bone.custom_shape}
    return [obj for obj in scene_objects
            if obj.type in {'MESH', 'ARMATURE', 'EMPTY'} and obj not in shapes
            and not (obj.users_collection and all(
                collection.name.startswith('glTF_not_exported')
                for collection in obj.users_collection))]


def animation_owners(objects):
    owners = list(objects)
    for obj in objects:
        keys = getattr(obj.data, 'shape_keys', None) if obj.data else None
        if keys and keys not in owners:
            owners.append(keys)
    return owners


def animation_clips(objects):
    """A glTF clip can have separate actions on several objects/shape keys."""
    clips = {}
    for owner in animation_owners(objects):
        data = owner.animation_data
        if not data:
            continue
        stashed = set()
        # glTF inserts tracks in reverse animation order.
        for track in reversed(list(data.nla_tracks)):
            for strip in track.strips:
                if strip.action:
                    clips.setdefault(track.name, []).append((owner, strip.action))
                    stashed.add(strip.action)
        if data.action and data.action not in stashed:
            clips.setdefault(data.action.name, []).append((owner, data.action))
    return clips


def capture_defaults(objects):
    """Do not replace pose scales with identity: glTF may have scaled joints."""
    result = []
    for obj in objects:
        result.append((obj, obj.matrix_basis.copy()))
        if obj.type == 'ARMATURE':
            result.extend((bone, bone.matrix_basis.copy()) for bone in obj.pose.bones)
    return result


def pack_images():
    """Distinct useful filenames avoid FBX deduplicating empty image paths."""
    used = set()
    for image in bpy.data.images:
        if image.type in {'RENDER_RESULT', 'COMPOSITING'}:
            continue
        if min(image.size) <= 0:
            raise RuntimeError('Texture has no readable pixels: ' + image.name)
        if not image.packed_file:
            image.pack()
        if not image.packed_file:
            raise RuntimeError('Could not pack texture: ' + image.name)
        payload = image.packed_file.data
        extension = '.jpg' if payload[:3] == b'\xff\xd8\xff' else '.png'
        if payload[:4] == b'RIFF':
            extension = '.webp'
        stem = Path(image.name).stem
        stem = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '_', stem).strip(' .') or 'texture'
        name = stem + extension
        counter = 2
        while name.casefold() in used:
            name = stem + '_' + str(counter) + extension
            counter += 1
        used.add(name.casefold())
        image.filepath_raw = '//' + name


def export_fbx(target, objects, clips, defaults):
    """Bake each complete source clip once, not every action onto every rig.

    Blender's built-in NLA mode bakes one strip at a time, losing synchronized
    objects. Its all-actions mode can retarget compatible actions to other rigs.
    Replace only that collection stage while retaining Blender's FBX writer and
    sample/bake implementation. The original function is restored even on error.
    """
    from io_scene_fbx import export_fbx_bin
    from io_scene_fbx.fbx_utils import ObjectWrapper

    original = export_fbx_bin.fbx_animations
    original_object_tx = ObjectWrapper.fbx_object_tx

    def exact_local_tx(wrapper, scene_data, rest=False, rot_euler_compat=None):
        base = original_object_tx(wrapper, scene_data, rest, rot_euler_compat)
        # A quaternion->matrix->decompose->Euler float32 round-trip loses
        # precision close to gimbal lock. Use known local channels directly.
        if (wrapper.is_bone and wrapper.armature.bdata.get('nmtm_skin_method')
                and not rest and not scene_data.settings.bone_correction_matrix):
            bone = wrapper.bdata_pose_bone
            if bone.rotation_mode == 'QUATERNION':
                w, x, y, z = np.asarray(bone.rotation_quaternion, dtype=np.float64)
                norm = math.sqrt(w*w+x*x+y*y+z*z)
                w, x, y, z = w/norm, x/norm, y/norm, z/norm
                angles = (math.atan2(2*(w*x+y*z), 1-2*(x*x+y*y)),
                          math.asin(min(max(2*(w*y-z*x), -1), 1)),
                          math.atan2(2*(w*z+x*y), 1-2*(y*y+z*z)))
                rotation = Euler(angles, 'XYZ')
                if rot_euler_compat is not None:
                    rotation.make_compatible(rot_euler_compat)
            else:
                rotation = bone.rotation_euler.copy()
            # Preserve all axis/unit/negative-scale corrections from the writer.
            # Replace only when the two decompositions describe the same rotation.
            if abs(base[1].to_quaternion().dot(rotation.to_quaternion())) > .999999:
                return base[0], rotation, base[2], base[3], base[4]
        return base
    owners = animation_owners(objects)
    states = [(owner, owner.animation_data.action, owner.animation_data.use_nla)
              for owner in owners if owner.animation_data]
    key_defaults = [(key, key.value) for owner in owners
                    if isinstance(owner, bpy.types.Key) for key in owner.key_blocks]

    def grouped_animations(scene_data):
        animations, animated = [], set()
        frame_start, frame_end = float('inf'), -float('inf')
        scene = scene_data.scene
        saved_frame, saved_subframe = scene.frame_current, scene.frame_subframe
        try:
            for name, bindings in clips.items():
                for owner, _action, _use_nla in states:
                    owner.animation_data.action = None
                    owner.animation_data.use_nla = False
                for target_object, matrix in defaults:
                    target_object.matrix_basis = matrix.copy()
                for key, value in key_defaults:
                    key.value = value
                for owner, action in bindings:
                    owner.animation_data_create().action = action
                start = min(float(action.frame_range[0]) for _, action in bindings)
                end = max(float(action.frame_range[1]) for _, action in bindings)
                scene.frame_set(math.floor(start), subframe=start - math.floor(start))
                bpy.context.view_layer.update()
                # A real RNA action is a supported FBX identity, but the stack
                # name is the source glTF clip, not an object-specific action.
                animation = export_fbx_bin.fbx_animations_do(
                    scene_data, bindings[0][1], start, end, True, force_keep=True)
                if animation:
                    stack_key, stack, layer_key, _, first, last = animation
                    animations.append((stack_key, stack, layer_key, name.encode('utf-8'), first, last))
                    frame_start, frame_end = min(frame_start, first), max(frame_end, last)
                    for element_key, (_, curves) in stack.items():
                        animated.update((element_key, prop) for prop in curves)
        finally:
            for owner, action, use_nla in states:
                owner.animation_data.action = action
                owner.animation_data.use_nla = use_nla
            for target_object, matrix in defaults:
                target_object.matrix_basis = matrix.copy()
            for key, value in key_defaults:
                key.value = value
            scene.frame_set(saved_frame, subframe=saved_subframe)
        return animations, animated, frame_start, frame_end

    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.hide_set(False)
        obj.hide_select = False
        obj.select_set(True)
    bpy.context.view_layer.objects.active = next((o for o in objects if o.type == 'ARMATURE'), objects[0])
    export_fbx_bin.fbx_animations = grouped_animations
    ObjectWrapper.fbx_object_tx = exact_local_tx
    try:
        bpy.ops.export_scene.fbx(
            filepath=str(target), use_selection=True,
            object_types={'ARMATURE', 'MESH', 'EMPTY'}, use_mesh_modifiers=True,
            add_leaf_bones=False, use_armature_deform_only=False,
            bake_anim=bool(clips), bake_anim_use_all_actions=False,
            bake_anim_use_nla_strips=False, bake_anim_use_all_bones=True,
            bake_anim_step=0.0625, bake_anim_simplify_factor=0.0,
            path_mode='COPY', embed_textures=True, axis_forward='-Z', axis_up='Y')
    finally:
        export_fbx_bin.fbx_animations = original
        ObjectWrapper.fbx_object_tx = original_object_tx


def convert(source, target, kind):
    if kind not in {'blend', 'fbx'}:
        raise ValueError('Unsupported NMTM conversion: ' + str(kind))
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.preferences.filepaths.use_scripts_auto_execute = False
    # Keep actual editable bones; suppress the extra Icosphere display mesh.
    exact_skin_import(source)
    objects = model_objects()
    if not any(obj.type == 'MESH' for obj in objects):
        raise RuntimeError('The GLB contains no model mesh objects.')
    defaults = capture_defaults(objects)
    clips = animation_clips(objects)
    for bindings in clips.values():
        for _owner, action in bindings:
            action.use_fake_user = True
    pack_images()
    scene = bpy.context.scene
    if clips:
        actions = {action for bindings in clips.values() for _, action in bindings}
        scene.frame_start = math.floor(min(action.frame_range[0] for action in actions))
        scene.frame_end = math.ceil(max(action.frame_range[1] for action in actions))
    scene.frame_set(scene.frame_start)
    if kind == 'blend':
        bpy.ops.wm.save_as_mainfile(filepath=str(target), check_existing=False)
    else:
        export_fbx(Path(target), objects, clips, defaults)
    print('NMTM_CONVERT_OK', kind, str(target), 'meshes',
          sum(obj.type == 'MESH' for obj in objects), 'clips', len(clips), flush=True)


if __name__ == '__main__':
    import sys
    arguments = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    if len(arguments) == 3:
        convert(*arguments)
