import {expect,it} from 'vitest';
import {widgetRows} from '../../src/core/structures/widgets';
import {createStructureStore} from '../../src/mocks/store';
it('STR-14 widget scope and limit preserve source order and facts',()=>{const tasks=createStructureStore().get().tasks;expect(widgetRows(tasks,{id:'w',kind:'tasks',width:1,scope:'done',limit:1}).map(t=>t.id)).toEqual(['t2']);expect(widgetRows(tasks,{id:'w',kind:'tasks',width:1,scope:'pending',limit:1}).map(t=>t.id)).toEqual(['t1']);expect(tasks).toHaveLength(3);});
