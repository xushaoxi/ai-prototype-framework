# 表单容器示例 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在一个指南配套示例中比较弹窗、抽屉和完整页面的新增编辑。

**Architecture:** 从 RecordForm 提取共享字段渲染，示例使用资产字段定义和本地演示数据；工作台路由提供示例页及完整页面，不调用写入 API。指南第 09、11 章提供入口。

**Tech Stack:** React、TypeScript、Ant Design、Playwright。

**Spec:** docs/superpowers/specs/2026-10-28-form-container-examples-design.md

## Global Constraints

不修改真实台账数据；不引入依赖；复用同一表单字段；适配桌面及手机；保持工作台标签和弹层行为。

## Review Focus

新增必填校验；编辑示例初始值一致；非活动页弹层隐藏；完整页面可直达返回；示例提交不发业务写入请求。

### Task 1: 功能与路径

**Files:** `src/core/ui/RecordForm.tsx`, `src/app/design-guide/FormContainerExample.tsx`, `src/app/App.tsx`, `src/app/design-guide/DesignGuide.tsx`, `src/styles.css`, `tests/e2e/form-container-example.spec.ts`。

- [x] 先写浏览器失败测试，覆盖三种容器、字段复用、完整页面返回、手机及数据隔离。
- [x] 提取共享字段并实现示例页、三种容器和指南入口。

### Task 2: 文档与交付

**Files:** `docs/design/design-guidelines.md`, `docs/design/outline.md`, `docs/acceptance.md`, `README.md`。

- [x] 同步示例入口、数据隔离和 FORM-001 状态。
- [x] 运行完整交付、检查桌面手机截图和控制台。

执行记录：入口未实现时浏览器测试失败；实现后完整 npm run deliver 成功，42 项核心测试与 33 项浏览器测试通过。已检查桌面三种容器及手机抽屉截图；测试捕获浏览器控制台和页面错误，示例不发业务写入请求。
