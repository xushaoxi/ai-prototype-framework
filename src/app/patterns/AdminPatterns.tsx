import {useEffect,useRef,useState} from 'react';
import {Alert,Button,Card,Checkbox,Empty,Form,Input,Modal,Result,Select,Space,Spin,Statistic,Switch,Table,Tag,Tree} from 'antd';
import type {ReactNode,RefObject} from 'react';
import {useUnsavedChanges} from '../../core/ui/useUnsavedForm';
import {FormValidationSummary} from '../../core/ui/FormValidationSummary';
import {usePatterns} from '../../core/patterns/usePatterns';
import {PERMISSION_OPTIONS} from '../../core/patterns/types';
import type {OrgNode,PatternPageProps,PatternRole,PatternSnapshot,PatternUser} from '../../core/patterns/types';
import './admin-patterns.css';

type OrgTreeNode={key:string;title:string;children:OrgTreeNode[]};
type Controller=ReturnType<typeof usePatterns>;
type PageContext={data:PatternSnapshot;run:Controller['run'];busy:boolean;readOnly:boolean;active:boolean};
const uid=(prefix:string)=>`${prefix}-${crypto.randomUUID()}`;
const required=(message:string)=>[{required:true,message}];
const emailRules=[{required:true,message:'请输入邮箱'},{type:'email' as const,message:'请输入有效邮箱'}];

type ExitRequest=(leave:()=>void)=>void;
const directExit:ExitRequest=leave=>leave();
function formSignature(values:object):string {return JSON.stringify(Object.entries(values).filter(([key])=>key!=='id').sort(([a],[b])=>a.localeCompare(b)).map(([key,value])=>[key,Array.isArray(value)?[...value].sort():value??'']));}
function GuardedForm<T extends object>({initialValues,busy,readOnly,onFinish,children,exitRef,className}:{initialValues:T;busy:boolean;readOnly:boolean;onFinish:(values:T)=>Promise<boolean>;children:ReactNode;exitRef?:RefObject<ExitRequest>;className?:string}){
 const [form]=Form.useForm<T>();const baseline=useRef(formSignature(initialValues));
 const failedKeys=useRef(new Set<string>());const [errorCount,setErrorCount]=useState(0);
 const syncErrors=()=>{const errors=form.getFieldsError().filter(field=>field.errors.length>0);setErrorCount(errors.length);return errors;};
 const focusFirstError=()=>{const first=syncErrors()[0];if(first)form.scrollToField(first.name,{focus:true,block:'center',behavior:'smooth'});};
 const exit=useUnsavedChanges(()=>formSignature(form.getFieldsValue(true))!==baseline.current,busy);
 useEffect(()=>{if(!exitRef)return;exitRef.current=exit.request;return()=>{exitRef.current=directExit;};},[exitRef,exit.request]);
 return <Form<T> form={form} layout="vertical" className={className} disabled={busy||readOnly} initialValues={initialValues} validateTrigger={[]} onValuesChange={changed=>{const names=Object.keys(changed).filter(key=>failedKeys.current.has(key));if(names.length)void form.validateFields(names).catch(()=>{}).finally(syncErrors);}} onFieldsChange={()=>{syncErrors();}} onFinishFailed={({errorFields})=>{errorFields.forEach(field=>failedKeys.current.add(String(field.name[0])));syncErrors();requestAnimationFrame(focusFirstError);}} onFinish={async values=>{if(await onFinish(values)){baseline.current=formSignature(form.getFieldsValue(true));failedKeys.current.clear();syncErrors();}}}><FormValidationSummary count={errorCount} onLocate={focusFirstError}/>{children}</Form>;
}

export function AdminPatterns({patternId,active}:PatternPageProps){
 const controller=usePatterns();const [readOnly,setReadOnly]=useState(false);const wasActive=useRef(active);
 const {data,error,loading,busy,reload,run}=controller;
 useEffect(()=>{if(active&&!wasActive.current)void reload();wasActive.current=active;},[active,reload]);
 let content:ReactNode=null;
 if(data){const context={data,run,busy,readOnly,active};switch(patternId){
  case 'organization':content=<Organization {...context}/>;break;
  case 'roles':content=<Roles {...context}/>;break;
  case 'users':content=<Users {...context}/>;break;
  case 'dashboard':content=<Dashboard data={data}/>;break;
  case 'settings':content=<Settings {...context}/>;break;
  case 'account':content=<Account {...context}/>;break;
  case 'messages':content=<Notices {...context}/>;break;
  case 'audit':content=<Audit data={data}/>;break;
  case 'login':content=<Login/>;break;
  case 'results':content=<Results/>;break;
  default:content=<Empty description="尚未选择模板"/>;
 }}
 return <div className="admin-patterns"><header className="admin-patterns-header"><div><p className="admin-patterns-kicker">后台通用模板 · 业务仿真</p></div><Space wrap><span>只读角色（仿真）</span><Switch aria-label="只读角色（仿真）" checked={readOnly} onChange={setReadOnly}/><Button onClick={()=>void reload()} loading={loading} aria-label="刷新数据">刷新数据</Button></Space></header>
 <Alert showIcon type="info" title="本地演示仿真" description="组织、用户、角色、设置和消息等数据由模式库 HTTP 服务处理；登录与结果页仅模拟本地反馈。均不能代替服务器认证和权限校验。"/>
 {readOnly&&<Alert showIcon type="warning" title="当前是只读交互仿真，写入入口已禁用。"/>}
 {error&&<Alert type="error" showIcon title="加载失败" description={error} action={<Button onClick={()=>void reload()}>重试</Button>}/>}
 {loading&&!data?<div className="admin-patterns-loading" role="status"><Spin/><p>正在加载演示数据…</p></div>:content}
 </div>;
}

function Organization({data,run,busy,readOnly,active}:PageContext){
 const exitRef=useRef<ExitRequest>(directExit);const [newVersion,setNewVersion]=useState(0);const [selected,setSelected]=useState('');const [fresh,setFresh]=useState(false);const [saved,setSaved]=useState('');const [deleting,setDeleting]=useState(false);
 const current=data.nodes.find(node=>node.id===selected);
 function descendants(id:string):Set<string>{const result=new Set([id]);let changed=true;while(changed){changed=false;for(const node of data.nodes)if(node.parentId&&result.has(node.parentId)&&!result.has(node.id)){result.add(node.id);changed=true;}}return result;}
 const forbidden=current?descendants(current.id):new Set<string>();
 const tree=(parentId:string|null):OrgTreeNode[]=>data.nodes.filter(node=>node.parentId===parentId).map(node=>({key:node.id,title:`${node.name}${node.enabled?'':'（停用）'}`,children:tree(node.id)}));
 return <div className="admin-patterns-split"><Card title="组织架构" extra={<Button disabled={readOnly||busy} onClick={()=>exitRef.current(()=>{setNewVersion(value=>value+1);setFresh(true);setSelected('');setSaved('');})}>新增组织</Button>}>
 {data.nodes.length?<Tree aria-label="组织架构" defaultExpandAll selectedKeys={selected?[selected]:[]} treeData={tree(null)} onSelect={keys=>exitRef.current(()=>{setSelected(String(keys[0]??''));setFresh(false);setSaved('');})}/>:<Empty description="暂无组织"/>}</Card>
 <Card title={fresh?'新增组织':'组织详情'}>{current||fresh?<GuardedForm<OrgNode> exitRef={exitRef} key={current?.id??`new-${newVersion}`} busy={busy} readOnly={readOnly} initialValues={current??{id:'',name:'',parentId:null,enabled:true}} onFinish={async values=>{const id=current?.id??uid('org');if(await run({type:'node.save',node:{...values,id,parentId:values.parentId??null}})){setSelected(id);setFresh(false);setSaved('组织已保存');return true;}return false;}}>
 <Form.Item name="name" label="组织名称" rules={required('请输入组织名称')}><Input maxLength={80}/></Form.Item>
 <Form.Item name="parentId" label="上级组织"><Select allowClear placeholder="无上级（根组织）" options={data.nodes.filter(node=>!forbidden.has(node.id)).map(node=>({label:node.name,value:node.id}))}/></Form.Item>
 <Form.Item name="enabled" label="启用状态" valuePropName="checked"><Switch/></Form.Item><Space wrap><Button htmlType="submit" type="primary" loading={busy} aria-label="保存组织">保存组织</Button>{current&&<Button danger onClick={()=>setDeleting(true)}>删除组织</Button>}</Space>
 </GuardedForm>:<Empty description="选择一个组织查看详情，或新增组织"/>}<p role="status">{saved}</p></Card>
 <Modal title={`删除组织「${current?.name??''}」？`} open={deleting&&active} okText="确认删除" cancelText="取消" okButtonProps={{danger:true,loading:busy,disabled:readOnly}} cancelButtonProps={{disabled:busy,autoFocus:true}} closable={!busy} onCancel={()=>{if(!busy)setDeleting(false);}} onOk={async()=>{if(current&&await run({type:'node.delete',id:current.id})){setDeleting(false);setSelected('');setSaved('组织已删除');}}}><p>删除后无法撤销。有子组织或关联用户的组织不能删除，须先调整关联关系。</p></Modal></div>;
}

function Roles({data,run,busy,readOnly,active}:PageContext){
 const exitRef=useRef<ExitRequest>(directExit);const [newVersion,setNewVersion]=useState(0);const [selected,setSelected]=useState('');const [fresh,setFresh]=useState(false);const [deleting,setDeleting]=useState(false);const [saved,setSaved]=useState('');const current=data.roles.find(role=>role.id===selected);
 return <div className="admin-patterns-split"><Card title="角色列表" extra={<Button disabled={readOnly||busy} onClick={()=>exitRef.current(()=>{setNewVersion(value=>value+1);setFresh(true);setSelected('');setSaved('');})}>新增角色</Button>}>
 {data.roles.length?<Tree aria-label="角色列表" selectedKeys={selected?[selected]:[]} treeData={data.roles.map(role=>({key:role.id,title:role.name}))} onSelect={keys=>exitRef.current(()=>{setSelected(String(keys[0]??''));setFresh(false);setSaved('');})}/>:<Empty description="暂无角色"/>}</Card>
 <Card title="权限配置"><p>以下为前端权限仿真。正式系统必须由服务器重新实施授权。</p>{current||fresh?<GuardedForm<PatternRole> exitRef={exitRef} key={current?.id??`new-${newVersion}`} busy={busy} readOnly={readOnly} initialValues={current??{id:'',name:'',permissions:[],scope:'self'}} onFinish={async values=>{const id=current?.id??uid('role');if(await run({type:'role.save',role:{...values,id}})){setSelected(id);setFresh(false);setSaved('角色已保存');return true;}return false;}}>
 <Form.Item label="角色名称" name="name" rules={required('请输入角色名称')}><Input maxLength={80}/></Form.Item>
 <Form.Item label="功能权限" name="permissions"><Checkbox.Group className="admin-patterns-checks" options={PERMISSION_OPTIONS}/></Form.Item>
 <Form.Item label="数据范围" name="scope" rules={required('请选择数据范围')}><Select options={[{label:'全部数据（仿真）',value:'all'},{label:'本部门（仿真）',value:'department'},{label:'仅本人（仿真）',value:'self'}]}/></Form.Item>
 <Space wrap><Button htmlType="submit" type="primary" loading={busy} aria-label="保存角色">保存角色</Button>{current&&<Button danger onClick={()=>setDeleting(true)}>删除角色</Button>}</Space></GuardedForm>:<Empty description="选择角色配置权限，或新增角色"/>}<p role="status">{saved}</p></Card>
 <Modal title={`删除角色「${current?.name??''}」？`} open={deleting&&active} okText="确认删除" cancelText="取消" okButtonProps={{danger:true,loading:busy,disabled:readOnly}} cancelButtonProps={{disabled:busy,autoFocus:true}} closable={!busy} onCancel={()=>{if(!busy)setDeleting(false);}} onOk={async()=>{if(current&&await run({type:'role.delete',id:current.id})){setDeleting(false);setSelected('');}}}><p>有关联用户的角色不能删除，请先调整用户角色。</p></Modal></div>;
}

function UserFields({data}:Pick<PageContext,'data'>){return <>
 <Form.Item label="用户姓名" name="name" rules={required('请输入用户姓名')}><Input maxLength={80}/></Form.Item>
 <Form.Item label="邮箱" name="email" rules={emailRules}><Input inputMode="email" maxLength={150}/></Form.Item>
 <Form.Item label="所属组织" name="orgId" rules={required('请选择所属组织')}><Select options={data.nodes.map(node=>({label:node.name,value:node.id}))}/></Form.Item>
 <Form.Item label="用户角色" name="roleIds" rules={[{required:true,type:'array',min:1,message:'请选择至少一个角色'}]}><Select mode="multiple" options={data.roles.map(role=>({label:role.name,value:role.id}))}/></Form.Item>
 <Form.Item label="启用用户" name="enabled" valuePropName="checked"><Switch/></Form.Item></>;}

function Users({data,run,busy,readOnly,active}:PageContext){
 const exitRef=useRef<ExitRequest>(directExit);const [keyword,setKeyword]=useState('');const [editing,setEditing]=useState<PatternUser|null>(null);const [open,setOpen]=useState(false);const [deleting,setDeleting]=useState<PatternUser|null>(null);
 function edit(user:PatternUser|null){setEditing(user);setOpen(true);}
 return <Card title="用户列表" extra={<Button type="primary" disabled={busy||readOnly} onClick={()=>edit(null)}>新增用户</Button>}><div className="admin-patterns-toolbar"><Input aria-label="搜索用户" placeholder="搜索姓名或邮箱" value={keyword} onChange={event=>setKeyword(event.target.value)} allowClear/></div>
 <Table<PatternUser> rowKey="id" scroll={{x:750}} dataSource={data.users.filter(user=>`${user.name} ${user.email}`.toLowerCase().includes(keyword.toLowerCase()))} pagination={{pageSize:10,showSizeChanger:false}} columns={[
 {title:'姓名',dataIndex:'name'},{title:'邮箱',dataIndex:'email'},{title:'组织',render:(_,user)=>data.nodes.find(node=>node.id===user.orgId)?.name??'—'},
 {title:'角色',render:(_,user)=>user.roleIds.map(id=>data.roles.find(role=>role.id===id)?.name??id).join('、')},
 {title:'状态',render:(_,user)=><Tag color={user.enabled?'success':'default'}>{user.enabled?'启用':'停用'}</Tag>},
 {title:'操作',render:(_,user)=><Space><Button size="small" disabled={busy||readOnly} onClick={()=>edit(user)}>编辑</Button><Button size="small" danger disabled={busy||readOnly} onClick={()=>setDeleting(user)}>删除</Button></Space>} ]}/>
 <Modal title={editing?'编辑用户':'新增用户'} open={open&&active} footer={null} destroyOnHidden closable={!busy} onCancel={()=>exitRef.current(()=>setOpen(false))}>{open&&<GuardedForm<PatternUser> key={editing?.id??'new'} exitRef={exitRef} busy={busy} readOnly={readOnly} initialValues={editing??{id:'',name:'',email:'',orgId:'',roleIds:[],enabled:true}} onFinish={async values=>{if(await run({type:'user.save',user:{...values,id:editing?.id??uid('user')}})){setOpen(false);return true;}return false;}}><UserFields data={data}/><Button type="primary" htmlType="submit" loading={busy} aria-label="保存用户">保存用户</Button></GuardedForm>}</Modal>
 <Modal title={`删除用户「${deleting?.name??''}」？`} open={Boolean(deleting)&&active} okText="确认删除" cancelText="取消" okButtonProps={{danger:true,loading:busy,disabled:readOnly}} cancelButtonProps={{disabled:busy,autoFocus:true}} closable={!busy} onCancel={()=>{if(!busy)setDeleting(null);}} onOk={async()=>{if(deleting&&await run({type:'user.delete',id:deleting.id}))setDeleting(null);}}><p>删除后该用户从仿真用户列表移除，无法撤销。</p></Modal></Card>;
}

function Settings({data,run,busy,readOnly}:PageContext){const [saved,setSaved]=useState('');return <Card title="基本设置"><GuardedForm<PatternSnapshot['settings']> className="admin-patterns-form" busy={busy} readOnly={readOnly} initialValues={data.settings} onFinish={async settings=>{if(await run({type:'settings.save',settings})){setSaved('设置已保存');return true;}return false;}}>
 <Form.Item name="systemName" label="系统名称" rules={required('请输入系统名称')}><Input maxLength={80}/></Form.Item>
 <Form.Item name="timezone" label="时区" rules={required('请选择时区')}><Select options={['Asia/Shanghai','UTC','Asia/Tokyo','America/New_York'].map(value=>({label:value,value}))}/></Form.Item>
 <Form.Item name="notifications" label="消息通知" valuePropName="checked"><Switch/></Form.Item><Button htmlType="submit" type="primary" loading={busy} aria-label="保存设置">保存设置</Button></GuardedForm><p role="status">{saved}</p></Card>;}

function Account({data,run,busy,readOnly}:PageContext){const exitRef=useRef<ExitRequest>(directExit);const [selected,setSelected]=useState('');const [saved,setSaved]=useState('');const user=data.users.find(value=>value.id===selected)??data.users[0];return <Card title="个人资料"><p>选择演示用户编辑资料，不代表当前登录身份。</p><Select aria-label="选择演示用户" className="admin-patterns-select" value={user?.id} onChange={value=>exitRef.current(()=>{setSelected(value);setSaved('');})} options={data.users.map(value=>({label:value.name,value:value.id}))}/>
 {user?<GuardedForm<Pick<PatternUser,'name'|'email'>> exitRef={exitRef} key={user.id} className="admin-patterns-form" busy={busy} readOnly={readOnly} initialValues={{name:user.name,email:user.email}} onFinish={async values=>{if(await run({type:'user.save',user:{...user,...values}})){setSaved('个人资料已保存');return true;}return false;}}><Form.Item label="用户姓名" name="name" rules={required('请输入用户姓名')}><Input maxLength={80}/></Form.Item><Form.Item label="邮箱" name="email" rules={emailRules}><Input inputMode="email" maxLength={150}/></Form.Item><Button type="primary" htmlType="submit" loading={busy} aria-label="保存资料">保存资料</Button></GuardedForm>:<Empty description="暂无演示用户，请先在用户管理新增"/>}<p role="status">{saved}</p></Card>;}

function Notices({data,run,busy,readOnly}:PageContext){const [filter,setFilter]=useState('all');return <Card title="站内消息" extra={<Button aria-label="全部标为已读" disabled={readOnly||busy||!data.notices.some(notice=>!notice.read)} loading={busy} onClick={()=>void run({type:'notice.read',ids:data.notices.filter(notice=>!notice.read).map(notice=>notice.id)})}>全部标为已读</Button>}>
 <Select aria-label="消息状态" className="admin-patterns-select" value={filter} onChange={setFilter} options={[{label:'全部消息',value:'all'},{label:'未读消息',value:'unread'},{label:'已读消息',value:'read'}]}/>
 <Table rowKey="id" scroll={{x:550}} dataSource={data.notices.filter(notice=>filter==='all'||notice.read===(filter==='read'))} columns={[{title:'消息标题',dataIndex:'title'},{title:'时间',dataIndex:'createdAt'},{title:'状态',render:(_,notice)=><Tag>{notice.read?'已读':'未读'}</Tag>},{title:'操作',render:(_,notice)=><Button size="small" disabled={notice.read||readOnly||busy} onClick={()=>void run({type:'notice.read',ids:[notice.id]})}>标为已读</Button>}]}/></Card>;}

function Audit({data}:Pick<PageContext,'data'>){const [keyword,setKeyword]=useState('');const [action,setAction]=useState('all');return <Card title="操作审计"><p>记录仿真域的真实写入操作，用于追踪演示操作。</p><div className="admin-patterns-toolbar"><Input aria-label="搜索审计日志" placeholder="搜索操作摘要" value={keyword} onChange={event=>setKeyword(event.target.value)} allowClear/><Select aria-label="审计操作类型" value={action} onChange={setAction} options={[{label:'全部操作',value:'all'},...Array.from(new Set(data.audit.map(entry=>entry.action))).map(value=>({label:value,value}))]}/></div><Table rowKey="id" scroll={{x:600}} dataSource={data.audit.filter(entry=>(action==='all'||entry.action===action)&&entry.summary.toLowerCase().includes(keyword.toLowerCase()))} columns={[{title:'操作',dataIndex:'action'},{title:'摘要',dataIndex:'summary'},{title:'发生时间',dataIndex:'at'}]}/></Card>;}

function Dashboard({data}:Pick<PageContext,'data'>){
 const [status,setStatus]=useState('all');const [dimension,setDimension]=useState<'category'|'owner'>('category');const records=data.records.filter(record=>status==='all'||record.status===status);const count=(value:string)=>records.filter(record=>record.status===value).length;
 const states=[{name:'草稿',value:count('draft')},{name:'启用',value:count('active')},{name:'归档',value:count('archived')}];const max=Math.max(1,...states.map(value=>value.value));
 const dates=Array.from(new Set(records.map(record=>record.date))).sort();const trend=dates.map(date=>({date,value:records.filter(record=>record.date===date).length}));const trendMax=Math.max(1,...trend.map(value=>value.value));
 const done=data.tasks.filter(task=>task.status!=='pending').length;const ratio=data.tasks.length?done/data.tasks.length:0;
 const groups=Array.from(new Set(records.map(record=>record[dimension]))).map(name=>({name,count:records.filter(record=>record[dimension]===name).length}));
 return <><div className="admin-patterns-toolbar"><Select aria-label="仪表盘记录状态" value={status} onChange={setStatus} options={[{label:'全部记录',value:'all'},{label:'草稿',value:'draft'},{label:'启用',value:'active'},{label:'归档',value:'archived'}]}/><Select aria-label="统计维度" value={dimension} onChange={setDimension} options={[{label:'按类别统计',value:'category'},{label:'按负责人统计',value:'owner'}]}/></div>
 <div className="admin-patterns-metrics"><Card><Statistic title="记录总数（当前筛选）" value={records.length}/></Card><Card><Statistic title="记录金额合计" prefix="¥" value={records.reduce((sum,record)=>sum+record.amount,0)} precision={2}/></Card><Card><Statistic title="待办审批（全部）" value={data.tasks.length-done}/></Card><Card><Statistic title="已处理审批（全部）" value={done}/></Card></div>
 <div className="admin-patterns-charts"><Card title="记录状态分布"><svg viewBox="0 0 360 210" role="img" aria-label="记录状态柱状图"><title>{states.map(item=>`${item.name}${item.value}条`).join('，')}</title>{states.map((item,index)=><g key={item.name}><rect x={40+index*105} y={165-item.value/max*130} width="55" height={item.value/max*130} rx="4" fill="var(--admin-chart-color)"/><text x={67+index*105} y={155-item.value/max*130} textAnchor="middle">{item.value}</text><text x={67+index*105} y="192" textAnchor="middle">{item.name}</text></g>)}</svg></Card>
 <Card title="登记日期分布"><svg viewBox="0 0 360 210" role="img" aria-label="登记日期趋势图"><title>{trend.length?trend.map(item=>`${item.date} ${item.value}条`).join('，'):'暂无记录'}</title><line x1="30" x2="330" y1="170" y2="170" stroke="currentColor" opacity=".2"/><polyline points={trend.map((item,index)=>`${30+index/Math.max(1,trend.length-1)*300},${170-item.value/trendMax*135}`).join(' ')} fill="none" stroke="var(--admin-chart-color)" strokeWidth="3"/>{trend.map((item,index)=><circle key={item.date} cx={30+index/Math.max(1,trend.length-1)*300} cy={170-item.value/trendMax*135} r="4" fill="var(--admin-chart-color)"/>)}<text x="30" y="196" fontSize="11">{dates[0]??'暂无数据'}</text><text x="330" y="196" textAnchor="end" fontSize="11">{dates.length>1?dates.at(-1):''}</text></svg><p>按记录登记日期汇总条数，不代表历史业务增长。</p></Card>
 <Card title="审批处理进度"><svg viewBox="0 0 360 210" role="img" aria-label="审批进度环图"><title>{`已处理${done}项，共${data.tasks.length}项`}</title><circle cx="180" cy="100" r="65" fill="none" stroke="currentColor" opacity=".1" strokeWidth="18"/><circle cx="180" cy="100" r="65" fill="none" stroke="var(--admin-chart-color)" strokeWidth="18" strokeDasharray={`${ratio*408.4} 408.4`} transform="rotate(-90 180 100)"/><text x="180" y="103" textAnchor="middle" fontSize="27">{Math.round(ratio*100)}%</text><text x="180" y="130" textAnchor="middle">已处理</text><text x="180" y="202" textAnchor="middle">{done} / {data.tasks.length} 项</text></svg></Card></div>
 <Card title={dimension==='category'?'按类别汇总':'按负责人汇总'}><Table rowKey="name" dataSource={groups} columns={[{title:'分组',dataIndex:'name'},{title:'记录数',dataIndex:'count'}]} pagination={false}/></Card></>;
}

function Login(){const [outcome,setOutcome]=useState<'success'|'error'|null>(null);const [scenario,setScenario]=useState('success');return <Card title="演示登录" className="admin-patterns-login"><p>仅验证交互。此处不请求真实认证、不建立会话、不保存密码或账号。</p>{outcome==='success'?<Result status="success" title="登录仿真成功" subTitle="尚未建立真实登录会话，可返回继续体验表单。" extra={<Button onClick={()=>setOutcome(null)}>返回登录表单</Button>}/>:<><Select aria-label="登录仿真场景" className="admin-patterns-select" value={scenario} onChange={setScenario} options={[{label:'成功场景',value:'success'},{label:'服务失败场景',value:'error'}]}/>{outcome==='error'&&<Alert type="error" showIcon title="登录仿真失败" description="模拟服务暂不可用；可重试，或切换成功场景。"/>}<GuardedForm<{account:string}> initialValues={{account:''}} busy={false} readOnly={false} onFinish={async()=>{setOutcome(scenario==='error'?'error':'success');return scenario!=='error';}}><Form.Item label="演示账号" name="account" rules={required('请输入演示账号')}><Input autoComplete="off" placeholder="输入任意演示账号"/></Form.Item><Button htmlType="submit" type="primary">模拟登录</Button></GuardedForm></>}</Card>;}

function Results(){const [status,setStatus]=useState<'403'|'404'|'500'|'success'>('403');const [recovered,setRecovered]=useState(false);const descriptions={'403':'暂无访问权限，请联系管理员申请权限。此处仅仿真页面状态。','404':'页面不存在，可以返回模板入口。','500':'模拟服务异常，请重试恢复内容。',success:'演示操作已完成，可以继续查看内容。'};return <Card title="通用结果页"><Select aria-label="结果场景" className="admin-patterns-select" value={status} onChange={value=>{setStatus(value);setRecovered(false);}} options={[{label:'403 无权限',value:'403'},{label:'404 未找到',value:'404'},{label:'500 服务错误',value:'500'},{label:'操作成功',value:'success'}]}/>{recovered?<Result status="success" title="已恢复演示内容" extra={<Button onClick={()=>setRecovered(false)}>再次查看结果</Button>}/>:<Result status={status} title={status==='success'?'操作成功':status} subTitle={descriptions[status]} extra={<Button type="primary" onClick={()=>setRecovered(true)}>{status==='500'?'重试恢复':'返回演示内容'}</Button>}/>}</Card>;}
