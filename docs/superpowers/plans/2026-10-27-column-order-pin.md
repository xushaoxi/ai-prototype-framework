# 列顺序与固定 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans inline.

**Goal:** 提供拖拽、上下箭头和左右固定列。
**Architecture:** 扩展版本1本地偏好的orderKeys/fixedKeys，归一化兼容旧数据；共享列设置与LedgerPage消费同一顺序和固定分组。
**Tech Stack:** React/TypeScript/Ant Design/Vitest/Playwright。
**Spec:** docs/superpowers/specs/2026-10-27-column-order-pin-design.md

## Global Constraints

不引入依赖；名称/操作列保留；固定分区内排序；保存浏览器本地偏好；窄屏不遮挡中间列；导出排序跟随表格。

## Review Focus

旧偏好迁移及无效值；隐藏列与固定恢复；同区拖拽和箭头首尾；桌面左右固定与窄屏回退；导出实际列顺序。

### Task 1: 偏好与规则

**Files:** core/columns.ts、tests/domain/columns.test.ts。
**Interfaces:** ColumnPreferences新增orderKeys和fixedKeys；moveColumn及setColumnFixed导出纯函数。
- [x] 编写旧偏好、分组/同区移动与无效参数失败测试并运行。
- [x] 实现归一化和纯函数，核心测试通过。

### Task 2: 界面与验收

**Files:** ColumnSettings.tsx、LedgerPage.tsx、styles.css、columns.spec.ts、业务规范和设计指南。
- [x] 编写拖拽、箭头、固定、刷新和导出顺序等浏览器失败测试。
- [x] 实现交互、固定效果、无障碍与窄屏退化；同步文档。
- [x] 独立审查、完整deliver、桌面手机截图和控制台检查。

执行记录：核心测试先因旧偏好缺少排序状态失败，随后通过；浏览器测试先因缺少上下箭头失败。修正测试定位器嵌套作用域及连续菜单关闭动画后，拖拽、箭头、左右固定、刷新、导出顺序及手机测试通过。独立审查无阻塞，固定横滚坐标检查已纳入回归；固定状态的title已被Chrome无障碍接口作为描述暴露，并有浏览器断言。已检查桌面与手机截图。

完整交付记录：npm run deliver 成功，核心测试 42 项、浏览器测试 30 项通过；release/latest.json 标记完整交付。已检查最终桌面及手机截图。
