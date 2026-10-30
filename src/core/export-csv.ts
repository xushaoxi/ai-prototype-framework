import {columnChoices} from './columns';
import type { BusinessRecord, ModuleDefinition } from './types';
import {displayFieldValue} from './field-values';
export function escapeCsv(value:unknown):string {
  let text=String(value??'');
  if(/^[\s]*[=+\-@\t\r]/.test(text)) text="'"+text;
  return '"'+text.replaceAll('"','""')+'"';
}
export function recordsToCsv(module:ModuleDefinition,records:BusinessRecord[],keys?:readonly string[]):string {
  const choices=columnChoices(module);
  const selected=[...new Set(keys??choices.map(choice=>choice.key))];
  if(!selected.length)throw new Error('请至少选择一个导出列');
  if(selected.some(key=>!choices.some(choice=>choice.key===key)))throw new Error('导出列不合法');
  const labels=selected.map(key=>choices.find(choice=>choice.key===key)!.label);
  return '\uFEFF'+[labels.map(escapeCsv).join(','),...records.map(record=>selected.map(key=>escapeCsv(key==='status'?(module.statuses.find(status=>status.value===record.status)?.label??record.status):displayFieldValue(module.fields.find(field=>field.key===key),record[key],''))).join(','))].join('\r\n');
}
export function downloadText(content:string,filename:string,type='text/plain;charset=utf-8') {
  const url=URL.createObjectURL(new Blob([content],{type}));
  const anchor=document.createElement('a');anchor.href=url;anchor.download=filename;anchor.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
