# FORM-007 Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 统一首次提交校验、错误定位、修正反馈及重复提交保护。
**Architecture:** 共享useFormFeedback hook由业务表单与示例复用，Form初始关闭自动验证，onValuesChange仅复查曾失败字段，提交统一捕获字段错误。store继续执行业务校验。
**Tech Stack:** React / TypeScript strict / Ant Design / Playwright，无新依赖。
**Spec:** docs/superpowers/specs/2026-10-29-form-validation-design.md

## Global Constraints
- 复用当前工作目录已有未提交成果，不创建缺失这些成果的新checkout；不提交、部署或推送。
- 关键规则先失败测试；npm run deliver完整成功才交付。
- Browser plugin not available，使用项目Playwright；检查桌面与手机截图和控制台。

## Review Focus
- 未提交输入与失焦不红字。
- 一处修正不能验证尚未报错字段。
- API业务错误也计数且可修正，网络失败输入保留。
- 重复点击只请求一次，保存中不可关闭。
- 三种容器及移动滚动聚焦一致，旧金额兼容不退化。

## Task 1: 共享反馈与容器接入
Files: src/core/ui/useFormFeedback.ts, FormValidationSummary.tsx, RecordForm.tsx, FormContainerExample.tsx; tests/e2e/form-validation.spec.ts.
Interfaces: hook(form).submit(action), onValuesChange, onFieldsChange, errors, submitting；summary显示错误数量与定位入口。
- [x] 新增浏览器测试，验证首次填写安静、首次提交计数聚焦、修正复查、示例容器一致，运行观察失败。
- [x] 实现共享逻辑并接入业务表单与示例，保留现有HTTP错误处理与输入。
- [x] 运行针对性测试及旧控件回归，验证慢响应重复保存和网络错误恢复。

## Task 2: 指南与交付
Files: docs/design/design-guidelines.md, outline.md, docs/acceptance.md, docs/architecture.md, README.md, business-specs/assets.json, src/app/design-guide/DesignGuide.tsx.
- [x] 同步FORM-007及AST-016验收要求。
- [x] 独立复核本次变更，处理真实问题。
- [x] npm run deliver，检查桌面手机截图、控制台与实际清单。

执行记录：首次红灯证明预提交提前校验；API-400红灯证明保存时禁用控件会阻止接口错误聚焦，动画帧方案在完整回归仍失败，最终改为提交状态复位后的React effect定位，定向API-400测试通过。独立复核确认该问题，其余未见阻塞项。当前单选复选演示字段可选；未来改为必填时需同步扩展组内选项聚焦验收。

最终证据：npm run deliver 成功（exit 0），46项核心测试与42项浏览器测试通过。桌面1440×1000、手机390×844截图检查通过；无未预期控制台错误。release/latest.json complete=true，目录 ai-prototype-framework-1.0.0-2026-10-29T03-19-35-833Z。
