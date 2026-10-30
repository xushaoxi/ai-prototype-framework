# 显式查询与回车实施计划

> 使用 superpowers:executing-plans 在当前分支连续执行；用户已确认点击查询并要求回车支持。

**Goal:** 统一点击和Enter查询规则，避免输入法选词误提交。
**Architecture:** 复用LedgerPage已有filter；沿用IME保护并添加输入提示，文档新增QUERY-001并映射第06章。
**Tech Stack:** React、Ant Design、TypeScript、Playwright；不新增依赖。
**Spec:** ../specs/2026-10-26-explicit-query-design.md

## Global Constraints

条件在显式提交时生效、回到第一页、保留真实HTTP/MSW路径，不复制模块页面。

## Review Focus

中文选词Enter、类别和关键词组合、未提交条件被状态标签误用、提交后仍停在第2页、手机提示挤压输入。

## Steps

- [x] 先写QUERY-001浏览器测试，确认第06章规则显示在旧实现失败，并验证已有输入法行为。
- [x] 补输入提示并验证组件已有IME保护，更新指南、章映射、业务规范与验收。
- [x] 运行针对性验证，审查桌面/手机截图及独立代码审查。
- [ ] 执行deliver，使用实际核心与浏览器日志交付。

## 执行记录

现有Input已提供IME保护，不额外实现。旧指南第06章缺少规则，先失败后接入。两个组合用例初版测试误用了分页aria-current和虚拟选项定位，已按实际DOM改为页码激活状态与可见选项；未修改产品来迎合测试。最终4项针对性浏览器测试通过，含按钮/Enter请求等价与已提交条件在状态切换后保留。桌面/手机截图已检查，独立审查无阻断问题，其补充覆盖建议已加入。完整证据以本轮deliver清单为准。
