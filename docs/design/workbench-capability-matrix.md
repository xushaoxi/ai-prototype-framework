# 工作台能力与验收映射

2026-10-30。本文件说明本批承诺与边界；具体运行证据见实际交付清单，尚未运行的检查不提前写通过。主体结构选择见设计指南PAGE-004，主题规则见THEME-001。

| 结构/组合 | 稳定入口与共享内容 | 本批操作及必要状态 | 验收入口 |
| --- | --- | --- | --- |
| P01 查询列表 | LedgerPage、PAGE-003；集合变体在目录检索 | 提交查询/条件/列/导出/排序分页、空/错/只读、返回现场 | ledger、query、columns、workspace-tabs浏览器用例 |
| P02 录入 | SharedForm/useSharedForm；业务字段与生命周期分离 | 分组/步骤/动态明细、草稿、提交校验/失败保留/退出保护、三列降列 | shared-form/domain、form-patterns、shared-form-validation、unsaved-form |
| P03 详情 | ObjectSummary/TaskFacts，structures/detail | 摘要定位分区、页签、主子任务、关联详情、历程 | structures浏览器用例与桌面/手机检查 |
| P04 阶段 | structures/stages及有限stage动作 | 推进/阻塞原因/恢复/重开、责任日期进度、持久历史、非法动作拒绝 | structures/domain、structures-http、structures浏览器用例 |
| P05 任务时间 | TaskTable/taskTree/TimelineView | 任务增改删、WBS折叠、父子引用、计划/实际、同日里程碑、月历/日期明细、人工核查重叠 | structure-schedule、structures/domain与浏览器用例 |
| P06 关系 | RelationCanvas与typed nodes/edges | 对象/人员/任务及边语义、查找定位、平移缩放、全屏/小地图、Enter/Space/焦点恢复 | structures浏览器用例及键盘/窄屏检查 |
| P07 分析 | AnalysisChart及来源TaskTable | 明确范围/单位/口径、分布/计划日期图、点击同口径下钻、返回 | structures图表下钻浏览器用例 |
| P08 布局 | LayoutWidget、widgetRows、WidgetBoundary | 添加移除、前后移动、宽度、范围/字段/条数、撤销/排版/默认、保存取消/刷新、逐组件异常重试 | structure-widgets、structures/domain与STR-WIDGET-BOUNDARY |
| P09 配置 | ReportConfig/previewReport | 字段/顺序/别名、最多8个类型兼容AND条件、增删排序、预览与保存分离、取消/刷新 | structure-report、structures浏览器用例 |
| 总量分配 | AllocationEditor/allocationSummary | 受控草稿、已知引用、逐项上限、非负两位小数、总量/余额、禁用 | allocation/domain与COMBO-001浏览器用例 |
| 主题与检索 | theme.ts、recipes/pageStructures、PAGE-004 | Ant/CSS同源、字号/尺寸/间距、主色派生、结构与语义变体、旧地址兼容、工具外壳 | workbench-foundation/domain及WB-001浏览器用例 |

## 统一状态与数据边界

复杂结构在独立命名空间经API/MSW/store处理，版本冲突、非法输入、损坏数据和持久化失败有明确拒绝/恢复；保存前完整校验，失败不提交部分状态。前端只读是演示仿真，不能替代服务端授权。刷新、版本信息和异常演示属于工作台工具区。

布局、配置和录入草稿属于页面状态，退出保护比较内容变化，不因只查看详情弹确认；切换标签保留实例。保存锁同步阻止重复请求，保存失败保留草稿。图形按钮和键盘操作提供等价路径，布局调整不修改关系事实。

## 支持范围

本批提供常见结构的有限演示与公共接口，不能推出覆盖任意后台业务。对象字段、阶段规则、资源语义、指标口径和数据量须按真实需求适配；复杂结构的第二份真实业务产出仍需独立验收。

真实认证、服务器权限、审批/调度/支付引擎、远端附件服务、任意数据源、嵌套条件DSL、图谱业务关系维护、拖拽布局与高度编排均不属于本批承诺。它们不能通过按钮或说明冒充已实现。具体限制见complex-structures-status.md。

整体交付只在verify与完整浏览器验收通过后运行deliver生成实际证据，测试数量不作为设计覆盖程度的替代。

组件适配补证：structure-reuse.test.ts验证服务依赖关系与培训时间/详情两种输入适配，属于静态展示接口测试；交互由结构浏览器用例验证，不等于新项目完整交付。

草稿冲突策略：任务、布局、报告在开始编辑时固定快照版本；切换/刷新保留输入但不静默提升草稿版本。版本过期须提示冲突，用户取消或比较后重新编辑；不自动覆盖别处保存。任务提交失败的说明在抽屉内可见。

本轮最终交付已通过：核心89项、浏览器105项，deliver真实退出0。具体清单与归档校验见workbench-convergence-acceptance.md；状态不代表所有未来业务已验证。

指南治理阶段另已交付：规则覆盖/未覆盖/验证/证据/示例由正文统一维护，深链接与双向定位通过91核心/107浏览器回归。详见guide-navigation-acceptance.md；上述89/105为前一结构建设阶段的历史验收记录。
