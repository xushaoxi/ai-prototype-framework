import {useRef,useState} from 'react';
import {App,Form} from 'antd';
import type {FormInstance} from 'antd';
import {BusinessError} from '../types';
import {useUnsavedChanges} from './useUnsavedForm';

/** A lifecycle, not a field interpreter. Consumers own values, content and persistence. */
export function useSharedForm<T extends object>({initial,signature,busy=false,readOnly=false,onInvalid}:{initial:T;signature:(values:T)=>string;busy?:boolean;readOnly?:boolean;onInvalid?:(name:(string|number)[])=>void}){
 const [form]=Form.useForm<T>();const {message}=App.useApp();
 const [initialValues]=useState(initial);const baseline=useRef(signature(initialValues));
 const [submitting,setSubmitting]=useState(false);const locked=useRef(false);
 const [errors,setErrors]=useState(0);const failed=useRef(new Map<string,(string|number)[]>());
 const saving=busy||submitting;const disabled=saving||readOnly;
 const {request}=useUnsavedChanges(()=>signature(form.getFieldsValue(true))!==baseline.current,saving);
 const syncErrors=()=>{const issues=form.getFieldsError().filter(field=>field.errors.length);issues.forEach(field=>failed.current.set(JSON.stringify(field.name),[...field.name]));setErrors(issues.length);return issues;};
 const reportErrors=()=>{
  const first=syncErrors()[0];if(!first)return;
  onInvalid?.(first.name);setTimeout(()=>form.scrollToField(first.name,{focus:true,block:'center'}),100);
 };
 const replace=(next:T)=>{form.resetFields();form.setFieldsValue(next);baseline.current=signature(next);failed.current.clear();setErrors(0);};
 const perform=async(action:(values:T)=>Promise<boolean|void>,validate=true)=>{
  if(locked.current||disabled)return false;
  locked.current=true;setSubmitting(true);
  try{
   const values:T=validate?await form.validateFields():form.getFieldsValue(true);
   const success=await action(values);
   if(success===false)return false;
   baseline.current=signature(values);setErrors(0);return true;
  }catch(error){
   if(error instanceof BusinessError&&error.fields){form.setFields(Object.entries(error.fields).map(([name,text])=>({name,errors:[text]})) as Parameters<FormInstance<T>['setFields']>[0]);reportErrors();}
   else if(error&&typeof error==='object'&&'errorFields'in error)reportErrors();
   else void message.error('保存失败，输入已保留，请重试');
   return false;
  }finally{locked.current=false;setSubmitting(false);}
 };
 const onValuesChange=(changed:Partial<T>)=>{
  const roots=new Set(Object.keys(changed));
  const paths=[...failed.current.values()].filter(path=>roots.has(String(path[0])));
  if(paths.length)void form.validateFields(paths).catch(()=>{}).finally(syncErrors);
 };
 return {form,initialValues,saving,disabled,errors,request,replace,perform,onValuesChange,reportErrors};
}
