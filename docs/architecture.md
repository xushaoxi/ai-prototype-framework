# 架构与模块边界

框架提供独立原型工作台和 B 级业务仿真：T01承载标准台账，后台通用原型模式库补充24个有限、可操作模板。二者共用公共界面与HTTP边界，业务快照明确隔离。不包含真实后端、认证、服务端权限、流程引擎、微前端、低代码设计器或大模型 API。

```text
business-specs/*.json ↔ src/modules/*/definition.ts → registry
                                                     ↓
页面 App / LedgerPage / RecordForm / RecordDetail → core/api (fetch)
                                                     ↓
                                      MSW handlers (浏览器 / Node)
                                                     ↓
                                      store → seed / localStorage
```

## 一个模块是什么

`ModuleDefinition` 是常规业务的声明：名称、字段及显示位置、必填/范围、类别选项、状态、合法动作、初始值和编号前缀。资产与供应商都使用同一个 LedgerPage、表单和详情容器。`registry.ts` 是唯一注册表，导航、HTTP 处理、存储分区以及确定性种子均从这里识别模块。

T01 保留编号、名称、类别、负责人、金额、日期、备注、状态、时间和版本这些公共字段，fields 支持文本、多行文本、数字、枚举、日期，以及 FORM-006 明确扩展的 radio、checkbox、multiselect、time、dateRange。普通字段使用 string/number，声明的多值字段允许 string[]；其他数组和嵌套对象仍拒绝。时间保存为HH:mm，日期范围为两个YYYY-MM-DD字符串。表单、列表、详情、CSV和 store 按字段元数据处理；业务规范 JSON 同步完整字段元数据。进一步新增类型或对象需单独评估。

业务规则通过 ModuleDefinition.validate 显式扩展，在新增、编辑、状态流转和备份导入时执行；详情展示通过 src/modules/extensions.ts 扩展。模块生成器复制配置，故意不传播资产专属 validate 函数。配置不作为通用编程语言。

FORM-006：FieldDefinition 显式提供 placeholder/help/unit/precision/fullRow/inputMode。新建表单仅使用模块声明的默认值，不补今天日期；资产金额不声明0默认值。store校验数组元素（含稀疏数组）、选项及唯一性、时间、日期范围和数字精度，并复制数组避免调用方绕过校验修改内部状态。旧版金额精度在快照/备份恢复和金额未改的写入中保留，新建或修改金额必须符合当前精度；新增可选字段仍完整校验。详情和导出用 displayFieldValue 转换可读选项标签。

## 仿真如何可信

页面始终发 HTTP 请求，MSW 在浏览器和 Node 测试复用同一组 handlers；store 是规则的唯一执行层。非法跳转、非初始状态删除、无效枚举、重复编号、负金额、旧版本更新均须拒绝。写入先校验及持久化，再提交内存状态，避免 quota 失败或非法备份留下部分数据。导入需要精确已知模块和完整结构，重置只清除自身命名空间。

慢响应和错误场景通过请求头传递。Playwright 不再重复劫持同一 API；否则会绕过实际业务规则。开发及构建预览均启动 Mock。静态部署使用相对资源与 hash 路由，支持子目录；Service Worker 需要 localhost 或 HTTPS。

## 状态与数据边界

查询、分页、弹层和演示角色属于页面状态；业务记录与审计属于 store。每个模块独立分区，新增模块初始为空；资产和供应商有确定性种子。刷新从 localStorage 恢复；模块 ID、记录 ID、编号不可通过编辑改变。多个窗口的顺序操作会重读持久化快照并以 version 拒绝旧版本覆盖；真正同时跨进程写入需要正式后端事务，V1 不承诺。

新增注册模块时，本地快照迁移补一个空分区并保留现有数据；显式导入仍要求精确匹配全部已知模块。给已有记录增加必填字段属于业务数据迁移：先备份，明确旧记录默认值及升级办法；V1 不自动猜测。单个持久化快照和备份均限制2MB，写入前检查且失败原子回滚。损坏快照会进入可备份、可确认重置的恢复入口。若浏览器不提供本地存储，store 只能在当前页面内存中运行，关闭后不保留；使用前确认浏览器允许持久化。

只读角色是交互仿真：隐藏/禁用写入口不能当作服务端授权。接真实后端时保留 core/api 契约，替换 Mock 启动和 handlers；服务端必须重新实施权限、事务、并发与校验，不能依赖浏览器可信。

## 规范防漂移

`npm run spec:check` 使用已安装 TypeScript 将真实 registry 及其项目内导入编译到临时目录再加载，逐模块比较 ID、名称、前缀、字段标签/类型/必填/选项/约束及显示元数据、状态与动作。它还检查需求 ID 唯一、状态流转引用和规范覆盖，没有通过解析源码字符串猜测定义。新增模块无需修改固定的规范列表。

## 内置设计指南

`src/app/design-guide` 在构建时以 raw 导入 docs/design/outline.md、design-guidelines.md 和 design-guidelines-research.md；指南页与台账参考面板共享读取结果。受限 Markdown 渲染只生成 React 文本、列表、标题、表格与 http(s) 链接，不解释 HTML。新增 Markdown 语法需同步扩展与验证，不提供通用富文本编辑器。

指南独立地址为 `#/design-guide`。台账对照面板在视口至少 1360px 时占据独立列；更窄视口采用抽屉。章节选择属于页面状态，打开关闭不重新挂载台账。设计目录、候选建议与实际实现状态分开表述。

FORM-002：指南第 09、11 章进入 `#/form-demo`，同一示例页比较弹窗、抽屉和完整页面。示例和业务表单共用 RecordFormFields 与资产字段定义，示例值仅作为表单初值，不创建或修改业务记录；完整页面使用独立路由，返回时关闭该任务标签。示例不替代真实业务的数据层校验。

模块可通过有限的 queryFilters（dateRange/status）启用附加查询，当前仅资产启用。ListQuery.dateFrom/dateTo经MSW传递到store，日期校验和包含边界的过滤先于状态计数及分页；UI不自行过滤数据。

## 多功能页现场

App维护打开的唯一有效路由，保留各tabpanel的React实例；非活动页面使用hidden退出布局和可访问树。WorkspaceTabs提供方向键/Home/End/Delete与局部横滚。每页文档滚动独立保存；关闭释放现场，刷新只按hash打开当前页。LedgerPage.active控制后台同步与弹层显隐，重新激活从store刷新数据；RecordForm隐藏时保留未保存输入。指南章节选择也随实例保留。查询提示及展开区ID包含模块ID，避免保留多个实例后的关联冲突。

列候选从模块inTable字段与状态派生，core/columns.ts归一化本地偏好（version/knownKeys/visibleKeys/widths）。偏好键按模块独立，与业务store分离；失败只影响持久保存，不阻止本次调整。ResizableColumnTitle处理Pointer Capture和键盘，LedgerPage受控宽度决定表格横滚总宽；recordsToCsv接受显式可选列keys并拒绝非列表字段/空列。

`resolveColumnWidths` 根据实际内容区分配剩余宽度给未手动调整的可见列；调整过的列记录为resizedKeys并保留像素宽度。旧偏好通过与默认宽度比较识别手动调整。空间不足时以原宽度横向滚动；全部可用列达到上限或被手动固定时由空白列吸收剩余空间，不改变既有业务列宽。

COL-004：列偏好v1增加orderKeys和fixedKeys，旧数据缺省时保持默认顺序及无固定。规范化忽略未知键和无效方向，并按左、普通、右稳定分组；moveColumn限制在相同分组，setColumnFixed调整分区。表格、列设置和导出共享同一有序列清单；内容区不足时暂停固定渲染但保留偏好。

FORM-007：useFormFeedback在共享Form实例上管理曾报错字段、错误计数与同步提交锁。初始validateTrigger为空，onValuesChange仅复查曾报错字段；submit统一处理校验、API字段错误及非字段异常。RecordForm与三种示例容器复用；store规则不变。保存期间当前容器禁止关闭，工作台标签及浏览器退出保护另议。

FORM-008：WorkspaceExit按路由注册表单退出守卫，关闭后台或当前标签统一检查，beforeunload汇总未保存与正在保存的表单。useUnsavedForm比较序列化后的字段值（复选、多选忽略顺序，日期范围保留顺序），而非touched；只有内容会丢失时确认。示例保存仍不入store，组件与状态示例只做明确标识的本地仿真。

## 后台通用原型模式库

`src/app/patterns/catalog.ts` 定义24个有限模板；`PatternPage` 按 family 组合 `DataPatterns`、`FormPatterns`、`AdminPatterns`。可直接复用的细粒度导出包括 `PatternRecordTable`、`GroupedTreeTable` 和 `AdvancedRecordForm`；内部业务组合按真实需求提取类型化接口，不以复制整页或万能配置引擎扩展。普通台账仍按 PAGE-003 复用 `LedgerPage`。

模式链路为 `页面 → core/api.ts patternApi → MSW /api/patterns/* → mocks/store.ts createPatternStore`。`PatternSnapshot` 和 `PatternAction` 在 `src/core/patterns/types.ts` 显式声明，节点、用户角色、待办审批、消息、配置、草稿、文件元数据、回收站及审计均由同一个 store 文件管理。`GET /api/patterns/snapshot` 读取快照，`POST /api/patterns/actions` 接收 `{version,action}` 并返回提交后的完整快照。状态与引用校验、批量原子性、审批pending及驳回原因、附件规则必须在领域层执行，按钮显隐不能替代校验。

持久化使用独立键 `prototype-workbench:patterns:v1`，大小上限2MB，写前重读并检查快照版本，先验证和持久化再更新内存。`usePatterns` 以同窗口事件与跨窗口 storage 事件重新读取；旧版本冲突刷新快照后重试，不静默覆盖。该机制仅适用于本地顺序演示，不承诺跨进程并发事务。损坏快照可以由明确确认的模式重置或有效模式备份恢复。

模式备份包含此域的完整结构，恢复时完整验证嵌套字段、引用、唯一性与大小后替换；模式重置只重置本域。资产、供应商和其他registry模块的原台账备份与重置保持原语义，两种格式不可互换。文件只保存元数据，不上传内容；只读和角色权限是演示仿真；登录不建立会话；审批只提供有限状态流转，不是正式流程引擎。

能力与状态边界见[后台模式目录](design/backend-pattern-library.md)，业务接入见[复用指南](backend-pattern-reuse.md)。独立规范 `business-specs/pattern-library/requirements.json` 维护模板/动作/验收入口，位于子目录，既有T01根目录规范检查不代替其领域、HTTP和浏览器验收。交付仍以实际verify、浏览器检查和deliver日志为准。

## 结构检索与主题来源（2026-10-30）

旧catalog保留示例路由身份；recipes描述用户任务、适用边界与语义变体关系，两者不等同于公共组件继承或业务域。目录聚合展示，旧业务样例在兼容区；PatternPage将维护工具放外壳可展开区域。

core/theme.ts为统一视觉入口，createTheme同时导出Ant ThemeConfig与CSS变量，bootstrap统一安装。基础控件消费Ant主题，工作台与组合样式消费变量；控件API不另加同名包装。结构断点、图形坐标和列宽仍属于相应组件的约束。
