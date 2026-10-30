import type {ModuleDefinition} from './types';
export interface ColumnChoice {key:string;label:string;width:number}
export type ColumnFixed='left'|'right';
export interface ColumnPreferences {version:1;knownKeys:string[];visibleKeys:string[];widths:Record<string,number>;resizedKeys:string[];orderKeys:string[];fixedKeys:Record<string,ColumnFixed>}
export function columnChoices(module:ModuleDefinition):ColumnChoice[]{
  return [...module.fields.filter(field=>field.inTable&&field.key!=='status').map(field=>({key:field.key,label:field.label,width:field.width??(field.key==='amount'?130:field.key==='date'?116:100)})),{key:'status',label:'状态',width:92}];
}
const object=(value:unknown):value is Record<string,unknown>=>typeof value==='object'&&value!==null&&!Array.isArray(value);
export function normalizeColumnPreferences(module:ModuleDefinition,value:unknown):ColumnPreferences{
  const choices=columnChoices(module);const keys=choices.map(c=>c.key);
  const valid=object(value)&&value.version===1&&Array.isArray(value.knownKeys)&&Array.isArray(value.visibleKeys)&&object(value.widths);
  const known=valid?new Set(value.knownKeys as unknown[]):new Set(keys);
  const selected=valid?new Set(value.visibleKeys as unknown[]):new Set(keys);
  const saved=valid?value.widths as Record<string,unknown>:{};
  const resized=valid&&Array.isArray(value.resizedKeys)?new Set(value.resizedKeys):new Set(choices.filter(choice=>typeof saved[choice.key]==='number'&&saved[choice.key]!==choice.width).map(choice=>choice.key));
  const savedFixed=valid&&object(value.fixedKeys)?value.fixedKeys:{};
  const fixedKeys:Record<string,ColumnFixed>={};
  for(const key of keys){const pin=savedFixed[key];if(pin==='left'||pin==='right')fixedKeys[key]=pin;}
  const savedOrder=valid&&Array.isArray(value.orderKeys)?value.orderKeys.filter((item):item is string=>typeof item==='string'&&keys.includes(item)):[];
  const order=[...new Set([...savedOrder,...keys])];
  const rank=(key:string)=>fixedKeys[key]==='left'?0:fixedKeys[key]==='right'?2:1;
  const orderKeys=order.sort((a,b)=>rank(a)-rank(b));
  return {version:1,knownKeys:keys,orderKeys,fixedKeys,visibleKeys:keys.filter(key=>key==='name'||selected.has(key)||!known.has(key)),resizedKeys:keys.filter(key=>resized.has(key)),widths:Object.fromEntries(choices.map(choice=>{
    const width=saved[choice.key];return [choice.key,typeof width==='number'&&Number.isFinite(width)?Math.max(80,Math.min(600,Math.round(width))):choice.width];
  }))};
}
export const columnPreferenceKey=(moduleId:string)=>`prototype-workbench:columns:v1:${moduleId}`;
export function loadColumnPreferences(module:ModuleDefinition):ColumnPreferences{
  try{return normalizeColumnPreferences(module,JSON.parse(localStorage.getItem(columnPreferenceKey(module.id))??'null'));}
  catch{return normalizeColumnPreferences(module,null);}
}

// Distribute spare width only to columns that the user has not resized.
export function resolveColumnWidths(module:ModuleDefinition,preferences:ColumnPreferences,containerWidth:number):{widths:Record<string,number>;filler:number}{
  const choices=columnChoices(module).filter(choice=>preferences.visibleKeys.includes(choice.key));
  const widths=Object.fromEntries(choices.map(choice=>[choice.key,preferences.widths[choice.key]??choice.width]));
  let extra=Math.max(0,Math.floor(containerWidth)-150-Object.values(widths).reduce((sum,width)=>sum+width,0));
  let candidates=choices.filter(choice=>!preferences.resizedKeys.includes(choice.key)&&widths[choice.key]<600);
  while(extra>0&&candidates.length){
    const share=Math.max(1,Math.floor(extra/candidates.length));
    for(const choice of candidates){const amount=Math.min(share,600-widths[choice.key],extra);widths[choice.key]+=amount;extra-=amount;}
    candidates=candidates.filter(choice=>widths[choice.key]<600);
  }
  return {widths,filler:extra};
}

export function orderedColumnChoices(module:ModuleDefinition,preferences:ColumnPreferences):ColumnChoice[]{
  const choices=columnChoices(module);
  return preferences.orderKeys.flatMap(key=>{const choice=choices.find(item=>item.key===key);return choice?[choice]:[];});
}
export function moveColumn(preferences:ColumnPreferences,from:string,to:string):ColumnPreferences{
  const order=preferences.orderKeys;const fromIndex=order.indexOf(from);const toIndex=order.indexOf(to);
  if(fromIndex<0||toIndex<0||fromIndex===toIndex||preferences.fixedKeys[from]!==preferences.fixedKeys[to])return preferences;
  const next=[...order];next.splice(fromIndex,1);next.splice(toIndex,0,from);
  return {...preferences,orderKeys:next};
}
export function setColumnFixed(preferences:ColumnPreferences,key:string,pin:ColumnFixed|undefined):ColumnPreferences{
  if(!preferences.orderKeys.includes(key)||preferences.fixedKeys[key]===pin)return preferences;
  const fixedKeys={...preferences.fixedKeys};
  if(pin)fixedKeys[key]=pin;else delete fixedKeys[key];
  const order=preferences.orderKeys.filter(item=>item!==key);
  const index=pin==='left'?order.findIndex(item=>fixedKeys[item]!=='left'):pin==='right'?-1:order.findIndex(item=>fixedKeys[item]==='right');
  order.splice(index<0?order.length:index,0,key);
  return {...preferences,orderKeys:order,fixedKeys};
}
