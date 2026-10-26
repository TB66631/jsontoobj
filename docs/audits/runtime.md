# Blockbench 运行时验收记录

记录日期：2026-10-27。目标版本：NMTM 0.6.0。当前结论是：离线保护逻辑检查通过，真实桌面验收尚未完成。最新尝试在插件加载前因 Windows 安全警报改变前台窗口而终止，未生成当前插件的新 GLB。

本文件区分三类证据：仓库中的测试实现、已执行的离线检查、只存在于本地 `output/` 下的历史运行记录。测试代码已经写好不等于对应功能已经通过真实 Blockbench 验收。

## 版本与环境

| 项目 | 本次核对值 |
| --- | --- |
| 生产插件 | [`nmtm.js`](../../nmtm.js)，版本 `0.6.0` |
| 插件 SHA256 | `004238161e4a73f889b5421e40fe66b5dbeb98623c67dcf939f183f8abdddd79` |
| Blockbench | `5.1.4`，读取已安装的 `D:/Apps/Blockbench/resources/app.asar` |
| 原始主进程入口 | ASAR 内 `electron/main.js` |
| 原始主进程入口 SHA256 | `6f0f0e75ef2ce8cd542a0bf6daf73d50d22eda1c5e1b76db7027989a39895a69` |
| 离线检查使用的 Node.js | `v24.14.1` |
| 同进程原生桥接 | Koffi `3.3.4`，仅安装于工作区 E 盘的本地工具目录 |
| 桌面约束 | 用户停留在桌面 1，测试窗口必须验证归属桌面 2；原生桌面索引分别为 `0`、`1` |

这些哈希由当前本地文件重新核对。后续修改插件、Blockbench 或测试保护代码后，需要重新记录版本；本记录不能自动证明新版本通过。

## 仓库中的测试实现

| 源文件 | 作用 |
| --- | --- |
| [`tests/nmtm_rig_regression.cjs`](../../tests/nmtm_rig_regression.cjs) | 主运行时验收入口，包含 7 个合成案例、7 个真实模型案例和生命周期验收 |
| [`tests/nmtm_hidden_blockbench.cjs`](../../tests/nmtm_hidden_blockbench.cjs) | 创建独立 Electron 副本、独立 profile，读取原安装 ASAR 并校验窗口隔离日志 |
| [`tests/nmtm_isolated_electron_main.cjs`](../../tests/nmtm_isolated_electron_main.cjs) | 在加载原主进程前约束窗口构造、显示、聚焦、对话框、更新器和外部启动 |
| [`tests/nmtm_inprocess_desktop_guard.cjs`](../../tests/nmtm_inprocess_desktop_guard.cjs) | 同进程 DWM 遮蔽、窗口归属核验、桌面 2 分配、前台和活动桌面保护 |
| [`tests/nmtm_cdp_pipe.cjs`](../../tests/nmtm_cdp_pipe.cjs) | 通过继承的 fd3/fd4 与原 Blockbench 渲染器通信，无 TCP 调试监听端口 |
| [`tests/nmtm_rig_lifecycle.cjs`](../../tests/nmtm_rig_lifecycle.cjs) | 原生 `.bbmodel` 写盘重载，以及分组、多骨架、实时几何编辑和导出排除案例 |

安装目录保持只读。测试副本只适配原始主进程的 Electron 导入绑定，并将 `import.meta.url` 固定到原 ASAR URL，以保留原有模块和资源解析。生产插件不由测试改写，预定使用 `Plugin.loadFromFile({path: ...}, false)` 加载真实 `nmtm.js` 文件。

## 已执行的检查

2026-10-27 重新执行以下检查，均通过；没有启动 GUI：

```powershell
node tests/nmtm_cdp_pipe_unit.cjs
node tests/nmtm_hidden_bootstrap_unit.cjs
node tests/nmtm_desktop_guard_unit.cjs
node --check tests/nmtm_rig_regression.cjs
node --check tests/nmtm_rig_lifecycle.cjs
node --check tests/nmtm_cdp_pipe.cjs
node --check tests/nmtm_hidden_blockbench.cjs
```

| 检查 | 证明的内容 | 不覆盖的内容 |
| --- | --- | --- |
| CDP pipe 单元检查 | NUL 分帧、跨数据块 UTF-8、浏览器目标发现、flattened renderer session 路由 | 实际插件导入和导出 |
| 隐藏启动单元检查 | 强制隐藏/不可聚焦构造，显示和聚焦抑制，对话框、弹窗、更新器拦截 | Windows 实际 ApplicationView 注册和桌面归属 |
| 原生桌面保护单元检查 | 先验证 cloak 再显示；访问被拒绝、缺失 cloak、前台变化时终止并隐藏 | 当前机器安全警报的原因或抑制 |
| Node 语法检查 | 测试文件可被解析 | Blockbench API 调用在真实渲染器中的行为 |

最近一次原生启动还实际证明了以下有限事实：原始主进程可由副本载入；同进程 `DwmSetWindowAttribute` 成功；`DwmFlush` 后 `DWMWA_CLOAKED` 的 app-cloak 位为 `1`；继承管道能够连接到原 Blockbench 渲染器。这次启动未通过桌面隔离关卡，因此这些事实不能计为插件运行时通过。

## 当前阻塞与时间线

最新运行的关键事件来自本地 `profile-Ms04Zj-windows.jsonl`，时间为 `2026-10-26T16:01:02Z` 起，即北京时间 2026-10-27 凌晨：

1. 独立 Blockbench 副本 PID `24400`，自有 HWND `3802806`，构造时 `show:false`、`focusable:false`，实际不可见且未聚焦。
2. 同进程 DWM 遮蔽成功并验证标志位 `1`，随后仅在保持遮蔽时调用捕获的原始 `showInactive`，以注册 ApplicationView。
3. 原主进程请求的普通 `show`、`maximize` 被抑制；继承 CDP 管道连接渲染器成功。
4. 约 0.58 秒后，前台由 ChatGPT（PID `26504`、HWND `6359192`）变成“Windows 安全中心警报”（PID `5400`、HWND `2099132`）。该窗口不是自有测试窗口；活动桌面仍为索引 `0`，测试窗口的 cloak 标志仍为 `1`。
5. 保护逻辑检测前台变化，隐藏并销毁仍被遮蔽的测试窗口，终止副本。尚未验证桌面 2 分配，也尚未加载插件或运行模型案例。

先前一次 TCP 调试尝试也捕获到独立的“Windows 安全中心警报”改变前台。改用继承管道后再次出现，故“只要移除 TCP 调试端口就能解决”这一假设不成立。

2026-10-27 的只读调查进一步确认了警报对应的程序路径：Windows Firewall 通道 Event 2097、Record 10155/10156 在 `16:01:03.248Z` 和 `16:01:03.257Z` 为 E 盘 `profile-Ms04Zj/isolated-electron-runtime/Blockbench.exe` 新增 TCP/UDP Query User 入站阻止规则，紧接着 `16:01:03.330Z` 前台变成安全警报。更早的 TCP 尝试也为另一个随机副本路径新增了同类规则。当前 harness 每次把 EXE 放入新 profile，因此已有按程序路径匹配的规则不能直接复用于下次随机副本。这是系统对测试副本的提示，未进入 NMTM 插件加载。

安装 renderer 的 PeerJS 模块还有一条已核实的自动启动调用链：`edit_sessions.js` 导入 PeerJS，`new Util()` 的 `supports` 初始化构造 `RTCPeerConnection`，创建 `_PEERJSTEST` DataChannel 后关闭。源码、编译 bundle 及只使用 fake RTC 的离线 VM 检查均确认该调用发生于模块初始化。没有原生监听端口或调用栈证据，不能据此断言该 RTC 调用是历史防火墙警报的唯一原因。

只读本地规则快照存在原安装及旧副本路径的 TCP/UDP Allow 项，但旧 E 盘副本已经清理；对有效 ActiveStore 的精确查询被拒绝访问。现有本地注册表规则不证明后续运行一定无提示。后续可评估固定且已核对的运行路径，并保留独立 profile 和全部窗口保护；本次没有实现或启动该方案，没有新增、放宽或删除防火墙规则。详细事件、源码定位、哈希和限制保存在本地 `output/runtime-alert-static-analysis-20261027.md`。

更早的纯隐藏窗口方案无法取得 ApplicationView 桌面归属；外部 Python 进程调用 DWM app-cloak 返回 `0x80070005 / E_ACCESSDENIED`，在显示前终止。同进程原生桥接解决了 cloak 调用权限问题，尚未解决独立安全警报对前台的影响。

未点击、关闭或自动化操作安全警报，未修改防火墙或系统安全设置。最新清理后，以及本次文档整理时的只读进程检查，均未发现存活的 Blockbench/Electron 测试进程。本轮没有再次启动 GUI。

## 尚待真实运行的覆盖范围

以下逻辑已实现于测试脚本，但当前生产哈希下均未完成真实桌面验收。生命周期模块中的 Blockbench API 假设也仍须以实际运行核对。

| 范围 | 预定检查 |
| --- | --- |
| 真实插件加载 | `Plugin.loadFromFile`、插件 ID/注册状态/测试 hook、没有导入错误提示 |
| 7 个合成案例 | 缺失骨架拒绝、初始四元数归一化、重复权重求和与整数型顶点 key 顺序、非均匀 rest scale、负 rest scale、两种 channel-mask 拼写、双 mesh section |
| 骨骼和权重 | 源顶点对应关系、归一化权重、骨骼 origin、rest quaternion、scale、GLB joints/weights、有限数和 inverse bind matrices |
| 四元数预览 | 非 identity rest、多关键帧轨道，在首帧/中间/末帧调用真实 animator 插值与显示；与独立源 quaternion slerp 比较，角误差阈值 `0.01°` |
| 7 个真实模型 | Craft、Cyber 背饰、牛魔王披风、蛟龙坐骑、花龙尾巴、Galaxy 坐骑、悟空坐骑，读取本地原始 mesh/skeleton/animation |
| 真实贴图解析 | 由生产 source-path/material resolver 查找资源，不手工替换真实案例的纹理和面；检查原路径、PNG 解码尺寸、UV 画布尺寸、面纹理 UUID、精确 UV、嵌入原 PNG 的 SHA256 |
| 原生项目生命周期 | `Codecs.project.compile({raw:true,bitmaps:true})` → E 盘 `.bbmodel` 文件 → 重新读取解析 → `Codecs.project.parse`；核对注册元数据、实时顶点、权重、动画数量、重载后四元数预览和 GLB 再导出 |
| 分组和多骨架 | 首个 rig 放在有旋转/位移的 Group 下，编辑实时顶点，再导入第二个 rig 并添加普通三角面；检查 parent transform、source IBM 和编辑后的导出位置 |
| 导出排除 | 分别排除父 Group、首个 rig、首个 mesh；所有 rig 排除后只保留普通几何，验证没有骨架数据重新进入导出 |

真实资源依赖本地 `NetMC Assets/[3.8.30.293955]/assets/assets/resource_packs/vanilla_netease`。当前脚本中的七个模型标识为：

```text
ss_s8Time_Craft
cs_s6Cyber_skin_guajian_back
cs_s7NiuMoWang_skin_guajian_pifeng
cs_s6Jiaolong_horse
cs_s6FlowerDragon_skin_guajian_weiba
ss_s8Galaxy_horse
cs_s7WuKong_horse
```

合成案例会注入确定的 PNG fixture；真实案例必须走生产解析器。这两类贴图检查不能混为同一类运行证据。

## 安全的复现方式与下一步

离线检查可直接按前述命令运行。GUI 验收当前保持暂停，不能在前台问题未解决时反复重试、取消前台断言、解除 cloak、切换用户桌面或自动操作安全警报。

下次 GUI 尝试前，需要确定能保持前台不变的隔离方案，并遵守下列顺序：

1. 从当前安装只读创建 E 盘副本；profile、temp、sessionData、crashDumps 和工具缓存均留在 E 盘。不要修改安装目录或原用户 profile。
2. 核对至少有两个桌面、用户活动桌面为索引 `0`，记录当前前台 HWND/PID/title。按 PID 核验每个待操作 HWND 归本次副本所有。
3. 所有窗口先以 `show:false`、`focusable:false`、`skipTaskbar:true` 创建；普通显示、聚焦和外部窗口路径仍须被抑制。
4. 在同一进程设置 app-cloak，等待 `DwmFlush` 并读取标志确认成功。只有此后才可将自有窗口移到屏幕外并调用不聚焦的 `showInactive` 注册 ApplicationView；整个生命周期保持 cloak，不得解除。
5. 移到桌面索引 `1` 并独立读取确认，期间检查用户活动桌面和前台 HWND 始终不变。任何失败都隐藏/销毁仍被遮蔽的自有窗口并退出。
6. 桌面分配完整通过后，才允许真实插件加载、模型案例、项目重载和导出。退出时只停止本次拥有的进程树，核对无残留。

当隔离问题已解决且重新允许本次 GUI 尝试后，主入口为：

```powershell
# 当前不要执行：先解决并复核上面的隔离阻塞。
# 环境开关只启用保护入口，不代表隔离已经成功。
$env:NMTM_ALLOW_HIDDEN_GUI = '1'
$env:NMTM_TEST_VIRTUAL_DESKTOP = '2'
try {
    node tests/nmtm_rig_regression.cjs
} finally {
    Remove-Item Env:NMTM_ALLOW_HIDDEN_GUI -ErrorAction SilentlyContinue
    Remove-Item Env:NMTM_TEST_VIRTUAL_DESKTOP -ErrorAction SilentlyContinue
}
```

此入口强制 `NMTM_TEST_CDP_PIPE=1`。本机可用 `BLOCKBENCH_EXE` 覆盖安装可执行文件路径，`NMTM_TEST_DESKTOP_DLL_SOURCE` 覆盖已核对的桌面 accessor DLL 来源，`NMTM_TEST_PYTHON` 覆盖旧 helper 的 Python 路径检查。当前主流程使用同进程 Koffi guard，旧 Python helper 不执行桌面分配。Koffi 必须预先存在于本地 `output/nmtm-rig-repair/native-tools/node_modules/koffi`；这些外部安装和本地工具依赖不是仓库自带的运行环境。

完成一次可接受的运行后，应记录新的 `startedAt`、插件哈希、Blockbench 版本、`cdpTransport`、完整 `windowIsolation`、全部案例结果和 `lifecycle.passed`，再检查新生成 GLB 的哈希和内容。还需要按最终验收要求完成视觉/交互检查；数值通过本身不能替代视觉确认。

## 本地证据与产物边界

以下是本地生成数据的位置，可能被 Git 忽略或清理，不属于可移植的仓库依赖，也不应作为 GitHub 中必须存在的链接：

| 本地路径（相对工作区） | 含义 |
| --- | --- |
| `output/nmtm-rig-repair/runtime/agent-status.md` | 启动策略、尝试和失败原因的过程记录 |
| `output/nmtm-rig-repair/runtime/profile-Ms04Zj-windows.jsonl` | 最新继承管道尝试，记录 cloak 成功及独立安全警报改变前台 |
| `output/nmtm-rig-repair/runtime/profile-ttz3Cw-windows.jsonl` | 先前 TCP 尝试，也记录独立安全警报改变前台 |
| `output/nmtm-rig-repair/runtime/profile-RqnUjj-windows.jsonl` | 首次同进程 cloak 尝试；当时尚未加入即时前台窗口归属日志 |
| `output/runtime-alert-static-analysis-20261027.md` | 新副本程序路径的防火墙事件、PeerJS 启动调用链及只读规则调查；未重试 GUI |
| `output/nmtm-rig-repair/runtime/rig-regression.json` | 成功进入模型测试后才会更新的结果文件；启动早期失败可能保留旧报告 |
| `output/nmtm-rig-repair/runtime/*.glb` | 可能是旧版本或旧测试策略的产物，须结合报告时间和插件哈希验证来源 |
| `output/nmtm-rig-repair/runtime/lifecycle-roundtrip.bbmodel` | 预定生命周期产物；本次阻塞期间未重新生成 |

本次阻塞发生在首次结果写盘之前，因此已有 `rig-regression.json`、GLB 和 `.bbmodel` 的存在不证明当前版本通过。源代码合同审计、转换工具检查与真实桌面生命周期属于不同验证层级，后续报告应分别列明覆盖和缺口。
