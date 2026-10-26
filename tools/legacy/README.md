# 历史工具

这些脚本保留用于参考，不属于当前 NMTM 精确骨架/蒙皮导出路径，也不会在测试或安装时自动执行。

- `json_to_obj.py`：原根目录 `4.py`。从仓库根目录运行，读取本地 `json/`，输出静态 OBJ/MTL 与贴图到 `output/`。仅处理 `mesh[0]`，跳过 skeleton；OBJ 本身不保存骨骼与动画。
- `import_skeleton.py`：原 `Blender Python/import_skeleton.py`。早期根据 `_mesh` 物体名称匹配的 Blender 脚本；带有旧的本机 `JSON_FOLDER`，需要人工修改配置后才能在自己的场景运行。不要将它与当前 GLB 精确绑定桥混用。

当前插件源码入口为根目录 `nmtm.js`，Blender 转换桥为 `nmtm_blender_bridge.py`。旧脚本移动后，本地 `json/` 中的用户资源保持原位且不随 Git 发布。
