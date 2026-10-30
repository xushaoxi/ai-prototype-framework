import {useEffect, useRef, useState} from 'react';
import {Alert, Button, Empty, Modal, Space, Spin, Tag, theme} from 'antd';
import {CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, ReloadOutlined} from '@ant-design/icons';
import './component-examples.css';
import {ControlGallery} from './ControlGallery';

type ExampleState='ready'|'initial'|'filtered'|'loading'|'error';

/** 纯展示与局部交互示例：不调用业务 API，不读写业务 store。 */
export function ComponentExamples(){
  const {token}=theme.useToken();
  const [state,setState]=useState<ExampleState>('ready');
  const [feedback,setFeedback]=useState('');
  const [busy,setBusy]=useState(false);
  const [deleted,setDeleted]=useState(false);
  const [confirming,setConfirming]=useState(false);
  const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const actionTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  useEffect(()=>()=>{clearTimeout(timer.current);clearTimeout(actionTimer.current);},[]);
  function selectState(next:ExampleState){clearTimeout(timer.current);setState(next);}
  function load(){
    selectState('loading');
    timer.current=setTimeout(()=>setState('ready'),1200);
  }
  function primary(){
    if(busy)return;
    setBusy(true);setFeedback('');
    actionTimer.current=setTimeout(()=>{setBusy(false);setFeedback('主要操作已完成，仅演示本地反馈。');},800);
  }
  return <div className="component-examples" style={{color:token.colorText, background:token.colorBgContainer,borderRadius:token.borderRadiusLG}}>
    <header><p className="component-examples-eyebrow">组件参考 · 交互可体验</p><h1>通用组件与状态示例</h1><p>用于比较常见交互与反馈。所有操作仅在本页模拟，不调用业务接口、不写入台账；切换标签保留当前示例；关闭该标签后重新打开或刷新页面恢复初始示例。</p></header>
    <section aria-labelledby="component-actions"><h2 id="component-actions">操作层级</h2><p>主要操作保持集中；图标按钮提供明确的可访问名称，禁用时说明原因。</p>
      <Space wrap><Button type="primary" loading={busy} onClick={primary}>执行主要操作</Button><Button onClick={()=>setFeedback('次要操作已完成，仅演示本地反馈。')}>执行次要操作</Button><Button icon={<ReloadOutlined/>} aria-label="刷新示例反馈" onClick={()=>setFeedback('示例反馈已刷新。')}/><Button disabled>当前不可提交</Button></Space>
      <p className="component-examples-muted">禁用原因：尚未完成必填信息。主要操作耗时约 0.8 秒，期间阻止重复提交。</p><div role="status" aria-live="polite" className="component-examples-feedback">{feedback}</div>
    </section>
    <section aria-labelledby="component-states"><h2 id="component-states">状态与恢复路径</h2><Space wrap><Tag icon={<CheckCircleOutlined/>} color="success">成功 · 已完成</Tag><Tag icon={<ClockCircleOutlined/>} color="warning">待处理 · 需要关注</Tag><Tag icon={<CloseCircleOutlined/>} color="error">失败 · 需要重试</Tag></Space><p>通过图标和文字表达含义，颜色只作辅助。选择场景，体验不同的下一步操作。</p>
      <Space wrap>{([{key:'ready',label:'正常内容'},{key:'initial',label:'初始空态'},{key:'filtered',label:'筛选无结果'},{key:'loading',label:'加载中'},{key:'error',label:'错误状态'}] as const).map(item=><Button key={item.key} aria-pressed={state===item.key} type={state===item.key?'primary':'default'} onClick={()=>item.key==='loading'?load():selectState(item.key)}>{item.label}</Button>)}</Space>
      <div className="component-examples-preview" aria-live="polite" aria-busy={state==='loading'}>
        {state==='loading'?<div role="status"><Spin/><p>正在加载示例，请稍候…</p></div>:null}
        {state==='initial'?<Empty description="尚无示例记录"><Button type="primary" onClick={()=>{setDeleted(false);selectState('ready');}}>创建示例</Button></Empty>:null}
        {state==='filtered'?<Empty description="没有符合条件的示例"><p>当前条件：关键词「不存在」。请调整条件后查看。</p><Button onClick={()=>selectState('ready')}>清除示例筛选</Button></Empty>:null}
        {state==='error'?<Alert type="error" showIcon title="示例加载失败" description="这是网络错误的本地仿真。保留当前上下文，重试可恢复示例内容。" action={<Button onClick={load}>重试示例请求</Button>}/>:null}
        {state==='ready'?(deleted?<Empty description="示例文档已移除"/>:<div className="component-examples-record"><CheckCircleOutlined style={{color:token.colorSuccess}}/><div><strong>示例文档 A</strong><p>内容已加载 · 仅用于展示</p></div></div>):null}
      </div>
    </section>
    <section aria-labelledby="component-danger"><h2 id="component-danger">危险操作</h2><p>确认前说明操作对象与后果，取消后保留内容。此处仅移除本页的示例文档。</p><Button danger disabled={deleted} onClick={()=>setConfirming(true)}>删除示例文档</Button>{deleted?<p role="status">已删除示例文档 A，仅影响本页演示。</p>:null}
      <Modal title="删除示例文档 A？" open={confirming} onCancel={()=>setConfirming(false)} okText="确认删除" cancelText="取消" okButtonProps={{danger:true}} onOk={()=>{setDeleted(true);setConfirming(false);}}><p>确认后将从本页示例列表移除，当前页面内无法撤销。</p><p>这是演示仿真，不会删除任何业务记录。</p></Modal>
    </section>
    <div className="component-examples-grid"><section aria-labelledby="component-format"><h2 id="component-format">格式与缺省值</h2><dl className="component-examples-values"><div><dt>有效零值</dt><dd>0</dd></div><div><dt>零金额</dt><dd>¥0.00</dd></div><div><dt>金额 · 两位小数</dt><dd>¥12,345.60</dd></div><div><dt>日期 · 年月日</dt><dd>2026-10-29</dd></div><div><dt>空值</dt><dd>未填写（—）</dd></div></dl><p className="component-examples-muted">零是有效数值；空值不自动替换为 0 或今天。</p></section>
    <section aria-labelledby="component-tokens"><h2 id="component-tokens">视觉基础参考</h2><p>沿用当前主题 token，保持层级与间距一致。</p><dl className="component-examples-values"><div><dt>正文</dt><dd>{token.fontSize}px</dd></div><div><dt>区块间距</dt><dd>{token.marginLG}px</dd></div><div><dt>圆角</dt><dd>{token.borderRadiusLG}px</dd></div></dl><div className="component-examples-swatches">{[{name:'主色',color:token.colorPrimary},{name:'正文',color:token.colorText},{name:'边框',color:token.colorBorder}].map(item=><span key={item.name}><i style={{background:item.color}}/>{item.name}<code>{item.color}</code></span>)}</div></section></div>
    <ControlGallery/>
  </div>;
}
