import {useRef} from 'react';
import {App} from 'antd';
import type {FormInstance} from 'antd';
import {serializeFormValues} from '../form-values';
import type {ModuleDefinition} from '../types';
import {useRegisterWorkspaceExit} from './workspace-exit';

function signature(module:ModuleDefinition,values:Record<string,unknown>):string {
 const saved=serializeFormValues(module,values);
 return JSON.stringify(module.fields.filter(field=>field.inForm!==false).map(field=>{
  const value=saved[field.key];
  return Array.isArray(value)&&['checkbox','multiselect'].includes(field.type)?[...value].sort():value??'';
 }));
}
export function useUnsavedForm(form:FormInstance<Record<string,unknown>>,module:ModuleDefinition,initial:Record<string,unknown>,busy:boolean){
 const baseline=useRef(signature(module,initial));
 return useUnsavedChanges(()=>{try{return signature(module,form.getFieldsValue(true))!==baseline.current;}catch{return true;}},busy);
}
export function useUnsavedChanges(dirty:()=>boolean,busy:boolean){
 const {modal}=App.useApp();
 const confirmation=useRef<ReturnType<typeof modal.confirm>|null>(null);
 const request=(leave:()=>void)=>{
  if(busy||confirmation.current)return;
  if(!dirty()){leave();return;}
  confirmation.current=modal.confirm({title:'放弃未保存的修改？',content:'离开后，本次修改将丢失。',okText:'放弃修改',cancelText:'继续编辑',okButtonProps:{danger:true},focusable:{autoFocusButton:'cancel'},mask:{closable:false},
   onOk:()=>{confirmation.current=null;leave();},onCancel:()=>{confirmation.current=null;},afterClose:()=>{confirmation.current=null;}});
 };
 useRegisterWorkspaceExit({shouldWarn:()=>busy||dirty(),request});
 return {request};
}
