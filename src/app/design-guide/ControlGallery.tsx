import {useState} from 'react';
import {AutoComplete,Avatar,Badge,Breadcrumb,Button,Card,Cascader,Collapse,ConfigProvider,DatePicker,Descriptions,Form,Input,Pagination,Popover,Progress,Select,Slider,Space,Statistic,Switch,Tabs,Tag,TimePicker,Tooltip,Transfer,TreeSelect,Typography,Upload,theme} from 'antd';
import type {UploadFile} from 'antd';
import {UploadOutlined,UserOutlined} from '@ant-design/icons';
import './control-gallery.css';
import {AllocationEditor} from '../../core/ui/AllocationEditor';

const documents=[{key:'design',title:'设计说明'},{key:'requirements',title:'需求清单'},{key:'acceptance',title:'验收记录'}];
const departments=[{title:'示例公司',value:'company',children:[{title:'产品部',value:'product'},{title:'技术部',value:'technology'}]}];
const locations=[{label:'华东',value:'east',children:[{label:'上海',value:'shanghai'},{label:'杭州',value:'hangzhou'}]},{label:'华南',value:'south',children:[{label:'深圳',value:'shenzhen'}]}];

/** Only local UI state. Files contain metadata; no request or business persistence. */
export function ControlGallery(){
 const {token}=theme.useToken();
 const [disabled,setDisabled]=useState(false);const [notifications,setNotifications]=useState(false);const [progress,setProgress]=useState(40);
 const [targetKeys,setTargetKeys]=useState<string[]>([]);const [search,setSearch]=useState('');const [result,setResult]=useState('未执行搜索');
 const [files,setFiles]=useState<UploadFile[]>([]);const [fileError,setFileError]=useState('');const [tab,setTab]=useState('overview');const [page,setPage]=useState(1);
 const [allocation,setAllocation]=useState<Record<string,number>>({});
 const [popover,setPopover]=useState(false);
 return <section className="control-gallery" aria-label="基础控件组合" style={{'--gallery-gap':`${token.marginLG}px`,'--gallery-border':token.colorBorderSecondary,'--gallery-muted':token.colorTextSecondary} as React.CSSProperties}>
 <div className="control-gallery-heading"><div><h2>基础控件组合</h2><p>基础录入、选择、展示与导航的常用组合。仅 UI 交互，不写入业务数据；不代表全部组件 API 变体。</p></div><Space><span>禁用状态</span><Switch aria-label="禁用控件示例" checked={disabled} onChange={setDisabled}/></Space></div>
 <p className="control-gallery-help">开启禁用状态可比较不可操作样式；关闭后继续体验。清除图标用于恢复空值，关闭该标签后重新打开或刷新页面恢复默认示例，切换标签保留当前状态。</p>
 <ConfigProvider componentDisabled={disabled}>
 <div className="control-gallery-grid"><Card title="总量与上限分配" size="small"><p>本地草稿演示；业务保存须在领域层重新校验，不提供支付服务。</p><AllocationEditor total={100} items={[{id:'a',label:'事项甲',limit:80},{id:'b',label:'事项乙',limit:60}]} value={allocation} onChange={setAllocation} unit="份" disabled={disabled}/></Card>
 <Card title="文本录入与搜索" size="small"><Form layout="vertical">
 <Form.Item label="演示密码" htmlFor="gallery-password" extra="仅体验显示与隐藏，不登录、不保存密码。"><Input.Password id="gallery-password" placeholder="输入模拟内容" autoComplete="off" allowClear /></Form.Item>
 <Form.Item label="搜索演示条目" htmlFor="gallery-search" extra="输入关键词后点击搜索，仅更新本页结果说明。"><Input.Search id="gallery-search" value={search} onChange={event=>setSearch(event.target.value)} allowClear enterButton={<Button aria-label="搜索示例" disabled={disabled}>搜索</Button>} onSearch={value=>setResult(value.trim()?`匹配关键词：${value.trim()}`:'请输入搜索关键词')} /></Form.Item>
 <div role="status">搜索结果：{result}</div>
 <Form.Item label="自动补全" htmlFor="gallery-autocomplete" extra="可选择建议，也可输入自己的内容。"><AutoComplete id="gallery-autocomplete" allowClear placeholder="输入办公或采购" options={[{value:'办公设备采购'},{value:'办公用品申请'},{value:'采购服务评估'}]} filterOption={(input,option)=>String(option?.value??'').includes(input)} /></Form.Item>
 <Form.Item label="可搜索多选" htmlFor="gallery-multiple" extra="支持关键词匹配与逐项移除。"><Select id="gallery-multiple" virtual={false} mode="multiple" allowClear optionFilterProp="label" placeholder="选择业务标签" options={[{value:'urgent',label:'紧急'},{value:'shared',label:'共享'},{value:'review',label:'待复核'}]} /></Form.Item>
 </Form></Card>
 <Card title="层级选择与分配" size="small"><Form layout="vertical">
 <Form.Item label="组织树选择" htmlFor="gallery-tree" extra="用于已有组织层级，可搜索并清除。"><TreeSelect virtual={false} id="gallery-tree" allowClear showSearch treeNodeFilterProp="title" treeData={departments} treeDefaultExpandAll placeholder="选择组织" /></Form.Item>
 <Form.Item label="地区级联选择" htmlFor="gallery-cascader" extra="先选择区域，再选择城市。"><Cascader id="gallery-cascader" options={locations} allowClear showSearch placeholder="选择地区与城市" /></Form.Item>
 </Form><Typography.Paragraph strong>穿梭选择资料</Typography.Paragraph><p className="control-gallery-help">勾选候选资料，再点击移入；已选资料也可移回。</p>
 <Transfer dataSource={documents} targetKeys={targetKeys} onChange={keys=>setTargetKeys(keys.map(String))} showSearch titles={['候选资料','已选资料']} actions={['移入已选','移回候选']} render={item=><span aria-label={`${targetKeys.includes(item.key)?'已选':'候选'}：${item.title}`}>{item.title}</span>} locale={{itemUnit:'项',itemsUnit:'项',searchPlaceholder:'搜索资料'}} />
 <p role="status">已选资料：{documents.filter(item=>targetKeys.includes(item.key)).map(item=>item.title).join('、')||'尚未选择'}</p></Card>
 <Card title="开关、进度与日期时间" size="small"><Form layout="vertical">
 <Form.Item label="通知偏好" extra="开关仅改变本页说明，不发送通知。"><Switch aria-label="开启通知示例" checked={notifications} onChange={setNotifications} /><span className="control-gallery-inline" role="status">通知状态：{notifications?'已开启':'已关闭'}</span></Form.Item>
 <Form.Item label="完成进度" extra="拖动或使用方向键调整，进度条和数字同步更新。"><Slider ariaLabelForHandle="完成进度示例" value={progress} onChange={setProgress}/><span role="status">完成进度：{progress}%</span><Progress percent={progress} size="small" /></Form.Item>
 <Form.Item label="日期范围" htmlFor="gallery-date-range" extra="开始日期和结束日期可清除；未预填今天。"><DatePicker.RangePicker allowEmpty={[true,true]} id={{start:'gallery-date-range',end:'gallery-date-range-end'}} className="control-gallery-full" classNames={{popup:{root:'control-gallery-picker-popup'}}} /></Form.Item>
 <Form.Item label="时间范围" htmlFor="gallery-time-range" extra="以小时和分钟选择时间范围。"><TimePicker.RangePicker allowEmpty={[true,true]} id={{start:'gallery-time-range',end:'gallery-time-range-end'}} format="HH:mm" className="control-gallery-full" classNames={{popup:{root:'control-gallery-picker-popup'}}} /></Form.Item>
 </Form></Card>
 <Card title="本地附件与信息浮层" size="small"><p className="control-gallery-help">选择 PDF / PNG / JPEG，单个不超过 5 MB。只保存本页文件名、类型与大小，不读取或上传内容。</p>
 <Upload accept="application/pdf,image/png,image/jpeg" fileList={files} disabled={disabled} beforeUpload={file=>{
  if(!['application/pdf','image/png','image/jpeg'].includes(file.type)){setFileError('请选择 PDF、PNG 或 JPEG 文件');return Upload.LIST_IGNORE;}
  if(file.size<=0||file.size>5*1024*1024){setFileError('请选择非空且不超过 5 MB 的文件');return Upload.LIST_IGNORE;}
  if(files.length>=3){setFileError('最多保留 3 个本地文件元数据');return Upload.LIST_IGNORE;}
  setFiles(current=>[...current,{uid:file.uid,name:file.name,size:file.size,type:file.type,status:'done'}]);setFileError('');return Upload.LIST_IGNORE;
 }} onRemove={file=>{setFiles(current=>current.filter(item=>item.uid!==file.uid));return true;}}><Button icon={<UploadOutlined/>}>选择本地示例附件</Button></Upload>
 {fileError&&<p role="alert">{fileError}</p>}<p role="status">本地附件：{files.length} 个元数据，刷新后清空。</p>
 <Space wrap><Tooltip title="提示用于简短说明，按钮也可通过键盘聚焦。"><Button>悬停或聚焦查看提示</Button></Tooltip><Popover trigger="click" open={popover&&!disabled} onOpenChange={setPopover} title="浮层说明" content={<div><p>这是可关闭的本地说明浮层。</p><Button onClick={()=>setPopover(false)}>关闭说明</Button></div>}><Button onClick={()=>setPopover(!popover)}>查看浮层说明</Button></Popover></Space>
 </Card>
 <Card title="导航与内容组织" size="small"><Breadcrumb items={[{title:'工作台'},{title:'组件示例'},{title:'本地演示'}]} />
 <Tabs activeKey={tab} onChange={setTab} items={[{key:'overview',label:'概览示例',disabled,children:<p>概览内容：适合展示概要和主要操作。</p>},{key:'activity',label:'活动示例',disabled,children:<p>活动内容：本页演示了标签切换。</p>}]} />
 <Collapse items={[{key:'help',label:<span>展开使用说明</span>,children:<p>所有示例仅保留在当前页面，不写入业务数据。</p>,collapsible:disabled?'disabled':undefined},{key:'details',label:'附加参数说明',children:<p>在具体业务中按实际场景配置字段、校验和操作。</p>,collapsible:disabled?'disabled':undefined}]} />
 <p role="status">分页示例：当前第 {page} 页，共 3 页。</p><Pagination simple current={page} onChange={setPage} total={30} pageSize={10} showSizeChanger={false} /></Card>
 <Card title="结构化详情与数据摘要" size="small"><Space size="middle"><Badge count={3}><Avatar icon={<UserOutlined/>}/></Badge><div><Typography.Text strong>示例负责人</Typography.Text><div><Tag color="processing">待处理</Tag><Badge status="success" text="在线演示" /></div></div></Space>
 <Descriptions column={1} size="small" bordered items={[{key:'code',label:'示例编号',children:'UI-001'},{key:'scope',label:'使用范围',children:'当前页面交互'},{key:'empty',label:'未填写字段',children:'—'}]} />
 <div className="control-gallery-statistics"><Statistic title="候选资料" value={documents.length} suffix="项" /><Statistic title="已选资料" value={targetKeys.length} suffix="项" /></div><Progress percent={progress} status={progress===100?'success':'active'} /><p className="control-gallery-help">统计数字来自上方资料选择；进度与滑块同步。空值使用破折号。</p></Card>
 </div></ConfigProvider></section>;
}
