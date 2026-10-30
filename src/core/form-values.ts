import dayjs from 'dayjs';
import { BusinessError } from './types';
import type { FieldValue, ModuleDefinition, SaveInput } from './types';

export function initialFormValues(module:ModuleDefinition, values:SaveInput = {}):Record<string,unknown> {
  const initial:Record<string,unknown>={...module.defaultValues,...values};
  for(const field of module.fields) {
    const value=initial[field.key];
    if(field.type==='date')initial[field.key]=value?dayjs(String(value)):undefined;
    if(field.type==='time')initial[field.key]=value?dayjs(`2000-01-01T${String(value)}:00`):undefined;
    if(field.type==='dateRange')initial[field.key]=Array.isArray(value)&&value.length===2?value.map(item=>dayjs(String(item))):undefined;
    if(field.type==='checkbox'||field.type==='multiselect')initial[field.key]=Array.isArray(value)?[...value]:[];
  }
  return initial;
}

export function serializeFormValues(module:ModuleDefinition, values:Record<string,unknown>):SaveInput {
  const input:Record<string,FieldValue>={};
  for(const field of module.fields.filter(field=>field.inForm!==false)) {
    const value=values[field.key];
    const multiple=field.type==='checkbox'||field.type==='multiselect'||field.type==='dateRange';
    if(value===null||value===undefined) { input[field.key]=multiple?[]:'';continue; }
    if((field.type==='date'||field.type==='time')&&dayjs.isDayjs(value)&&value.isValid())input[field.key]=value.format(field.type==='time'?'HH:mm':'YYYY-MM-DD');
    else if(field.type==='dateRange'&&Array.isArray(value)&&value.length===2&&Array.from(value).every(item=>dayjs.isDayjs(item)&&item.isValid()))input[field.key]=value.map(item=>item.format('YYYY-MM-DD'));
    else if(multiple&&Array.isArray(value)&&Array.from(value).every(item=>typeof item==='string'))input[field.key]=[...value];
    else if(typeof value==='string'||typeof value==='number') input[field.key]=value;
    else throw new BusinessError('VALIDATION_ERROR','请检查填写内容',400,{[field.key]:`请输入有效${field.label}`});
  }
  return input;
}
