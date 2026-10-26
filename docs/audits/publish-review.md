# 发布范围独立复核

审查日期：2026-10-27。本次只读检查预定发布的源码、文档、测试与 GitHub 配置；唯一写入文件为本记录。没有启动 GUI、联网、构建或运行测试，没有读取 `output/`、游戏资源或用户 profile 的内容，也没有修改 Git 索引和历史。

## 范围与结论

检查范围为根目录的 `nmtm.js`、`nmtm_blender_bridge.py`、`package.json`、`NMTM_README.md`、`README.md`、`CONTRIBUTING.md`、`.gitignore`、`.gitattributes`，以及 `.github/`、`scripts/`、`tests/`、`tools/`、`docs/`。审查进行时根代理仍在整理文档，文件总数和体积不是最终提交统计。

| 检查 | 观察结果与限制 |
| --- | --- |
| 预定源码体积 | 排除待取消跟踪的 `tests/__pycache__/` 后，观察到的最大文件为 `nmtm.js`，214626 字节。范围内没有 EXE、DLL、JAR、ZIP、Blend、FBX、GLB 或 MP4 文件。最终以清洗后 Git 树和对象检查为准。 |
| 明显凭据 | 常见 API key、Bearer、GitHub token、AWS key、私钥头、带密码 URL 等静态模式未发现凭据字面量；相关关键词仅出现在禁止上传敏感数据的说明中。这不构成完整秘密检测证明。 |
| 个人运行数据 | 发布范围未发现 Cookies、Local State、Trust Tokens 或实际 profile 数据。测试代码中的 profile 路径和内存 mock 不等于个人运行文件。旧索引中的此类文件由根代理取消跟踪并清除历史。 |
| 第三方资产 | `.gitignore` 排除 `NetMC Assets/`、`mc1.8.8 assets/`、`json/`、`output/` 和依赖/缓存；仓库许可证说明限定到项目源码。忽略规则本身不能移除已跟踪资产，必须配合本次索引与历史清洗。 |
| 默认测试依赖 | `scripts/check.cjs` 使用 Node 内置库，固定关闭 live version test，仅运行语法检查、桥 payload 一致性和六个离线测试入口。未看到默认入口要求安装 Blockbench、Blender、第三方 npm 包、联网或创建真实窗口。未在本次审查重复执行。 |
| GitHub 工作流 | Node 22、Ubuntu、只读 contents 权限，执行 `npm test` 与 `npm run repo:check`；不安装 npm 依赖、不上传本地输出。全历史 checkout 便于发现可达大对象。 |
| 仓库检查器 | 已看到根代理修正为保留 `rev-list --objects` 路径、允许根 `AGENTS.md`，并拒绝嵌套依赖、Python 缓存及常见产物二进制。其真正通过状态需在索引与历史整理后确认。 |
| 本机验收依赖 | Blender、Blockbench ASAR、Koffi、桌面 accessor 与私有素材都明确属于非默认的本机前提。源码 helper 只读安装版 ASAR，不需要把提取后的软件源码提交进仓库。 |

## 文档核对与反馈

已观察到根代理修正以下问题：

- `docs/TESTING.md` 和 `tests/README.md` 改为说明 fidelity 直接导入根 `nmtm_blender_bridge.py`，无需预生成桥副本。
- 独立 fidelity audit 的示例改为通过 Blender 的 Python 运行，因为脚本导入 `bpy`、`mathutils` 和 `numpy`。
- 当前 runtime 文档明确说明 CDP pipe 仍曾遇到前台 Windows 安全警报，不能把 pipe 视为已解决弹窗风险。
- 整理前的仓库审查已明确标注为历史快照，并与整理后记录分开。

另将以下文档问题反馈给根代理；根代理已按生产源码复核并修正：

- `NMTM_README.md` 的 EMF 拒绝项已限定到严格方体转换，并说明 voxel 自动多纹理 atlas 与主导骨近似的边界。
- 安装说明中的个人 E 盘绝对路径已改为仓库根目录。
- `blender-fidelity.md` 被忽略的 `output/` 本地证据已改成代码路径。

内部 Markdown 目标检查使用文件存在性，不读取目标内容。审查时除正在新增的 `git-cleanup.md` 与本记录外，发布源码及文档目标均能解析；本机输出证据存在不等于 clean clone 会携带它们。

## 验收边界

本次结论只覆盖预定公开文件的静态检查，不声称 Git 历史已经清洗、默认测试在干净 clone 中通过、模型渲染正确或插件已安装。最终提交必须另行确认：外部备份可验证、旧大对象不可达并回收、Git 树只含预定文件、工作树干净，以及 E 盘干净 clone 的默认检查通过。原骨骼/蒙皮目标中的真实 Blockbench 验收仍应保留其未完成状态。
