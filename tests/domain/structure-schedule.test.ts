import {it,expect} from 'vitest';
import {taskTree} from '../../src/core/structures/schedule';
import {createStructureStore} from '../../src/mocks/store';
it('STR-12 builds one finite WBS tree and keeps filtered orphans visible',()=>{const tasks=createStructureStore().get().tasks;const tree=taskTree(tasks);expect(tree.map(t=>t.id)).toEqual(['t1']);expect(tree[0].children?.map(t=>t.id)).toEqual(['t2','t3']);expect(taskTree(tasks.slice(1)).map(t=>t.id)).toEqual(['t2','t3']);expect(tasks[0]).not.toHaveProperty('children');});
