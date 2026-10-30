export interface AllocationItem {id:string;label:string;limit:number}
const validAmount=(value:number)=>Number.isFinite(value)&&value>=0&&value===Number(value.toFixed(2))&&Number.isSafeInteger(Math.round(value*100));
/** UI and business adapters can share validation; business writes must call it in store. */
export function allocationSummary(total:number,items:AllocationItem[],values:Record<string,number>){
 const errors:Record<string,string>={};const issues:string[]=[];
 if(!validAmount(total))issues.push('总量须为非负且最多两位小数的安全数值');
 if(new Set(items.map(item=>item.id)).size!==items.length||items.some(item=>!item.id||!validAmount(item.limit)))issues.push('候选项标识和上限须有效且唯一');
 const ids=new Set(items.map(item=>item.id));if(Object.keys(values).some(id=>!ids.has(id)))issues.push('包含未知候选项');
 let allocatedUnits=0;
 for(const item of items){const value=Object.hasOwn(values,item.id)?values[item.id]:undefined;if(value===undefined)continue;if(!validAmount(value))errors[item.id]='请输入非负且最多两位小数的数值';else {allocatedUnits+=Math.round(value*100);if(value>item.limit)errors[item.id]='不能超过本项上限';}}
 if(!Number.isSafeInteger(allocatedUnits))issues.push('分配合计超出安全范围');
 const remainingUnits=Math.round(total*100)-allocatedUnits;
 if(validAmount(total)&&remainingUnits<0)issues.push('分配合计不能超过总量');
 return {allocated:allocatedUnits/100,remaining:remainingUnits/100,errors,issues,valid:Object.keys(errors).length===0&&issues.length===0};
}
