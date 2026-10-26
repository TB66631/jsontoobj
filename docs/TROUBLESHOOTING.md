# 故障排查

先记录 Blockbench / Blender 版本、输入文件类型、模型名、复现步骤和完整错误文字。不要只凭编辑器缩略图判断贴图或蒙皮是否正确。

## 模型无法导入

- 检查模型 JSON 与 skeleton、animation、material/texture 引用是否来自同一资源根目录。
- 带 JSON companion 的 BIN 才能导入；BIN 中未知的数据不会按猜测解释。
- 先用一个模型、一张贴图缩小问题，再逐个加入其余变体。变体 JSON 的路径通常相对于资源包根目录。
- 缺骨架、无效索引、非法或全零权重应在导入前报错；不要通过忽略验证强行继续。
- 检查开发者控制台中首个 NMTM 错误及其输入文件名。不要将私有游戏原始文件直接附到公开 issue。

## 贴图破损、错位或缺面

- 确认对应 PNG/JPG 确实存在且引用路径、大小写、命名空间正确。
- 确认 Blockbench 项目中面纹理 UUID 仍指向当前项目的贴图；跨项目复制纹理缓存会导致陈旧 UUID。
- 对照贴图原始像素、texture canvas 尺寸、面 UV 上下界和纹理旋转；有效 PNG 不代表 UV 范围正确。
- 保留最小可重现 JSON、贴图尺寸和错误日志。贴图图像可能是私有资源，公开前先换成自行制作的最小 fixture。

## 骨骼倾斜或蒙皮异常

- 骨显示轴不等于顶点绑定。检查 Armature/Group origin、父变换、rest rotation/scale、每顶点权重和归一化结果。
- 负数与非均匀 rest scale、混合权重和源 inverse bind matrix 共同决定最终蒙皮。
- FBX / Blend 中的 _NMTM_bind_* 和 _NMTM_deform_* 是精确保留 inverse bind matrix 的固定 helper 链。权重由 deform 骨承载，动画驱动原名源控制骨；不要为了让 Outliner 更短而删除辅助骨。
- 先检查 GLB 默认姿势，再检查动画首帧、中间和末帧。导出器采样间隔为 1/16 帧，不是连续时间解析表示。
- 骨骼变形验证以受影响顶点及实际权重为准，不以单张骨架截图为准。

## FBX / Blender 导出失败

- .blend 和 FBX 都经过 Blender 4.2 的后台 GLB 桥。确认 Blender 可执行文件路径正确，Blockbench 有写入目标目录的权限。
- 导出临时目录应在目标目录下的 .nmtm-export-*；失败时检查 Blockbench 错误信息和 Blender 日志中的第一个异常，不要删调用者原始 GLB 来“清理”。
- 输出目标必须非空且包含成功标记。没有产物、空文件或 Blender 非零退出都不算成功。
- nmtm.js 内嵌 Python 与 nmtm_blender_bridge.py 必须一致：运行 npm run bridge:check。

## 动画导出后不动或错位

- 确认所选 animation clip 有 tracks/keyframes，目标 bone 名称与动画引用一致，且 source control bone 的权重映射正确。
- helper bones 是静态绑定链；需要检查原名控制骨的动作曲线，而不是给 helper 设置 keyframe。
- FBX 导入器的叶骨或 bone orientation 选项可能改变观察结果。用 Blender 4.2 重新导入导出的 FBX 并比较相同时间点的受影响顶点。
- 先跑 node tests/nmtm_export_contract.cjs（依赖本机 Blockbench app.asar），再根据需要跑 node tests/nmtm_conversion_contract.cjs。

## 代码检查失败

    node --version
    npm test
    npm run diagnose

便携检查不启动 GUI，也不会访问网络。diagnose 的路径缺失是环境提示，不代表插件运行失败；请区分 fail 与 optional-missing。

Blockbench / Blender / 视频渲染验收不属于 npm test。真实窗口测试必须经过桌面 2 隔离；任何无法证明窗口仍隐藏且不会改变前台的情况都应立即失败退出。不要自动点击 Windows 安全警报、修改防火墙规则或关闭隔离断言。详见测试说明、运行时验收边界和项目当前状态。

## 报告问题

公开 issue 仅提供无私密素材的最小复现、软件版本、npm test 摘要和已脱敏日志。不要附原版资源包、Cookies/profile、账号数据、机器绝对路径、API key 或完整 output/ 目录。
