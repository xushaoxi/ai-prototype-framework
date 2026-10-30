# 新后台项目复用指南

新后台可以沿用已有工作台、导航标签、公共颜色、间距、表单与列表容器，从业务字段和规则开始，不必重新设计一套公共样式。常规台账选 T01，复杂录入、组织权限、审批等从模式库选择类型化组合。模式库不是自动生成任意后台的工具。

## 创建独立项目

在框架目录执行，目标目录必须不存在：

```bash
npm run create:project -- ../purchase-demo
cd ../purchase-demo
npm ci
npm run dev
```

目标父目录须存在，目录名使用安全英文 slug。脚本不覆盖既有目录，不复制依赖、Git历史、交付缓存、环境文件或个人工作数据，不自动安装依赖。Node 使用本机满足 Vite 引擎的版本（20.19+ 的20.x或22.12+）；macOS 可由 `start.command` 选择已有兼容版本，不修改系统 Node。

先打开资产台账、`#/patterns` 和设计指南，确认复用模板。浏览器数据按 origin 保存，源码副本不携带浏览器数据；若项目复用同一 origin，需分别理解台账与模式域的备份和重置范围，不把副本误认为全新浏览器存储。

## 常规台账：生成模块并适配业务

```bash
npm run generate:module -- contracts 合同 --dry-run
npm run generate:module -- contracts 合同
```

生成器创建 `src/modules/contracts/definition.ts`、根目录业务规范并更新 registry；初始记录为空。它只生成 T01 台账模块，**不会生成组织管理、审批引擎、复杂明细表单或其他任意模式页面**。

在 definition 与业务规范中同步字段、选项、默认值、状态、动作和稳定需求 ID。搜索查询表格按 PAGE-003 复用 `LedgerPage`，保留查询提交、结果提示、列设置、导出和移动布局。对业务不适用的能力或有依据的偏离写明原因。业务规则放入 store/显式模块校验，先补失败测试；不要复制整页，也不要只靠按钮显隐控制状态。

详细脚本约束见[新模块指南](new-module.md)。

## 其他模式：从类型化组件组合开始

类型在 `src/core/patterns/types.ts`；目录元数据在 `src/app/patterns/catalog.ts`；页面路由由 App/PatternPage 接入。三类页面容器均接受 `PatternPageProps = {patternId:string; active:boolean}`。`active` 用于工作台隐藏页面现场与弹层处理，不代表权限。

| 需求 | 已有入口 | 需要适配的业务内容 |
| --- | --- | --- |
| 高级表格 | `PatternRecordTable` | `records`、`busy`、编辑/删除/行内保存回调、可选受控 `selected`/`onSelect`；保存成功后才退出编辑 |
| 分类树表 | `GroupedTreeTable` | 类型化 `records` 输入；若要可编辑树节点，应接入组织类规则而非复制表格 |
| 分组/分步/明细表单 | `AdvancedRecordForm` | `initial`、`mode`、`nodes`、`busy`、`readOnly` 与 `onSubmit`；不同业务先定义自己的 payload 和校验 |
| 草稿 | `AdvancedRecordForm` 草稿扩展 | `drafts`、`showDrafts`、刷新/载入/删除回调、`onDraft(values,id)`；未完成字段与正式提交分别校验 |
| 组织、角色、用户、消息、图表等 | `AdminPatterns` 内部类型化组合 | 先沿用现有页面容器；产生真实复用需求时提取组件及 props，不宣称内部函数已有稳定公共导出 |
| 导入 | `core/patterns/import.ts`、`read-import.ts` 与导入页面 | 文件读取、业务字段映射、预览规则、整批提交；CSV与XLSX第一工作表，不支持旧.xls |
| 主从/详情/审批/回收站 | `DataPatterns` 对应组合 | 对象选择、字段标签、业务动作与错误提示；规则仍放领域层 |

示例：接入同一录入组件，不重做布局和状态处理。以下用于独立新建页面，假定父组件已通过 `usePatterns()` 取得 `data`、`busy` 和 `run`：

```tsx
<AdvancedRecordForm
  nodes={data.nodes}
  busy={busy}
  readOnly={readOnly}
  mode="steps"
  onSubmit={values => run({
    type: 'record.save',
    record: {
      name: values.name, category: values.category, owner: values.owner,
      amount: values.amount, date: values.date, notes: values.notes,
      tags: values.tags, status: 'draft', details: values,
    },
  })}
/>
```

`AdvancedRecordForm` 从 `src/app/patterns/FormPatterns.tsx` 导入。`onSubmit` / `onDraft` 返回 `Promise<boolean>`；失败返回 false，保留输入；不能在请求未成功时清空表单或显示已完成。公共样式沿用 `src/app/patterns/*.css` 和现有工作台样式；仅为新的业务信息结构添加局部样式。

现有 `PatternRecord` 字段适用于示例。真实业务出现完全不同的数据结构时，显式定义类型、API适配和领域校验，不强行塞进通用备注字段，也不无限扩展配置解释器。所有本地业务状态继续集中在 `src/mocks/store.ts`，不要在组件或另一个状态文件中创建第二份业务真相。

## API、并发与数据维护

`src/core/api.ts` 导出：

```ts
patternApi.get(): Promise<PatternSnapshot>
patternApi.act(version: number, action: PatternAction): Promise<PatternSnapshot>
```

对应 HTTP 为 `GET /api/patterns/snapshot` 与 `POST /api/patterns/actions`，后者请求体 `{version, action}`。MSW 只是本地传输仿真，规则唯一执行点在 store。action 联合覆盖记录保存/导入/流转/回收、组织角色用户、审批、设置、已读、草稿、文件、备份恢复和重置；不要传未声明字段或以类型断言绕过调用适配。

新记录不带 id/code，store生成；编辑带 id、保留状态，状态变化用 `record.status`。包含 `details` 的记录须保留明细和附件，并保持 name/category/owner/amount/date/notes 与顶层一致。普通编辑不能无意删除 details。同一版本的批量动作全部成功才提交，版本冲突应刷新后由用户重试。

`usePatterns()` 封装快照、初次加载、错误、保存锁、重新读取和写操作，同一窗口通过 `pattern-data-changed`、跨窗口通过 storage 事件同步。它不是服务器实时协作方案，不提供跨用户事务。接真实后端时保留 UI 回调和 API 边界，替换 transport 并在服务器重新实施认证、授权、事务和全部校验。

模式库使用 `prototype-workbench:patterns:v1` 独立2MB快照；「备份模板数据/恢复模板备份/重置模板数据」只作用于本模式域。原资产、供应商及新增 T01 模块仍用原台账备份工具。两种备份格式不可互换，不要用某一种重置声称清除了整个应用的数据。

附件只保存安全元数据，不保存或上传文件内容。登录页没有真实认证、会话或密码存储。角色权限及只读是演示交互；审批是有限状态规则，不能当作正式流程引擎。

## 验证与交付

同步新业务规范、类型和验收映射，再执行：

```bash
npm run verify
npm run test:e2e
npm run deliver
```

`verify` 包括 T01规范检查、TypeScript、lint、测试和构建。模式库的独立规范在 `business-specs/pattern-library/requirements.json`，需维护与类型/action和模板目录的对应；旧 `spec:check` 不会自动证明这些附加页面的业务正确。UI修改要检查桌面/手机截图、控制台、只读、失败重试、版本冲突和未保存退出路径。

仅 `deliver` 成功执行产生的日志、SHA-256和清单可作为交付证据；`--skip-e2e` 会生成不完整证据。复制脚本、模板目录或测试映射本身都不表示新业务已验收。参见[模式能力目录](design/backend-pattern-library.md)与[交付说明](delivery.md)。

## 注入业务服务而不复制模板

通过 `src/core/patterns/PatternProvider.tsx` 注入 `PatternService`：

```tsx
<PatternProvider service={businessAdapter}>
  <AdminPatterns patternId="users" active />
</PatternProvider>
```

适配器实现 get、act、restore 三个类型化异步接口，负责将真实后端数据转换为 PatternSnapshot、将 PatternAction 转换为业务请求。默认使用MSW仿真；真正权限与事务由后端实施。复杂表单可直接使用AdvancedRecordForm的onSubmit/onDraft回调，表格可直接使用PatternRecordTable的数据与操作回调。标准台账仍以模块definition/registry/store契约接入。

## 本轮AI接入与复用验证

统一任务入口见[AI生成原型使用契约](ai-workflow.md)。先形成需求到结构、组件和规则的映射，再实现业务适配，不能把旧样例页面换名当作新业务复用。

当前T01的`BusinessRecord`及store保留固定名称、负责人、类别、金额、日期字段约束；因此它适合该契约范围的台账，**不适合直接承载没有金额等字段的任意对象**。隐藏字段并补造0或部门不是异构复用证据。复杂数据应定义自己的payload和领域规则，并提取真正共享的布局、表单反馈及退出行为。

服务Provider的注入只替换传输实现；`PatternSnapshot`仍是旧样例域的结构，不应要求所有新项目实现组织、角色、采购和审批数据才能保存一个对象。共享容器验证、领域规则验证、独立项目产出分别记录，不相互替代。

### 内容自定义表单的共享出口

`src/core/ui/SharedForm.tsx`导出`SharedForm<T>`，`src/core/ui/useSharedForm.ts`导出`useSharedForm<T extends object>`。传入业务初值、业务签名及busy/readOnly；字段内容使用children，业务自行使用Form.Item，不解析万能字段配置。

hook提供`form`、`perform(async values => boolean | void)`、`replace(next)`、`request(leave)`、`saving/disabled`及错误反馈。成功提交更新基线；回调返回false或抛错保留输入。正式保存默认校验，草稿可以显式跳过正式必填校验，领域层仍要验证草稿允许的结构。消费者应在生命周期中保持Form连接，避免尚未挂载表单时调用表单实例。

`AdvancedRecordForm`是采购语义消费者，不是任意业务表单。独立培训报名合成验证使用不同payload与专用store/HTTP适配；该演示证明有限容器和无采购字段流程可复用，不证明所有后台需求已覆盖。


## 2026-10-30：结构入口、主题和组合

- `app/structures/catalog.ts`为九类任务检索；`app/patterns/recipes.ts`为有限组合/变体目录，旧catalog只保留路由兼容。业务名称不定义新的结构。
- 主题修改`core/theme.ts`，同时生成Ant ThemeConfig与CSS变量。语义颜色、字号、控件高度、间距尺度与公共容器共同维护；复杂图形坐标、列宽和断点由各结构声明。
- `core/ui/AllocationEditor`接受候选项、上限、总量与受控草稿，`core/allocation`验证已知引用、非负两位小数、逐项上限和总量；部分分配允许保留余额。真实业务写入须在store复用校验，不能只靠组件禁用。
- `core/structures/StructureViews.tsx`提供有限对象摘要、任务明细、时间轴、关系图接口；`types.ts`声明任务、节点/边、布局、报表等数据。具体演示适配位于app/structures，由结构域store/API/MSW提供业务事实；不能把这个样例快照强加给所有项目。
- 适配结构先明确自己的数据契约，再复用展示接口；当前复杂模式实际边界与验证见design/complex-structures-status.md。组件/结构有可操作示例，不等于所有行业、数据量或专用算法已验证。
