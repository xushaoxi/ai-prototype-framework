# 通用字段控件 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 在新增资产表单演示通用控件，支持保存、详情、编辑和备份往返。
**Architecture:** 显式字段类型驱动共享表单，多值只存string[]；序列化经HTTP进入store校验，详情与导出统一显示值。
**Tech Stack:** React、TypeScript、Ant Design、MSW、Vitest、Playwright。
**Spec:** docs/superpowers/specs/2026-10-29-form-controls-design.md

## Global Constraints

不引入依赖；保留已有记录；新增字段可选；数据规则在store；规范和验收同步。

## Review Focus

数组错误类型与重复值；不合法时间与倒置日期；整数/金额精度；空金额不转0；弹窗正文滚动及原有表单回归。

### Task 1: 类型与数据

**Files:** types.ts、form-values.ts、store.ts、check-spec.mjs、form-controls.test.ts。
- [x] 失败测试覆盖新类型序列化、合法非法写入、备份及旧数据。
- [x] 实现显式类型与store校验。

### Task 2: 控件与示例

**Files:** RecordFormFields.tsx、RecordForm.tsx、FormContainerExample.tsx、assets/definition.ts、business-specs/assets.json、RecordDetail.tsx、field-values.ts、export-csv.ts。
- [x] 复用控件、提示、单位、选项搜索及弹窗滚动。
- [x] 新增字段保存、编辑、详情与导出显示一致。
- [x] 同步受显式默认值变化影响的既有验收。

### Task 3: 指南与交付

- [x] 同步指南、架构和验收。
- [x] 完整交付及桌面手机截图检查。
- [x] 独立审查并修复重要问题。

执行记录：新类型领域测试先失败后通过；独立审查发现并修复稀疏数组、旧金额精度兼容及可选单选清空；补充旧金额仅聚焦失焦不改写和手机范围日历回归。最终 npm run deliver 成功，46 项核心测试、36 项浏览器测试通过，桌面/手机截图已查看，浏览器控制台检查通过。
