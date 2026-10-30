/** Task-oriented discovery is separate from route compatibility and domain schemas. */
export const pageStructures=[
 {id:'P01',title:'查询与列表',route:'assets',task:'查找、比较、选择和处理一组对象',keywords:'标准查询 表格 树表 卡片 主从',rule:'PAGE-003',reuse:'LedgerPage'},
 {id:'P02',title:'表单录入',route:'patterns/grouped-form',task:'创建或维护一个对象，按任务选择分组、步骤和明细',keywords:'新增 编辑 分组 分步 明细 草稿',rule:'FORM-007 / FORM-008',reuse:'SharedForm / useSharedForm'},
 {id:'P03',title:'详情展示',route:'structures/detail',task:'理解对象身份、主子信息、关联及业务历程',keywords:'对象 概览 页签 关联 附件',rule:'DETAIL-001',reuse:'ObjectSummary / TaskFacts'},
 {id:'P04',title:'阶段过程',route:'structures/stages',task:'按阶段推进，处理阻塞、恢复与重开',keywords:'阶段 责任 日期 进度 历史',rule:'PAGE-004',reuse:'ObjectSummary + domain adapter'},
 {id:'P05',title:'任务与排程',route:'structures/schedule',task:'组织层级任务，比较时间并查看资源占用',keywords:'WBS 甘特 里程碑 日历 排程 资源',rule:'PAGE-004',reuse:'TaskTable / TimelineView'},
 {id:'P06',title:'关系图谱',route:'structures/graph',task:'定位并理解不同对象之间的关系',keywords:'节点 关系 图谱 搜索 定位 缩放',rule:'PAGE-004',reuse:'RelationCanvas'},
 {id:'P07',title:'指标分析',route:'structures/analysis',task:'按明确口径理解指标并下钻到来源',keywords:'分析 统计 数字卡片 口径 下钻',rule:'METRIC-001',reuse:'ObjectSummary / TaskTable'},
 {id:'P08',title:'自定义工作台',route:'structures/workbench',task:'配置个人信息布局，保存或取消整份草稿',keywords:'布局 组件 移动 宽度 撤销 恢复',rule:'PAGE-004',reuse:'LayoutWidget typed composition'},
 {id:'P09',title:'配置向导',route:'structures/wizard',task:'选择字段、别名和条件，预览后保存配置',keywords:'配置 报表 字段 顺序 条件 预览',rule:'PAGE-004',reuse:'ReportConfig / previewReport'},
] as const;
