# 项目状态

状态更新时间：2026-10-27。源码版本 0.6.0。本页汇总经过记录的证据与未完成事项，不等同于所有支持路径的端到端验收。

## 已记录的检查

- 插件源 nmtm.js SHA256：004238161e4a73f889b5421e40fe66b5dbeb98623c67dcf939f183f8abdddd79。
- Blender 桥源 nmtm_blender_bridge.py SHA256：2bcb7a9da4562f7035054dae11693a5a89184831eb2a4dbc3b5e798c15cc11c0。
- 基础 Node 离线检查已包含转换报告隔离回归；具体命令与实际输出参见测试说明。
- 导出 API / selection / animation / quaternion / metadata 合约检查在 Blockbench 5.1.4 本机 source map 上通过，未启动 GUI。
- Blender 桥的固定 GLB 数值保真审计为 14/14（7 个夹具 × Blend/FBX）；逐索引 CPU skin、三角形、UV、material、weights 和贴图字节检查见保真度记录。
- 逐控制骨动画渲染为 8/8 固定产物案例；108 个控制实例、648 个数值姿势、24 个渲染控制实例、288 帧。抽帧记录不等于新 Blockbench 导入的验收。
- 已修复转换报告相互覆盖：每次执行使用独立新目录，显式摘要只读，不允许已有路径、越界或链接祖先。当前生产内嵌桥重新执行 13/13 必须通过案例、6/6 后台转换及 6/6 Blender 重开检查，完整聚合已恢复；输入仍为历史固定 GLB。报告位置与 SHA256 见[导出契约](audits/export-contract.md)。
- 新转换的 Craft / Jiaolong 四项 Blend/FBX 又完成 100 个控制实例、600 个数值姿势、192 帧后台渲染和视频抽帧；父代理已查看四张接触表。自动断言通过，视觉疑点与比较限制见[保真度记录](audits/blender-fidelity.md)。

## 仍未完成

- 当前版本真实 Blockbench renderer 插件冷加载、贴图生产路径解析、保存 .bbmodel 后关闭重开和二次导出尚无成功完整运行证据。
- 上次隔离桌面尝试检测到 Windows 安全中心警报夺取前台，测试按保护逻辑隐藏并退出；没有新鲜 runtime GLB。不能将旧版 runtime JSON 当作本版本验收。
- Craft 单骨旋转时小件明显外摆的用途与绑定仍待源模型对照；Jiaolong 两格式的本次渲染初始动作和时间未统一，不能宣称视觉一致。
- 用户要求最终插件备份与安装尚未据此记为完成。

下一次真实桌面验收必须先解决前台安全提示的根因，同时保留第二虚拟桌面、隐藏窗口、桌面不切换和 fail-closed 检查。不得点击或自动处理系统安全对话框，不得修改防火墙规则。

## 新增目标：导入资源的读取边界

2026-10-27 用户提供了两项源码审查发现，要求加入目标、后续逐步处理。先完成 Git 整理提交，再分别复核和修复；截图中的推断不作为已成功复现的漏洞记录。

- [ ] `resolveResource()`：核对自动资源引用是否始终限制在已选资源包根目录内，覆盖 `../`、Windows 绝对路径与盘符、大小写及链接路径。区分 JSON 自动引用和用户主动选择外部文件的授权，补充明确的根目录包含检查与必要回归。
- [ ] `decodePngRgba()`：核对文件大小、宽高、总像素、计算溢出和 zlib 解压输出上限；分配和解压前拒绝超限输入，并保留正常贴图及 atlas 导出的兼容性。使用小型合成输入验证，避免以实际耗尽内存作为测试。

两项均纳入后续导入、贴图与导出修复的验收范围；本次整理提交不会宣称生产代码已经修复。已确认的源码缺口、证据边界与验收要求见[资源读取与 PNG 解码](audits/input-boundaries.md)。

## 详细记录

- 导出契约：audits/export-contract.md
- Blender / FBX 保真度：audits/blender-fidelity.md
- 真实运行时限制：audits/runtime.md
- 清理前仓库审查：[repository-review.md](audits/repository-review.md)
- 仓库整理与历史清洗：[git-cleanup.md](audits/git-cleanup.md)
