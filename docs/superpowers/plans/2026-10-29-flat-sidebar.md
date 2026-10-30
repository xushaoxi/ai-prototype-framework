# Flat Sidebar Implementation Plan

**Spec:** docs/superpowers/specs/2026-10-29-flat-sidebar-design.md
**Goal:** 24模板按业务顺序分组平铺，一次点击直达。
**Architecture:** WorkspaceNavigation共享模块registry与模板catalog；App只提供当前route，所有链接保持现有hash与工作台标签行为。
**Constraints:** 无新依赖、不改业务数据、不提交部署，保留用户工作目录；Browser plugin not available，使用项目Playwright。

- [x] 先写NAV-002菜单/手机浏览器测试并观察失败。
- [x] 提取共享导航和六组菜单数据，保证完整覆盖与唯一高亮，增加菜单独立滚动。
- [x] 同步指南与验收，跑专项和全量deliver，查看桌面手机截图及控制台。

实际结果：专项2项通过；完整deliver成功，65项核心测试、88项浏览器测试通过。桌面1440与手机390截图已查看，菜单直达/高亮/独立滚动/手机关闭正常，无未预期控制台错误。
