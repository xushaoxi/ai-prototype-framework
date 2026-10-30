import { useState } from 'react';
import { App, Button, Drawer, Form, Modal, Radio, Tag } from 'antd';
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
import { initialFormValues } from '../../core/form-values';
import { RecordFormFields } from '../../core/ui/RecordFormFields';
import {useUnsavedForm} from '../../core/ui/useUnsavedForm';
import {useFormFeedback} from '../../core/ui/useFormFeedback';
import {FormValidationSummary} from '../../core/ui/FormValidationSummary';
import { assetModule } from '../../modules/assets/definition';
import type { SaveInput } from '../../core/types';

type Surface='modal'|'drawer'|'page';
type Mode='new'|'edit';
const sample:SaveInput={name:'示例笔记本电脑',category:'电子设备',owner:'示例负责人',amount:6000,date:'2026-10-28',notes:'仅用于表单容器体验'};
const descriptions:Record<Surface,{title:string;detail:string}>={
  modal:{title:'弹窗',detail:'适合简单、集中且可以较快完成的任务。若需要长距离滚动或反复对照背景，应重新评估。'},
  drawer:{title:'右侧抽屉',detail:'适合复杂度适中、需要保留当前页面上下文的任务。背景可见并不代表可以同时操作背景。'},
  page:{title:'完整页面',detail:'适合多个复杂分组、明细、附件或较长时间填写的任务。完整页面提供独立空间和返回入口。'},
};

function ExampleEditor({surface,mode,active,onClose}:{surface:Surface;mode:Mode;active:boolean;onClose:()=>void}) {
  const [form]=Form.useForm();
  const {message}=App.useApp();
  const feedback=useFormFeedback(form);
  const initial=initialFormValues(assetModule,mode==='edit'?sample:{});
  const unsaved=useUnsavedForm(form,assetModule,initial,feedback.submitting);
  const close=()=>unsaved.request(onClose);
  const title=mode==='new'?'新增示例资产':'编辑示例资产';
  const submit=()=>feedback.submit(async()=>{message.success('示例已提交，不会写入资产台账');onClose();},()=>{message.error('示例提交失败，请重试');});
  const content=<><p className="form-example-note">使用同一套资产字段和示例数据，保存仅用于体验。</p><Form name={`example-${surface}-${mode}`} form={form} layout="vertical" initialValues={initial} requiredMark disabled={feedback.submitting} validateTrigger={[]} onValuesChange={feedback.onValuesChange} onFieldsChange={feedback.onFieldsChange}><FormValidationSummary count={feedback.errorCount} onLocate={feedback.focusFirstError}/><RecordFormFields module={assetModule}/></Form></>;
  const actions=<div className="form-example-actions"><Button disabled={feedback.submitting} onClick={close}>取消</Button><Button type="primary" aria-label="保存示例" loading={feedback.submitting} onClick={()=>void submit()}>保存示例</Button></div>;
  if(surface==='modal')return <Modal title={title} open={active} onCancel={close} confirmLoading={feedback.submitting} cancelButtonProps={{disabled:feedback.submitting}} closable={!feedback.submitting} keyboard={!feedback.submitting} onOk={()=>void submit()} okText="保存示例" okButtonProps={{'aria-label':'保存示例'}} cancelText="取消" mask={{closable:false}} width={620} style={{top:24}} styles={{body:{maxHeight:'calc(100dvh - 220px)',overflowY:'auto',paddingRight:4}}}>{content}</Modal>;
  if(surface==='drawer')return <Drawer title={title} open={active} onClose={close} closable={!feedback.submitting} keyboard={!feedback.submitting} mask={{closable:false}} size="min(560px, 100vw)" footer={actions}>{content}</Drawer>;
  return <section className="form-example-full"><div className="form-example-full-heading"><div><p className="form-example-eyebrow">表单容器示例 / 完整页面</p><h1>{title}</h1></div><Button icon={<ArrowLeftOutlined/>} disabled={feedback.submitting} onClick={close}>返回示例</Button></div><div className="form-example-full-body">{content}{actions}</div></section>;
}

export function FormContainerExample({active}:{active:boolean}) {
  const [surface,setSurface]=useState<Surface>('modal');
  const [opened,setOpened]=useState<Mode|null>(null);
  const selected=descriptions[surface];
  const open=(mode:Mode)=>{
    if(surface==='page'){window.location.assign(`#/form-demo/full/${mode}`);return;}
    setOpened(mode);
  };
  return <div className="form-example-page"><div className="form-example-header"><div><p className="form-example-eyebrow">设计指南 / 实际体验</p><h1>表单容器示例</h1><p>用同一份资产表单，体验不同容器如何承载新增与编辑。</p></div><Button href="#/design-guide" icon={<ArrowLeftOutlined/>}>返回设计指南</Button></div>
    <div className="form-example-layout"><section className="form-example-main" aria-label="表单容器体验"><div className="form-example-section-title"><div><h2>选择容器</h2><p>切换后体验新增或编辑，比较操作方式。</p></div><Tag>示例数据</Tag></div>
      <Radio.Group aria-label="表单容器" value={surface} onChange={event=>setSurface(event.target.value as Surface)} optionType="button" buttonStyle="solid" options={[{label:'弹窗',value:'modal'},{label:'右侧抽屉',value:'drawer'},{label:'完整页面',value:'page'}]}/>
      <div className="form-example-scenario"><div className="form-example-section-title"><div><h2>资产列表示例</h2><p>示例操作只用于体验，不会修改资产台账。</p></div><Button type="primary" aria-label="新增示例资产" icon={<PlusOutlined/>} onClick={()=>open('new')}>新增示例资产</Button></div><div className="form-example-record"><div><strong>示例笔记本电脑</strong><p>电子设备 · 示例负责人 · ¥6,000.00</p></div><Button onClick={()=>open('edit')}>编辑示例资产</Button></div></div>
    </section><aside className="form-example-guidance" aria-label="容器使用说明"><p className="form-example-eyebrow">当前选择</p><h2>{selected.title}</h2><p>{selected.detail}</p><div className="form-example-guidance-divider"/><strong>判断时关注</strong><ul><li>任务复杂度和填写时间</li><li>是否需要对照或操作原页面</li><li>桌面与手机的可用空间</li></ul><Button href="#/design-guide">查看设计指南</Button></aside></div>
    {opened?<ExampleEditor key={`${surface}-${opened}`} surface={surface} mode={opened} active={active} onClose={()=>setOpened(null)}/>:null}
  </div>;
}

export function FormContainerFullPage({mode,active,onClose}:{mode:Mode;active:boolean;onClose:()=>void}) {
  return <ExampleEditor surface="page" mode={mode} active={active} onClose={onClose}/>;
}
