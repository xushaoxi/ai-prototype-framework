export interface RelationNode {id:string;label:string;kind:string;x:number;y:number}
export interface RelationEdge {id:string;source:string;target:string;label:string}
export interface ScheduleTask {id:string;parentId:string|null;name:string;owner:string;start:string;end:string;progress:number;milestone?:boolean;actualStart?:string;actualEnd?:string}
export interface LayoutWidget {id:string;kind:'metric'|'tasks';width:number;scope?:'all'|'done'|'pending';fields?:('name'|'owner'|'progress')[];limit?:number}
export type ReportCondition={field:'name'|'owner';operator:'contains'|'eq';value:string}|{field:'progress';operator:'gte';value:number};
export interface ReportConfig {aliases?:Partial<Record<'name'|'owner'|'progress',string>>;conditions?:ReportCondition[];fields:('name'|'owner'|'progress')[];minimum:number}
export interface StructureSnapshot {schema:1;nodes:RelationNode[];edges:RelationEdge[];version:number;stage:number;blocked:boolean;history:{at:string;summary:string}[];tasks:ScheduleTask[];widgets:LayoutWidget[];report:ReportConfig}
export type StructureAction={type:'stage.advance'|'stage.resume'|'stage.reopen'}|{type:'stage.block';note:string}|{type:'task.save';task:ScheduleTask}|{type:'task.delete';id:string}|{type:'layout.save';widgets:LayoutWidget[]}|{type:'report.save';report:ReportConfig};
export const structureTitles:Record<string,string>={detail:'详情展示',stages:'阶段过程',schedule:'任务与排程',graph:'关系图谱',analysis:'指标分析',workbench:'自定义工作台',wizard:'配置向导'};
