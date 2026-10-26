# 仓库结构审查（清理前快照）

审查日期：2026-10-27。本文保留整理前的只读发现，下文的“当前”均指审查当时。它不是清理后状态；后续整理与历史清洗结果见 [Git 清洗记录](git-cleanup.md)。原审查没有修改 Git 索引、历史、远程地址或运行中的测试。

## 当前状态

当前分支为 `main`，初始提交为 `a349959d`（`Initial commit`）。本次检查时 `git remote -v` 没有输出。Git 已跟踪 19,092 个路径，`.git` 对象包约 1.10 GiB。根目录没有 `.gitignore`。

| 路径 | 已跟踪文件数 | 用途及建议 |
| --- | ---: | --- |
| `NetMC Assets/` | 13,248 | 本地网易资源输入；默认忽略，保留在本机，不能用本项目 MIT 许可概括第三方素材许可。 |
| `mc1.8.8 assets/` | 3,085 | 本地 Java 版参考资源；默认忽略，不作为插件分发内容。 |
| `output/` | 2,721 | 转换结果、视频、报告、测试运行副本、缓存及早期试验脚本；默认忽略，先提取仍需维护的脚本与简明报告。 |
| `tests/` | 22 | 当前自动化与 Blender/Blockbench 验证脚本；跟踪维护。 |
| `.idea/` | 4 | 开发者本地 IDE 配置；忽略。 |
| `json/` | 2 | 当前是一个真实模型 JSON 和 PNG；默认按本地输入处理，需要公开示例时另外制作可分发的小型合成 fixture。 |
| `__pycache__/` | 1 | Python 字节码缓存；忽略。 |
| 其余根目录文件 | 9 | 插件、桥接源码、文档、许可和历史脚本；按下文整理。 |

以上为审查时快照，正在运行的测试可能继续生成本地文件。

## 应跟踪的核心内容

- `nmtm.js`：Blockbench 直接安装的插件入口，保留根目录路径，避免现有安装及测试脚本失效。
- `nmtm_blender_bridge.py`：Blender 桥接源码；与插件内嵌 payload 的同步由 `tests/build_nmtm_bridge.cjs --check` 检查。
- `tests/`：可维护的回归测试、桌面隔离工具和渲染验收脚本。
- `README.md`：仓库入口、安装、功能范围和文档索引。
- `NMTM_README.md` 或迁移后的使用文档：现有详细说明需保留链接兼容性。
- `docs/`：故障排查、开发流程、验证边界和代理审查报告；不要复制原始用户资源或 Electron profile。
- 项目自身的 `package.json`、`.gitignore`、`.gitattributes`、`LICENSE`，以及必要的 GitHub 工作流或 issue 模板。

根目录 `package.json` 当前来自 Blockbench：名称 `Blockbench`、版本 `5.1.4`、作者和仓库指向 JannisX11，入口是本仓库不存在的 `electron/main.js`。这不是 NMTM 插件工程的正确元数据。应改为 NMTM 的私有开发包，提供本仓库确实可运行的检查脚本；不应直接安装或发布这份复制的 Blockbench 应用依赖。修改前确认没有脚本依赖原来的 `type: module`。当前维护的 Node 测试均为 `.cjs`，不依赖根包的 ESM 声明。

## 本地输出与隐私检查

`output/` 已跟踪的主要内容包括：

- `output/nmtm-gradle-home/caches/`：1,415 个文件，含下载的 Minecraft JAR、Gradle 缓存和转换产物。
- `output/nmtm-rig-repair/native-tools/`：681 个文件，主要为本地测试依赖。
- `output/nmtm-rig-repair/runtime/`：235 个文件，含隔离运行 profile。
- `output/nmtm-rig-repair/acceptance/`：152 个文件，含 Blender 输出、视频和抽帧。
- `output/nmtm-rig-repair/bridge-test/`：63 个文件。
- `output/nmtm-rig-repair/conversion-contract/`：33 个文件。

文件名检查发现多个测试 profile 已跟踪 `Network/Cookies`、`Cookies-journal`、`Local State`、`Preferences`、`Network Persistent State` 和 `Trust Tokens`。本次没有读取这些数据库或配置内容，不能据此判断其是否含有效凭据；它们应作为本地运行数据排除，不能当作公开测试 fixture。

对已跟踪路径进行了 `.env`、凭据/密钥名称及常见私钥扩展名的有界检查，除上述浏览器 profile 名称外没有发现匹配项。这只是文件名筛查，不是对所有素材与二进制文件的秘密扫描。

## `.gitignore` 与现有提交的区别

新增 `.gitignore` 可以阻止以后误加入缓存，但不会取消已经跟踪的 19,092 个路径，也不会删除初始提交里的对象。建议的默认忽略范围为：

```gitignore
/NetMC Assets/
/mc1.8.8 assets/
/json/
/output/
/.idea/
**/__pycache__/
*.py[cod]
**/node_modules/
.env
.env.*
!.env.example
```

同时按实际使用补充本地配置、编辑器文件和临时目录；不要全局忽略所有 `.json`、`.png` 或 `.bin`，否则未来的小型合成 fixture 也会被隐藏。

当前没有配置远程地址，也没有执行推送。整理时可以先添加忽略规则和维护文档，保留磁盘文件；若要从 Git 跟踪中去掉输入与输出，应只改索引，不删除本地资源。原始初始提交的体积仍会保留，是否整理已提交历史需要单独按实际发布状态决定，不能把“工作区已清理”表述成“历史已净化”。本审查没有执行任何历史重写。

## 历史脚本与路径依赖

`4.py` 是独立的早期 JSON → OBJ/MTL 转换器，只读取 `mesh[0]`，忽略骨骼文件，从相对工作目录 `json/` 读取数据，向相对 `output/` 输出，并寻找同名贴图。没有发现维护中的测试或文档引用它。建议移到 `tools/legacy/json_to_obj.py` 并注明只用于静态旧流程；若移动，应同时明确从仓库根目录运行，或将路径改为可传入参数，避免用户从脚本目录启动后读错位置。

`Blender Python/import_skeleton.py` 是早期场景匹配导入器，按 `_mesh` 名称寻找模型，再建立/对齐骨骼。它硬编码了一个旧的本机 `JSON_FOLDER`。没有发现维护中的测试或文档引用它。建议移到 `tools/legacy/import_skeleton.py` 并标为历史脚本，不应与当前精确 GLB → Blender 绑定桥混用。不要在整理时悄悄执行此脚本。

以下文件仍位于通常应忽略的 `output/` 内，值得维护者在取消跟踪输出前评估并提升到 `tests/` 或 `docs/audits/`：

- `audit-c3-contract.cjs`、`audit-c3-animation-export.cjs`、`audit-c3-source.cjs`：导出与四元数审查。
- `bind-math-test.cjs`、`make-bind-blender-fixture.cjs`：绑定数学与合成 fixture 生成。`bind-math-prototype.cjs` 属于历史原型，不应自动变为标准测试。
- `export-audit.md`、`fidelity-audit.md`、`BIND-MATH-FINDINGS.md`：适合整理为带日期、源码 hash 与验证边界的审查记录。
- `blender_harness/`、`bridge-test/inspect.py`、`acceptance/` 下的小型脚本：先确认是否已被 `tests/` 新脚本覆盖，避免复制两套来源。

不要直接移动这些目录：`tests/nmtm_blender_bridge_fidelity.py` 当前仍导入 `output/nmtm-rig-repair/blender_convert_impl.py`；`tests/nmtm_fidelity_independent_audit.py` 也把此副本的 hash 纳入报告。当前桥接源码应以根目录 `nmtm_blender_bridge.py` 为权威；提升脚本时需要同步调整依赖，并用 payload 同步检查和相关回归检查验证。正在运行的隔离 Blockbench 测试也依赖 `output/nmtm-rig-repair/native-tools/` 中本地 Koffi 安装，忽略/取消跟踪它不等于删除它。

真实模型回归目前按既定 `NetMC Assets/[3.8.30.293955]/...` 位置读取本机素材。公开仓库应说明如何在本地提供这些资源，缺失时清晰报告需要本地素材的测试条件；不能把未运行的真实模型测试记为通过。

## 建议的整理次序

1. 创建根级忽略规则、修正项目元数据、补齐 README 与故障排查入口。
2. 将仍需维护的审查源码/报告从 `output/` 提升，并修正其中的路径依赖；保留正在跑的本地输出。
3. 对本地资源、生成结果、依赖与缓存取消 Git 跟踪，确认磁盘文件不变，保留当前未提交的源代码改动。
4. 用 `git status`、被跟踪路径汇总和必要的无 GUI 检查确认整理结果；运行时验收继续遵守桌面 2、隐藏窗口与 E 盘临时目录约束。
5. 发布前单独确认第三方素材范围、历史对象体积和 profile 数据；本次审查不自动推送或重写历史。

本文件由仓库结构审查子代理编写。其他代理应在各自拥有的 Markdown 中记录结论、实际命令、源码 hash、证据位置、未完成项及验证限制，并由父代理建立索引，避免多个代理覆盖同一文件。
