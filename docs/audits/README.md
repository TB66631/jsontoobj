# 审查记录索引

以下文档注明测试范围、源码哈希、数据依赖和不能外推的部分。被忽略的 output/ 中原始日志、模型、视频、profile 和机器报告只存在于当前工作区，不随 GitHub checkout 发布。

| 文档 | 覆盖内容 |
| --- | --- |
| [导出契约](export-contract.md) | Blockbench API、selection 排除、共享动画轨道、插件转换生命周期及报告隔离复核 |
| [Blender / FBX 保真度](blender-fidelity.md) | 固定 GLB、权重、inverse bind、几何对应、动画采样与渲染结果 |
| [Blockbench 运行时边界](runtime.md) | 隔离尝试、前台警报、未完成的真实窗口验收和安全复现门槛 |
| [清理前仓库审查](repository-review.md) | 原仓库资产分布、历史风险和提交范围的只读快照 |
| [Git 清洗记录](git-cleanup.md) | 外部备份、取消跟踪范围、历史重写和清洗后的验证 |
| [发布范围复核](publish-review.md) | 对公开源码范围、工作流及文档依赖的独立检查 |
| [资源读取与 PNG 解码](input-boundaries.md) | 新增待修复目标、路径越界复核、内存上限缺口及后续验收要求 |

摘要只保留已实际观察的结果；不能用旧插件哈希、合成夹具或 Blender 固定输入测试宣称完整真实项目已经端到端通过。
