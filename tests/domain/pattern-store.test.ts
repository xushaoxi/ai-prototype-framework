import { describe, expect, it } from 'vitest';
import { createPatternStore } from '../../src/mocks/store';
import type { PatternAction } from '../../src/core/patterns/types';
const memory = () => { const values = new Map<string,string>(); return {getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v);},removeItem:(k:string)=>{values.delete(k);},clear:()=>values.clear(),key:(i:number)=>[...values.keys()][i]??null,get length(){return values.size;}} satisfies Storage; };
describe('PAT-DATA pattern domain',()=>{
 it('seeds independently and returns copies; persists and rejects stale versions',()=>{ const storage=memory();const a=createPatternStore(storage),b=createPatternStore(storage);const s=a.get();expect(s.records.length).toBe(24);s.records.length=0;expect(a.get().records.length).toBe(24);const next=a.act(1,{type:'notice.read',ids:[a.get().notices[0].id]});expect(b.get()).toEqual(next);expect(()=>b.act(1,{type:'reset'})).toThrow(); });
 it('enforces legal status transitions, atomic batches and recycle lifecycle',()=>{const s=createPatternStore();const initial=s.get();const draft=initial.records.find(r=>r.status==='draft')!;const active=initial.records.find(r=>r.status==='active')!;expect(()=>s.act(1,{type:'record.delete',ids:[draft.id,active.id]})).toThrow();expect(s.get()).toEqual(initial);let n=s.act(1,{type:'record.delete',ids:[draft.id]});expect(n.deletedRecords).toHaveLength(1);n=s.act(n.version,{type:'record.restore',ids:[draft.id]});expect(n.records).toHaveLength(24);expect(()=>s.act(n.version,{type:'record.status',ids:[draft.id],status:'archived'})).toThrow();});
 it('rejects malformed actions, unsafe metadata, references, permissions and cyclic organizations',()=>{const s=createPatternStore();const initial=s.get();const invalid:unknown[]=[{type:'record.save',record:{}},{type:'file.add',files:[{id:'bad',name:'evil.html',size:12,type:'text/html'}]},{type:'node.save',node:{...initial.nodes[0],parentId:initial.nodes[1].id}},{type:'role.save',role:{...initial.roles[0],permissions:['root']}},{type:'node.delete',id:initial.users[0].orgId},{type:'role.delete',id:initial.users[0].roleIds[0]},{type:'task.decide',id:initial.tasks[0].id,decision:'rejected',comment:''}];for(const action of invalid){expect(()=>s.act(1,action as PatternAction)).toThrow();expect(s.get()).toEqual(initial);}});
 it('validates every restored collection and leaves persistence atomic on failure',()=>{const storage=memory();const s=createPatternStore(storage);const initial=s.get();for(const key of ['records','nodes','roles','users','tasks','notices','audit','drafts','files']){expect(()=>s.act(1,{type:'backup.restore',snapshot:{...initial,[key]:[{}]}})).toThrow();}storage.setItem=()=>{throw new Error('quota');};expect(()=>s.act(1,{type:'notice.read',ids:[initial.notices[0].id]})).toThrow();expect(s.get()).toEqual(initial);});
});

const form = {name:'分组表单',category:'设备',owner:'张晓明',amount:600,date:'2026-10-29',notes:'说明',classification:'basic' as const,reason:'',tags:['重点'],items:[{id:'line-1',name:'键盘',quantity:2,price:300}],files:[]};
const record = {name:form.name,category:form.category,owner:form.owner,amount:form.amount,date:form.date,notes:form.notes,status:'draft' as const,tags:form.tags,details:form};
it('PAT-DATA supports every declared action with persisted audit and references',()=>{
 const s=createPatternStore(memory());let n=s.get(); const act=(action:PatternAction)=>{n=s.act(n.version,action);expect(n.audit.at(-1)?.action).toBe(action.type);expect(s.get()).toEqual(n);};
 act({type:'record.save',record});const created=n.records.at(-1)!;
 act({type:'record.save',record:{...record,id:created.id,name:'修改后的分组表单',details:{...form,name:'修改后的分组表单'}}});
 act({type:'record.status',ids:[created.id],status:'active'});act({type:'record.status',ids:[created.id],status:'archived'});act({type:'record.status',ids:[created.id],status:'draft'});
 act({type:'record.delete',ids:[created.id]});act({type:'record.purge',ids:[created.id]});expect(n.deletedRecords).toHaveLength(0);
 act({type:'record.import',records:[{...record,details:undefined},{...record,details:undefined}]});expect(n.records).toHaveLength(26);
 act({type:'node.save',node:{id:'new-org',name:'新组织',parentId:'org-root',enabled:true}});
 act({type:'role.save',role:{id:'new-role',name:'角色',permissions:['record.read'],scope:'department'}});
 act({type:'user.save',user:{id:'new-user',name:'人员',email:'new@example.test',orgId:'new-org',roleIds:['new-role'],enabled:true}});
 act({type:'user.delete',id:'new-user'});act({type:'role.delete',id:'new-role'});act({type:'node.delete',id:'new-org'});
 act({type:'task.decide',id:n.tasks[0].id,decision:'approved',comment:''});act({type:'task.decide',id:n.tasks[1].id,decision:'rejected',comment:'材料不齐全'});
 act({type:'settings.save',settings:{systemName:'新工作台',notifications:false,timezone:'UTC'}});expect(n.settings.notifications).toBe(false);
 act({type:'notice.read',ids:n.notices.map(v=>v.id)});expect(n.notices.every(v=>v.read)).toBe(true);
 const file={id:'file-1',name:'演示.pdf',size:100,type:'application/pdf'};act({type:'file.add',files:[file]});
 act({type:'draft.save',draft:{id:'draft-1',title:'草稿',values:{...form,files:[file]}}});
 expect(()=>s.act(n.version,{type:'file.delete',id:file.id})).toThrow();
 act({type:'draft.delete',id:'draft-1'});act({type:'file.delete',id:file.id});
 const backup=n;act({type:'reset'});expect(n.records).toHaveLength(24);expect(n.audit).toHaveLength(1);
 act({type:'backup.restore',snapshot:backup});expect(n.records).toEqual(backup.records);
});
it('PAT-DATA validates form details and rejects unsafe backup relationships atomically',()=>{
 const s=createPatternStore();const original=s.get();
 const invalidForms:unknown[]=[{...form,classification:'special',reason:''},{...form,items:[{...form.items[0],quantity:0}]},{...form,items:[{...form.items[0],price:-1}]},{...form,files:[{id:'f',name:'../evil.pdf',size:1,type:'application/pdf'}]},{...form,files:[{id:'f',name:'file.pdf',size:5*1024*1024+1,type:'application/pdf'}]},{...form,date:'2026-02-30'}];
 for(const details of invalidForms){expect(()=>s.act(1,{type:'record.save',record:{...record,details}})).toThrow();expect(s.get()).toEqual(original);}
 const badBackups=[{...original,users:[{...original.users[0],orgId:'missing'}]},{...original,roles:[{...original.roles[0],permissions:['root']}]},{...original,records:[original.records[0],original.records[0]]},{...original,settings:{...original.settings,timezone:'invalid/timezone'}},{...original,nodes:[{...original.nodes[0],parentId:original.nodes[0].id}]},{...original,extra:'unknown'},{...original,records:[{...original.records[0],details:form}]}];
 for(const snapshot of badBackups){expect(()=>s.act(1,{type:'backup.restore',snapshot})).toThrow();expect(s.get()).toEqual(original);}
});
it('PAT-DATA isolates T01 storage, rejects >2MB and recovers from corrupted persistence',()=>{
 const storage=memory();storage.setItem('prototype-workbench:sentinel','preserved');const s=createPatternStore(storage);const n=s.act(1,{type:'notice.read',ids:['notice-1']});
 const tooLarge={...n,notices:Array.from({length:300},(_,i)=>({id:`notice-${i}`,title:'x'.repeat(10000),read:false,createdAt:'2026-10-29T00:00:00.000Z'}))};
 expect(()=>s.act(n.version,{type:'backup.restore',snapshot:tooLarge})).toThrow();expect(s.get()).toEqual(n);
 storage.setItem('prototype-workbench:patterns:v1','{broken');expect(()=>s.get()).toThrow();expect(()=>s.act(n.version,{type:'notice.read',ids:['notice-1']})).toThrow();
 const recovered=s.act(n.version,{type:'reset'});expect(recovered.records).toHaveLength(24);expect(storage.getItem('prototype-workbench:sentinel')).toBe('preserved');
});
it('PAT-DATA atomically registers form files, retains unfinished drafts and guards file deletion',()=>{
 const storage=memory();const s=createPatternStore(storage);const file={id:'form-file',name:'说明.txt',size:12,type:'text/plain'};
 let n=s.act(1,{type:'draft.save',draft:{id:'unfinished',title:'未填完',values:{...form,name:'',owner:'',category:'',date:'',classification:'special',reason:'',items:[{id:'empty-line',name:'',quantity:0,price:0}],files:[file]}}});
 expect(n.files).toEqual([file]);expect(createPatternStore(storage).get().drafts[0].values.name).toBe('');
 expect(()=>s.act(n.version,{type:'file.delete',id:file.id})).toThrow();
 const before=n;expect(()=>s.act(n.version,{type:'record.save',record:{...record,details:{...form,files:[{...file,name:'different.txt'}]}}})).toThrow();expect(s.get()).toEqual(before);
 n=s.act(n.version,{type:'record.save',record:{...record,details:{...form,files:[file]}}});const id=n.records.at(-1)!.id;
 n=s.act(n.version,{type:'draft.delete',id:'unfinished'});n=s.act(n.version,{type:'record.delete',ids:[id]});expect(()=>s.act(n.version,{type:'file.delete',id:file.id})).toThrow();
 n=s.act(n.version,{type:'record.purge',ids:[id]});n=s.act(n.version,{type:'file.delete',id:file.id});expect(n.files).toHaveLength(0);
});
it('PAT-DATA rejects double decisions, malformed metadata and partial imports',()=>{
 const s=createPatternStore();let n=s.act(1,{type:'task.decide',id:'task-1',decision:'approved',comment:''});expect(()=>s.act(n.version,{type:'task.decide',id:'task-1',decision:'rejected',comment:'重复'})).toThrow();
 const invalid:unknown[]=[{type:'record.import',records:[record,{...record,amount:-1}]},{type:'file.add',files:[{id:'bad',name:'fake.html',size:1,type:'application/pdf'}]},{type:'file.add',files:[{id:'bad',name:'nul\u0000.txt',size:1,type:'text/plain'}]},{type:'file.add',files:[{id:'bad',name:'large.txt',size:5242881,type:'text/plain'}]},{type:'record.status',ids:[n.records[0].id,'missing'],status:'active'},{type:'settings.save',settings:{systemName:'',notifications:true,timezone:'UTC'}},{type:'user.save',user:{...n.users[0],roleIds:['missing']}}];
 for(const action of invalid){expect(()=>s.act(n.version,action)).toThrow();expect(s.get()).toEqual(n);}
 n=s.act(n.version,{type:'record.import',records:[record]});expect(n.records).toHaveLength(25);
});
