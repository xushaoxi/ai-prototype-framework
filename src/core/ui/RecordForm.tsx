import { App, Form, Modal } from 'antd';
import { initialFormValues, serializeFormValues } from '../form-values';
import type { BusinessRecord, ModuleDefinition, SaveInput } from '../types';
import { RecordFormFields } from './RecordFormFields';
import {useUnsavedForm} from './useUnsavedForm';
import {useFormFeedback} from './useFormFeedback';
import {FormValidationSummary} from './FormValidationSummary';

export function RecordForm({module,record,onCancel,onSave,saving,active=true}:{active?:boolean;module:ModuleDefinition;record:BusinessRecord|null;onCancel:()=>void;onSave:(input:SaveInput)=>Promise<void>;saving:boolean}) {
  const [form]=Form.useForm();
  const feedback=useFormFeedback(form);
  const {message}=App.useApp();
  const busy=saving||feedback.submitting;
  const initial=initialFormValues(module,record??{});
  const unsaved=useUnsavedForm(form,module,initial,busy);
  const submit=()=>feedback.submit(async values=>{
    await onSave({...serializeFormValues(module,values),...(record?{version:record.version}:{})});
  },error=>{message.error(error instanceof Error?error.message:'保存失败，请重试');});
  return <Modal title={`${record?'编辑':'新增'}${module.singularName}`} open={active} focusable={{focusTriggerAfterClose:active}} onCancel={()=>unsaved.request(onCancel)} onOk={()=>void submit()} okText="保存" okButtonProps={{'aria-label':'保存'}} cancelText="取消" confirmLoading={busy} cancelButtonProps={{disabled:busy}} closable={!busy} keyboard={!busy} mask={{closable:false}} width={620} style={{top:24}} styles={{body:{maxHeight:'calc(100dvh - 220px)',overflowY:'auto',paddingRight:4}}}>
    <p className="form-intro">{record?'修改业务信息，编号与状态由系统维护。':'填写基本信息，保存后可在台账中继续管理。'}</p>
    <Form name={`${module.id}-record-form`} form={form} layout="vertical" initialValues={initial} requiredMark disabled={busy} validateTrigger={[]} onValuesChange={feedback.onValuesChange} onFieldsChange={feedback.onFieldsChange}>
      <FormValidationSummary count={feedback.errorCount} onLocate={feedback.focusFirstError}/>
      <RecordFormFields module={module} originalValues={record??undefined}/>
    </Form>
  </Modal>;
}
