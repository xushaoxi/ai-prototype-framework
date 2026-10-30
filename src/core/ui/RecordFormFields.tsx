import { Button, Checkbox, DatePicker, Form, Input, InputNumber, Radio, Select, TimePicker } from 'antd';
import type {AriaAttributes} from 'react';
import type { FieldDefinition, FieldValue, ModuleDefinition, SaveInput } from '../types';

function RadioControl({field,value,onChange,id,...aria}:{field:FieldDefinition;value?:string;onChange?:(value:string|undefined)=>void;id?:string}&AriaAttributes) {
  return <div className="field-radio-control"><Radio.Group {...aria} id={id} aria-label={field.label} value={value??''} onChange={event=>onChange?.(event.target.value)} options={field.options}/>{!field.required&&value?<Button type="link" size="small" aria-label={`清除${field.label}`} onClick={()=>onChange?.(undefined)}>清除选择</Button>:null}</div>;
}

function preservesLegacyAmount(field:FieldDefinition,original?:FieldValue):boolean {
  return field.key==='amount'&&field.precision!==undefined&&typeof original==='number'&&Number(original.toFixed(field.precision))!==original;
}

function fieldControl(field:FieldDefinition,original?:FieldValue) {
  if(field.type==='radio')return <RadioControl field={field}/>;
  if(field.type==='checkbox')return <Checkbox.Group aria-label={field.label} options={field.options}/>;
  if(field.type==='select'||field.type==='multiselect')return <Select mode={field.type==='multiselect'?'multiple':undefined} options={field.options} showSearch={{optionFilterProp:'label'}} allowClear={!field.required} placeholder={field.placeholder??`请选择${field.label}`}/>;
  if(field.type==='number')return <InputNumber min={field.min} max={field.max} precision={preservesLegacyAmount(field,original)?undefined:field.precision??(field.key==='amount'?2:undefined)} changeOnBlur={!preservesLegacyAmount(field,original)} suffix={field.unit} style={{width:'100%'}} placeholder={field.placeholder??`请输入${field.label}`}/>;
  if(field.type==='dateRange')return <DatePicker.RangePicker classNames={{popup:{root:'form-range-popup'}}} style={{width:'100%'}} format="YYYY-MM-DD" placeholder={['开始日期','结束日期']} allowClear={!field.required}/>;
  if(field.type==='date')return <DatePicker style={{width:'100%'}} format="YYYY-MM-DD" placeholder={field.placeholder??'选择日期'} allowClear={!field.required}/>;
  if(field.type==='time')return <TimePicker style={{width:'100%'}} format="HH:mm" placeholder={field.placeholder??'选择时间'} allowClear={!field.required}/>;
  if(field.type==='textarea')return <Input.TextArea rows={3} maxLength={field.maxLength} showCount placeholder={field.placeholder??`请输入${field.label}`}/>;
  return <Input inputMode={field.inputMode} maxLength={field.maxLength} placeholder={field.placeholder??`请输入${field.label}`}/>;
}

export function RecordFormFields({module,originalValues}:{module:ModuleDefinition;originalValues?:SaveInput}) {
  return <><p className="form-required-hint">带 * 的为必填项</p><div className="form-grid">{module.fields.filter(field=>field.inForm!==false).map(field=><Form.Item key={field.key} name={field.key} label={field.label} extra={preservesLegacyAmount(field,originalValues?.[field.key])?'原有金额保留原始精度，修改后需符合当前小数位数要求':field.help} className={field.type==='textarea'||field.fullRow?'form-full':undefined} rules={[
    ...(field.required?[{required:true,message:`${['select','multiselect','radio','checkbox','date','dateRange','time'].includes(field.type)?'请选择':'请输入'}${field.label}`}]:[]),
    ...((field.type==='text'||field.type==='textarea')&&field.required?[{whitespace:true,message:`请输入${field.label}`}]:[]),
    ...(field.type==='number'?[{type:'number' as const,min:field.min,max:field.max,message:`${field.label}须在允许的数值范围内`}]:[]),
    ...(field.type==='number'&&field.precision!==undefined?[{validator:(_rule:unknown,value:unknown)=>{
      if(typeof value!=='number'||value===originalValues?.[field.key]||Number(value.toFixed(field.precision))===value)return Promise.resolve();
      return Promise.reject(new Error(`${field.label}最多保留${field.precision}位小数`));
    }}]:[]),
    ...(field.maxLength?[{max:field.maxLength,message:`最多${field.maxLength}个字符`}]:[]),
  ]}>{fieldControl(field,originalValues?.[field.key])}</Form.Item>)}</div></>;
}
