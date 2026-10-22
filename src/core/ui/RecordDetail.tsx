import { Alert, Descriptions, Drawer, Empty, Skeleton, Tag, Timeline } from 'antd';
import type { ReactNode } from 'react';
import type { AuditEntry, BusinessRecord, ModuleDefinition } from '../types';

export type DetailExtension = (record:BusinessRecord)=>ReactNode;
export function RecordDetail({module,record,history,loading,error,onClose,extra}:{module:ModuleDefinition;record:BusinessRecord;history:AuditEntry[];loading:boolean;error:string;onClose:()=>void;extra?:DetailExtension}) {
  const status=module.statuses.find(status=>status.value===record.status);
  return <Drawer title={`${module.singularName}详情`} open onClose={onClose} size={560}>
    <div className="detail-heading"><div><div className="detail-code">{record.code}</div><h2>{record.name}</h2></div><Tag variant="filled" color={status?.color==='green'?'success':record.status==='draft'||record.status==='pending'?'warning':'default'}>{status?.label??record.status}</Tag></div>
    <Descriptions column={1} size="small" colon={false} items={module.fields.filter(field=>field.inDetail!==false).map(field=>({key:field.key,label:field.label,children:field.key==='amount'?new Intl.NumberFormat('zh-CN',{style:'currency',currency:'CNY'}).format(record.amount):String(record[field.key as keyof BusinessRecord]??'—')||'—'}))}/>
    {extra?.(record)}
    <div className="detail-section"><h3>活动记录</h3><p className="muted">每一次登记、变更与业务操作都有迹可循。</p></div>
    {loading?<Skeleton active paragraph={{rows:3}}/>:error?<Alert type="error" title="活动记录加载失败" description={error}/>:history.length?<Timeline items={history.map(item=>({title:new Date(item.at).toLocaleString('zh-CN',{hour12:false}),content:<><strong>{item.action==='create'?'登记记录':item.action==='update'?'修改信息':module.actions.find(action=>action.key===item.action)?.label??item.action}</strong><div className="muted">{item.summary}</div></>}))}/>:<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无活动记录"/>}
    <div className="detail-version">版本 {record.version} · 最近更新 {new Date(record.updatedAt).toLocaleString('zh-CN',{hour12:false})}</div>
  </Drawer>;
}
