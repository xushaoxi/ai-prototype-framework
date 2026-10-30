import {describe,it,expect} from 'vitest';
import {createStructureStore,STRUCTURE_STORAGE_KEY} from '../../src/mocks/store';
describe('STR complex structure rules',()=>{
 it('STR-01 blocks advancing blocked stages and records recovery',()=>{const s=createStructureStore();s.act(1,{type:'stage.block',note:'等待材料'});expect(()=>s.act(2,{type:'stage.advance'})).toThrow();const next=s.act(2,{type:'stage.resume'});expect(next.history).toHaveLength(2);expect(s.act(next.version,{type:'stage.advance'}).stage).toBe(1);});
 it('STR-02 rejects stale versions and invalid schedules atomically',()=>{const s=createStructureStore();const before=s.get();expect(()=>s.act(0,{type:'stage.advance'})).toThrow();expect(()=>s.act(1,{type:'task.save',task:{...before.tasks[0],end:'2026-10-01'}})).toThrow();expect(s.get()).toEqual(before);});
 it('STR-03 validates complete layouts and report fields before saving',()=>{const s=createStructureStore();const before=s.get();expect(()=>s.act(1,{type:'layout.save',widgets:[{id:'x',kind:'metric',width:0}]})).toThrow();expect(()=>s.act(1,{type:'report.save',report:{fields:['unknown'],minimum:0}})).toThrow();expect(s.get()).toEqual(before);});
 it('STR-04 preserves state after persistence failure and isolates reset',()=>{const values=new Map<string,string>();const storage={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{if(values.has('fail'))throw Error('quota');values.set(k,v);}};const s=createStructureStore(storage);s.act(1,{type:'stage.advance'});values.set('fail','yes');expect(()=>s.act(2,{type:'stage.advance'})).toThrow();expect(s.get().stage).toBe(1);expect(values.has(STRUCTURE_STORAGE_KEY)).toBe(true);});
 it('STR-05 damaged storage requires explicit reset and reset recovers',()=>{const storage={getItem:()=>'{broken',setItem:()=>{}};const s=createStructureStore(storage);expect(()=>s.get()).toThrow();expect(s.reset().stage).toBe(0);});
});
describe('STR strict input and isolation',()=>{
 it('STR-06 rejects unknown task fields, long ids and hierarchy cycles',()=>{const s=createStructureStore();const task=s.get().tasks[0];for(const invalid of [{...task,extra:1},{...task,id:'x'.repeat(81)},{...task,parentId:'t2'}])expect(()=>s.act(1,{type:'task.save',task:invalid})).toThrow();expect(s.get().version).toBe(1);});
 it('STR-07 resets only the structure namespace and copies returned values',()=>{const values=new Map([['other','keep']]);const s=createStructureStore({getItem:k=>values.get(k)??null,setItem:(k,v)=>{values.set(k,v);}});const snapshot=s.get();snapshot.tasks[0].name='mutated';expect(s.get().tasks[0].name).not.toBe('mutated');s.reset();expect(values.get('other')).toBe('keep');});
});
describe('STR-08 finite report conditions and aliases',()=>{
 it('rejects mismatched condition types and aliases atomically',()=>{const s=createStructureStore();const before=s.get();expect(()=>s.act(1,{type:'report.save',report:{...before.report,conditions:[{field:'progress',operator:'contains',value:'x'}]}})).toThrow();expect(()=>s.act(1,{type:'report.save',report:{...before.report,aliases:{unknown:'标题'}}})).toThrow();expect(s.get()).toEqual(before);});
});
it('STR-09 saves supported aliases and text conditions',()=>{const s=createStructureStore();const report={...s.get().report,aliases:{name:'工作项'},conditions:[{field:'name',operator:'contains',value:'核对'}]};expect(s.act(1,{type:'report.save',report}).report).toEqual(report);});
describe('STR-11 schedule milestone and actual dates',()=>{
 it('accepts an optional milestone with matching plan dates and actual range',()=>{const s=createStructureStore();const task={...s.get().tasks[0],start:'2026-10-30',end:'2026-10-30',milestone:true,actualStart:'2026-10-29',actualEnd:'2026-10-30'};expect(s.act(1,{type:'task.save',task}).tasks[0]).toEqual(task);});
 it('rejects multi-day milestones and invalid actual dates atomically',()=>{const s=createStructureStore();const before=s.get();for(const patch of [{milestone:true},{actualEnd:'2026-10-30'},{actualStart:'2026-10-29',actualEnd:'2026-10-28'},{actualStart:'2026-02-30'},{milestone:'yes'}])expect(()=>s.act(1,{type:'task.save',task:{...before.tasks[0],...patch}})).toThrow();expect(s.get()).toEqual(before);});
});
describe('STR-13 configurable widget scope fields and limit',()=>{
 it('saves finite widget configuration',()=>{const s=createStructureStore();const widgets=[{...s.get().widgets[1],scope:'done',fields:['name'],limit:2}];expect(s.act(1,{type:'layout.save',widgets}).widgets).toEqual(widgets);});
 it('rejects invalid scope fields and row limit atomically',()=>{const s=createStructureStore();const before=s.get();for(const patch of [{scope:'unknown'},{fields:[]},{fields:['unknown']},{limit:0},{limit:21}])expect(()=>s.act(1,{type:'layout.save',widgets:[{...before.widgets[1],...patch}]})).toThrow();expect(s.get()).toEqual(before);});
});
