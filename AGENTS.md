# NMTM 工作约定

## 源码与提交范围

- 插件名称保留 `Netease Mesh To Modle (NMTM)`，入口为根目录 `nmtm.js`。
- Blender 桥的可读源码为根目录 `nmtm_blender_bridge.py`；插件内嵌 payload 必须同步。修改后运行 `npm run bridge:check`。
- 保留用户已有改动与本地资源。使用 `apply_patch` 编辑文件；不要用恢复工作树或递归删除来处理无关改动。
- `NetMC Assets/`、`mc1.8.8 assets/`、`json/`、`output/`、IDE 配置、运行 profile、依赖与缓存保留本地，不加入 Git。
- 不恢复已废除的 GeckoLib / 新增桥接 mod 路线；资源包适配以当前 Java 与 EMF/CEM 路线为准。
- 2026-10-27 的历史清洗与本地重新提交由用户明确授权；这不是以后任意重写历史或推送的永久授权。不要自行添加 remote 或推送。

## 检查与桌面隔离

- 默认检查为 `npm test`、`npm run diagnose`、`npm run repo:check`。默认流程必须离线、无需私有素材、不启动 GUI。
- 所有测试缓存、报告、临时文件和渲染产物写到本项目 `output/` 或用户指定的 E 盘目录。不要往 C 盘新增大体积缓存。
- 用户正在使用前台桌面，测试窗口及弹窗必须位于虚拟桌面 2；不得切换桌面、抢焦点或干扰游戏。
- 真实 GUI 验收必须先验证隐藏窗口与桌面隔离保护。无法证明安全时 fail closed，不重复启动以碰运气，不自动处理系统安全弹窗，不修改防火墙规则。
- 分别记录语法检查、隔离契约、Blender 后台转换、真实 Blockbench 运行和渲染目检。没有实际完成的验证不得写成通过。
- 仓库整理完成不等于骨骼、蒙皮、动画及真实运行时验收完成；未完成事项保留在 `docs/STATUS.md`。

## 子代理协作

- 父代理与子代理总并发不超过 8。按互不重叠的文件划分任务，不并行改同一文件或 Git 索引。
- 每个审查子代理在分配的 Markdown 中写清结论、实际检查、证据位置、源码哈希与限制；父代理维护 `docs/audits/README.md` 索引。
- 完成的代理不要反复唤醒；不重复运行会覆写机器报告的测试。私有 `output/` 证据不随 GitHub 仓库发布。

## 图像提供方

For raster image generation or editing, use the personal `$CustomImage2Create (CI2C)` skill and its configured relay by default. This is the user's explicit provider preference. Do not use the built-in image generator unless the user explicitly requests it or the relay fails; disclose any fallback before using it.
