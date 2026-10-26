import os
import json
# Legacy static converter: run from repository root, inputs json/, outputs output/.
import glob
import shutil


def batch_convert():
    json_dir = "json"
    output_dir = "output"  # 转换后的文件会统一放在这里，避免污染你的json文件夹

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # 扫描 json 文件夹下的所有 json 文件
    json_files = glob.glob(os.path.join(json_dir, "*.json"))

    if not json_files:
        print(f"❌ 在 '{json_dir}' 文件夹中没有找到任何 JSON 文件！请检查路径。")
        return

    print(f"🚀 开始批量转换，目标文件夹: {output_dir}\n" + "-" * 50)

    for json_path in json_files:
        filename = os.path.basename(json_path)

        # 自动过滤骨骼文件
        if "_skeleton" in filename:
            print(f"⏭️  [跳过骨骼] {filename}")
            continue

        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # 验证是否为有效的 mesh 数据
            if 'mesh' not in data or not data['mesh']:
                print(f"⚠️  [无法解析] {filename} 不包含有效的 mesh 数据，已跳过。")
                continue

            mesh = data['mesh'][0]
            material_path = mesh.get('material', 'default_material')
            # 提取材质名称 (例如从 "2026s8/ss_s8lehun_skin_guajian" 提取出 "ss_s8lehun_skin_guajian")
            material_name = os.path.basename(material_path)

            vertices = mesh.get('vertices', [])
            indices = mesh.get('indices', [])

            base_name = os.path.splitext(filename)[0]
            obj_path = os.path.join(output_dir, f"{base_name}.obj")
            mtl_path = os.path.join(output_dir, f"{base_name}.mtl")

            # --- 智能寻找并复制贴图 ---
            texture_file = None
            # 尝试匹配材质名或者json文件名
            possible_names = [material_name, base_name]
            extensions = ['.png', '.jpg', '.jpeg', '.PNG', '.JPG']

            for name in possible_names:
                for ext in extensions:
                    test_img_path = os.path.join(json_dir, f"{name}{ext}")
                    if os.path.exists(test_img_path):
                        texture_file = f"{name}{ext}"
                        # 自动把贴图复制到输出的 output 文件夹，方便 3D 软件直接读取
                        shutil.copy(test_img_path, os.path.join(output_dir, texture_file))
                        break
                if texture_file:
                    break

            if not texture_file:
                texture_file = f"{material_name}.png"
                print(f"  ❓ [未找到贴图] 未在 json/ 中找到 {material_name} 的图片，已默认虚拟绑定: {texture_file}")

            # --- 1. 自动生成 .mtl 材质文件 ---
            with open(mtl_path, 'w', encoding='utf-8') as mtl_f:
                mtl_f.write(f"newmtl {material_name}\n")
                mtl_f.write("Ka 1.000000 1.000000 1.000000\n")
                mtl_f.write("Kd 1.000000 1.000000 1.000000\n")
                mtl_f.write("Ks 0.000000 0.000000 0.000000\n")
                mtl_f.write(f"map_Kd {texture_file}\n")  # 链接贴图

            # --- 2. 自动生成 .obj 模型文件 ---
            with open(obj_path, 'w', encoding='utf-8') as obj_f:
                obj_f.write(f"mtllib {base_name}.mtl\n\n")
                obj_f.write(f"g {base_name}\n")
                obj_f.write(f"usemtl {material_name}\n")

                # 写入顶点位置 (v)
                for v in vertices:
                    pos = v['pos']
                    obj_f.write(f"v {pos[0]} {pos[1]} {pos[2]}\n")

                # 写入纹理坐标 (vt) - 并进行 Minecraft 顶底颠倒修正 (1.0 - v)
                for v in vertices:
                    uv = v['uvcoord']
                    v_fixed = 1.0 - uv[1]
                    obj_f.write(f"vt {uv[0]} {v_fixed}\n")

                # 写入法线 (vn)
                for v in vertices:
                    normal = v['normal']
                    obj_f.write(f"vn {normal[0]} {normal[1]} {normal[2]}\n")

                # 写入面索引 (f)
                obj_f.write("\n")
                for face in indices:
                    # OBJ 的索引从 1 开始计算，所以全部 +1
                    idx1 = face[0] + 1
                    idx2 = face[1] + 1
                    idx3 = face[2] + 1
                    obj_f.write(f"f {idx1}/{idx1}/{idx1} {idx2}/{idx2}/{idx2} {idx3}/{idx3}/{idx3}\n")

            print(f"  ✅ [转换成功] {base_name}.obj")

        except Exception as e:
            print(f"  ❌ [转换失败] {filename} 出错: {e}")

    print("-" * 50 + f"\n🎉 所有任务处理完毕！请前往 '{output_dir}' 文件夹查看转换完成的模型。")


if __name__ == "__main__":
    batch_convert()
