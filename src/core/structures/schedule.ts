import type {ScheduleTask} from './types';
export type TaskTreeRow=ScheduleTask&{children?:TaskTreeRow[]};
/** Missing parents in filtered views remain visible as roots. Store rejects cycles. */
export function taskTree(tasks:ScheduleTask[]):TaskTreeRow[]{const ids=new Set(tasks.map(t=>t.id));const branch=(parentId:string|null,ancestors:Set<string>):TaskTreeRow[]=>tasks.filter(t=>t.parentId===parentId||(parentId===null&&t.parentId!==null&&!ids.has(t.parentId))).filter(t=>!ancestors.has(t.id)).map(task=>{const children=branch(task.id,new Set([...ancestors,task.id]));return {...task,...(children.length?{children}:{})};});return branch(null,new Set());}
