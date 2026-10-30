# Workbench V1 Completion Plan

> Use superpowers:executing-plans; independent domains use superpowers:dispatching-parallel-agents.

**Goal:** 完成可复用工作台V1整体规则与任务闭环。
**Spec:** docs/superpowers/specs/2026-10-29-workbench-v1-completion-design.md
**Architecture:** 共享退出保护注册到功能标签；独立通用组件示例；现有详情/API链路恢复；16章指南映射。
**Constraints:** npm、兼容Node、strict、无新依赖、不部署推送；不丢弃现有工作目录；真实MSW测试。
**Review focus:** 修改恢复初值、后台标签丢失、保存期间关闭、接口竞态、移动布局、指南事实与实现一致。

- [x] FORM-008失败测试、共享比较与关闭保护、容器接入。
- [x] 详情错误恢复与测试。
- [x] 通用组件示例与测试、导航注册。
- [x] 16章V1指南、范围与适配依据。
- [x] 集成审查、verify、全量e2e、桌面手机截图和完整deliver。

实际结果：完整deliver成功，46项核心测试、53项Chrome浏览器测试通过。桌面1440×1000、手机390×844检查；无未预期控制台异常。独立复核未保存守卫与注册清理，无阻塞问题。React refs lint问题已通过layout effect及组件/hooks拆分修正。
