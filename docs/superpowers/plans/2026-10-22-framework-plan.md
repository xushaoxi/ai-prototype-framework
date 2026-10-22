# AI 原型框架 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Autonomous execution authorized by user; no implementation approval pause required.

**Goal:** 可复制复用、具备完整 T01 业务闭环和可验证交付的独立原型框架。
**Architecture:** 模块定义驱动 T01 容器。统一 store 通过 MSW REST 供 UI 和测试使用。源码、业务规范与证据共同交付。
**Tech Stack:** React, TypeScript, Vite, Ant Design, MSW, Vitest, Playwright, npm。
**Spec:** docs/superpowers/specs/2026-10-22-framework-design.md

## Global Constraints
- Node 20.20.0 兼容，依赖精确锁定；无服务器/密钥依赖；不修改既有项目。
- 接口、路径、状态、模块名按 spec；只实现 T01，特殊逻辑显式扩展；Mock 角色不是安全机制。
- 用户离线授权自主决策并完成；仅本地交付，不推送/部署。

## Review Focus
- 非法导入和存储失败必须保持旧数据完整；测试验证原子性。
- 状态操作及旧版本编辑不得绕过；领域测试验证冲突。
- 过滤后状态摘要与导出语义一致；UI明确查询结果范围。
- 生成脚本防覆盖/路径穿越，模块代码与业务规范同步；真实生成测试。
- 刷新持久化、模块隔离和手机溢出；E2E 覆盖。

### Task 1: 工程与契约（root）
Files: package.json, configs, src/core/types.ts, src/modules/**/definition.ts, src/modules/registry.ts, business-specs/*.json.
Interfaces: 按 spec 的类型与模块导出；任务2消费，任务3消费。
- [x] 记录规范/计划与自主决策，初始化 Git；安装兼容依赖并生成 MSW worker。
- [x] 创建两套 T01 模块定义与轻量业务规范，规范一致性测试先行。
- [x] 验证模块元数据与 TypeScript；提交。

### Task 2: 统一业务数据与 HTTP（独立实现者）
Files: src/mocks/{seed,store,handlers,browser}.ts, src/core/api.ts, tests/domain/*.test.ts, tests/integration/*.test.ts.
Interfaces: 严格消费 core/types.ts 与 modules/registry.ts，产出 spec 定义的 store/api 接口。
- [x] 先写合法CRUD/查询/状态/持久化/冲突/原子导入/非法输入/模块隔离测试，先运行观察红。
- [x] 实现确定性 seed 和可持久化 store，以及 MSW REST 与 fetch API。
- [x] 运行 npm test：全绿；更新工作进度并提交自身文件。
Expected: 所有领域与接口测试通过，UI 无须绕过 HTTP。

### Task 3: 可配置 T01 界面（root）
Files: src/app/*, src/core/ui/*, src/main.tsx, src/styles.css, index.html, tests/e2e/*.spec.ts, playwright.config.ts.
Interfaces: 消费模块定义和 api；不在组件复制 Mock 数据或状态流转逻辑。
- [x] 生成完整台账桌面概念，记录 tokens 与必要交互状态；先写可运行失败 E2E。
- [x] 实现壳层、T01、配置表单/详情、业务操作、演示设置与使用指南；响应式。
- [x] 类型/lint/构建/桌面及手机浏览器验证，查看截图、修复问题。
Expected: 核心路径可见可操作且通过端到端测试。

### Task 4: 复用与研发交付（独立实现者，Task2后）
Files: scripts/*, tests/tooling/*, README.md, AGENTS.md, docs/{architecture,technology-decisions,new-module,ai-workflow,acceptance,delivery}.md, .github/workflows/ci.yml.
Interfaces: 消费模块定义契约，产出 npm run create:project / generate:module / deliver / spec:check。
- [x] 先写脚本行为测试验证副本/拒绝覆盖/路径安全/生成模块规范一致性。
- [x] 实现复制、新模块生成、规范校验与交付打包，真实临时项目生成并 typecheck/build。
- [x] 轻量 AI 七步工作流、需求追踪、双质量关口与快速启动说明。
Expected: 复制项目与新增模块的真实调用可用，交付包有清单和质量证据。

### Task 5: 独立审查与最终验证
Files: docs/verification.md, docs/progress.md, release/* (生成物忽略，交付副本到 chat outputs).
- [x] 独立审查全项目需求覆盖和风险；修复重要问题并回归。
- [x] npm run verify / npm run test:e2e / npm run deliver；检查解压清单和截图。
- [x] 保存最终版本/进度/限制，Git 提交；本地预览交付。
Expected: 所有质量关口通过，证据真实；无虚假完美保证。

## 最终结果

34项测试及8条正式构建浏览器验收通过；详情异步串记录、模块命名冲突、模板函数克隆、re-export加载、快照大小/多窗口同步等问题均已修复。测试证据随正式交付保存，详见 docs/verification.md。源码由本地Git保存，无远程发布。
