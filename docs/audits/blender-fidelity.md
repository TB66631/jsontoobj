# NMTM Blender / FBX 骨骼保真度记录

记录日期：2026-10-27（Asia/Shanghai）。数值审查与动画渲染证据主要生成于 2026-10-26。测试环境为 Blender 4.2.16 LTS，输出与临时文件位于本机 E 盘项目目录。

## 版本与适用范围

本次核对的 Python 桥 SHA256 为 `2bcb7a9da4562f7035054dae11693a5a89184831eb2a4dbc3b5e798c15cc11c0`。生产 [nmtm_blender_bridge.py](../../nmtm_blender_bridge.py)、本地测试副本和插件内嵌 Base64 payload 一致。记录时 `nmtm.js` SHA256 为 `004238161e4a73f889b5421e40fe66b5dbeb98623c67dcf939f183f8abdddd79`。

这里证明的是固定输入 GLB 经当前桥转换、保存、重新加载后的结果。真实模型输入 GLB 来自旧 runtime 快照；当前插件重新从源 JSON 导入、预览、保存重开再导出的完整链路仍待单独验证。不能把本页的通过数字写成“当前插件全部端到端通过”。

## 为什么导出后有辅助骨

源控制骨保留原名、局部 TRS 层级与动画。为了精确保留源 inverse bind matrix（IBM），每个 joint 的绑定通过 SVD 拆成固定 `_NMTM_bind_*` → `_NMTM_deform_*` 辅助链。顶点权重绑定到 deform 骨；做动画时控制原名源骨，不直接旋转这些固定辅助骨。

该结构实现 `sum(weight * worldJoint * IBM * sourceVertex)`，用于负缩放、非均匀缩放、混合权重和 TRS 父链产生的 shear。骨的显示方向或辅助骨数量不能单独证明蒙皮错位，需比较实际受权重影响的顶点。不能删掉辅助链来“整理骨架”。直接以源 `node.matrix` 存储、且不能表达为 TRS 的 shear 会明确拒绝，避免静默丢失变换。

当前源动画采样步长和 FBX `bake_anim_step` 均为 `0.0625` 帧（1/16 帧）。采样与有限精度转换仍有误差，不能宣称任意连续时间数学无损。

## 数值与结构结果

| 检查 | 已验证结果 | 范围 |
| --- | --- | --- |
| 保存后 `.blend` / 回导 `.fbx` | 14/14 通过 | 7 个固定 GLB × 2 格式 |
| 三角面及 corner 一一对应 | 14/14 通过 | 包含重复面数量、位置、UV、源 joint 序号权重、材质槽 |
| 源纹理 payload | 字节 SHA256 保留 | 有贴图的输入在重开后仍 packed/embedded |
| 独立逐源索引 CPU skin 对比 | 72 次通过 | 默认姿势与不在采样格点上的时刻，零时长动作去重 |
| 真实源 JSON IBM | 63 joints float32-exact | 先进行 1/16 模型单位转换 |
| indexed motion 最大误差 | `9.476897273e-6` | 最大阈值占用 10.0617% |

7 个输入的实际组成：

- 3 个真实模型：`ss_s8Time_Craft`、`cs_s6Cyber_skin_guajian_back`、`cs_s6Jiaolong_horse`。
- 3 个合成绑定夹具：nonuniform、negative、unit-independent-bind。
- 1 个 two-mesh-sections 夹具。

这不是 14 个真实模型。原报告的 126 条姿势记录含 Jiaolong 零时长 `Take 2` 的重复时间点，折叠后为 114 个唯一 artifact/clip/time/default 检查。独立严格审查另外执行了上述 72 次逐索引比较。

CPU oracle 直接解析原 GLB 的 TRS、四元数插值、IBM、joint indices 和 weights。Blender 比较对象来自保存后重开文件，未以 Blender 自己重导出的 GLB 当作源真值。旧 nearest-vertex 距离会漏掉完全重叠的重复面；本次结构检查以缺失一张重复三角面的负例确认能够拒绝该情况。

two-mesh-sections 的 POSITION accessor 共 12 条记录，仅 6 条被三角面引用；Blender 保留 6 顶点、2 三角面与两个材质槽是正确结果，不能按 accessor 长度误判为丢失一半模型。

## bpy 动画、视频与抽帧

本地 `output/nmtm-rig-repair/acceptance/final-source-control-summary.json` 生成于 `2026-10-26T23:48:01.781261+08:00`，8/8 案例通过。总计按该 JSON 的真实字段计算：**108 个控制骨测试实例、648 个数值姿势、24 个渲染控制骨实例、288 帧**。同一源模型在两种格式中分别计数，不等于 108 个不同骨名。

| 输入 × 每种格式 | 数值测试控制骨 | 数值姿势 | 渲染控制骨 | 渲染帧 |
| --- | ---: | ---: | ---: | ---: |
| Craft：Blend / FBX 各一次 | 各 15 | 各 90 | 各 4 | 各 48 |
| Jiaolong：Blend / FBX 各一次 | 各 35 | 各 210 | 各 4 | 各 48 |
| multi-section：Blend / FBX 各一次 | 各 2 | 各 12 | 各 2 | 各 24 |
| negative：Blend / FBX 各一次 | 各 2 | 各 12 | 各 2 | 各 24 |

脚本逐个操作有正权重后代影响的原名控制骨，测试三个局部轴的 ±30°，验证无关顶点、有限几何值与恢复初始姿势。渲染只选择表中代表控制骨；没有宣称每个控制骨都渲染。contact sheet 从实际输出的 MP4 解码抽帧，不能用静态截图替代动画视频。源 Blend/FBX 在测试前后的哈希保持不变。

最终视频、抽帧与逐案例报告保存在 `output/nmtm-rig-repair/acceptance/final-source-control-*`。人工目检须由负责最终验收的维护者执行并记录；自动 `passed=true` 只代表脚本断言通过。

### 2026-10-27 新转换产物的复验与视觉疑点

当前生产内嵌桥重新转换固定旧 GLB 后，对 Craft / Jiaolong 的 Blend、FBX 四项产物再次后台制作逐骨动画、渲染 MP4，并从视频抽取接触表。四项退出码均为 0，输入文件哈希未变；合计 100 个控制骨测试实例、600 个数值姿势、16 个渲染控制实例、192 帧。这组数字独立于上面的 8 项历史记录，不是新增真实模型数量。

父代理实际查看了四张新接触表：Craft 的小浅青零件在第三排的正负旋转中明显离开主体，底部小件在另一控制骨负向旋转时外摆。两格式均可观察到，因此不能仅凭隔离、数值有限和复位检查通过，就写成“没有脱落”或完成视觉验收。尚需对照源 JSON 的控制骨用途、pivot、IBM 及原动作，区分原本可独立运动的装饰件和错误绑定；本轮未据此改动生产源码。

Jiaolong 两格式接触表的青色细须位置也有可见差异，但本次渲染没有统一初始动作与时间：Blend 从 frame 0、无 active action、2 条 NLA 的当前姿势开始；FBX 从 frame 1、`NMTM_ExactSkin|Take 2`、无 NLA 的当前姿势开始。脚本分别保存导入时姿势再冻结动画，因此这些图片不能直接证明同一动作同一时间下的格式差异，也不能用来声明视觉一致。相同动作与时间的 CPU 数值比较另见完整转换检查，后续视觉对比需要显式统一该条件。

本组证据位于本地 `output/nmtm-rig-repair/acceptance/conversion-20261027-review-a93e7c/`，每项子目录包含 `acceptance.json`、视频和 `isolated-bone-contact.png`，调用与输入哈希见 `run-manifest.json`。输入仍是历史 runtime GLB，未启动新 Blockbench 导入；这些二进制证据不随 Git 分发。

## 复现与排查入口

先检查桥 payload 一致：

```powershell
node tests/build_nmtm_bridge.cjs --check
```

已有合法 GLB 时可直接运行生产桥，命令会后台生成指定输出；路径应使用自己的工作盘目录：

```powershell
& 'D:/Program Files/Blender4.2/blender.exe' --factory-startup --background --threads 2 --python-exit-code 1 --python nmtm_blender_bridge.py -- 'E:/NMTM-test/model.glb' 'E:/NMTM-test/model.blend' blend
```

仓库内回归脚本各司其职：

- [nmtm_blender_bridge_fidelity.py](../../tests/nmtm_blender_bridge_fidelity.py)：原 GLB CPU skin 与重开 Blend/FBX；参数为报告路径及一个或多个输入 GLB。需先准备实际 GLB fixtures 和 Blender 4.2；报告输出放在项目盘。
- [nmtm_fidelity_independent_audit.py](../../tests/nmtm_fidelity_independent_audit.py)：参数为前项报告 JSON、输出 JSON；增加一一结构对应、纹理字节和离格点逐索引检查。部分源溯源还需要本地原始资源。
- [nmtm_render_acceptance.py](../../tests/nmtm_render_acceptance.py)：参数为输入 Blend/FBX、`--output` 目录，可指定 `--ffmpeg`、`--render-bones`。`--render-bones` 只限制渲染，不限制数值骨骼测试。
- [nmtm_conversion_contract.cjs](../../tests/nmtm_conversion_contract.cjs)：调用实际插件导出入口，覆盖临时目录、错误处理与保存重开；详情见[导出契约](export-contract.md)。

前两项的 Blender 调用形式：

```powershell
& 'D:/Program Files/Blender4.2/blender.exe' --factory-startup --background --threads 2 --python-exit-code 1 --python tests/nmtm_blender_bridge_fidelity.py -- 'E:/NMTM-test/fidelity.json' 'E:/NMTM-test/model.glb'
& 'D:/Program Files/Blender4.2/blender.exe' --factory-startup --background --threads 2 --python-exit-code 1 --python tests/nmtm_fidelity_independent_audit.py -- 'E:/NMTM-test/fidelity.json' 'E:/NMTM-test/independent.json'
```

本地完整证据为 `output/nmtm-rig-repair/fidelity-audit.md`、`output/nmtm-rig-repair/fidelity-audit-structure.json` 和 `output/nmtm-rig-repair/bridge-test/fidelity-final.json`。这些证据、输入游戏资产、二进制模型和渲染视频不随 Git 分发。新 clone 缺少这些文件时，应准备输入并重新生成证据，不能从本文数字推断本机执行结果。

## 仍未覆盖

本组输入未覆盖 STEP/CUBICSPLINE、morph targets、JOINTS_1 或任意混合有/无蒙皮场景，也未完整覆盖 NiuMoWang、FlowerDragon、Galaxy、WuKong 等计划中的真实模型。当前插件 fresh GLB、真实 Blockbench 保存重开、全部新模型及视觉验收完成后，应以新的输入/输出哈希增补记录。
