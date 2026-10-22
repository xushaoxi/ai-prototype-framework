# AI 原型开发框架 V1.0 架构基线

用户于 2026-10-22 明确授权在指定目录新建项目，并自主完成全部交付流程；本次无须逐项等待确认。新项目不会修改 Code 下既有项目，不发布远程仓库或公网服务。

## 目标与边界
A+ 独立原型框架、B 级业务仿真。业务模块是最小单元；先完整交付 T01 台账管理型。配置驱动常规页面，显式扩展特殊业务逻辑。支持查询、列表、详情、新增、编辑、业务操作；统一确定性 Mock；规范驱动 AI 验证和轻量交付。无真实账号认证、服务端权限、工作流引擎、低代码设计器、微前端和大模型 API。权限仅做业务交互仿真并清晰标识。

## 选型
React + TypeScript + Vite + Ant Design；不引入整套 Ant Design Pro/Umi。2026-10-22 npm 校验发现 ProComponents 2.8.10 声明 peer antd ^4.24.15 || ^5.11.2，不支持当前 antd 6.6.7，故 V1 采用 Ant Design 基础组件与一个轻量 T01 容器，避免强制安装不受支持的组合。React 与 Vue 都能胜任；选择 React 是此项目 UI/TS 配置组合的工程判断，不宣称 AI 成功率已实测优于 Vue。版本以实际安装后的锁文件为准，兼容机器 Node 20.20.0，不盲追要求 Node 22 的 MSW 3 / Vitest 5。

## 模块接口（跨任务唯一依据）
`src/core/types.ts`:
- FieldType = 'text' | 'textarea' | 'number' | 'select' | 'date'.
- FieldDefinition {key:string; label:string; type:FieldType; required?:boolean; options?:{label:string; value:string}[]; searchable?:boolean; inTable?:boolean; inForm?:boolean; inDetail?:boolean; width?:number; min?:number; max?:number; maxLength?:number}.
- BusinessRecord {id:string; code:string; name:string; status:string; owner:string; category:string; amount:number; date:string; notes:string; updatedAt:string; version:number}.
- ActionDefinition {key:string; label:string; from:string[]; to:string; tone?:'primary'|'danger'}.
- ModuleDefinition {id:string; name:string; singularName:string; description:string; icon:'ledger'|'team'; codePrefix:string; fields:FieldDefinition[]; statuses:{value:string; label:string; color:string}[]; actions:ActionDefinition[]; defaultValues:Partial<BusinessRecord>}.
- ListQuery {keyword?:string; status?:string; category?:string; page?:number; pageSize?:number; sortBy?:'updatedAt'|'amount'|'date'; sortOrder?:'asc'|'desc'}.
- ListResult {items:BusinessRecord[]; total:number; counts:Record<string,number>; amountTotal:number}.
- SaveInput = Partial<BusinessRecord>.
- ApiError {code:string; message:string; fields?:Record<string,string>} (implement as Error subclass `BusinessError`, optional status:number).
`src/modules/registry.ts`: `modules:ModuleDefinition[]`, `getModule(id:string):ModuleDefinition|undefined`.
`src/modules/assets/definition.ts`: `assetModule:ModuleDefinition`, id='assets', name='资产台账', singularName='资产', prefix='AST', states draft/active/archived (草稿/使用中/已归档), actions activate draft→active / archive active→archived / restore archived→draft.
`src/modules/vendors/definition.ts`: `vendorModule:ModuleDefinition`, id='vendors', name='供应商台账', singularName='供应商', prefix='VEN', same field contract and states pending/active/disabled (待评估/合作中/已停用), actions approve pending→active / disable active→disabled / reopen disabled→pending. This second small configuration proves reuse; it is still T01.
`src/mocks/store.ts`: `createStore(storage?:Storage)` returns synchronous `list(moduleId, query?:ListQuery):ListResult`, `get(moduleId,id):BusinessRecord`, `create(moduleId,input):BusinessRecord`, `update(moduleId,id,input):BusinessRecord`, `transition(moduleId,id,actionKey,version?:number):BusinessRecord`, `remove(moduleId,id):void` only draft/pending, `reset():void`, `exportData():string`, `importData(text:string):void`, `history(moduleId,id):AuditEntry[]`; export `store` singleton. AuditEntry {id:string; recordId:string; moduleId:string; action:string; at:string; summary:string}. Data versioned localStorage, deterministic seed, invalid import atomic, validate required fields/enums/finite nonnegative amounts/dates/unique code, immutable IDs and codes, optimistic concurrency on versions, illegal transitions rejected, unknown modules/records rejected. Browser quota errors must not report successful mutation; new store sees persisted writes; reset clears only own namespace. Import limits 2MB, requires known exact modules, IDs/codes unique. no eval.
`src/mocks/handlers.ts`: REST handlers using same store: GET/POST /api/modules/:moduleId/records, GET/PATCH/DELETE /api/modules/:moduleId/records/:id, POST /api/modules/:moduleId/records/:id/actions/:actionKey, GET .../:id/history; POST /api/demo/reset. Error JSON {code,message,fields?}, correct 4xx. Scenario header x-demo-scenario=error|slow optional; never double-route Playwright and MSW.
`src/core/api.ts`: async `api.list/get/create/update/transition/remove/history/reset` over fetch. UI uses HTTP path (MSW starts in development AND preview demo builds), same handlers Node integration tests. Hash routing permits static deployment subfolders. Browser state is demo only.

## UI 基线
中文界面「原型工作台」，冷灰背景 #f5f7fa，白色侧栏与内容面板，深蓝绿强调 #0f766e，正文 #172b34，圆角 10px，系统中文无衬线。桌面 1440×1000，侧栏 220px、顶栏 64px、内容边距 32px。主导航：资产台账 / 供应商台账 / 使用指南；底部框架版本和 Mock 演示说明。主界面标题资产台账、说明“统一管理资产信息，跟踪从登记到归档的完整过程。”、新增资产主按钮。由真实种子数据派生总数/使用中/草稿/已归档摘要（非装饰性指标）；状态页签、关键词/类别查询、重置、刷新、导出当前查询 CSV。table 内编号/名称/类别/负责人/金额/日期/状态/操作，10 行分页。详情 Drawer 含字段和活动记录；新增编辑 Modal 配置化字段与校验；状态操作确认；草稿删除确认；空态/错误重试/加载状态。演示设置含只读角色（仅仿真）、普通/慢响应/错误场景、JSON备份导入导出、重置种子数据。手机侧栏收起，表格仅在独立表格容器横向滚动，页面自身不横溢出。

## 可复用与 AI 工作流
README 中文快速开始；AGENTS.md 工具无关开发规则；docs 技术选型、架构、新模块指南、七步 AI 工作流、测试验收、交付追踪。business-specs/assets.json 和 vendors.json 为轻量业务规范，包含稳定需求ID与接受条件；测试明确关联ID；规范不得与代码字段/枚举漂移。本地命令创建项目副本（不覆盖存在路径，不复制 node_modules/.git/用户数据）与生成新 T01 模块（受限 slug，不覆盖已有文件，有 dry-run，业务规范与路由注册同步）。生成模块须能立即 typecheck/build 通过，脚本回归测试使用临时目录。交付命令先运行核心质量关口再打包源码、静态构建、规范、测试证据与清单，排除 node_modules/.git/个人数据；不伪造验收。

## 验收标准
类型检查、lint、领域/HTTP集成/脚本测试、构建全通过；浏览器核心路径查询→新增→编辑→详情→合法及非法业务操作→刷新持久化→只读阻止→空态→错误恢复，测试隔离；资产和供应商隔离；手机 390×844 无整体溢出；桌面与移动截图人工查看；页面无相关 console.error；新项目复制与模块生成在临时目录真实执行验证；交付包可解压且不含依赖缓存；独立代码审查问题修复。保留质量证据和限制说明；不承诺绝对完美。

## 官方依据（研究日期 2026-10-22）
- https://react.dev/learn/build-a-react-app-from-scratch
- https://ant.design/docs/react/use-with-vite/
- https://github.com/ant-design/pro-components/blob/master/package.json （并核实已发布 npm peerDependencies）
- https://vuejs.org/guide/typescript/overview
- https://vuejs.org/guide/scaling-up/testing.html
- https://element-plus.org/en-US/component/table.html
- https://mswjs.io/docs/
- https://playwright.dev/docs/best-practices

## 实施后基线补充

BusinessRecord保留公共字段，并支持由模块fields声明的string/number标量扩展；未知额外字段拒绝，text/textarea/number/select/date按元数据校验。ModuleDefinition.validate是可选业务校验函数，在新增、编辑、状态变更和导入时执行；所有表单日期统一序列化。searchable额外字段参与查询，删除判断初始状态值而非状态数组排序。新增注册模块可迁移空分区，已有记录新增必填字段需业务迁移。快照持久化/备份均2MB，顺序多窗口同步；超限原子失败。源代码及锁文件为实际精确接口依据。
