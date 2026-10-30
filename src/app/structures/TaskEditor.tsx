import {Form,Input,InputNumber,Select,Checkbox} from 'antd';
import {useEffect} from 'react';
import type {ScheduleTask} from '../../core/structures/types';
import {SharedForm} from '../../core/ui/SharedForm';
import {useFormFeedback} from '../../core/ui/useFormFeedback';
export function TaskEditor({task,tasks,disabled,onChange,save,registerSubmit}:{task:ScheduleTask;tasks:ScheduleTask[];disabled:boolean;onChange:(task:ScheduleTask)=>void;save:(task:ScheduleTask)=>Promise<boolean|undefined>;registerSubmit:(submit:()=>void)=>void}){
 const [form]=Form.useForm<Record<string,unknown>>();const feedback=useFormFeedback(form);
 useEffect(()=>{registerSubmit(()=>{void feedback.submit(async()=>{await save(task);},()=>{});});});
 return <SharedForm state={{form,initialValues:{...task},disabled,errors:feedback.errorCount,onValuesChange:changed=>{feedback.onValuesChange(changed);const values=form.getFieldsValue(true);onChange({...task,name:String(values.name??''),owner:String(values.owner??''),start:String(values.start??''),end:String(values.end??''),progress:typeof values.progress==='number'?values.progress:0,parentId:typeof values.parentId==='string'?values.parentId:null,milestone:values.milestone===true,...(typeof values.actualStart==='string'&&values.actualStart?{actualStart:values.actualStart}:{actualStart:undefined}),...(typeof values.actualEnd==='string'&&values.actualEnd?{actualEnd:values.actualEnd}:{actualEnd:undefined})});}}}>
 <Form.Item name="name" label="任务名称" rules={[{required:true,whitespace:true,message:'请输入任务名称'},{max:100,message:'名称最多100字'}]}><Input/></Form.Item>
 <Form.Item name="owner" label="责任人" rules={[{required:true,whitespace:true,message:'请输入责任人'}]}><Input/></Form.Item>
 <Form.Item name="parentId" label="父任务"><Select virtual={false} allowClear options={tasks.filter(t=>t.id!==task.id).map(t=>({label:t.name,value:t.id}))} placeholder="无父任务（顶层）"/></Form.Item>
 <Form.Item name="milestone" label="任务类型" valuePropName="checked"><Checkbox>里程碑（计划开始与结束同一天）</Checkbox></Form.Item>
 <Form.Item name="start" label="开始日期" rules={[{required:true,message:'请选择开始日期'}]}><Input type="date"/></Form.Item>
 <Form.Item name="end" label="结束日期" dependencies={['start','milestone']} rules={[{required:true,message:'请选择结束日期'},{validator:(_,value:unknown)=>typeof value==='string'&&value>=String(form.getFieldValue('start'))&&(!form.getFieldValue('milestone')||value===form.getFieldValue('start'))?Promise.resolve():Promise.reject(new Error('结束日期不能早于开始日期，里程碑须为同一天'))}]}><Input type="date"/></Form.Item>
 <Form.Item name="actualStart" label="实际开始日期"><Input type="date"/></Form.Item>
 <Form.Item name="actualEnd" label="实际结束日期" dependencies={['actualStart']} rules={[{validator:(_,value:unknown)=>!value||(typeof value==='string'&&Boolean(form.getFieldValue('actualStart'))&&value>=String(form.getFieldValue('actualStart')))?Promise.resolve():Promise.reject(new Error('实际结束不能早于实际开始，且须先填实际开始'))}]}><Input type="date"/></Form.Item>
 <Form.Item name="progress" label="进度" rules={[{required:true,type:'number',min:0,max:100,message:'进度为0至100'}]}><InputNumber min={0} max={100}/></Form.Item>
 </SharedForm>;
}
