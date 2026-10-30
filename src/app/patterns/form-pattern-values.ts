import type {FormPayload,LineItem} from '../../core/patterns/types';
export function emptyForm():FormPayload {return {name:'',owner:'',category:'',amount:0,date:'',notes:'',classification:'basic',reason:'',tags:[],items:[],files:[]};}
export function attachmentError(file:Pick<File,'name'|'size'|'type'>,count:number):string {
 if(count>=5)return '最多选择 5 个附件';
 if(!['application/pdf','image/png','image/jpeg','text/csv'].includes(file.type))return '附件类型仅支持 PDF、PNG、JPEG、CSV';
 const extensions:Record<string,string[]>={'application/pdf':['pdf'],'image/png':['png'],'image/jpeg':['jpg','jpeg'],'text/csv':['csv']};
 if(!extensions[file.type]?.includes(file.name.split('.').pop()?.toLowerCase()??''))return '文件扩展名与类型不匹配';
 if(file.size>5*1024*1024)return '单个附件不能超过 5 MB';
 if(file.size<=0)return '不能选择空文件';
 return '';
}
export function lineTotal(items:LineItem[]):number {return Math.round(items.reduce((sum,item)=>sum+(Number(item.quantity)||0)*(Number(item.price)||0),0)*100)/100;}
export function formSignature(values:FormPayload):string {return JSON.stringify({...emptyForm(),...values,tags:[...(values.tags??[])].sort()});}
