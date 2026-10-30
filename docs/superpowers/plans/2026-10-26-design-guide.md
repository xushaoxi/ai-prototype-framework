# 工作台设计指南实施计划

> **For agentic workers:** 使用 superpowers:executing-plans，在当前会话逐项执行。

**Goal:** 工作台完整阅读 16 章大纲，并在台账旁对照规则。
**Architecture:** Vite raw 导入现有 Markdown；受限结构解析与 React 安全渲染，不解释 HTML。指南页和参考面板共享内容与章节选择器。
**Tech Stack:** React、TypeScript、Ant Design、Playwright；无新增依赖。
**Spec:** ../specs/2026-10-26-design-guide-in-workbench-design.md（用户已确认方案 2）。

## Global Constraints

保留原台账与 Mock 规则；文档为单一来源；小屏抽屉；候选规则不标为已确认。

## Review Focus

直接访问刷新、打开参考时不丢失查询、模块切换、窄屏横向溢出、链接和文档内容漂移。

## Tasks

- [x] 添加 DG-001/002/003 浏览器测试：导航和 16 章、候选规则、同屏对照保留查询、手机抽屉；运行确认缺少入口而失败。
- [x] 创建 src/app/design-guide 内容解析与阅读组件，导入 docs/design/outline.md 和 design-guidelines.md；参考资料链接与章节正文安全展示。
- [x] App 注册 design-guide 路由和导航；台账区域增加非遮挡参考面板，窄屏用 Drawer，关闭与断点切换保留选章。
- [ ] 同步规范与验收文档；运行 verify、test:e2e，查看桌面/手机截图与控制台。
- [ ] 审查变更并执行 deliver，记录实际证据。

## Browser 路径

Browser plugin not available：会话无 Browser 技能及运行时，使用项目 Playwright 测试。

## 执行记录

- 在当前 checkout 新建 codex/design-guide-workbench 分支，保留之前的指南文档变更，不另建工作树。
- 原生 Chromium 缺失，使用已安装 Chrome；初始 E2E 已证明入口缺失而失败。
- 核心 verify 已通过（36 项测试）；新增指南 E2E 第一轮 3 项通过后补充断点、模块切换和编辑取消覆盖。
- 独立只读审查未发现交付阻断问题；已更新确认状态并补充编辑取消验收。最终证据以 release 清单与日志为准。
