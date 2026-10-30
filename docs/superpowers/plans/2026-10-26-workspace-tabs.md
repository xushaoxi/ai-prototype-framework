# Workspace Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans inline.

**Goal:** 多功能页同时打开并保留现场，减少台账重复标题与孤立操作。
**Architecture:** App保留已打开路由实例；WorkspaceTabs提供键盘可访问导航；LedgerPage通过active控制后台同步与弹层。
**Tech Stack:** React/TypeScript/Ant Design/Playwright。
**Spec:** docs/superpowers/specs/2026-10-26-workspace-tabs-design.md

## Global Constraints

不新增依赖、接口或业务规则；仍复用共享台账。关闭释放状态，切换保留状态，刷新只打开当前hash。最后一个标签不可关闭。

## Review Focus

后台弹层与请求、页面滚动恢复、长标签横滚及焦点、关闭活跃/非活跃页、状态筛选与功能标签可访问名称。

### Task 1: 页签与布局

**Files:** src/app/App.tsx、新增WorkspaceTabs.tsx、LedgerPage/RecordForm/RecordDetail、styles.css、tests/e2e/workspace-tabs.spec.ts。
**Interfaces:** WorkspaceTabs接收pages/active/title/onSelect/onClose；LedgerPage新增active属性控制请求和弹层。

- [x] 浏览器先验证已打开页面tablist不存在的失败。
- [x] 实现唯一页面标签与保留实例、关闭/键盘/滚动，以及紧凑布局和弹层活动控制。
- [x] 更新设计指南第02/03/07章、架构、README、验收；独立审查。
- [x] 完整deliver，检查桌面/手机截图和控制台，记录真实结果；不自动提交或推送。

执行记录：两个功能页测试先因tablist不存在失败，随后通过；13项定向回归通过（指南、CRUD、3项页签含保留未保存表单）。初次完整交付通过38核心/23浏览器，但尚未覆盖审查修复，最终结果待新交付。独立审查发现确认框跨页泄漏，补回归先失败，保存实例并在失活/卸载销毁后该项通过；表单增加模块唯一name。开发模式检查发现Modal焦点属性弃用警告，按当前类型改用focusable。

最终交付：npm run deliver退出0，38项核心测试与24项浏览器测试通过，控制台由fixtures检查。已检查最终资产桌面及手机截图；git diff --check通过。release/ai-prototype-framework-1.0.0-2026-10-26T03-28-52-897Z/manifest.json为包含审查修复的完整证据。
