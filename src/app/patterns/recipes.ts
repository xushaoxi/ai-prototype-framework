import {patternCatalog} from './catalog';
export interface PatternRecipe {id:string;title:string;task:string;when:string;avoid:string;variants:string[]}
export const patternRecipes:PatternRecipe[]=[
 {id:'collection',title:'集合展示与处理',task:'查找、比较和处理一组记录',when:'默认用PAGE-003查询表格；层级、摘要或并排查看有实际价值时启用变体',avoid:'不因资产、供应商、待办等业务名称创建重复模板',variants:['advanced-table','tree-table','card-list','master-detail']},
 {id:'form',title:'表单组织与保存',task:'新增或修改一个对象',when:'按信息分组、步骤依赖和动态明细选择组织方式；草稿是保存能力',avoid:'分步不代替合理分组；完整页面仍默认桌面三列',variants:['grouped-form','step-form','detail-form','drafts']},
 {id:'detail',title:'详情分区与历程组合',task:'理解一个对象及其关联信息',when:'主体身份、状态、分组和关联内容需完整呈现',avoid:'不以多层抽屉拼接复杂对象全貌',variants:['record-detail','audit']},
 {id:'status',title:'状态处理与恢复',task:'执行受约束的状态动作',when:'需要意见、确认、失败恢复或撤销结果',avoid:'待办和审批是查询加处理组合，不是两种独立基础页面',variants:['approval','tasks','recycle']},
 {id:'files',title:'附件与数据交换',task:'导入、校验、预览和维护附件元数据',when:'文件处理有明确格式、范围和原子提交规则',avoid:'附件示例不提供真实文件存储',variants:['import','files']},
 {id:'selection',title:'层级与权限选择',task:'选择层级对象或一组能力',when:'用树形关系、勾选和范围表达选择结果',avoid:'组织和角色只作为选择组合的样例，不提供真实鉴权',variants:['organization','roles']},
 {id:'analytics',title:'图表与指标基础',task:'理解范围、趋势、分布与异常',when:'有明确统计口径且能够追溯来源',avoid:'日常查询不默认放数字卡片',variants:['dashboard']},
 {id:'feedback',title:'结果与通知反馈',task:'理解处理结果并找到下一步',when:'需要成功、错误、无权限或可恢复反馈',avoid:'不以消息中心业务菜单代替反馈组件说明',variants:['results','messages']},
];
export function relatedPatterns(id:string){const recipe=patternRecipes.find(item=>item.variants.includes(id));return recipe?patternCatalog.filter(item=>recipe.variants.includes(item.id)):[];}
export const compatibilityPatterns=patternCatalog.filter(pattern=>!patternRecipes.some(recipe=>recipe.variants.includes(pattern.id)));
