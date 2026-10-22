import { useCallback, useEffect, useRef, useState } from 'react';
import { App, Alert, Button, Dropdown, Empty, Grid, Input, Select, Skeleton, Table, Tabs, Tag, Tooltip } from 'antd';
import { DownloadOutlined, MoreOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { api } from '../api';
import type { AuditEntry, BusinessRecord, DemoRole, DemoScenario, ListQuery, ListResult, ModuleDefinition, SaveInput } from '../types';
import { downloadText, recordsToCsv } from '../export-csv';
import { detailExtensions } from '../../modules/extensions';
import { RecordForm } from './RecordForm';
import { RecordDetail } from './RecordDetail';

const money=new Intl.NumberFormat('zh-CN',{style:'currency',currency:'CNY'});
const errorText=(error:unknown)=>error instanceof Error?error.message:'请求未能完成，请稍后重试';
export function LedgerPage({module,role,scenario,revision}:{module:ModuleDefinition;role:DemoRole;scenario:DemoScenario;revision:number}) {
  const {message,modal}=App.useApp();
  const screens=Grid.useBreakpoint();
  const [result,setResult]=useState<ListResult|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [query,setQuery]=useState<ListQuery>({page:1,pageSize:10,sortBy:'updatedAt',sortOrder:'desc'});
  const [keyword,setKeyword]=useState('');
  const [category,setCategory]=useState<string|undefined>();
  const [formRecord,setFormRecord]=useState<BusinessRecord|null|undefined>();
  const [saving,setSaving]=useState(false);
  const savingRef=useRef(false);
  const [detail,setDetail]=useState<BusinessRecord|null>(null);
  const [history,setHistory]=useState<AuditEntry[]>([]);
  const [historyLoading,setHistoryLoading]=useState(false);
  const [historyError,setHistoryError]=useState('');
  const detailLatest=useRef(0);
  const [exporting,setExporting]=useState(false);
  const latest=useRef(0);
  const readOnly=role==='viewer';
  const load=useCallback(async()=>{
    const request=++latest.current;setLoading(true);setError('');
    try {const data=await api.list(module.id,query);if(request===latest.current)setResult(data);}
    catch(e){if(request===latest.current)setError(errorText(e));}
    finally {if(request===latest.current)setLoading(false);}
  },[module.id,query]);
  useEffect(()=>{
    // 请求生命周期属于外部 HTTP 同步；微任务确保清理先于重新加载执行。
    let active=true;
    const requestSequence=latest;
    queueMicrotask(()=>{if(active)void load();});
    return()=>{active=false;requestSequence.current++;};
  },[load,scenario,revision]);
  const orderedStatuses=[...module.statuses].sort((a,b)=>Number(b.value==='active')-Number(a.value==='active'));
  const counts=result?.counts??{};
  const total=Object.values(counts).reduce((sum,value)=>sum+value,0);
  const filter=()=>setQuery(current=>({...current,keyword:keyword.trim()||undefined,category,page:1}));
  const reset=()=>{setKeyword('');setCategory(undefined);setQuery({page:1,pageSize:10,sortBy:'updatedAt',sortOrder:'desc'});};
  const showDetail=async(record:BusinessRecord)=>{
    const request=++detailLatest.current;
    setDetail(record);setHistory([]);setHistoryError('');setHistoryLoading(true);
    try {const [fresh,entries]=await Promise.all([api.get(module.id,record.id),api.history(module.id,record.id)]);if(request===detailLatest.current){setDetail(fresh);setHistory(entries);}}
    catch(e){if(request===detailLatest.current)setHistoryError(errorText(e));}finally {if(request===detailLatest.current)setHistoryLoading(false);}
  };
  const save=async(input:SaveInput)=>{
    if(readOnly||savingRef.current)return;
    savingRef.current=true;setSaving(true);
    try {
      if(formRecord)await api.update(module.id,formRecord.id,input);else await api.create(module.id,input);
      setFormRecord(undefined);message.success(formRecord?'修改已保存':`${module.singularName}已新增`);
      setQuery(current=>({...current,page:1}));await load();
    }catch(e){message.error(errorText(e));throw e;}finally{savingRef.current=false;setSaving(false);}
  };
  const perform=(record:BusinessRecord,key:string)=>{
    if(readOnly)return;
    const action=module.actions.find(action=>action.key===key);
    modal.confirm({title:key==='delete'?`删除${module.singularName}`:`确认${action?.label}`,content:key==='delete'?`将删除「${record.name}」。此操作不可撤销。`:`「${record.name}」将变更为「${module.statuses.find(status=>status.value===action?.to)?.label}」。`,okText:key==='delete'?'确认删除':'确认操作',cancelText:'取消',okButtonProps:{danger:key==='delete'||action?.tone==='danger'},onOk:async()=>{
      try {
        if(key==='delete')await api.remove(module.id,record.id);else await api.transition(module.id,record.id,key,record.version);
        message.success(key==='delete'?'记录已删除':'业务操作已完成');
        setQuery(current=>({...current,page:1}));await load();
      }catch(e){message.error(errorText(e));throw e;}
    }});
  };
  const exportCsv=async()=>{
    setExporting(true);
    try {
      const records:BusinessRecord[]=[];let page=1;let count=0;
      do {const part=await api.list(module.id,{...query,page,pageSize:100});records.push(...part.items);count=part.total;if(!part.items.length)break;page++;}while(records.length<count);
      downloadText(recordsToCsv(module,records),`${module.name}-${new Date().toISOString().slice(0,10)}.csv`,'text/csv;charset=utf-8');
      message.success(`已导出当前查询的 ${records.length} 条记录`);
    }catch(e){message.error(errorText(e));}finally{setExporting(false);}
  };
  const columns:ColumnsType<BusinessRecord>=[...module.fields.filter(field=>field.inTable).map(field=>({title:field.label,dataIndex:field.key,key:field.key,responsive:field.key==='code'?['md' as const]:undefined,width:field.width??(field.key==='amount'?130:field.key==='date'?116:100),ellipsis:true,sorter:field.key==='amount'||field.key==='date',sortOrder:query.sortBy===field.key?(query.sortOrder==='asc'?'ascend' as const:'descend' as const):null,render:(value:unknown)=>field.key==='amount'?<span className="numeric">{money.format(Number(value))}</span>:field.key==='code'?<span className="record-code">{String(value)}</span>:String(value)})),
    {title:'状态',dataIndex:'status',key:'status',width:92,render:(value:string)=>{const status=module.statuses.find(status=>status.value===value);return <Tag variant="filled" color={value==='active'?'success':value===module.defaultValues.status?'warning':'default'}>{status?.label??value}</Tag>;}},
    {title:'操作',key:'actions',width:150,fixed:screens.md?'right':undefined,render:(_,record)=><div className="row-actions"><Button type="link" size="small" onClick={()=>void showDetail(record)}>查看</Button><Button type="link" size="small" disabled={readOnly} onClick={()=>setFormRecord(record)}>编辑</Button><Dropdown trigger={['click']} menu={{items:[...module.actions.filter(action=>action.from.includes(record.status)).map(action=>({key:action.key,label:action.label,danger:action.tone==='danger'})),...(record.status===module.defaultValues.status?[{key:'delete',label:'删除',danger:true}]:[])],onClick:({key})=>perform(record,key)}}><Button type="text" size="small" aria-label="更多操作" disabled={readOnly} icon={<MoreOutlined/>}/></Dropdown></div>},
  ];
  return <>
    <div className="page-heading"><div><h1>{module.name}</h1><p>{module.description}</p></div><Tooltip title={readOnly?'当前为只读演示角色':undefined}><Button type="primary" aria-label={`新增${module.singularName}`} icon={<PlusOutlined/>} disabled={readOnly} onClick={()=>setFormRecord(null)}>{`新增${module.singularName}`}</Button></Tooltip></div>
    <section className="summary-strip" aria-label="当前筛选统计"><div className="summary-item"><div className="summary-label"><i className="summary-dot total"/>{module.singularName}总数</div><strong data-testid="summary-total">{loading&&!result?'—':total}</strong></div>{orderedStatuses.map(status=><div className="summary-item" key={status.value}><div className="summary-label"><i className={`summary-dot ${status.value==='active'?'active':status.value===module.defaultValues.status?'draft':'archived'}`}/>{status.label}</div><strong>{loading&&!result?'—':counts[status.value]??0}</strong></div>)}</section>
    <section className="ledger-panel" aria-label={`${module.name}列表`}>
      <Tabs activeKey={query.status??'all'} onChange={status=>setQuery(current=>({...current,status:status==='all'?undefined:status,page:1}))} items={[{key:'all',label:`全部 ${total}`},...orderedStatuses.map(status=>({key:status.value,label:`${status.label} ${counts[status.value]??0}`}))]}/>
      <div className="query-toolbar"><div className="query-inputs"><Input prefix={<SearchOutlined/>} placeholder="搜索名称、编号或负责人" aria-label="关键词" value={keyword} onChange={event=>setKeyword(event.target.value)} onPressEnter={filter} allowClear/><Select aria-label="类别筛选" placeholder="全部类别" value={category} onChange={setCategory} allowClear options={module.fields.find(field=>field.key==='category')?.options}/><Button type="primary" onClick={filter}>查询</Button><Button onClick={reset}>重置</Button></div><div className="query-tools"><Tooltip title="导出当前查询的全部页"><Button icon={<DownloadOutlined/>} onClick={()=>void exportCsv()} loading={exporting}>导出</Button></Tooltip><Tooltip title="刷新列表"><Button aria-label="刷新列表" icon={<ReloadOutlined/>} onClick={()=>void load()} loading={loading}/></Tooltip></div></div>
      <div className="mobile-table-hint">左右滑动查看完整台账</div>
      {error?<Alert className="list-error" type="error" showIcon title="数据加载失败" description={error} action={<Button size="small" onClick={()=>void load()}>重试</Button>}/>:loading&&!result?<div className="table-loading"><Skeleton active paragraph={{rows:10}}/></div>:<Table<BusinessRecord> rowKey="id" className="ledger-table" dataSource={result?.items??[]} columns={columns} loading={loading} size="middle" scroll={{x:1050}} locale={{emptyText:<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无符合条件的记录"/>}} pagination={{current:query.page,pageSize:query.pageSize,total:result?.total??0,showSizeChanger:true,pageSizeOptions:[10,20,50],showTotal:total=>`共 ${total} 条`,size:'small'}} onChange={(pagination,_filters,sorter)=>{
        const sort=Array.isArray(sorter)?sorter[0]:sorter;
        setQuery(current=>({...current,page:pagination.current??1,pageSize:pagination.pageSize??10,...(sort.columnKey==='amount'||sort.columnKey==='date'?{sortBy:sort.order?sort.columnKey:'updatedAt',sortOrder:sort.order==='ascend'?'asc':'desc'}:{})}));
      }}/>}<div className="table-footnote">统计随关键词和类别筛选更新 · 导出包含当前查询的全部页</div>
    </section>
    <p className="workspace-footnote">数据仅存储于当前浏览器 · 可随时重置演示数据</p>
    {formRecord!==undefined?<RecordForm key={formRecord?.id??'new'} module={module} record={formRecord} onCancel={()=>{if(!saving)setFormRecord(undefined);}} onSave={save} saving={saving}/>:null}
    {detail?<RecordDetail module={module} record={detail} history={history} loading={historyLoading} error={historyError} onClose={()=>{detailLatest.current++;setDetail(null);}} extra={detailExtensions[module.id]}/>:null}
  </>;
}
