import type {FieldDefinition,FieldValue} from './types';

export function displayFieldValue(field:FieldDefinition|undefined,value:FieldValue|undefined,empty='—'):string {
  if(value===undefined||value===''||(Array.isArray(value)&&value.length===0))return empty;
  const label=(item:string)=>field?.options?.find(option=>option.value===item)?.label??item;
  if(Array.isArray(value))return field?.type==='dateRange'?value.join(' 至 '):value.map(label).join('、');
  return typeof value==='string'?label(value):String(value);
}
