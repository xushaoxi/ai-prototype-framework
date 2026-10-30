# 测试验收与需求追踪

业务规范位于 business-specs。资产使用 AST-001—009，供应商使用 VEN-001—009；测试名称携带需求 ID。规范一致性使用 SPEC-001，脚本复用使用 TOOL-001/002。

| 需求 | 可观察的接受条件 | 主要证据 |
| --- | --- | --- |
| AST/VEN-001 | 关键词、类别、状态组合查询，分页和统计正确 | tests/domain/store.test.ts；tests/e2e/ledger.spec.ts |
| AST/VEN-002 | 必填、枚举、金额/日期校验；自动唯一编号 | store.test.ts；tests/integration/api.test.ts；ledger.spec.ts |
| AST/VEN-003 | 完整详情与动作历史 | store.test.ts；api.test.ts；ledger.spec.ts |
| AST/VEN-004 | 编辑持久化，旧 version 拒绝覆盖 | store.test.ts；api.test.ts；ledger.spec.ts |
| AST/VEN-005 | 合法状态转移成功，非法操作 HTTP 4xx | store.test.ts；api.test.ts；ledger.spec.ts |
| AST/VEN-006 | 仅初始状态可删除 | store.test.ts；api.test.ts；ledger.spec.ts |
| AST/VEN-007 | 只读演示角色无法通过界面写入 | ledger.spec.ts；人工检查设置说明 |
| AST/VEN-008 | 模块隔离、确定性重置 | store.test.ts；api.test.ts；ledger.spec.ts |
| AST/VEN-009 | 错误恢复，非法导入/持久化失败无部分写入 | store.test.ts；api.test.ts；ledger.spec.ts |
| SPEC-001 | 所有注册模块的真实字段、标签、类型、选项、约束、状态、动作与规范相符 | npm run spec:check；tests/domain/spec.test.ts |
| TOOL-001 | 真实副本、拒绝覆盖/路径穿越、dry-run、规范同步、生成项目可构建和创建记录 | tests/tooling/cli.test.ts |
| TOOL-002 | 交付默认两关，失败阻止打包，跳过标记不完整，包内日志和校验和正确 | tests/tooling/cli.test.ts |

表中路径表示测试所属层，不表示每个浏览器测试逐个完整覆盖两模块全部组合。请结合实际测试名称、断言和日志审查；新生成业务需要补业务专属测试，不能自动继承「已验收」结论。

## 两道关口

第一关 `npm run verify` 顺序执行 spec:check → typecheck → lint → test → build，任何一步失败即停止。脚本测试使用临时目录，真实执行复制、生成、种子/存储加载与构建，结束清理。领域与 HTTP 测试应自行初始化数据，不借用其他测试状态。

第二关 `npm run test:e2e` 用 Chromium 访问真实应用与 MSW，覆盖查询、新增、编辑、详情、状态操作、刷新持久化、只读、空态、错误恢复、CSV/备份等可见行为。不能用另一套 route mock 替换业务层。

## 人工补充检查

桌面 1440×1000 检查层级、表格、弹层和中文；手机 390×844 检查导航收起、表格容器滚动和整个页面无横向溢出。实际查看截图，关注长标题、错误文案、键盘焦点和危险操作确认。检查控制台无相关异常。自动截图存在不等于视觉已审阅。

每次完整交付的实际状态见 release/latest.json 和 manifest.json；正文标准和测试存在不能代替当次执行证据。CI 保存浏览器报告；本地 deliver 保存完整日志和已有报告/截图。

## 工作台设计指南

DG-001—004 接受条件见 [设计指南验收规范](design/workbench-guide-acceptance.md)。覆盖独立指南路由、16 章内容、候选状态、同屏参考保留查询、手机抽屉，以及文档单一来源与安全链接；证据分别为 tests/e2e/design-guide.spec.ts 与 tests/domain/design-guide.test.ts。

## PAGE-001 / LIST-001 默认台账任务与计数

默认台账用于日常查找和处理记录，移除重复数字卡片，在状态标签保留计数；计数随关键词与类别更新，切换状态时保留完整状态计数，加载未知/失败使用“—”，真实空结果为0。两个模块共享同一容器。证据：tests/e2e/task-first-ledger.spec.ts、ledger.spec.ts、design-guide.spec.ts 和 tests/domain/design-guide.test.ts；对应业务查询需求 AST/VEN-001。

## QUERY-001 显式查询与回车

标准台账通过点击查询或关键词框Enter统一应用关键词和类别，并回到第一页；输入与类别选择不自动查询；状态标签只使用已生效条件；输入法选词Enter不触发提交。测试：tests/e2e/query.spec.ts，指南第06章同步显示规则。原有错误恢复与重置继续由ledger.spec.ts覆盖。需求对应AST/VEN-001。

QUERY-002：tests/e2e/query-layout.spec.ts 验证两模块桌面、指南并排、手机条件排布与无整体横向溢出；未来折叠筛选不属于当前实现。

AST-010/QUERY-003：HTTP测试验证日期边界、单边、非法及反向区间；advanced-query.spec.ts验证更多筛选、状态标签联动、隐藏数量、日期响应式迁移、导出请求及重置。

NAV-001/PAGE-002：workspace-tabs.spec.ts验证唯一功能标签、两模块查询/页码/展开/滚动保留、关闭重开、键盘关闭、手机无溢出及后台表单隐藏保留。原有ledger.spec.ts验证新列表操作栏的新增、编辑、详情、导出与只读。

COL-001/002（AST-012/VEN-011）：columns.test.ts与export.test.ts验证偏好、列合法性及安全CSV；columns.spec.ts验证真实拖动宽度、键盘、显示持久化/隔离/恢复、存储异常、独立选列导出及手机无整体溢出。

COL-003：columns.test.ts验证宽屏剩余空间分配、已调整列保留、旧偏好兼容及窄屏滚动；columns.spec.ts验证表格铺满宽屏、测量行不重复显示手柄、可排序列边界位置与原有拖动/键盘交互。

COL-001：columns.spec.ts 验证导出右侧为仅图标的列设置，保留可访问名称和悬停提示。

COL-004 / AST-013 / VEN-012：columns.test.ts验证旧偏好、非法固定值、分组和顺序规则；columns.spec.ts验证拖拽与上下箭头、左右固定及横滚、刷新、导出列顺序和窄屏回退。

QUERY-004 / LIST-002 / AST-014 / VEN-013：共享 LedgerPage 显示已应用条件并支持单项/全部清除，草稿变化与已应用结果区分；状态标签与下拉共用条件；无条件结果和有条件空结果使用不同提示；真实横向溢出时提示并提供键盘滚动，截断文本可聚焦读取全文。批量操作与保存筛选方案尚未纳入，因为当前没有已确认的批量业务规则或保存范围。

PAGE-003：资产台账确定为标准查询表格 V1，后续搜索查询表格按此基准适配业务。design-guide.spec.ts 检查该规则可从页面布局、查询筛选和列表表格三个章节查看；新业务还须结合实际字段和操作补充验收。

FORM-001：新增编辑容器先按任务复杂度、上下文依赖和可用空间选择；设计指南第 09、11 章均展示规则。design-guide.spec.ts 检查规则可见；当前资产弹窗仅为既有实现，具体业务匹配及未保存退出行为须另行评估验收。

FORM-002：设计指南第 09、11 章可进入同一表单容器示例；弹窗、右侧抽屉和独立完整页面使用相同资产字段体验新增编辑，示例不向台账发出写入请求，完整页面支持返回。form-container-example.spec.ts 验证容器切换、字段校验、示例数据、返回、手机布局与数据隔离。

FORM-003：表单容器示例在工作台主导航提供固定入口；关闭标签后可从桌面或手机菜单重新打开，手机选择后收起导航。form-container-example.spec.ts 覆盖两端关闭与重开。

FORM-004：完整页面示例在 1440px 桌面宽度使用三列，备注独占一行，窄内容区降为两列、手机单列。form-container-example.spec.ts 检查字段实际位置、备注跨列及手机无整体横向溢出。

FORM-005：三种容器示例与共享业务表单统一显示必填星号及“带 * 的为必填项”说明，可选项不附加标记，首次打开不显示填写错误。form-container-example.spec.ts 与 ledger.spec.ts 检查可见提示、必填语义、可选字段及提交校验。

AST-015 / FORM-006：新增资产展示单行文本、单选、复选、多选下拉、整数数量、金额、日期、时间、日期范围及备注；金额和日期无自动填充值，单位和提示依字段配置。form-controls.test.ts验证序列化、非法类型/选项/时间/范围/精度、数组隔离、备份及旧数据兼容；form-controls.spec.ts通过真实UI和HTTP验证新增、编辑及详情回显，并检查桌面与手机正文滚动和保存入口。

FORM-006 边界：拒绝稀疏数组；旧金额精度可在快照加载、备份恢复及未改金额的编辑中保留；可选单选能清空并保存；手机日期范围面板位于视口内且内部可滚动。上述边界均纳入专项测试。

AST-016 / FORM-007：form-validation.spec.ts覆盖首次填写不提前报错、统一提交计数聚焦、修正复查、三容器一致，以及网络失败输入保留、保存中重复点击/取消/Escape保护。桌面1440×1000与手机390×844检查滚动定位及保存按钮可见。

## 通用组件与状态示例（COMP）

入口 `#/component-demo`，所有交互仅保存在页面 React 状态，不调用业务 API、不读写 store。关闭页面标签后重开恢复示例，不影响台账数据。

- COMP-001：主要/次要、图标可访问名、禁用原因及加载按钮；语义状态同时提供文字与图标。初始空态可创建示例，筛选空态可清除条件，加载明确提示，错误可重试恢复。危险确认说明对象与不可撤销后果，取消保留内容，确认真实移除本页示例并反馈结果。
- COMP-002：零值与空值分别展示；金额与日期保持一致格式；主题字号、间距、圆角和颜色参考。桌面 1440 与手机 390 截图检查，无整页横溢出。
- 自动化证据：`tests/e2e/component-examples.spec.ts`；截图 `/tmp/component-examples-desktop.png` 与 `/tmp/component-examples-mobile.png` 由执行测试时生成。测试与截图完成状态以实际执行日志为准。

DETAIL-001/002：共享详情抽屉分别反馈详情与活动记录加载失败并提供独立重试，保留已知摘要且说明时效；关闭或切换记录后忽略旧响应。detail-feedback.spec.ts 覆盖双失败恢复、旧请求乱序、桌面与手机截图。字段保持模块定义及已有可读格式，不引入新业务权限。

AST-017 / FORM-008：unsaved-form.spec.ts验证取消继续/放弃、恢复初值、三容器、切换保留与后台标签关闭及原生刷新提示；保存期间由退出守卫阻止关闭。组件示例和16章指南同批完整deliver后记录验收。

NAV-002 / PAT-LIB-001：全部24模板左侧直达，按六个业务分组排序；当前页唯一高亮，手机长菜单独立滚动并在导航后关闭。证据由sidebar-navigation.spec.ts、桌面/手机截图及完整deliver提供。

DG-005：规则深链接/刷新/浏览器返回/功能标签返回恢复章节和焦点；规则与示例双向可达，同一指南只有一个功能标签，未知规则明确提示，手机无溢出。DG-006：所有正文规则有覆盖/未覆盖/验证/证据/有效示例及章节映射，索引从正文解析。测试：rule-index.test.ts、rule-navigation.spec.ts；以最新实际交付结果为准。
