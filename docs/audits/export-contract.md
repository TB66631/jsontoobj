# NMTM 导出契约审查

记录日期：2026-10-27（Asia/Shanghai）。本记录保存 0.6.0 的审查结论与复现入口，供后续排查使用。它不是整个插件的完成声明。

## 对应版本与证据边界

| 文件或环境 | 已核对的值 |
| --- | --- |
| `nmtm.js` SHA256 | `004238161e4a73f889b5421e40fe66b5dbeb98623c67dcf939f183f8abdddd79` |
| `nmtm_blender_bridge.py` SHA256 | `2bcb7a9da4562f7035054dae11693a5a89184831eb2a4dbc3b5e798c15cc11c0` |
| Blockbench API 来源 | 本机 Blockbench 5.1.4 的 `resources/app.asar` 内嵌 source map，由仓库 helper 只读解析 |
| Blender 实际转换环境 | Blender 4.2.16 LTS，后台运行、2 线程 |

源代码契约检查在上述插件哈希上通过。检查使用安装版 Three r129、实际 `buildSkinnedMesh`、GLTFExporter 和 Property 方法；其 renderer 生命周期由夹具模拟，不能等同于真实 Blockbench 窗口内操作。

真实桌面链路仍待完成：插件冷加载、源路径贴图解析、预览首/中/末姿势、原生 `.bbmodel` 保存关闭重开、重新导出。本机隔离测试已因为 Windows 安全中心警报导致前台窗口变化而安全退出；没有取得当前版本的新一轮完整 runtime 验收。旧 `runtime/rig-regression.json` 记录的是 2026-10-23 的其他插件哈希，不能用于宣称当前版本通过。

## 已修复并覆盖的导出行为

| 触发条件 | 修复后的契约 |
| --- | --- |
| Armature 的任一祖先 Group 关闭导出 | 子 rig 不导出；其他 rig 与普通网格按各自导出状态保留 |
| 所有 NMTM rig 都关闭导出 | 继续使用 NMTM 导出路径；输出普通网格时不会回退原生 codec 并重新带出被排除 rig |
| 同一动画同时引用保留和被排除的对象 | 按实际输出场景过滤不存在的 track；保留有效 channel 与 clip 时长 |
| 导入后编辑顶点或权重 | GLB 中间文件读取当前 Mesh 几何与权重；不会从 `nmtm_source_section` 恢复旧顶点 |
| 两个 rig、普通网格、带平移旋转的父 Group | 保留各自层级与模型空间变换，IBM 不重复乘父变换 |
| 非均匀或负 rest scale | 保留 rest TRS 与绝对缩放动画；缺省 IBM 才使用逆 rest fallback |
| 四元数动画预览 | 按实际 Blockbench 插值返回值恢复绝对旋转，再计算 `inverse(rest) * absolute` |
| `.bbmodel` 元数据 | 7 个已注册字段通过真实 Property 方法的 JSON 复制/合并契约测试；仍需真实磁盘重开验收 |

父变换计算检查的最大误差为 `3.722145839155691e-15`，源 IBM 保存误差为 0。最终四元数契约检查为 150 个非单位 rest/target 样例，最大角误差 `5.16191365590357e-8` 弧度。上述数字仅描述对应夹具，不能外推为全部模型或全部编辑操作。

## Blender 调用与清理契约

当前插件将 Python 桥内嵌于 `nmtm.js`，用户安装插件时不需要另放 `.py` 文件。导出时在目标目录生成自有 `.nmtm-export-*` 临时目录，子进程 TEMP/TMP 指向该目录。仅当进程成功、包含 `NMTM_CONVERT_OK` 标记且目标文件非空时，才报告成功。

实际测试调用的是生产插件里的 `blenderConvert`，不只是独立执行桥脚本。2026-10-27 对 SHA256 `004238...` 的完整运行快照曾报告运行期间源文件未变化，并记录：

- 13/13 必须通过的异常与清理案例：非零退出、缺标记、缺文件、空文件、启动抛错、缺少 Blender、不支持格式、文件检查抛错、完成回调抛错，以及调用者/插件自有输入的不同清理规则。
- 6/6 实际转换：Craft、Cyber、Jiaolong，各导出 `.blend` 与 `.fbx`。
- 6/6 重新打开检查：Armature、真实顶点组与权重、packed/embedded 纹理、动作及实际运动。

另有一个人为重复调用 child callback 的 advisory 未通过；该探针违反 Node 原生 `execFile` 的单回调契约，因此不计入必须通过项。该结论不隐藏在总通过数字中。

重要的证据留存说明：随后一次 `--negative-only` 运行将本地 `conversion-contract/report.json` 覆写成 13/13 负向案例通过、0 次转换/重开检查的报告。先前完整报告快照曾是 13/13 + 6/6 + 6/6，绑定上述 SHA，但当前完整聚合 JSON 已不在工作区。`inspection.json` 仍保留六个重开产物的检查结果；同目录 `agent-status.md` 描述完整运行，但其插件 SHA 是更早的 `1cd682...`，因此不能独自证明完整运行来自当前 SHA。需重新运行完整套件以恢复可机器复核、同一文件内绑定哈希的证据。请不要把当前 `report.json` 的 13/13 误读为 6/6 转换仍在该报告中。

## 回归入口

在仓库根运行基础检查，无需打开 GUI：

```powershell
node --check nmtm.js
node tests/build_nmtm_bridge.cjs --check
node tests/nmtm_plugin_smoke.cjs
node tests/nmtm_java_block_export.cjs
node tests/nmtm_conversion_contract.cjs --negative-only
```

有 Blender 和本地测试 GLB 时，运行实际转换与重开检查；`NMTM_BLENDER` 可覆盖测试默认的 Blender 路径：

```powershell
$env:NMTM_BLENDER = 'D:/Program Files/Blender4.2/blender.exe'
node tests/nmtm_conversion_contract.cjs
```

仓库维护的导出审查入口为：

```powershell
node tests/nmtm_export_contract.cjs
```

该脚本通过仓库内的 `tests/helpers/read-blockbench-sources.cjs` 直接只读解析安装版 `resources/app.asar` 中的 `dist/bundle.js.map`，无需预生成或提取 API 文件，也不启动 Blockbench。默认安装路径为 `D:/Apps/Blockbench/Blockbench.exe`；可通过 `BLOCKBENCH_EXE` 指定其他安装位置，或通过 `NMTM_BLOCKBENCH_ASAR` 直接指定 ASAR。报告写入 `output/nmtm-rig-repair/audit-c3-contract.json` 并记录被测插件 SHA256。缺少安装文件、source map 或所需 API 时命令报错退出，不会静默计为通过，因此该检查不属于无需软件安装的默认 `npm test`。原型脚本 `output/nmtm-rig-repair/audit-c3-contract.cjs` 仅是本地历史材料，正式入口不依赖它。

真实 renderer 回归入口为 [nmtm_rig_regression.cjs](../../tests/nmtm_rig_regression.cjs)。该脚本会启动隔离的 Blockbench 进程，不能加入默认静态检查冒充无界面测试。当前用户要求所有测试窗口留在虚拟桌面 2，且不得切换桌面或抢焦点；隔离未确认时必须保持窗口隐藏并退出，不能通过关闭防护或点击系统警报绕过。

## 原始本地证据

- 详细 API 审查：`output/nmtm-rig-repair/export-audit.md`
- 仓库审查入口：[nmtm_export_contract.cjs](../../tests/nmtm_export_contract.cjs)
- API 契约结果：`output/nmtm-rig-repair/audit-c3-contract.json`
- 转换/清理/重开报告：`output/nmtm-rig-repair/conversion-contract/report.json`
- 保留的 Blend/FBX 独立检查结果：`output/nmtm-rig-repair/conversion-contract/inspection.json`
- 转换代理状态记录（哈希较早，不能独立绑定最终完整运行）：`output/nmtm-rig-repair/conversion-contract/agent-status.md`
- runtime 当前状态与隔离失败记录：`output/nmtm-rig-repair/runtime/agent-status.md`
- [独立 Blender 保真度与动画验收说明](blender-fidelity.md)

`output`、安装版软件和游戏原始资源属于本地材料，不随仓库分发。上述 `output/` 路径只记录原工作站的证据位置，不是 GitHub 下载链接；新 clone 中缺少这些文件不代表检查已经在其他机器执行。正式导出契约脚本和 ASAR 读取 helper 则随仓库提供。后续验收应记录执行时间、插件 SHA256、输入文件哈希、报告路径以及是否真实加载/重开，再更新本记录。
