# Git 历史清洗与仓库整理

执行日期：2026-10-27。用户明确要求先整理并清洗 Git 历史，再重新提交。本次操作只整理本地仓库，不添加远程地址或推送。

## 原始状态与备份

- 分支为 `main`，原历史只有一个根提交 `a349959dcd9dbc46b126ce7aa390130345501145`，无其他分支、标签或 remote。
- 原索引跟踪 19,092 个路径；原对象包文件合计 1,186,893,155 字节，`git count-objects -vH` 报告 `size-pack: 1.10 GiB`。
- 其中包含本地游戏资源、Gradle 缓存、隔离 Electron 运行时、测试 profile、视频和转换产物，不能作为插件源码发布。
- 重写前已在仓库外创建并通过 `git bundle verify` 验证完整历史备份：`E:/Administrator/文档/Python/jsontoobj-git-backups/before-cleanup-20261027.bundle`。
- bundle 大小为 1,186,266,741 字节，SHA256 为 `bf417c291e6a5b489d85f9ce7b5f6e99c9bd7cca1ef00260e1c1687595333aed`。备份包含原 `main` 和 `HEAD`，不依赖其他历史。

备份仍含原来误提交的素材和运行数据，只保留在本机；不要将其加入新仓库或作为公开附件。需要恢复旧历史时可把 bundle 克隆到另一个 E 盘目录，避免覆盖当前工作区。

## 内容整理

使用 `git rm --cached` 取消以下目录的跟踪，保留其磁盘内容：`NetMC Assets/`、`mc1.8.8 assets/`、`json/`、`output/`、`.idea/`、根目录及测试目录下的 `__pycache__/`。工作区中本来已删除的文件没有恢复。

清洗基线提交仅保留 53 个源码、文档、测试与配置文件；后续维护提交可以加入新的源码或测试。插件入口仍为根 `nmtm.js`；早期 `4.py` 与 `Blender Python/import_skeleton.py` 移到 `tools/legacy/`，并注明历史用途。维护中的导出契约提升为 `tests/nmtm_export_contract.cjs`，其 ASAR helper 只读本机安装文件；Blender fidelity 测试直接导入根桥源码。

新增 `.gitignore`、项目自身的 `package.json`、离线检查与只读诊断命令、Git 发布范围检查、GitHub 工作流、问题模板，以及排查和子代理审查文档。`.gitattributes` 固定源码的 LF 换行，保护嵌入 Python payload 的逐字节一致性。`.npmrc` 关闭更新提示，缓存与日志放入工作区 `output/npm-cache/`。

本轮没有修改生产插件和 Blender 桥的内容：

```text
nmtm.js
004238161e4a73f889b5421e40fe66b5dbeb98623c67dcf939f183f8abdddd79
nmtm_blender_bridge.py
2bcb7a9da4562f7035054dae11693a5a89184831eb2a4dbc3b5e798c15cc11c0
```

## 历史处理与复核方式

原历史只有一个本地根提交，因此采用重建该根提交的方式：整理索引后 `git commit --amend --no-gpg-sign`，不保留指向旧提交的本地备份分支或标签。外部 bundle 是旧历史的恢复来源。随后过期本地 reflog，并用 `git gc --prune=now` 回收旧对象，避免只删除工作树记录而仍携带旧资源。

复核命令：

```powershell
git rev-list --count --all
git log --oneline --all
git count-objects -vH
git fsck --full --strict
npm run repo:check
git status --short
```

清洗完成时历史只有一个干净根提交，后续维护正常追加提交；旧提交在主仓库中不可读取，`git fsck` 无损坏或悬空对象，`repo:check` 通过。该检查器限制顶层跟踪范围，拒绝依赖、缓存及常见产物二进制，并检查全部可达历史中超过 25 MiB 的 blob，输出最大对象的实际路径。

整理前的 `npm test` 和只读 `npm run diagnose -- --json` 已通过。提交后的可移植验收使用 E 盘 `output/repository-clean-check/` 下的 `git clone --no-local`，不复用对象硬链接，也不复制被忽略的游戏资源、运行 profile 或依赖；在克隆内再次运行 `npm test`、`npm run diagnose` 和 `npm run repo:check`。具体提交号、对象数量和体积以该提交上的 Git 命令及最终执行记录为准。

已完成的清洗基线为根提交 `c83f59eaeebf517ddb514b589d7853e1a96ff6c7`：53 个跟踪文件、65 个可达对象、53 个 blob；最大 blob 为 `nmtm.js` 的 214,626 字节，对象包为 596.54 KiB。旧根对象已不可读取，`git fsck --full --strict` 和 `repo:check` 通过。独立非硬链接 clone 的默认测试、诊断及仓库检查均通过，工作树干净；原始本地资源目录仍存在且未跟踪。后续正常维护提交可以增加小型源码对象，不再重写该基线。

清洗后的独立最终复核记录在本地 `output/git-history-final-verification-20261027.md`。清理期间外部应用/用户已经配置 `origin`，本地远程跟踪 refs 指向上述基线；本代理没有添加 remote 或推送。最后一次在线只读核验遇到连接重置，不能把本地跟踪 refs 当作服务器此刻状态。

本次仓库整理不代表真实 Blockbench 窗口验收、骨骼渲染或插件安装已经完成；这些状态保留在 [项目状态](../STATUS.md)。全过程不启动 GUI、不处理系统弹窗，测试输出和备份留在 E 盘。
