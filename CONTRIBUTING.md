# 贡献指南

## 改动范围

- 保持 nmtm.js 为可直接加载到 Blockbench 的插件入口；避免提交用户资源和生成结果。
- Blender 桥以根目录 nmtm_blender_bridge.py 为可读源码，并在改动后运行 npm run bridge:check 确认插件内嵌 payload 同步。
- 新增离线逻辑测试使用 Node.js 内置库并加入 npm test；需要真实素材、Blender、Blockbench、网络或 GUI 的验收单独运行，不能静默加入便携检查。
- 测试输出和临时目录放到工作区下的 output/。不要触碰 C 盘缓存，不要修改安装版 Blockbench 的 app.asar。
- 用户正在使用前台桌面时，GUI 验收必须在虚拟桌面 2 隔离并 fail closed；无法验证隔离就不启动或继续运行窗口。

## 提交前检查

    npm test
    npm run diagnose
    npm run repo:check
    git status --short

若只做了静态检查，要明确写成静态检查；不要声称 Blender 重开、动画渲染或真实 Blockbench 导入通过，除非该运行确实完成。

## 问题报告

报告 Blockbench/Blender 版本、复现步骤和最小合成输入。不要上传未经许可的 Minecraft/网易资产、用户 profile、Cookies、访问令牌或完整测试输出。请遵守故障排查文档的数据清理要求。
