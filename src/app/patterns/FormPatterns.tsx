import {useState} from 'react';
import {Alert,App,Button,Card,Cascader,Empty,Form,Input,InputNumber,Popconfirm,Radio,Select,Space,Spin,Steps,Switch,Table,Tag,Typography} from 'antd';
import type {FileMeta,FormPayload,OrgNode,PatternDraft,PatternPageProps} from '../../core/patterns/types';
import {usePatterns} from '../../core/patterns/usePatterns';
import {SharedForm} from '../../core/ui/SharedForm';
import {useSharedForm} from '../../core/ui/useSharedForm';
import {attachmentError,emptyForm,formSignature,lineTotal} from './form-pattern-values';
import './FormPatterns.css';

export interface AdvancedRecordFormProps {
 initial?:FormPayload;mode?:'grouped'|'steps'|'details';busy:boolean;readOnly?:boolean;nodes:OrgNode[];
 onSubmit:(values:FormPayload)=>Promise<boolean>;
 onDraft?:(values:FormPayload,id:string)=>Promise<boolean>;
 drafts?:PatternDraft[];showDrafts?:boolean;onReloadDrafts?:()=>Promise<void>;onLoadDraft?:(id:string|null)=>void;onDeleteDraft?:(id:string)=>Promise<boolean>;
}

const popupContainer=(trigger:HTMLElement)=>trigger.parentElement??document.body;

function AttachmentPicker({value=[],onChange,disabled=false}:{value?:FileMeta[];onChange?:(files:FileMeta[])=>void;disabled?:boolean}){
 const {message}=App.useApp();
 return <div className="pattern-attachments"><label className="pattern-file-input">选择附件<input aria-label="选择附件" type="file" accept="application/pdf,image/png,image/jpeg,text/csv" disabled={disabled} onChange={event=>{
  const file=event.target.files?.[0];event.target.value='';if(!file)return;
  const error=attachmentError(file,value.length);if(error){void message.error(error);return;}
  onChange?.([...value,{id:crypto.randomUUID(),name:file.name,type:file.type,size:file.size}]);
 }}/></label><Typography.Paragraph type="secondary">PDF / PNG / JPEG / CSV，单个最多 5 MB，最多 5 个。仅保存文件元数据，不上传文件内容。</Typography.Paragraph>
 {value.map(file=><div key={file.id} className="pattern-file-row"><span><strong>{file.name}</strong> · {(file.size/1024).toFixed(1)} KB</span><Button disabled={disabled} size="small" onClick={()=>onChange?.(value.filter(item=>item.id!==file.id))}>移除 {file.name}</Button></div>)}</div>;
}
function orgTree(nodes:OrgNode[],parentId:string|null=null):{title:string;value:string;disabled:boolean;children:ReturnType<typeof orgTree>}[]{
 return nodes.filter(node=>node.parentId===parentId).map(node=>({title:node.name,value:node.id,disabled:!node.enabled,children:orgTree(nodes,node.id)}));
}

function DepartmentPicker({nodes,value,onChange,id}:{nodes:OrgNode[];value?:string;onChange?:(value:string)=>void;id?:string}){
 const path:string[]=[];let node=nodes.find(item=>item.id===value);
 while(node){path.unshift(node.id);node=nodes.find(item=>item.id===node?.parentId);}
 return <Cascader getPopupContainer={popupContainer} id={id} value={path} options={orgTree(nodes)} fieldNames={{label:'title'}} showSearch expandTrigger="hover" changeOnSelect placeholder="搜索并选择部门" onChange={next=>onChange?.(String(next.at(-1)??''))} />;
}

export function AdvancedRecordForm({initial,mode='grouped',busy,readOnly=false,nodes,onSubmit,onDraft,drafts=[],showDrafts=false,onReloadDrafts,onLoadDraft,onDeleteDraft}:AdvancedRecordFormProps){
 const {message}=App.useApp();
 const [step,setStep]=useState(0);const [draftId,setDraftId]=useState<string>(()=>crypto.randomUUID());
 const state=useSharedForm({initial:initial??emptyForm(),signature:formSignature,busy,readOnly,onInvalid:name=>setStep(['name','category','owner','amount','date'].includes(String(name[0]))?0:['classification','reason','tags','notes'].includes(String(name[0]))?1:2)});
 const {form,saving,disabled,request}=state;
 const values=Form.useWatch([],form);const classification=values?.classification??'basic';const items=values?.items??[];
 const replace=(next:FormPayload,id?:string)=>{state.replace(next);setDraftId(id??crypto.randomUUID());setStep(0);};
 const perform=async(draft:boolean)=>{
  const success=await state.perform(async values=>{const payload:FormPayload={...emptyForm(),...values};return draft?await onDraft?.(payload,draftId):await onSubmit(payload);},!draft);
  if(success){void message.success(draft?'草稿已暂存':'记录已提交');if(!draft){replace(emptyForm());onLoadDraft?.(null);}}
 };
 const nextStep=async()=>{try{await form.validateFields(step===0?['name','category','owner','amount','date']:['classification','reason','tags','notes']);setStep(step+1);}catch{state.reportErrors();}};
 return <div className="advanced-record-form">
 {showDrafts&&<Card title="已保存草稿" size="small" extra={<Button disabled={saving} onClick={()=>void onReloadDrafts?.()}>刷新草稿列表</Button>}><Table<PatternDraft> rowKey="id" dataSource={drafts} pagination={{pageSize:5}} scroll={{x:520}} columns={[{title:'草稿名称',dataIndex:'title'},{title:'更新时间',dataIndex:'updatedAt',render:(value:string)=>new Date(value).toLocaleString('zh-CN')},{title:'操作',render:(_,draft)=><Space><Button disabled={disabled} size="small" onClick={()=>request(()=>{replace(draft.values,draft.id);onLoadDraft?.(draft.id);})}>载入</Button><Popconfirm getPopupContainer={popupContainer} title="删除这个草稿？" okText="确认删除" cancelText="取消" onConfirm={()=>onDeleteDraft?.(draft.id)}><Button danger size="small" disabled={disabled}>删除</Button></Popconfirm></Space>}]} /></Card>}
 {mode==='steps'&&<Steps current={step} items={[{title:'基本信息'},{title:'申请说明'},{title:'明细与附件'}]} />}
 <SharedForm state={state}>
 <section hidden={mode==='steps'&&step!==0}><Typography.Title level={5}>基本信息</Typography.Title><div className="pattern-form-grid">
 <Form.Item name="name" label="申请名称" rules={[{required:true,whitespace:true,message:'请输入申请名称'},{max:100,message:'最多 100 字'}]}><Input maxLength={100} placeholder="输入申请名称" /></Form.Item>
 <Form.Item name="category" label="所属类别" rules={[{required:true,message:'请选择所属类别'}]}><Select getPopupContainer={popupContainer} virtual={false} placeholder="选择所属类别" options={[{value:'equipment',label:'设备采购'},{value:'service',label:'服务采购'},{value:'supplies',label:'办公物资'}]} /></Form.Item>
 <Form.Item name="owner" label="所属部门" rules={[{required:true,message:'请选择所属部门'}]}><DepartmentPicker nodes={nodes} /></Form.Item>
 <Form.Item name="amount" label="申请金额（元）" rules={[{required:true,message:'请输入申请金额'},{type:'number',min:0,message:'金额不能为负数'}]}><InputNumber min={0} precision={2} style={{width:'100%'}} /></Form.Item>
 <Form.Item name="date" label="申请日期" rules={[{required:true,message:'请选择申请日期'}]}><Input type="date" /></Form.Item>
 </div></section>
 <section hidden={mode==='steps'&&step!==1}><Typography.Title level={5}>申请说明</Typography.Title><div className="pattern-form-grid">
 <Form.Item name="classification" label="申请类型"><Radio.Group options={[{label:'普通申请',value:'basic'},{label:'特殊申请',value:'special'}]} /></Form.Item>
 <Form.Item name="tags" label="业务标签"><Select getPopupContainer={popupContainer} virtual={false} mode="multiple" showSearch optionFilterProp="label" placeholder="搜索并选择标签" options={[{value:'urgent',label:'紧急'},{value:'review',label:'需要复核'},{value:'shared',label:'共享'}]} /></Form.Item>
 {classification==='special'&&<Form.Item name="reason" label="特殊申请原因" rules={[{required:true,whitespace:true,message:'请输入特殊申请原因'},{max:500,message:'最多 500 字'}]}><Input.TextArea rows={2} maxLength={500} /></Form.Item>}
 <Form.Item name="notes" label="申请备注" className="pattern-form-full"><Input.TextArea rows={3} maxLength={2000} showCount /></Form.Item>
 </div></section>
 <section hidden={mode==='steps'&&step!==2}><Typography.Title level={5}>明细与附件</Typography.Title>
 <Form.List name="items">{(fields,{add,remove})=><><div className="pattern-detail-lines">{fields.map(({key,name},index)=><div key={key} className="pattern-detail-line">
 <Form.Item name={[name,'name']} rules={[{required:true,whitespace:true,message:'请输入明细名称'}]}><Input aria-label={`明细名称 ${index+1}`} placeholder="明细名称" /></Form.Item>
 <Form.Item name={[name,'quantity']} rules={[{required:true,message:'请输入数量'},{type:'number',min:1,message:'数量至少为 1'}]}><InputNumber aria-label={`数量 ${index+1}`} min={1} precision={0} placeholder="数量" /></Form.Item>
 <Form.Item name={[name,'price']} rules={[{required:true,message:'请输入单价'},{type:'number',min:0,message:'单价不能为负'}]}><InputNumber aria-label={`单价 ${index+1}`} min={0} precision={2} placeholder="单价" /></Form.Item>
 <Button disabled={disabled} danger onClick={()=>remove(name)} aria-label={`删除明细 ${index+1}`}>删除</Button></div>)}</div>
 <Space wrap><Button disabled={disabled||fields.length>=20} onClick={()=>add({id:crypto.randomUUID(),name:'',quantity:1,price:0})}>添加明细</Button><span role="status">明细合计：¥ {lineTotal(items).toFixed(2)}</span></Space></>}</Form.List>
 <Form.Item name="files" label="申请附件" style={{marginTop:24}}><AttachmentPicker disabled={disabled} /></Form.Item>
 </section>
 <div className="pattern-form-footer"><Space wrap>{mode==='steps'&&step>0&&<Button disabled={saving} onClick={()=>setStep(step-1)}>上一步</Button>}{mode==='steps'&&step<2?<Button type="primary" disabled={disabled} onClick={()=>void nextStep()}>下一步</Button>:<Button aria-label="提交记录" type="primary" loading={saving} disabled={readOnly} onClick={()=>void perform(false)}>提交记录</Button>}{onDraft&&<Button aria-label="暂存草稿" loading={saving} disabled={readOnly} onClick={()=>void perform(true)}>暂存草稿</Button>}<Button disabled={disabled} onClick={()=>request(()=>{replace(emptyForm());onLoadDraft?.(null);})}>清空表单</Button></Space></div>
 </SharedForm></div>;
}

export function FormPatterns({patternId,active}:PatternPageProps){
 const {data,loading,error,busy,reload,run}=usePatterns();const [readOnly,setReadOnly]=useState(false);
 const [draftId,setDraftId]=useState<string|null>(null);
 const {modal}=App.useApp();
 if(!data&&loading)return <Spin description="加载模式示例"><div style={{minHeight:180}} /></Spin>;
 if(error&&!data)return <Alert type="error" title={error} action={<Button onClick={()=>void reload()}>重试</Button>} />;
 if(!data)return <Empty description="暂无模式数据" />;
 const isFiles=patternId==='files';const title=({ 'grouped-form':'分组联动表单','step-form':'分步表单','detail-form':'明细子表单',drafts:'草稿箱',files:'文件中心'} as Record<string,string>)[patternId]??'表单模式';
 return <div className="form-pattern-page" hidden={!active}><div className="pattern-page-heading"><Typography.Text type="secondary">{title} · 填写体验</Typography.Text><Space><span>只读角色（演示仿真）</span><Switch aria-label="只读角色（演示仿真）" checked={readOnly} disabled={busy} onChange={setReadOnly} /></Space></div>
 {error&&<Alert type="error" title={error} action={<Button onClick={()=>void reload()}>重试</Button>} />}
 {isFiles&&<Alert type="info" showIcon title="附件演示边界" description="仅保存附件元数据，不上传文件内容，不提供远端文件下载。" />}
 {isFiles?<Card title="附件元数据"><AttachmentPicker disabled={busy||readOnly} onChange={files=>{void run({type:'file.add',files});}} /><Button disabled={busy} onClick={()=>void reload()}>刷新文件列表</Button><Table<FileMeta> rowKey="id" dataSource={data.files} scroll={{x:650}} pagination={{pageSize:10}} columns={[{title:'文件名称',dataIndex:'name'},{title:'文件类型',dataIndex:'type',render:(value:string)=><Tag>{value}</Tag>},{title:'大小',dataIndex:'size',render:(size:number)=>`${(size/1024).toFixed(1)} KB`},{title:'操作',render:(_,file)=><Button disabled={busy||readOnly} danger onClick={()=>modal.confirm({title:'删除附件元数据？',content:file.name,okText:'确认删除',cancelText:'取消',onOk:async()=>{if(!await run({type:'file.delete',id:file.id}))throw new Error('删除失败');}})}>删除</Button>}]} /></Card>:
 <Card><AdvancedRecordForm busy={busy} readOnly={readOnly} showDrafts={patternId==='drafts'} onReloadDrafts={reload} nodes={data.nodes} mode={patternId==='step-form'?'steps':patternId==='detail-form'?'details':'grouped'} drafts={patternId==='drafts'?data.drafts:[]} onLoadDraft={setDraftId} onDeleteDraft={id=>run({type:'draft.delete',id})} onDraft={async(values,id)=>{const saved=await run({type:'draft.save',draft:{id,title:values.name.trim()||'未命名草稿',values}});if(saved)setDraftId(id);return saved;}} onSubmit={async values=>{
  const saved=await run({type:'record.save',record:{name:values.name,category:values.category,owner:values.owner,amount:values.amount,date:values.date,notes:values.notes,tags:values.tags,status:'draft',details:values}});
  if(saved&&draftId){await run({type:'draft.delete',id:draftId});setDraftId(null);}return saved;
 }} /></Card>}
 </div>;
}
