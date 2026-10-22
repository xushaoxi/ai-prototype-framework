import dayjs from 'dayjs';
import { BusinessError } from './types';
import type { ModuleDefinition, SaveInput } from './types';

export function initialFormValues(module:ModuleDefinition, values:SaveInput = {}):Record<string,unknown> {
  const initial:Record<string,unknown>={...module.defaultValues,...values};
  for(const field of module.fields.filter(field=>field.type==='date')) {
    const value=initial[field.key];
    initial[field.key]=value?dayjs(String(value)):field.key==='date'?dayjs():undefined;
  }
  return initial;
}

export function serializeFormValues(module:ModuleDefinition, values:Record<string,unknown>):SaveInput {
  const input:Record<string,string|number>={};
  for(const field of module.fields.filter(field=>field.inForm!==false)) {
    const value=values[field.key];
    if(value===null||value===undefined) { input[field.key]='';continue; }
    if(field.type==='date'&&dayjs.isDayjs(value)&&value.isValid()) input[field.key]=value.format('YYYY-MM-DD');
    else if(typeof value==='string'||typeof value==='number') input[field.key]=value;
    else throw new BusinessError('VALIDATION_ERROR','请检查填写内容',400,{[field.key]:`请输入有效${field.label}`});
  }
  return input;
}
