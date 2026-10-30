import {escapeCsv} from '../export-csv';
import type {PatternRecord} from './types';
export function parseCsv(text:string):string[][] {
 if(text.length>2*1024*1024)throw new Error('文件不能超过2MB');
 const source=text.replace(/^\uFEFF/,'');const rows:string[][]=[];let row:string[]=[];let cell='';let quoted=false;let closed=false;
 for(let i=0;i<source.length;i++){
  const char=source[i];
  if(quoted){if(char==='"'){if(source[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=char;continue;}
  if(char==='"'){if(cell||closed)throw new Error('CSV引号格式错误');quoted=true;continue;}
  if(char===','||char==='\n'||char==='\r'){
   row.push(cell);cell='';closed=false;
   if(char!==','){if(char==='\r'&&source[i+1]==='\n')i++;if(row.some(value=>value.trim()))rows.push(row);row=[];}
  }else{if(closed&&char.trim())throw new Error('CSV引号后存在非法内容');if(!closed)cell+=char;}
 }
 if(quoted)throw new Error('CSV引号未闭合');row.push(cell);if(row.some(value=>value.trim()))rows.push(row);
 if(rows.length<1||rows.length>501)throw new Error('须有标题且最多500行数据');return rows;
}
export type ImportMap=Record<'name'|'owner'|'category'|'amount'|'date',string>;
export function previewImport(rows:string[][],map:ImportMap):{row:number;record?:Omit<PatternRecord,'id'|'code'>;errors:string[]}[]{
 const headers=rows[0]??[];
 if(new Set(headers).size!==headers.length||headers.some(value=>!value.trim()))throw new Error('列名不能为空或重复');
 if(Object.values(map).some(value=>!headers.includes(value))||new Set(Object.values(map)).size!==5)throw new Error('请分别映射五个必填字段');
 return rows.slice(1).map((values,index)=>{
  const get=(key:keyof ImportMap)=>(values[headers.indexOf(map[key])]??'').trim();const errors:string[]=[];
  if(values.length!==headers.length)errors.push('列数与标题不一致');
  for(const key of ['name','owner','category'] as const)if(!get(key))errors.push(`${map[key]}不能为空`);
  const amount=Number(get('amount'));if(!get('amount')||!Number.isFinite(amount)||amount<0||amount>999999999||Number(amount.toFixed(2))!==amount)errors.push('金额须为非负数字，最多两位小数');
  const date=get('date');if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)errors.push('日期须为有效YYYY-MM-DD');
  const record={name:get('name'),owner:get('owner'),category:get('category'),amount,date,status:'draft' as const,notes:'',tags:[]};
  return {row:index+2,...(!errors.length?{record}:{}),errors};
 });
}
export function patternCsv(rows:PatternRecord[]):string {
 return '\uFEFF'+[['编号','名称','类别','负责人','金额','日期','状态'],...rows.map(row=>[row.code,row.name,row.category,row.owner,row.amount,row.date,row.status])].map(row=>row.map(escapeCsv).join(',')).join('\r\n');
}
