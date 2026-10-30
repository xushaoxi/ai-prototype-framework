import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { setupServer } from 'msw/node';
import { createPatternStore } from '../../src/mocks/store';
import { patternApi, setScenario } from '../../src/core/api';
import { createPatternHandlers } from '../../src/mocks/handlers';
const data=createPatternStore();const server=setupServer(...createPatternHandlers(data));
beforeAll(()=>server.listen({onUnhandledRequest:'error'}));afterAll(()=>server.close());
const post=(value:unknown)=>fetch('http://localhost/api/patterns/actions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});
describe('PAT-HTTP validated patterns API',()=>{it('reads and mutates the domain through HTTP with conflicts and validation errors',async()=>{const r=await fetch('http://localhost/api/patterns/snapshot');expect(r.status).toBe(200);const s=data.get();expect((await post({version:s.version,action:{type:'notice.read',ids:[s.notices[0].id]}})).status).toBe(200);expect((await post({version:s.version,action:{type:'reset'}})).status).toBe(409);expect((await post({version:data.get().version,action:{type:'file.add',files:[{}]}})).status).toBe(400);expect((await post({version:1,action:{type:'unknown'}})).status).toBe(400);});});
it('PAT-HTTP rejects malformed JSON/extra fields, preserves failed batches and supports scenarios/recovery',async()=>{
 const start=data.get();const json=await fetch('http://localhost/api/patterns/actions',{method:'POST',body:'{broken'});expect(json.status).toBe(400);expect(await json.json()).toMatchObject({code:'INVALID_JSON'});
 expect((await post({version:start.version,action:{type:'reset'},extra:true})).status).toBe(400);
 const active=start.records.find(r=>r.status==='active')!,draft=start.records.find(r=>r.status==='draft')!;
 expect((await post({version:start.version,action:{type:'record.delete',ids:[draft.id,active.id]}})).status).toBe(409);expect(data.get()).toEqual(start);
 const error=await fetch('http://localhost/api/patterns/snapshot',{headers:{'x-demo-scenario':'error'}});expect(error.status).toBe(503);
 const recovery=await fetch('http://localhost/api/patterns/actions',{method:'POST',headers:{'Content-Type':'application/json','x-demo-scenario':'error'},body:JSON.stringify({version:start.version,action:{type:'reset'}})});expect(recovery.status).toBe(200);
 const before=Date.now();const slow=await fetch('http://localhost/api/patterns/snapshot',{headers:{'x-demo-scenario':'slow'}});expect(slow.status).toBe(200);expect(Date.now()-before).toBeGreaterThanOrEqual(650);
});

it('PAT-HTTP core patternApi uses the same handlers and receives business errors',async()=>{
 setScenario('normal');const snapshot=await patternApi.get();const next=await patternApi.act(snapshot.version,{type:'settings.save',settings:{...snapshot.settings,systemName:'HTTP集成演示'}});expect((await patternApi.get()).settings.systemName).toBe('HTTP集成演示');await expect(patternApi.act(snapshot.version,{type:'reset'})).rejects.toMatchObject({code:'VERSION_CONFLICT',status:409});expect(next.version).toBe(snapshot.version+1);
});
