# Column Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans inline.

**Goal:** 可调整宽度、显示列和导出列的共享台账。
**Architecture:** 列候选与偏好归一化独立纯函数；React保留/保存偏好；受控表头拖动；CSV显式列参数；列设置与导出弹窗组合到LedgerPage。
**Tech Stack:** React/TypeScript/Ant Design/Playwright/Vitest。
**Spec:** docs/superpowers/specs/2026-10-26-column-settings-design.md

## Global Constraints

无新增依赖；名称/操作列保留；宽80–600；导出至少一列且不包含操作/非列表字段；范围为已提交查询全部页。

## Review Focus

损坏/不可写存储、模块隔离、隐藏列导出、拖动误触排序、窗口缩小和表格真实宽度。

### Task 1: 列契约与CSV

**Files:** core/columns.ts、core/export-csv.ts、tests/domain/columns.test.ts、export.test.ts。
**Interfaces:** 列候选key/label/width；偏好visibleKeys/widths；recordsToCsv第三参可选列keys。
- [x] 核心测试先失败，再实现偏好校验与导出选列。

### Task 2: 界面与文档

**Files:** core/ui/ColumnSettings.tsx、ResizableColumnTitle.tsx、LedgerPage、styles、e2e/columns.spec.ts、设计指南/业务规范/验收。
- [x] 浏览器先观察列设置缺失的失败。
- [x] 实现偏好存储、显示列、列宽和导出选列；同步旧导出测试的新确认步骤。
- [x] 独立审查、完整deliver、截图与控制台检查，记录真实证据。

执行记录：核心测试先观察模块缺失及CSV忽略列参数而失败，实现后4项通过；浏览器先因缺少列设置失败，实现后3项专项通过，包含实际列宽、刷新、隐藏列真实CSV、存储异常。修正下载事件早于Modal关闭时测试过早定位第二次导出的问题（等待关闭并限定列表操作区）。独立审查无阻塞，补强可排序金额列拖动不排序、未提交草稿与已提交多页导出的覆盖。typecheck/lint通过，待完整交付。

补充验证：拆分过长的显示/拖动用例，切页先确认活动标签，手机宽度等待响应式布局稳定。4项构建浏览器专项通过。截图发现边缘浮层初始对齐时裁切，稳定边界检查原布局已可自动调整，仍将浮层改为底部居中减少边缘跳动；新增稳定边界断言。前一完整交付在浏览器阶段主动停止，最终证据以新运行结果为准。

最终验收记录（2026-10-27补记）：完整交付已于2026-10-26成功执行，40项核心测试、28项浏览器测试通过，verify/e2e退出码均为0。桌面和手机截图已检查；核心实现、选列测试与设计规则文件哈希均与交付源码一致。证据清单：release/ai-prototype-framework-1.0.0-2026-10-26T03-56-11-180Z/manifest.json。git diff --check通过。未推送或部署。
