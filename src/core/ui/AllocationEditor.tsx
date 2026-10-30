import {InputNumber} from 'antd';
import {useId} from 'react';
import {allocationSummary} from '../allocation';
import type {AllocationItem} from '../allocation';
export interface AllocationEditorProps {total:number;items:AllocationItem[];value:Record<string,number>;onChange:(values:Record<string,number>)=>void;unit?:string;disabled?:boolean}
/** Controlled draft editor; no persistence and no finance/payment services. */
export function AllocationEditor({total,items,value,onChange,unit='单位',disabled=false}:AllocationEditorProps){
 const id=useId();const summary=allocationSummary(total,items,value);
 return <div className="allocation-editor"><p>可分配总量：{total.toFixed(2)} {unit}</p>{items.map(item=><div key={item.id} className="allocation-row"><label htmlFor={`${id}-${item.id}`}>{item.label}（上限 {item.limit.toFixed(2)} {unit}）</label><InputNumber id={`${id}-${item.id}`} disabled={disabled} value={value[item.id]} min={0} precision={2} status={summary.errors[item.id]?'error':undefined} aria-describedby={summary.errors[item.id]?`${id}-${item.id}-error`:undefined} onChange={next=>{const values={...value};if(next===null)delete values[item.id];else values[item.id]=next;onChange(values);}}/>{summary.errors[item.id]&&<span id={`${id}-${item.id}-error`} role="alert">{summary.errors[item.id]}</span>}</div>)}<p role="status">已分配：{summary.allocated.toFixed(2)} {unit} · 剩余：{Number.isFinite(summary.remaining)?summary.remaining.toFixed(2):'—'} {unit}</p>{summary.issues.map(issue=><p role="alert" key={issue}>{issue}</p>)}</div>;
}
