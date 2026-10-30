import { useCallback, useEffect, useRef, useState } from 'react';
import { App, Alert, Button, Dropdown, Empty, Grid, Input, Modal, Select, Skeleton, Table, Tabs, Tag, Tooltip } from 'antd';
import { DownloadOutlined, MoreOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {modules} from '../../modules/registry';
import { api } from '../api';
import type { AuditEntry, BusinessRecord, DemoRole, DemoScenario, ListQuery, ListResult, ModuleDefinition, SaveInput } from '../types';
import { downloadText, recordsToCsv } from '../export-csv';
import { detailExtensions } from '../../modules/extensions';
import { RecordForm } from './RecordForm';
import { RecordDetail } from './RecordDetail';
import {columnPreferenceKey,loadColumnPreferences,normalizeColumnPreferences,resolveColumnWidths,orderedColumnChoices,moveColumn,setColumnFixed} from '../columns';
import type {ColumnPreferences} from '../columns';
import {ColumnPicker,ColumnSettings} from './ColumnSettings';
import {ResizableColumnTitle} from './ResizableColumnTitle';
import {displayFieldValue} from '../field-values';

const money=new Intl.NumberFormat('zh-CN',{style:'currency',currency:'CNY'});
const errorText=(error:unknown)=>error instanceof Error?error.message:'请求未能完成，请稍后重试';
export function LedgerPage({module,active=true,role,scenario,revision}:{module:ModuleDefinition;active?:boolean;role:DemoRole;scenario:DemoScenario;revision:number}) {
  const {message,modal}=App.useApp();
  const confirmation=useRef<ReturnType<typeof modal.confirm>|null>(null);
  useEffect(()=>()=>{confirmation.current?.destroy();confirmation.current=null;},[active]);
  const screens=Grid.useBreakpoint();
  const [result,setResult]=useState<ListResult|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [query,setQuery]=useState<ListQuery>({page:1,pageSize:10,sortBy:'updatedAt',sortOrder:'desc'});
  const [keyword,setKeyword]=useState('');
  const [category,setCategory]=useState<string|undefined>();
  const [dateFrom,setDateFrom]=useState('');
  const [dateTo,setDateTo]=useState('');
  const [statusDraft,setStatusDraft]=useState<string|undefined>();
  const [moreOpen,setMoreOpen]=useState(false);
  const [wideQuery,setWideQuery]=useState(false);
  const [tableWidth,setTableWidth]=useState(0);
  const queryPanel=useRef<HTMLElement>(null);
  const tableViewport=useRef<HTMLDivElement>(null);
  const [tableScroll,setTableScroll]=useState({overflow:false,atStart:true,atEnd:true});
  const hasDate=module.queryFilters?.includes('dateRange')??false;
  const hasStatus=module.queryFilters?.includes('status')??false;
  useEffect(()=>{
    const panel=queryPanel.current;
    if(!panel)return;
    const observer=new ResizeObserver(entries=>{setWideQuery((entries[0].borderBoxSize[0]?.inlineSize??entries[0].contentRect.width)>=1000);setTableWidth(entries[0].contentRect.width);});
    observer.observe(panel);
    return()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    const root=tableViewport.current;
    if(!root)return;
    const resizeObserver:{current:ResizeObserver|null}={current:null};
    let observedScroller:Element|null=null;
    let observedTable:Element|null=null;
    const update=()=>{
      const scroller=root.querySelector<HTMLElement>('.ant-table-content');
      const overflow=Boolean(scroller&&scroller.scrollWidth>scroller.clientWidth+1);
      const table=scroller?.querySelector('table')??null;
      if(scroller&&observedScroller!==scroller){resizeObserver.current?.observe(scroller);observedScroller=scroller;}
      if(table&&observedTable!==table){resizeObserver.current?.observe(table);observedTable=table;}
      const scrollLabel=`${module.name}数据表格，可使用方向键横向滚动`;
      if(scroller&&overflow){if(scroller.tabIndex!==0)scroller.tabIndex=0;if(scroller.getAttribute('aria-label')!==scrollLabel)scroller.setAttribute('aria-label',scrollLabel);}
      else if(scroller){if(scroller.hasAttribute('tabindex'))scroller.removeAttribute('tabindex');if(scroller.hasAttribute('aria-label'))scroller.removeAttribute('aria-label');}
      const atStart=!overflow||!scroller||scroller.scrollLeft<=1;
      const atEnd=!overflow||!scroller||scroller.scrollLeft+scroller.clientWidth>=scroller.scrollWidth-2;
      setTableScroll(current=>current.overflow===overflow&&current.atStart===atStart&&current.atEnd===atEnd?current:{overflow,atStart,atEnd});
    };
    const resize=new ResizeObserver(update);
    resizeObserver.current=resize;
    const mutation=new MutationObserver(update);
    resize.observe(root);
    mutation.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class','colspan','rowspan']});
    root.addEventListener('scroll',update,true);
    update();
    return()=>{resize.disconnect();mutation.disconnect();root.removeEventListener('scroll',update,true);};
  },[module.name]);
  const [formRecord,setFormRecord]=useState<BusinessRecord|null|undefined>();
  const [saving,setSaving]=useState(false);
  const savingRef=useRef(false);
  const [detail,setDetail]=useState<BusinessRecord|null>(null);
  const [detailLoading,setDetailLoading]=useState(false);
  const [detailError,setDetailError]=useState('');
  const [history,setHistory]=useState<AuditEntry[]>([]);
  const [historyLoading,setHistoryLoading]=useState(false);
  const [historyError,setHistoryError]=useState('');
  const detailLatest=useRef(0);
  const [exporting,setExporting]=useState(false);
  const [exportOpen,setExportOpen]=useState(false);
  const [exportKeys,setExportKeys]=useState<string[]>([]);
  const [savedColumnPreferences,setColumnPreferences]=useState(()=>loadColumnPreferences(module));
  const columnPreferences=normalizeColumnPreferences(module,savedColumnPreferences);
  const choices=orderedColumnChoices(module,columnPreferences);
  const saveColumns=(next:ColumnPreferences)=>{
    setColumnPreferences(next);
    try{localStorage.setItem(columnPreferenceKey(module.id),JSON.stringify(next));}
    catch{message.warning({key:`column-preferences-${module.id}`,content:'调整已生效，但浏览器无法保存本次列设置。'});}
  };
  const layout=resolveColumnWidths(module,columnPreferences,tableWidth);
  const setColumnWidth=(key:string,width:number)=>saveColumns({...columnPreferences,widths:{...columnPreferences.widths,[key]:width},resizedKeys:[...new Set([...columnPreferences.resizedKeys,key])]});
  const columnTitle=(key:string,label:string)=><ResizableColumnTitle label={label} width={layout.widths[key]} onWidthChange={width=>setColumnWidth(key,width)}/>;
  const openExport=()=>{setExportKeys(choices.filter(choice=>columnPreferences.visibleKeys.includes(choice.key)).map(choice=>choice.key));setExportOpen(true);};
  const pinnedWidth=choices.filter(choice=>columnPreferences.visibleKeys.includes(choice.key)&&columnPreferences.fixedKeys[choice.key]).reduce((sum,choice)=>sum+(layout.widths[choice.key]??0),0);
  const hasPins=pinnedWidth>0;
  const pinsActive=Boolean(screens.md)&&tableWidth>=pinnedWidth+150+160;
  const pinsPaused=hasPins&&!pinsActive;
  const latest=useRef(0);
  const readOnly=role==='viewer';
  const load=useCallback(async()=>{
    const request=++latest.current;setLoading(true);setError('');
    try {const data=await api.list(module.id,query);if(request===latest.current)setResult(data);}
    catch(e){if(request===latest.current)setError(errorText(e));}
    finally {if(request===latest.current)setLoading(false);}
  },[module.id,query]);
  useEffect(()=>{
    if(!active)return;
    // 请求生命周期属于外部 HTTP 同步；微任务确保清理先于重新加载执行。
    let mounted=true;
    const requestSequence=latest;
    queueMicrotask(()=>{if(mounted)void load();});
    return()=>{mounted=false;requestSequence.current++;};
  },[active,load,scenario,revision]);
  const orderedStatuses=[...module.statuses].sort((a,b)=>Number(b.value==='active')-Number(a.value==='active'));
  const counts=result?.counts??{};
  const total=Object.values(counts).reduce((sum,value)=>sum+value,0);
  const countLabel=(count:number)=>loading||error||!result?'—':String(count);
  const filter=()=>setQuery(current=>({...current,keyword:keyword.trim()||undefined,category,...(hasDate?{dateFrom:dateFrom||undefined,dateTo:dateTo||undefined}:{}),...(hasStatus?{status:statusDraft}:{}),page:1}));
  const clearFilters=()=>{setKeyword('');setCategory(undefined);setDateFrom('');setDateTo('');setStatusDraft(undefined);setQuery(current=>({...current,keyword:undefined,category:undefined,dateFrom:undefined,dateTo:undefined,status:undefined,page:1}));};
  const reset=()=>{setKeyword('');setCategory(undefined);setDateFrom('');setDateTo('');setStatusDraft(undefined);setQuery({page:1,pageSize:10,sortBy:'updatedAt',sortOrder:'desc'});};
  const draftChanged=(keyword.trim()!==(query.keyword??'')||category!==query.category||(hasDate&&(dateFrom!==(query.dateFrom??'')||dateTo!==(query.dateTo??'')))||(hasStatus&&statusDraft!==query.status));
  const appliedFilters=[
    ...(query.keyword?[{key:'keyword',label:`关键词：${query.keyword}`}]:[]),
    ...(query.category?[{key:'category',label:`类别：${query.category}`}]:[]),
    ...(hasDate&&(query.dateFrom||query.dateTo)?[{key:'date',label:`登记日期：${query.dateFrom||'不限'} 至 ${query.dateTo||'不限'}`}]:[]),
  ];
  const hasAppliedQuery=Boolean(query.keyword||query.category||(hasDate&&(query.dateFrom||query.dateTo))||(hasStatus&&query.status));
  const clearOneFilter=(key:string)=>{
    if(key==='keyword'){setKeyword('');setQuery(current=>({...current,keyword:undefined,page:1}));}
    if(key==='category'){setCategory(undefined);setQuery(current=>({...current,category:undefined,page:1}));}
    if(key==='date'){setDateFrom('');setDateTo('');setQuery(current=>({...current,dateFrom:undefined,dateTo:undefined,page:1}));}
    if(key==='status'){setStatusDraft(undefined);setQuery(current=>({...current,status:undefined,page:1}));}
  };
  const loadDetail=async(record:BusinessRecord,request:number)=>{
    setDetailError('');setDetailLoading(true);
    try {const fresh=await api.get(module.id,record.id);if(request===detailLatest.current)setDetail(fresh);}
    catch(e){if(request===detailLatest.current)setDetailError(errorText(e));}
    finally {if(request===detailLatest.current)setDetailLoading(false);}
  };
  const loadHistory=async(record:BusinessRecord,request:number)=>{
    setHistoryError('');setHistoryLoading(true);
    try {const entries=await api.history(module.id,record.id);if(request===detailLatest.current)setHistory(entries);}
    catch(e){if(request===detailLatest.current)setHistoryError(errorText(e));}
    finally {if(request===detailLatest.current)setHistoryLoading(false);}
  };
  const showDetail=async(record:BusinessRecord)=>{
    const request=++detailLatest.current;
    setDetail(record);setHistory([]);
    await Promise.all([loadDetail(record,request),loadHistory(record,request)]);
  };
  const save=async(input:SaveInput)=>{
    if(readOnly||savingRef.current)return;
    savingRef.current=true;setSaving(true);
    try {
      if(formRecord)await api.update(module.id,formRecord.id,input);else await api.create(module.id,input);
      setFormRecord(undefined);message.success(formRecord?'修改已保存':`${module.singularName}已新增`);
      setQuery(current=>({...current,page:1}));await load();
    }finally{savingRef.current=false;setSaving(false);}
  };
  const perform=(record:BusinessRecord,key:string)=>{
    if(readOnly)return;
    const action=module.actions.find(action=>action.key===key);
    confirmation.current=modal.confirm({focusable:{autoFocusButton:'cancel'},title:key==='delete'?`删除${module.singularName}`:`确认${action?.label}`,content:key==='delete'?`将删除「${record.name}」。此操作不可撤销。`:`「${record.name}」将变更为「${module.statuses.find(status=>status.value===action?.to)?.label}」。`,okText:key==='delete'?'确认删除':'确认操作',cancelText:'取消',okButtonProps:{danger:key==='delete'||action?.tone==='danger'},onOk:async()=>{
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
      downloadText(recordsToCsv(module,records,exportKeys),`${module.name}-${new Date().toISOString().slice(0,10)}.csv`,'text/csv;charset=utf-8');
      setExportOpen(false);message.success(`已导出当前查询的 ${records.length} 条记录`);
    }catch(e){message.error(errorText(e));}finally{setExporting(false);}
  };
  const dataColumns:ColumnsType<BusinessRecord>=choices.filter(choice=>columnPreferences.visibleKeys.includes(choice.key)).map(choice=>{
    const fixed=pinsActive?columnPreferences.fixedKeys[choice.key]:undefined;
    if(choice.key==='status')return {title:columnTitle('status','状态'),dataIndex:'status',key:'status',width:layout.widths.status,fixed,render:(value:string)=>{const status=module.statuses.find(status=>status.value===value);return <Tag variant="filled" color={value==='active'?'success':value===module.defaultValues.status?'warning':'default'}>{status?.label??value}</Tag>;}};
    const field=module.fields.find(item=>item.key===choice.key)!;
    return {title:columnTitle(field.key,field.label),dataIndex:field.key,key:field.key,width:layout.widths[field.key],fixed,ellipsis:true,sorter:field.key==='amount'||field.key==='date',sortOrder:query.sortBy===field.key?(query.sortOrder==='asc'?'ascend' as const:'descend' as const):null,render:(value:unknown,record)=>field.key==='amount'?<span className="numeric">{money.format(Number(value))}</span>:field.key==='code'?<span className="record-code">{String(value)}</span>:<Tooltip title={displayFieldValue(field,record[field.key],'')} placement="topLeft"><span className="table-cell-ellipsis" tabIndex={0} aria-label={displayFieldValue(field,record[field.key],'')}>{displayFieldValue(field,record[field.key],'')}</span></Tooltip>};
  });
  const rightIndex=dataColumns.findIndex(column=>columnPreferences.fixedKeys[String(column.key)]==='right');
  const splitIndex=rightIndex<0?dataColumns.length:rightIndex;
  const columns:ColumnsType<BusinessRecord>=[...dataColumns.slice(0,splitIndex),
    ...(layout.filler>0?[{title:'',key:'spacer',width:layout.filler,onHeaderCell:()=>({'aria-hidden':true as const}),onCell:()=>({'aria-hidden':true as const})}]:[]),
    ...dataColumns.slice(splitIndex),
    {title:'操作',key:'actions',width:150,fixed:screens.md&&(!hasPins||pinsActive)?'right':undefined,render:(_,record)=><div className="row-actions"><Button type="link" size="small" onClick={()=>void showDetail(record)}>查看</Button><Button type="link" size="small" disabled={readOnly} onClick={()=>setFormRecord(record)}>编辑</Button><Dropdown trigger={['click']} menu={{items:[...module.actions.filter(action=>action.from.includes(record.status)).map(action=>({key:action.key,label:action.label,danger:action.tone==='danger'})),...(record.status===module.defaultValues.status?[{key:'delete',label:'删除',danger:true}]:[])],onClick:({key})=>perform(record,key)}}><Button type="text" size="small" aria-label="更多操作" disabled={readOnly} icon={<MoreOutlined/>}/></Dropdown></div>},
  ];
  const hiddenCount=Number(hasStatus&&!!query.status)+Number(hasDate&&!wideQuery&&!!(query.dateFrom||query.dateTo));
  const dateField=<div className="query-field query-date-range" role="group" aria-label="登记日期范围"><span>登记日期</span><div className="query-date-inputs"><Input type="date" aria-label="登记开始日期" value={dateFrom} onChange={event=>setDateFrom(event.target.value)}/><span>至</span><Input type="date" aria-label="登记结束日期" value={dateTo} onChange={event=>setDateTo(event.target.value)}/></div></div>;
  return <>
    {modules.length>1&&<div className="ledger-variants" aria-label="查询表格业务变体">业务变体：{modules.map(item=><Button type="link" key={item.id} href={`#/${item.id}`}>{item.name}</Button>)}</div>}
    <h1 className="visually-hidden">{module.name}</h1>
    <section ref={queryPanel} className="ledger-panel" aria-label={`${module.name}列表`}>
      <Tabs activeKey={query.status??'all'} onChange={status=>{const value=status==='all'?undefined:status;setStatusDraft(value);setQuery(current=>({...current,status:value,page:1}));}} items={[{key:'all',label:`全部 ${countLabel(total)}`},...orderedStatuses.map(status=>({key:status.value,label:`${status.label} ${countLabel(counts[status.value]??0)}`}))]}/>
      <div className="query-toolbar"><div className="query-inputs">
        <div className="query-fields">
          <label className="query-field"><span>关键词</span><Input prefix={<SearchOutlined/>} placeholder="搜索名称、编号或负责人" aria-label="关键词" aria-describedby={`query-submit-hint-${module.id}`} aria-keyshortcuts="Enter" value={keyword} onChange={event=>setKeyword(event.target.value)} onPressEnter={filter} allowClear/></label>
          <label className="query-field"><span>类别</span><Select aria-label="类别筛选" placeholder="全部类别" value={category} onChange={setCategory} allowClear options={module.fields.find(field=>field.key==='category')?.options}/></label>
          {hasDate&&wideQuery?dateField:null}
        </div>
        {moreOpen?<div className="query-advanced" id={`query-advanced-${module.id}`}><div className="query-fields">
          {hasDate&&!wideQuery?dateField:null}
          {hasStatus?<label className="query-field query-status"><span>状态</span><Select aria-label="状态筛选" placeholder="全部状态" value={statusDraft} onChange={setStatusDraft} allowClear options={module.statuses.map(status=>({value:status.value,label:status.label}))}/></label>:null}
        </div></div>:null}
        <div className="query-actions"><Button type="primary" onClick={filter}>查询</Button><Button onClick={reset}>重置</Button>{hasDate||hasStatus?<Button aria-expanded={moreOpen} aria-controls={moreOpen?`query-advanced-${module.id}`:undefined} onClick={()=>setMoreOpen(open=>!open)}>{moreOpen?'收起筛选':`更多筛选${hiddenCount?`（${hiddenCount}）`:''}`}</Button>:null}</div>
      </div></div>
      <p className="query-submit-hint" id={`query-submit-hint-${module.id}`}>点击「查询」或在关键词框按 Enter 查询</p>
      {appliedFilters.length? <div className="applied-filters" aria-label="已生效的筛选条件"><span>已生效</span>{appliedFilters.map(item=><Tag key={item.key} closable onClose={event=>{event.preventDefault();clearOneFilter(item.key);}} closeIcon={<span aria-label={`清除${item.label.split('：')[0]}筛选`}>×</span>}>{item.label}</Tag>)}<Button type="link" size="small" onClick={clearFilters}>清除全部</Button></div>:null}
      {draftChanged?<p className="query-draft-hint" role="status">有尚未应用的筛选条件；列表仍显示上次查询结果。</p>:null}
      <div className="list-toolbar" role="group" aria-label="列表操作"><Tooltip title={readOnly?'当前为只读演示角色':undefined}><Button type="primary" aria-label={`新增${module.singularName}`} icon={<PlusOutlined/>} disabled={readOnly} onClick={()=>setFormRecord(null)}>{`新增${module.singularName}`}</Button></Tooltip><div className="query-tools"><Tooltip title="选择导出列，导出当前查询的全部页"><Button icon={<DownloadOutlined/>} onClick={openExport} loading={exporting}>导出</Button></Tooltip><ColumnSettings active={active} choices={choices} visible={columnPreferences.visibleKeys} fixed={columnPreferences.fixedKeys} onChange={visibleKeys=>saveColumns({...columnPreferences,visibleKeys})} onMove={(from,to)=>saveColumns(moveColumn(columnPreferences,from,to))} onFixed={(key,pin)=>saveColumns(setColumnFixed(columnPreferences,key,pin))} onReset={()=>saveColumns(normalizeColumnPreferences(module,null))}/><Tooltip title="刷新列表"><Button aria-label="刷新列表" icon={<ReloadOutlined/>} onClick={()=>void load()} loading={loading}/></Tooltip></div></div>
      {pinsPaused?<p className="column-pin-hint" role="status">当前空间不足，固定效果暂时关闭。</p>:null}
      {tableScroll.overflow?<p className="table-overflow-hint" role="status">{tableScroll.atStart?'向右滚动查看其他列':tableScroll.atEnd?'向左滚动查看其他列':'左右滚动查看其他列'}</p>:null}
      <div ref={tableViewport} className="table-viewport">{error?<Alert className="list-error" type="error" showIcon title="数据加载失败" description={error} action={<Button size="small" onClick={()=>void load()}>重试</Button>}/>:loading&&!result?<div className="table-loading"><Skeleton active paragraph={{rows:10}}/></div>:<Table<BusinessRecord> rowKey="id" className="ledger-table" dataSource={result?.items??[]} columns={columns} loading={loading} size="middle" tableLayout="fixed" scroll={{x:Object.values(layout.widths).reduce((sum,width)=>sum+width,150)+layout.filler}} locale={{emptyText:<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={hasAppliedQuery?'暂无符合条件的记录':`暂无${module.singularName}记录`}>{hasAppliedQuery?<Button onClick={clearFilters}>清除筛选条件</Button>:null}</Empty>}} pagination={{current:query.page,pageSize:query.pageSize,total:result?.total??0,showSizeChanger:true,pageSizeOptions:[10,20,50],showTotal:total=>`共 ${total} 条`,size:'small'}} onChange={(pagination,_filters,sorter)=>{
        const sort=Array.isArray(sorter)?sorter[0]:sorter;
        setQuery(current=>({...current,page:pagination.current??1,pageSize:pagination.pageSize??10,...(sort.columnKey==='amount'||sort.columnKey==='date'?{sortBy:sort.order?sort.columnKey:'updatedAt',sortOrder:sort.order==='ascend'?'asc':'desc'}:{})}));
      }}/>}</div><div className="table-footnote">状态计数随已提交的非状态条件更新 · 导出包含当前查询的全部页</div>
    </section>
    <p className="workspace-footnote">数据仅存储于当前浏览器 · 可随时重置演示数据</p>
    <Modal title="选择导出列" open={active&&exportOpen} onCancel={()=>{if(!exporting)setExportOpen(false);}} onOk={()=>void exportCsv()} okText="确认导出" cancelText="取消" confirmLoading={exporting} okButtonProps={{disabled:exportKeys.length===0}} cancelButtonProps={{disabled:exporting}} width={420}>
      <p className="export-column-description">导出当前查询的全部页。选择导出列不会改变表格显示。</p><ColumnPicker choices={choices} selected={exportKeys} onChange={setExportKeys} disabled={exporting}/>
    </Modal>
    {formRecord!==undefined?<RecordForm active={active} key={formRecord?.id??'new'} module={module} record={formRecord} onCancel={()=>{if(!saving)setFormRecord(undefined);}} onSave={save} saving={saving}/>:null}
    {detail?<RecordDetail active={active} module={module} record={detail} history={history} loading={historyLoading} error={historyError} detailLoading={detailLoading} detailError={detailError} onRetryDetail={()=>void loadDetail(detail,detailLatest.current)} onRetryHistory={()=>void loadHistory(detail,detailLatest.current)} onClose={()=>{detailLatest.current++;setDetail(null);}} extra={detailExtensions[module.id]}/>:null}
  </>;
}
