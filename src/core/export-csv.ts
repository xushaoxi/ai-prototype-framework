import type { BusinessRecord, ModuleDefinition } from './types';
export function escapeCsv(value:unknown):string {
  let text=String(value??'');
  if(/^[\s]*[=+\-@\t\r]/.test(text)) text="'"+text;
  return '"'+text.replaceAll('"','""')+'"';
}
export function recordsToCsv(module:ModuleDefinition,records:BusinessRecord[]):string {
  const fields=module.fields.filter(field=>field.inTable);
  return '\uFEFF'+[[...fields.map(field=>escapeCsv(field.label)),escapeCsv('状态')].join(','),...records.map(record=>[...fields.map(field=>escapeCsv(record[field.key as keyof BusinessRecord])),escapeCsv(module.statuses.find(status=>status.value===record.status)?.label??record.status)].join(','))].join('\r\n');
}
export function downloadText(content:string,filename:string,type='text/plain;charset=utf-8') {
  const url=URL.createObjectURL(new Blob([content],{type}));
  const anchor=document.createElement('a');anchor.href=url;anchor.download=filename;anchor.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
