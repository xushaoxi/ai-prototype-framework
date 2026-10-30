# 后台通用原型模式库

本库在现有 React、Ant Design 和工作台之上提供 24 个可操作模板。常规查询台账继续遵守 PAGE-003、复用 T01 `LedgerPage`；这里补充高级组合、复杂录入与后台管理，不另建公共样式体系，也不将业务差异扩展为万能配置引擎。

入口为侧栏「后台页面模板」及 `#/patterns`。模板 ID 来自 `src/app/patterns/catalog.ts`，详情地址为 `#/patterns/<id>`。这里的“可操作”指页面通过 HTTP 改变本地仿真域并能重新读取；登录和结果页属于明确标记的交互演示。它不代表真实认证、服务端权限、文件上传或流程引擎。

## 模板目录与复用入口

| ID | 模板与实际能力 | 复用入口 | 使用边界 |
| --- | --- | --- | --- |
| advanced-table | 查询、排序分页、行内名称编辑、跨页选择、批量启用/删除、导出 | `DataPatterns`、`PatternRecordTable` | 批量启用/删除须全为草稿；查询变化清空选择 |
| tree-table | 类别分组、展开记录、负责人和金额 | `GroupedTreeTable` | 从记录类别派生分组，不是可拖拽组织树 |
| card-list | 同一记录域的卡片摘要与编辑 | `DataPatterns` | 沿用通用记录字段；按需替换摘要内容 |
| master-detail | 选择记录、并排查看详情 | `DataPatterns` 的主从组合 | 从当前查询结果选择，窄屏上下排列 |
| record-detail | 摘要、状态、明细与附件元数据 | 同一详情组合 | 仅展示记录实际存在的 `details`，不是任意详情编排器 |
| import | CSV / XLSX、字段映射、错误行预览、整批导入 | `ImportWizard`、`core/patterns/import.ts`、`read-import.ts` | XLSX只读第一工作表；旧 `.xls` 须另存 `.xlsx`；最多500行、2MB |
| recycle | 恢复草稿、危险确认后永久清除 | `DataPatterns`、回收站动作 | 仅作用于本模式域；原 T01 删除规则不变 |
| approval | 审批列表、处理人筛选、通过/驳回、意见 | `DataPatterns`、`task.decide` | 只允许 pending 处理；驳回必填原因；不提供节点编排 |
| tasks | 只显示待审批事项，筛选并处理 | 与审批共用类型和动作 | 待办源为确定性审批种子，不是跨系统待办聚合 |
| grouped-form | 信息分组、部门级联、条件必填、多选标签、附件 | `AdvancedRecordForm mode="grouped"` | 特殊申请原因由 store 再校验 |
| step-form | 分步校验、上一步、最终提交、保留输入 | `AdvancedRecordForm mode="steps"` | 分步只是录入方式，最终仍走同一业务校验 |
| detail-form | 动态明细、数量/单价、金额合计、附件 | `AdvancedRecordForm mode="details"` | 合计为明细汇总展示，不假定它必须等于申请金额 |
| drafts | 未完成暂存、列表、载入、继续填写、删除 | `AdvancedRecordForm` 草稿回调 | 草稿允许空必填项，仍校验结构、数值范围和文件元数据 |
| files | 选择文件、格式/大小校验、文件中心、删除元数据 | `FormPatterns` 文件页 | 不保存文件内容，不提供远端预览/下载；被引用文件拒绝删除 |
| organization | 组织树、新增/编辑、父级、启停、引用保护 | `AdminPatterns`、`OrgNode` | 父级须存在且无循环；有子组织/用户不能删除 |
| users | 姓名邮箱搜索、新增/编辑、组织/角色、启停、删除 | `AdminPatterns`、`PatternUser` | 全为演示用户，不生成账号或会话 |
| roles | 角色列表、权限白名单、数据范围、引用保护 | `AdminPatterns`、`PatternRole` | scope 只是仿真配置，不是服务器数据权限 |
| dashboard | 状态柱图、登记日期分布、审批进度、维度汇总 | `AdminPatterns` 仪表盘组合 | 数字来自快照；日期分布不是历史增长趋势 |
| settings | 系统名称、通知开关、时区保存 | `AdminPatterns`、`PatternSettings` | 保存本模式域配置，不控制真实通知服务 |
| account | 选择演示用户、修改姓名邮箱 | `AdminPatterns` 用户资料组合 | 选择者不代表当前真实身份 |
| messages | 已读未读筛选、单条/全部标为已读 | `AdminPatterns`、`PatternNotice` | 来自本地种子；没有消息推送或外部发送 |
| audit | 操作类型与摘要查询、操作时间 | `AdminPatterns`、`PatternAudit` | 记录仿真写入，不能用作不可篡改的合规日志 |
| login | 账号必填校验、成功/失败场景及返回 | `AdminPatterns` 登录组合 | 不请求认证，不保存密码，不建立会话 |
| results | 成功、403、404、500与恢复演示 | `AdminPatterns` 结果组合 | 手动场景，不代表真正发生 HTTP 授权或路由错误 |

页面容器导出 `DataPatterns`、`FormPatterns`、`AdminPatterns`；可直接复用的细粒度导出包括 `PatternRecordTable`、`GroupedTreeTable`、`AdvancedRecordForm`。其余组织、角色、仪表盘等组合目前位于 `AdminPatterns.tsx` 内部，接入新业务时先按真实复用需要提取类型化组件，不宣称每个内部函数都是稳定公共组件包。

## 状态与异常覆盖

| 范围 | 正常/加载 | 空态 | 失败与恢复 | 只读及特殊状态 |
| --- | --- | --- | --- | --- |
| 数据列表、主从、树表、卡片 | 初始快照加载；查询、分页及写入状态 | 无查询结果、无可选记录 | 加载错误重试；写入失败保留编辑输入；旧版本冲突刷新快照 | 只读为页面交互仿真；草稿外不能删除，非法批量整批拒绝 |
| 导入 | 选择文件→映射→预览→提交完成 | 无文件、无有效数据不允许导入 | 格式/大小/列映射/行错误说明；失败不产生部分导入 | 只读禁用确认导入；XLSX只处理第一工作表，`.xls` 明确提示转换 |
| 回收站、审批、待办 | 快照加载、操作中防重复提交 | 无已删记录、无待办 | 引用/状态/版本错误由 store 拒绝并反馈 | 只读禁用写操作；驳回原因必填，审批不可重复决定 |
| 分组/分步/明细/草稿/文件 | 快照加载、保存中；分步保留输入 | 空草稿箱、空文件列表 | 校验数量与定位；失败保留输入；加载重试 | 独立只读开关；关闭或清空未保存表单有保护；附件只存元数据 |
| 组织、用户、角色、设置、资料 | 快照加载、保存中与刷新 | 无用户/组织/角色 | 加载重试；循环、引用、邮箱、权限及版本错误反馈 | 独立只读开关，仅模拟写入口禁用 |
| 仪表盘、消息、审计 | 快照加载、维度/筛选变化 | 无记录的零指标、空消息/日志 | 共享加载恢复机制 | 统计和日志可读；消息标记受只读控制 |
| 登录、结果 | 本地场景切换 | 不适用 | 登录仿真失败后重试；500恢复演示 | 不提供真实登录或授权；403只是一种结果展示 |

慢响应/错误响应沿用演示请求头，不是生产环境网络保证。只读开关的具体作用范围以页面说明为准，不能将任何隐藏/禁用按钮当作服务器授权。模板备份、恢复、重置是独立数据维护工具，会影响本模式域；它们需要危险操作确认，不代表真实权限管理。

## 数据与规则

调用链保持 `页面 → core/api.ts patternApi → MSW → mocks/store.ts`。`PatternSnapshot` 含 records、deletedRecords、nodes、roles、users、tasks、settings、notices、audit、drafts、files 及 version。所有业务状态由 `store.ts` 管理，UI 不以成功提示替代写入。

模式快照键为 `prototype-workbench:patterns:v1`，限制2MB。读取重新检查持久化快照，写入以版本拒绝旧数据，先完整校验及持久化再提交内存。跨页面写入事件和浏览器 storage 事件刷新快照；版本冲突刷新后由用户重试，不静默覆盖。浏览器 localStorage 不提供真实服务器事务或严格的跨进程同时写入保证。

记录状态为 `draft → active → archived → draft`；普通编辑不能偷偷改状态。只有草稿可以移入回收站，恢复回到记录域，永久清除需再次确认。批量动作在副本上全部执行、校验成功后提交一次，失败保留整个原快照。

审批仅允许 `pending → approved/rejected`，驳回原因不能为空。组织父子循环、缺失父节点、角色权限白名单、用户引用等由 store 检查。删除有子节点或用户引用的组织、被用户引用的角色均拒绝。

附件单个不超过5MiB；页面选择器提供 PDF/PNG/JPEG/CSV，领域层还支持 TXT/XLSX 安全元数据。表单最多5个附件；名称、MIME、扩展名和大小须合法。表单保存/草稿暂存时原子登记文件元数据，同一文件 ID 不可指向不同内容说明；文件被记录、回收站记录或草稿引用时拒绝删除。

## 验收与扩展

需求及测试入口见 `business-specs/pattern-library/requirements.json`。该子目录规范独立描述模式库，现有 `spec:check` 仍检查 T01 registry 与根目录业务规范，不把这里的模板假装成新增 T01 模块。领域、HTTP和浏览器测试路径在规范中映射，映射表示需要执行的验收入口，不代表当前已经通过。

交付必须实际运行 `npm run verify`、`npm run test:e2e` 及 `npm run deliver`，以当次日志和清单为证。桌面/移动布局、控制台、未保存保护和恢复路径需检查。未生成完整交付证据前，不得仅凭本目录标为完整验收。新业务接入步骤见[后台模式复用指南](../backend-pattern-reuse.md)。
