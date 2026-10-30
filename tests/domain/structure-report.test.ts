import {expect,it} from 'vitest';
import {previewReport} from '../../src/core/structures/report';
import {createStructureStore} from '../../src/mocks/store';
it('STR-10 previews finite AND conditions with matching source rows',()=>{const s=createStructureStore().get();expect(previewReport(s.tasks,{fields:['name'],minimum:0,conditions:[{field:'name',operator:'contains',value:'核对'},{field:'owner',operator:'eq',value:'林青'},{field:'progress',operator:'gte',value:100}]}).map(t=>t.id)).toEqual(['t2']);expect(previewReport(s.tasks,{fields:['name'],minimum:0,conditions:[{field:'name',operator:'contains',value:''}]})).toEqual([]);});
