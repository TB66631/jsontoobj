# Netease Mesh To Modle（NMTM）

用于 Blockbench 桌面版的网易《我的世界》模型导入与导出插件。项目保留名称中的 `Modle` 拼写，插件 ID 为 `nmtm`，当前源码版本为 `0.6.0`。

可以批量导入 JSON 模型及其骨骼、权重、动画、贴图引用；支持传统方块几何和网易三角网格。BIN 导入需要能够匹配的 JSON 伴随文件。导出提供独立的 GLB、带骨架和纹理的 FBX、Blender 4.2 文件、Java 资源包和 EMF/CEM 适配路径。

## 安装和使用

在 Blockbench 桌面版的插件窗口中选择「从文件加载插件」，打开仓库根目录的 [nmtm.js](nmtm.js)。插件菜单名称以 `NMTM:` 开头。推荐 Blockbench 5.1.x；FBX 和 `.blend` 导出还需要 Blender 4.2，并在导出界面指定可执行文件。

安装只需要 `nmtm.js`。Blender 转换脚本已嵌入插件，根目录的 [nmtm_blender_bridge.py](nmtm_blender_bridge.py) 是便于维护的同源脚本，无需随插件另装 Python 包。

完整操作和导出目录说明见 [插件使用说明](NMTM_README.md)。请按目标格式选择导出器：

| 目标 | 支持范围 |
| --- | --- |
| GLB / FBX / Blender | 网格、纹理、骨架、权重、动画；FBX / Blender 经 Blender 4.2 转换 |
| Java 物品资源包 | 原版支持的静态方块几何，按 Minecraft 版本生成映射 |
| Java 方块替换包 | 替换现有方块的外观，三角网格通过体素近似 |
| EMF / CEM 实体包 | 支持的实体部件、方块几何、刚性骨骼；复杂曲面可体素近似 |

原版 Java 资源包无法注册新物品，也无法直接承载任意三角网格、蒙皮和骨骼动画。EMF 适配用于已有实体的模型替换。曲面转体素会损失细节；需要保留原始网格和蒙皮时使用 GLB / FBX / Blender。

## 开发与排查

开发检查使用 Node.js 20 或更新版本，无需 `npm install`：

```powershell
npm test
npm run diagnose
npm run repo:check
```

`npm test` 离线运行语法和便携回归检查，不打开软件窗口；`diagnose` 只读取环境、版本、源文件哈希和依赖路径；`repo:check` 检查 Git 跟踪范围及历史中的大对象。可选诊断报告写入项目自己的 `output/diagnostics/`。项目 `.npmrc` 关闭 npm 更新提示，并把 npm 缓存和日志放在当前工作区的 `output/npm-cache/`。

| 入口 | 内容 |
| --- | --- |
| [故障排查](docs/TROUBLESHOOTING.md) | 模型、纹理、骨骼、导出与测试失败的定位顺序 |
| [测试说明](docs/TESTING.md) | 离线检查、本机 Blockbench / Blender 验收、渲染与抽帧命令 |
| [测试脚本索引](tests/README.md) | 各脚本的职责和前提 |
| [开发约定](CONTRIBUTING.md) | 改动、嵌入脚本同步、提交范围与问题报告 |
| [当前验证状态](docs/STATUS.md) | 已有证据、当前阻塞和待完成项 |
| [审查记录](docs/audits/README.md) | 子代理的导出、保真度、运行时与仓库检查记录 |

## 仓库结构

```text
nmtm.js                    可安装的单文件 Blockbench 插件
nmtm_blender_bridge.py      Blender 转换桥源码
NMTM_README.md              插件操作与格式说明
scripts/                   离线检查、诊断、Git 发布范围检查
tests/                     回归测试与受保护的本机验收工具
tools/legacy/              早期静态 OBJ 与 Blender 脚本
docs/                      排查、验证状态和审查记录
.github/                   自动检查与问题报告模板
```

仓库采用 [MIT License](LICENSE)。第三方游戏资源、Blockbench、Blender 及其依赖各自遵循原许可证；项目许可证不包含这些本地素材。
