# 查询布局 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 落地用户确认的查询条件每行数量与指南。
**Architecture:** 共享LedgerPage分离字段和按钮，CSS容器查询根据可用宽度排布。
**Tech Stack:** React、TypeScript、Ant Design、CSS、Playwright。
**Spec:** docs/superpowers/specs/2026-10-26-query-layout-design.md

## Global Constraints

不新增依赖、模拟数据字段或高级筛选能力；保留点击/Enter查询；两模块复用容器。

## Review Focus

指南占宽、手机类别与按钮分行、阈值两侧、条件宽度、文档实现状态。

### Task 1: 查询布局与QUERY-002

**Files:** LedgerPage.tsx、styles.css、DesignGuide.tsx、docs/design与acceptance、tests/e2e/query-layout.spec.ts。
**Interfaces:** 查询函数和模块接口不变；新增字段与按钮分组CSS类。

- [x] 写浏览器布局回归，先观察手机类别与关键词宽度/纵向顺序断言失败。
- [x] 实现字段网格与按钮分组，添加QUERY-002并注册第06章，同步基线与验收。
- [x] 跑完整deliver（含verify与浏览器测试），查看桌面和手机截图，检查控制台与diff。
- [x] 独立审查此次改动，处理阻塞问题。保留当前未提交协作成果，不自动推送或部署。

执行记录：首次测试定位器误取选择器内部，修正为外层控件后，两个模块均因手机类别宽度不等于关键词而失败；实现后2项通过。独立审查无阻塞；补充820px非手机窄内容区覆盖，验证容器查询单列。

完整回归首轮37核心通过、17浏览器通过，新增2项因测试误判850px视口下列表宽度不足600而失败；实际内容区602px，行为正确。修正为820px并先断言内容区小于600px，再检查单列。

最终证据：npm run deliver 退出0，37项核心测试与19项浏览器测试通过；已检查桌面/手机截图，控制台由fixtures检查，git diff --check干净。交付清单：release/ai-prototype-framework-1.0.0-2026-10-26T02-48-06-774Z/manifest.json。
