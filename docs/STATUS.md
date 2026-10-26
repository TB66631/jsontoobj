# 项目状态

状态更新时间：2026-10-27。源码版本 0.6.0。本页汇总经过记录的证据与未完成事项，不等同于所有支持路径的端到端验收。

## 已记录的检查

- 插件源 nmtm.js SHA256：004238161e4a73f889b5421e40fe66b5dbeb98623c67dcf939f183f8abdddd79。
- Blender 桥源 nmtm_blender_bridge.py SHA256：2bcb7a9da4562f7035054dae11693a5a89184831eb2a4dbc3b5e798c15cc11c0。
- 基础 Node 离线检查 7 项通过；具体命令与实际输出参见测试说明。
- 导出 API / selection / animation / quaternion / metadata 合约检查在 Blockbench 5.1.4 本机 source map 上通过，未启动 GUI。
- Blender 桥的固定 GLB 数值保真审计为 14/14（7 个夹具 × Blend/FBX）；逐索引 CPU skin、三角形、UV、material、weights 和贴图字节检查见保真度记录。
- 逐控制骨动画渲染为 8/8 固定产物案例；108 个控制实例、648 个数值姿势、24 个渲染控制实例、288 帧。抽帧记录不等于新 Blockbench 导入的验收。

## 仍未完成

- 当前版本真实 Blockbench renderer 插件冷加载、贴图生产路径解析、保存 .bbmodel 后关闭重开和二次导出尚无成功完整运行证据。
- 上次隔离桌面尝试检测到 Windows 安全中心警报夺取前台，测试按保护逻辑隐藏并退出；没有新鲜 runtime GLB。不能将旧版 runtime JSON 当作本版本验收。
- 一次完整转换报告被后续 --negative-only 运行覆写。恢复同哈希、同一报告中的 6 个转换与 6 个重开检查之前，不引用先前摘要代替当前可复核聚合文件。
- 用户要求最终插件备份与安装尚未据此记为完成。

下一次真实桌面验收必须先解决前台安全提示的根因，同时保留第二虚拟桌面、隐藏窗口、桌面不切换和 fail-closed 检查。不得点击或自动处理系统安全对话框，不得修改防火墙规则。

## 详细记录

- 导出契约：audits/export-contract.md
- Blender / FBX 保真度：audits/blender-fidelity.md
- 真实运行时限制：audits/runtime.md
- 清理前仓库审查：[repository-review.md](audits/repository-review.md)
- 仓库整理与历史清洗：[git-cleanup.md](audits/git-cleanup.md)
