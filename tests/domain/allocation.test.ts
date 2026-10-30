import {it,expect} from 'vitest';
import {allocationSummary} from '../../src/core/allocation';
const items=[{id:'a',label:'事项甲',limit:80},{id:'b',label:'事项乙',limit:60}];
it('COMBO-001 validates row caps, exact decimal totals and unknown references',()=>{
 expect(allocationSummary(100,items,{a:60,b:40}).valid).toBe(true);
 expect(allocationSummary(100,items,{a:81}).errors.a).toBeTruthy();
 expect(allocationSummary(100,items,{a:81}).allocated).toBe(81);
 expect(allocationSummary(100,items,{a:70,b:40}).valid).toBe(false);
 expect(allocationSummary(100,items,{unknown:1}).valid).toBe(false);
 expect(allocationSummary(0.3,[{id:'a',label:'甲',limit:1},{id:'b',label:'乙',limit:1}],{a:0.1,b:0.2}).remaining).toBe(0);
 expect(allocationSummary(100,items,{a:1.001}).valid).toBe(false);
 expect(allocationSummary(Infinity,items,{}).valid).toBe(false);
 expect(allocationSummary(100,[items[0],items[0]],{}).valid).toBe(false);
});
