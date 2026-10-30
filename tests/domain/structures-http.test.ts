import {afterAll,beforeAll,describe,it,expect} from 'vitest';
import {setupServer} from 'msw/node';
import {createStructureStore} from '../../src/mocks/store';
import {createStructureHandlers} from '../../src/mocks/handlers';
const data=createStructureStore();const server=setupServer(...createStructureHandlers(data));
beforeAll(()=>server.listen({onUnhandledRequest:'error'}));afterAll(()=>server.close());
describe('STR-HTTP',()=>{it('rejects stale versions and malformed actions without mutation',async()=>{
 const before=data.get();
 const stale=await fetch('http://localhost/api/structures/actions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({version:0,action:{type:'stage.advance'}})});expect(stale.status).toBe(409);
 const invalid=await fetch('http://localhost/api/structures/actions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({version:1,action:{type:'stage.advance',unexpected:true}})});expect(invalid.status).toBe(400);expect(data.get()).toEqual(before);
 const ok=await fetch('http://localhost/api/structures/actions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({version:1,action:{type:'stage.advance'}})});expect(ok.status).toBe(200);expect((await ok.json()).stage).toBe(1);
});});
