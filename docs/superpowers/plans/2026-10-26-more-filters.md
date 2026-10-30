# 更多筛选 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans inline.

**Goal:** 资产台账登记日期范围与联动状态筛选。
**Architecture:** 有限模块开关、ListQuery日期边界、store过滤与校验、共享UI内联展开。
**Tech Stack:** React/TypeScript/Ant Design/MSW/Vitest/Playwright。
**Spec:** docs/superpowers/specs/2026-10-26-more-filters-design.md

## Global Constraints

只资产启用；日期按天含边界；点击/Enter统一提交；状态标签与下拉共用条件；不新增依赖。

## Review Focus

日期非法/倒置/单边、计数与导出范围、未提交与隐藏草稿、标签覆盖状态草稿、窄屏迁移日期而不丢失值。

### Task 1: 日期契约与规则

**Files:** types.ts、handlers.ts、store.ts、assets/definition.ts、check-spec.mjs、business-specs/assets.json、tests/integration/api.test.ts。
**Interfaces:** ListQuery新增dateFrom/dateTo；ModuleDefinition.queryFilters可选有限枚举。

- [x] 先写HTTP测试：精确日期、范围边界、状态计数、空结果、单边、非法及反向区间；运行观察失败。
- [x] 实现契约、解析、store校验过滤、模块开关与规范一致性；测试通过。

### Task 2: 共享查询交互与指南

**Files:** LedgerPage.tsx、styles.css、tests/e2e/advanced-query.spec.ts、docs/design及acceptance。
**Interfaces:** 消费Task1契约，日期与状态草稿仅提交后生效。

- [x] 浏览器先验证更多筛选不存在的失败。
- [x] 实现内联展开、日期响应式迁移、状态标签联动、隐藏计数及重置；更新指南实现状态。
- [x] 独立只读审查本次范围；完整deliver通过、检查桌面手机截图与控制台，记录真实结果。

执行记录：HTTP先观察日期被忽略而失败，实现后5项HTTP测试通过；新增浏览器先观察更多筛选入口不存在而失败。修正空结果不展示分页总数、带图标按钮/导航的测试定位器后，新交互完整通过，包含非空日期范围、隐藏1/2条件、状态/日期草稿边界、重置和导出参数。独立审查无阻塞，补强草稿覆盖测试，修复收起aria-controls悬空引用。已查看桌面/手机截图。

最终结果：完整 npm run deliver 退出0，38项核心测试、20项浏览器测试通过；桌面/移动截图已检查，fixtures检查控制台。交付清单：release/ai-prototype-framework-1.0.0-2026-10-26T03-03-57-303Z/manifest.json。git diff --check通过，未推送部署。
