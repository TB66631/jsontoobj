"""
Blender 4.2 - 2D 骨骼动画导入器（Mesh 自动匹配版）
==================================================

功能:
  1. 读取 _skeleton.json 文件创建骨架
  2. 自动检测场景中 _mesh 命名的物体
  3. 骨骼位置自动对齐到对应 Mesh 物体

文件名匹配规则:
  ss_s8FoxMask_skin_body_skeleton.json  →  ss_s8FoxMask_skin_body_mesh
  ss_s8FoxMask_skin_head_skeleton.json  →  ss_s8FoxMask_skin_head_mesh
  ss_s8FoxMask_skin_leftarm_skeleton.json → ss_s8FoxMask_skin_leftarm_mesh
  ...等

用法:
  1. 先把图片/模型导入 Blender (Mesh 物体)
  2. 运行本脚本, 自动创建骨架并吸附到 Mesh
"""

import bpy
# Legacy scene-matching script. Edit JSON_FOLDER before manual use.
import json
import os
import re
from mathutils import Quaternion, Vector, Matrix

# ============================================================
# 配置区
# ============================================================
JSON_FOLDER = r"E:\Administrator\文档\Python\dailijiasuq\jsontoobj\output\11"
BONE_LENGTH = 1.2

# ============================================================
# 矩阵转换
# ============================================================

MAT_AXIS = Matrix((
    (0, -1, 0, 0),
    (1,  0, 0, 0),
    (0,  0, 1, 0),
    (0,  0, 0, 1),
))

MAT_COORD = Matrix((
    (1,  0,  0, 0),
    (0,  0, -1, 0),
    (0,  1,  0, 0),
    (0,  0,  0, 1),
))


def game_to_blender_matrix(game_pos, game_quat, game_scale=None):
    if game_scale is None:
        game_scale = (1.0, 1.0, 1.0)
    M_local = Matrix.LocRotScale(
        Vector(game_pos), Quaternion(game_quat), Vector(game_scale),
    )
    return MAT_COORD @ M_local @ MAT_AXIS


# ============================================================
# 场景 Mesh 物体检测 (新!)
# ============================================================

PART_KEYWORDS = {
    "body":       ["body", "body_s"],
    "bodydown":   ["bodydown", "body_down"],
    "head":       ["head"],
    "leftarm":    ["leftarm", "left_arm"],
    "leftarmdown": ["leftarmdown", "left_armdown", "left_arm_down"],
    "rightarm":   ["rightarm", "right_arm"],
    "rightarmdown": ["rightarmdown", "right_armdown", "right_arm_down"],
    "leftleg":    ["leftleg", "left_leg"],
    "leftlegdown": ["leftlegdown", "left_legdown", "left_leg_down"],
    "rightleg":   ["rightleg", "right_leg"],
    "rightlegdown": ["rightlegdown", "right_legdown", "right_leg_down"],
}

# 反向: mesh 物体名 → body part key
# 从场景中找一个叫 ss_s8FoxMask_skin_body_mesh 的物体
# 提取 "body" 作为 part key


def extract_part_from_filename(filename):
    """从文件名提取部位名"""
    name = filename.replace("ss_s8FoxMask_skin_", "").replace("_skeleton", "").replace("_mesh", "").replace(".json", "")
    return name


def find_mesh_objects():
    """
    扫描场景中的所有 Mesh 物体, 尝试匹配骨骼部位名。
    先严格匹配 ss_s8FoxMask_skin_XX_mesh,
    没找到再模糊匹配 (只要名字中含部位关键词就算)。
    """
    all_meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    if not all_meshes:
        print("  场景中没有 Mesh 物体")
        return {}

    print(f"  场景中共 {len(all_meshes)} 个 Mesh 物体:")
    for obj in all_meshes:
        print(f"    - {obj.name}")

    # 先从文件名反推部位列表
    skeleton_files = sorted(f for f in os.listdir(JSON_FOLDER) if f.endswith("_skeleton.json"))
    known_parts = set()
    for f in skeleton_files:
        part = extract_part_from_filename(f)
        known_parts.add(part)

    # 尝试匹配
    meshes = {}

    # 策略1: 精确匹配 ss_s8FoxMask_skin_XX_mesh
    strict_pattern = re.compile(r"ss_s8FoxMask_skin_(.+)_mesh")
    for obj in all_meshes:
        m = strict_pattern.match(obj.name)
        if m:
            part = m.group(1)
            if part in known_parts:
                meshes[part] = obj
                print(f"  ✓ 精确匹配: {obj.name} → {part}")

    # 策略2: 部位关键词模糊匹配 (补漏)
    for part in known_parts:
        if part in meshes:
            continue  # 已匹配
        for obj in all_meshes:
            if obj.name.startswith("ss_") or obj.name.startswith("s8F"):
                continue  # 已经是 ss_ 前缀的物体, 让精确匹配处理
            lower_name = obj.name.lower().replace("_", "").replace("-", "")
            lower_part = part.lower().replace("_", "").replace("-", "")
            if lower_part in lower_name:
                meshes[part] = obj
                print(f"  ~ 模糊匹配: {obj.name} → {part}")
                break

    # 策略3: 打印未匹配的 part
    unmatched = known_parts - set(meshes.keys())
    if unmatched:
        print(f"  ! 以下部位未找到对应 Mesh: {', '.join(sorted(unmatched))}")

    return meshes


def auto_scale_armature(arm_obj, bones, order, mesh_map):
    """整体缩放骨架以匹配 Mesh 集合大小"""
    if not mesh_map:
        return False

    # Mesh 集合包围盒
    all_min = Vector((float('inf'),) * 3)
    all_max = Vector((-float('inf'),) * 3)
    for obj in mesh_map.values():
        for v in obj.bound_box:
            vw = obj.matrix_world @ Vector(v)
            all_min.x = min(all_min.x, vw.x)
            all_min.y = min(all_min.y, vw.y)
            all_min.z = min(all_min.z, vw.z)
            all_max.x = max(all_max.x, vw.x)
            all_max.y = max(all_max.y, vw.y)
            all_max.z = max(all_max.z, vw.z)

    mesh_w = (all_max - all_min).length
    if mesh_w < 0.01:
        return False

    # 骨架包围盒
    j_min = Vector((float('inf'),) * 3)
    j_max = Vector((-float('inf'),) * 3)
    for n in order:
        p = bones[n]["matrix"].translation
        j_min.x = min(j_min.x, p.x); j_min.y = min(j_min.y, p.y); j_min.z = min(j_min.z, p.z)
        j_max.x = max(j_max.x, p.x); j_max.y = max(j_max.y, p.y); j_max.z = max(j_max.z, p.z)

    j_w = (j_max - j_min).length
    if j_w < 0.01:
        return False

    s = (mesh_w / j_w) * 0.85
    s = max(min(s, 20), 0.05)

    j_center = (j_max + j_min) / 2
    m_center = (all_max + all_min) / 2
    off = m_center - j_center

    bpy.ops.object.mode_set(mode='EDIT')
    for name in order:
        eb = arm_obj.data.edit_bones.get(name)
        if not eb:
            continue
        eb.head = j_center + (eb.head - j_center) * s + off
        eb.tail = j_center + (eb.tail - j_center) * s + off
    bpy.ops.object.mode_set(mode='OBJECT')

    print(f"  自动缩放: {j_w:.1f} → {mesh_w:.1f} (x{s:.2f})")
    return True


def snap_bones_to_meshes(arm_obj, bones, order, mesh_map):
    """
    直接吸附骨骼到 Mesh 位置。

    每个部位的所有骨骼整体偏移, 使其中心点 = 对应 Mesh 的中心点。
    骨骼方向不变, 长度按 Mesh 大小重新计算。
    """
    bpy.ops.object.mode_set(mode='EDIT')
    arm_data = arm_obj.data
    snapped = 0

    print(f"\n  --- 对齐详情 ---")
    for part in sorted(mesh_map.keys()):
        mesh_obj = mesh_map[part]

        # 属于这个部位的所有骨骼
        part_bones = [n for n in order
                      if any(part in f for f in bones[n]["files"])]
        if not part_bones:
            continue

        # --- Mesh 中心 (世界坐标) ---
        bb = [mesh_obj.matrix_world @ Vector(v) for v in mesh_obj.bound_box]
        xs = [v.x for v in bb]; ys = [v.y for v in bb]; zs = [v.z for v in bb]
        mc = Vector(((min(xs)+max(xs))/2, (min(ys)+max(ys))/2, (min(zs)+max(zs))/2))
        md = Vector((max(xs)-min(xs), max(ys)-min(ys), max(zs)-min(zs))).length

        # --- 骨骼中心 (JSON 世界坐标) ---
        sc = Vector((0,0,0))
        for n in part_bones:
            sc += bones[n]["matrix"].translation
        sc /= len(part_bones)

        print(f"    {part:15s}  Mesh=({mc.x:.1f},{mc.y:.1f},{mc.z:.1f})  "
              f"Skel=({sc.x:.1f},{sc.y:.1f},{sc.z:.1f})  "
              f"偏移=({(mc-sc).x:.1f},{(mc-sc).y:.1f},{(mc-sc).z:.1f})")

        offset = mc - sc

        # 原始长度
        raw_lens = {}
        for n in part_bones:
            eb = arm_data.edit_bones.get(n)
            if eb:
                raw_lens[n] = (eb.tail - eb.head).length
        avg_raw = sum(raw_lens.values())/len(raw_lens) if raw_lens else 1

        target_len = max(md * 0.35, 0.3)

        for n in part_bones:
            eb = arm_data.edit_bones.get(n)
            if not eb:
                continue
            dir_vec = (eb.tail - eb.head).normalized()
            if dir_vec.length < 0.001:
                dir_vec = Vector((0,0,1))

            eb.head += offset
            eb.tail += offset

            ratio = raw_lens.get(n, 1) / avg_raw if avg_raw > 0.01 else 1
            new_len = target_len * max(ratio, 0.3)
            eb.tail = eb.head + dir_vec * new_len

        snapped += 1

    bpy.ops.object.mode_set(mode='OBJECT')

    # 更新报告数据
    bpy.ops.object.mode_set(mode='EDIT')
    for n in order:
        eb = arm_data.edit_bones.get(n)
        if eb:
            bones[n]["adjusted_head"] = eb.head.copy()
    bpy.ops.object.mode_set(mode='OBJECT')

    return snapped


# ============================================================
# 文件读取
# ============================================================

def read_all_skeletons(folder):
    """读取所有 _skeleton.json, 合并骨骼"""
    raw = {}
    order = []

    if not os.path.isdir(folder):
        print(f"[错误] 找不到文件夹: {folder}")
        return {}, []

    files = [f for f in sorted(os.listdir(folder))
             if f.endswith("_skeleton.json")]
    print(f"\n  找到 {len(files)} 个骨骼文件")

    for fpath in files:
        full = os.path.join(folder, fpath)
        with open(full, "r", encoding="utf-8") as f:
            data = json.load(f)
        for bd in data.get("skeleton", []):
            n = bd["name"]
            p = bd.get("parent", "root")
            if p == n:
                p = None

            if n == "root":
                if n not in raw:
                    raw[n] = (p, bd, [fpath])
                    order.append(n)
                else:
                    raw[n][2].append(fpath)
                continue
            if n in raw:
                raw[n][2].append(fpath)
                continue

            raw[n] = (p, bd, [fpath])
            order.append(n)

    print(f"  共 {len(raw)} 根骨骼")

    # 递归计算世界矩阵
    world_mats = {}

    def get_world(name, depth=0):
        if name in world_mats:
            return world_mats[name]
        if depth > 200:
            return Matrix.Identity(4)

        parent, bd, _ = raw[name]
        M_local_bl = game_to_blender_matrix(
            bd["initpos"], bd["initquaternion"], bd.get("initscale"),
        )
        if parent and parent in raw:
            M_world = get_world(parent, depth + 1) @ M_local_bl
        else:
            M_world = M_local_bl

        world_mats[name] = M_world
        return M_world

    for name in order:
        get_world(name)

    bones = {}
    for name in order:
        parent, bd, files = raw[name]
        bones[name] = {
            "parent": parent,
            "matrix": world_mats[name].copy(),
            "files": files,
        }

    return bones, order


# ============================================================
# 创建骨架
# ============================================================

def build_armature(bones, order):
    """在 Blender 中创建骨架"""
    for obj in list(bpy.data.objects):
        if obj.type == 'ARMATURE' and "s8FoxMask" in obj.name:
            bpy.data.objects.remove(obj, do_unlink=True)

    arm_data = bpy.data.armatures.new("s8FoxMask")
    arm_obj = bpy.data.objects.new("s8FoxMask", arm_data)
    bpy.context.collection.objects.link(arm_obj)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='EDIT')

    ebs = {}

    for name in order:
        info = bones[name]
        mat = info["matrix"]

        ebone = arm_data.edit_bones.new(name)
        ebone.matrix = mat

        y_axis = mat.col[1].xyz.normalized()
        head = mat.translation

        children = [n for n in bones if bones[n]["parent"] == name]
        if children:
            child_dists = [
                (bones[c]["matrix"].translation - head).length
                for c in children
            ]
            length = max(min(child_dists) * 0.85, 0.3)
        else:
            length = BONE_LENGTH

        ebone.tail = head + y_axis * length
        ebone.roll = 0.0
        ebs[name] = ebone

    for name, ebone in ebs.items():
        parent_name = bones[name]["parent"]
        if parent_name and parent_name in ebs:
            ebone.parent = ebs[parent_name]

    bpy.ops.object.mode_set(mode='OBJECT')
    arm_obj.select_set(True)
    arm_obj.data.display_type = 'STICK'
    arm_obj.show_in_front = True

    return arm_obj, ebs


# ============================================================
# 视口配置
# ============================================================

def setup_viewport(arm_obj):
    """切换到正面视图并聚焦"""
    bpy.context.view_layer.objects.active = arm_obj

    for window in bpy.context.window_manager.windows:
        screen = window.screen
        for area in screen.areas:
            if area.type == 'VIEW_3D':
                area.spaces[0].region_3d.view_perspective = 'ORTHO'
                for region in area.regions:
                    if region.type == 'WINDOW':
                        with bpy.context.temp_override(
                            window=window, screen=screen,
                            area=area, region=region,
                        ):
                            bpy.ops.view3d.view_axis(type='FRONT')
                            bpy.ops.view3d.view_selected()
                        break
                break
        break


# ============================================================
# 打印报告
# ============================================================

def print_report(bones, order, mesh_map):
    """打印导入报告"""
    print("\n" + "=" * 55)
    print("  导入报告")
    print("=" * 55)

    # 统计来源
    all_files = set()
    for info in bones.values():
        all_files.update(info["files"])

    print(f"  骨骼总数:        {len(bones)}")
    print(f"  来源 JSON 文件:  {len(all_files)}")
    for f in sorted(all_files):
        part = extract_part_from_filename(f)
        matched = " ✓" if part in mesh_map else ""
        print(f"    • {f}{matched}")

    print(f"\n  匹配到场景 Mesh: {len(mesh_map)} 个")
    for part, obj in sorted(mesh_map.items()):
        print(f"    • {obj.name}  ← part={part}")

    # 层级深度
    depth = {}
    def calc_d(name):
        if name in depth:
            return depth[name]
        p = bones[name]["parent"]
        depth[name] = 0 if not p or p not in bones else calc_d(p) + 1
        return depth[name]
    for n in order:
        calc_d(n)
    print(f"  层级深度:        {max(depth.values()) if depth else 0}")

    # 骨骼列表
    print(f"\n  骨骼清单:")
    for i, name in enumerate(order):
        d = depth.get(name, 0)
        indent = "  " * d
        mat = bones[name]["matrix"]
        # 如果已经对齐到 Mesh, 用调整后的位置
        if "adjusted_head" in bones[name]:
            pos = bones[name]["adjusted_head"]
        else:
            pos = mat.translation
        pname = bones[name]["parent"] or "—"
        icon = ["●", "○", "◉", "◎", "◌"][min(d, 4)]
        print(f"    {i+1:3d}. {indent}{icon} {name:20s}  "
              f"({pos.x:6.2f}, {pos.y:6.2f}, {pos.z:6.2f})  父={pname}")


# ============================================================
# 主入口
# ============================================================

def import_skeleton():
    print("=" * 55)
    print("  s8FoxMask - Blender 4.2 骨骼导入器 (Mesh 对齐版)")
    print("=" * 55)

    # 1. 检测场景中的 Mesh 物体
    print("\n[1/4] 扫描场景 Mesh 物体...")
    mesh_map = find_mesh_objects()
    if mesh_map:
        print(f"  找到 {len(mesh_map)} 个匹配的 Mesh:")
        for part, obj in sorted(mesh_map.items()):
            print(f"    {part:15s} → {obj.name}")
    else:
        print("  未找到匹配的 Mesh (将按 JSON 原始位置创建)")

    # 2. 读取 JSON
    print(f"\n[2/4] 读取骨骼 JSON: {JSON_FOLDER}")
    bones, order = read_all_skeletons(JSON_FOLDER)
    if not bones:
        print("[错误] 没有找到骨骼数据")
        return

    # 3. 创建骨架
    print(f"\n[3/4] 创建骨架...")
    arm_obj, ebs = build_armature(bones, order)

    # 4. 对齐到 Mesh
    if mesh_map:
        print(f"\n[4/4] 对齐骨骼到 Mesh 物体...")
        auto_scale_armature(arm_obj, bones, order, mesh_map)
        snapped = snap_bones_to_meshes(arm_obj, bones, order, mesh_map)
        print(f"  → {snapped} 个部位已吸附到 Mesh")
    else:
        print(f"\n[4/4] 跳过对齐 (无 Mesh 可匹配)")

    # 视口
    setup_viewport(arm_obj)

    # 报告
    print_report(bones, order, mesh_map)

    print(f"\n  ✅ 导入成功! 共 {len(bones)} 根骨骼")
    print("     • 骨骼已匹配到场景中的 Mesh 物体位置")
    print("     • 切换到 Pose Mode 可测试骨骼旋转")
    print("     • 按 Numpad 1 看正面")


if __name__ == "__main__":
    import_skeleton()
