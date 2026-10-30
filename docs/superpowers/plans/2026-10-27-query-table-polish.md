# 查询与表格易读性优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让台账筛选状态、无结果恢复、横向溢出和长文本更容易理解与操作。

**Architecture:** 在共享 LedgerPage 表达已提交/待提交条件，基于真实表格滚动尺寸显示提示；通过 CSS 与 Tooltip 增强可读性，不改变数据接口。

**Tech Stack:** React, TypeScript, Ant Design, CSS。

**Spec:** docs/superpowers/specs/2026-10-27-query-table-polish-design.md

## Global Constraints

不引入依赖；不改变业务规则或 API；资产与供应商共用实现；不覆盖既有用户工作。

## Review Focus

单项清除后标签和控件同步；状态下拉与顶端标签同步；未提交条件不被误认为已生效；表格无横滚时无提示；无筛选结果恢复行为不改变数据。

### Task 1: 查询条件反馈

**Files:** `src/core/ui/LedgerPage.tsx`, `src/styles.css`。

- [x] 显示可单独清除的已提交条件和未提交修改提示。
- [x] 保持状态标签与下拉共享状态；状态标签继续立即应用。
- [ ] 无结果且存在条件时提供清除条件入口；空数据继续使用原有空态。

### Task 2: 表格阅读与规则同步

**Files:** `src/core/ui/LedgerPage.tsx`, `src/styles.css`, `docs/design/design-guidelines.md`, `docs/design/outline.md`, `business-specs/assets.json`, `business-specs/vendors.json`, `docs/acceptance.md`。

- [x] 基于实际横向溢出显示提示，并使长名称可聚焦查看全文。
- [x] 保留现有响应式更多筛选布局，并明确草稿状态。
- [x] 同步指南与 AST/VEN 接受条件。


执行记录：完整 npm run deliver 成功，42 项核心测试及 31 项浏览器测试通过；桌面与手机筛选截图已检查，页面错误由 E2E 控制台捕获器检查且无异常。修正列宽更新后横滚区不重新测量，以及既有记录编码测试与筛选标签文案匹配。批量处理与保存筛选方案按规格暂缓，待业务规则确认。
