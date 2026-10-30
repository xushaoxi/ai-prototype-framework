export interface LineItem {id:string;name:string;quantity:number;price:number}
export interface FileMeta {id:string;name:string;size:number;type:string}
export interface FormPayload {name:string;category:string;owner:string;amount:number;date:string;notes:string;classification:'basic'|'special';reason:string;tags:string[];items:LineItem[];files:FileMeta[]}
export interface PatternRecord {id:string;code:string;name:string;category:string;owner:string;amount:number;date:string;status:'draft'|'active'|'archived';notes:string;tags:string[];details?:FormPayload}
export interface OrgNode {id:string;name:string;parentId:string|null;enabled:boolean}
export interface PatternRole {id:string;name:string;permissions:string[];scope:'all'|'department'|'self'}
export interface PatternUser {id:string;name:string;email:string;orgId:string;roleIds:string[];enabled:boolean}
export interface ApprovalTask {id:string;title:string;applicant:string;assignee:string;status:'pending'|'approved'|'rejected';comment:string;createdAt:string}
export interface PatternSettings {systemName:string;notifications:boolean;timezone:string}
export interface PatternNotice {id:string;title:string;read:boolean;createdAt:string}
export interface PatternAudit {id:string;action:string;summary:string;at:string}
export interface PatternDraft {id:string;title:string;values:FormPayload;updatedAt:string}
export interface PatternSnapshot {version:number;records:PatternRecord[];deletedRecords:PatternRecord[];nodes:OrgNode[];roles:PatternRole[];users:PatternUser[];tasks:ApprovalTask[];settings:PatternSettings;notices:PatternNotice[];audit:PatternAudit[];drafts:PatternDraft[];files:FileMeta[]}
export type PatternAction =
 |{type:'record.save';record:Omit<PatternRecord,'id'|'code'> & {id?:string}}
 |{type:'record.delete'|'record.restore'|'record.purge';ids:string[]}
 |{type:'record.status';ids:string[];status:PatternRecord['status']}
 |{type:'record.import';records:Omit<PatternRecord,'id'|'code'>[]}
 |{type:'node.save';node:OrgNode}|{type:'node.delete';id:string}
 |{type:'role.save';role:PatternRole}|{type:'role.delete';id:string}
 |{type:'user.save';user:PatternUser}|{type:'user.delete';id:string}
 |{type:'task.decide';id:string;decision:'approved'|'rejected';comment:string}
 |{type:'settings.save';settings:PatternSettings}
 |{type:'notice.read';ids:string[]}
 |{type:'draft.save';draft:Omit<PatternDraft,'updatedAt'>}|{type:'draft.delete';id:string}
 |{type:'file.add';files:FileMeta[]}|{type:'file.delete';id:string}
 |{type:'reset'}|{type:'backup.restore';snapshot:PatternSnapshot};
export interface PatternPageProps {patternId:string;active:boolean}
export const PERMISSION_OPTIONS=[{label:'查看记录',value:'record.read'},{label:'新增编辑',value:'record.write'},{label:'删除记录',value:'record.delete'},{label:'审批处理',value:'task.decide'},{label:'管理配置',value:'settings.write'}];
