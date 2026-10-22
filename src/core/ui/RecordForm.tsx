import { DatePicker, Form, Input, InputNumber, Modal, Select } from 'antd';
import { BusinessError } from '../types';
import { initialFormValues, serializeFormValues } from '../form-values';
import type { BusinessRecord, FieldDefinition, ModuleDefinition, SaveInput } from '../types';

function fieldControl(field:FieldDefinition) {
  if(field.type==='select') return <Select options={field.options} placeholder={`请选择${field.label}`}/>;
  if(field.type==='number') return <InputNumber min={field.min} max={field.max} precision={2} style={{width:'100%'}} placeholder={`请输入${field.label}`}/>;
  if(field.type==='date') return <DatePicker style={{width:'100%'}} format="YYYY-MM-DD" allowClear={!field.required}/>;
  if(field.type==='textarea') return <Input.TextArea rows={3} maxLength={field.maxLength} showCount placeholder={`请输入${field.label}`}/>;
  return <Input maxLength={field.maxLength} placeholder={`请输入${field.label}`}/>;
}

export function RecordForm({module,record,onCancel,onSave,saving}:{module:ModuleDefinition;record:BusinessRecord|null;onCancel:()=>void;onSave:(input:SaveInput)=>Promise<void>;saving:boolean}) {
  const [form]=Form.useForm();
  const initial=initialFormValues(module,record??{});
  const submit=async()=>{
    const values=await form.validateFields();
    await onSave({...serializeFormValues(module,values),...(record?{version:record.version}:{})});
  };
  return <Modal title={`${record?'编辑':'新增'}${module.singularName}`} open onCancel={onCancel} onOk={()=>void submit().catch(error=>{if(error instanceof BusinessError&&error.fields)form.setFields(Object.entries(error.fields).map(([name,message])=>({name,errors:[message]})));})} okText="保存" cancelText="取消" confirmLoading={saving} mask={{closable:false}} destroyOnHidden width={620}>
    <p className="form-intro">{record?'修改业务信息，编号与状态由系统维护。':'填写基本信息，保存后可在台账中继续管理。'}</p>
    <Form form={form} layout="vertical" initialValues={initial} requiredMark="optional" disabled={saving}>
      <div className="form-grid">{module.fields.filter(field=>field.inForm!==false).map(field=><Form.Item key={field.key} name={field.key} label={field.label} className={field.type==='textarea'?'form-full':undefined} rules={[
        ...(field.required?[{required:true,message:`${field.type==='select'?'请选择':'请输入'}${field.label}`}]:[]),
        ...(field.type==='text'&&field.required?[{whitespace:true,message:`请输入${field.label}`}]:[]),
        ...(field.maxLength?[{max:field.maxLength,message:`最多${field.maxLength}个字符`}]:[]),
      ]}>{fieldControl(field)}</Form.Item>)}</div>
    </Form>
  </Modal>;
}
