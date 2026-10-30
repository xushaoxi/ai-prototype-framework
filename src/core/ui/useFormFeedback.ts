import {useEffect,useRef,useState} from 'react';
import type {FormInstance} from 'antd';
import {BusinessError} from '../types';

/** FORM-007: validate on submit, then recheck only fields that have failed. */
export function useFormFeedback(form:FormInstance<Record<string,unknown>>) {
  const failedKeys=useRef(new Set<string>());
  const locked=useRef(false);
  const [submitting,setSubmitting]=useState(false);
  const [errorCount,setErrorCount]=useState(0);
  const [focusRequest,setFocusRequest]=useState(0);
  const pendingFocus=useRef<(string|number)[]|null>(null);
  useEffect(()=>{
    if(submitting||!pendingFocus.current)return;
    const name=pendingFocus.current;
    pendingFocus.current=null;
    form.scrollToField(name,{focus:true,block:'center',behavior:'smooth'});
  },[form,submitting,focusRequest]);
  const syncErrors=()=>{
    const errors=form.getFieldsError().filter(field=>field.errors.length>0);
    errors.forEach(field=>failedKeys.current.add(String(field.name[0])));
    setErrorCount(errors.length);
    return errors;
  };
  const focusFirstError=()=>{
    const first=syncErrors()[0];
    // Focus after the commit that restores enabled controls, including API failures.
    if(first){pendingFocus.current=first.name;setFocusRequest(request=>request+1);}
  };
  const onValuesChange=(changed:Record<string,unknown>)=>{
    const names=Object.keys(changed).filter(key=>failedKeys.current.has(key));
    if(names.length)void form.validateFields(names).catch(()=>{}).finally(()=>syncErrors());
  };
  const submit=async(action:(values:Record<string,unknown>)=>Promise<void>,onError:(error:unknown)=>void)=>{
    if(locked.current)return;
    locked.current=true;
    try{
      const values=await form.validateFields();
      syncErrors();
      setSubmitting(true);
      await action(values);
    }catch(error){
      if(error instanceof BusinessError&&error.fields){
        form.setFields(Object.entries(error.fields).map(([name,message])=>({name,errors:[message]})));
        focusFirstError();
      }else if(error&&typeof error==='object'&&'errorFields' in error){
        focusFirstError();
      }else onError(error);
    }finally{locked.current=false;setSubmitting(false);}
  };
  return {submit,onValuesChange,onFieldsChange:()=>{syncErrors();},errorCount,focusFirstError,submitting};
}
