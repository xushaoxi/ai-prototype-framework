import {expect,it} from 'vitest';
import {columnChoices,normalizeColumnPreferences,resolveColumnWidths,moveColumn,setColumnFixed} from '../../src/core/columns';
import {assetModule} from '../../src/modules/assets/definition';
it('COL-001 偏好校验、必需名称、新增列和宽度边界',()=>{
  const choices=columnChoices(assetModule);
  expect(choices.map(c=>c.key)).not.toContain('notes');
  const defaults=normalizeColumnPreferences(assetModule,null);
  expect(defaults.visibleKeys).toContain('name');
  const saved={version:1,knownKeys:choices.map(c=>c.key).filter(k=>k!=='date'),visibleKeys:['amount','invalid'],widths:{name:9999,amount:-1,date:'bad'}};
  const result=normalizeColumnPreferences(assetModule,saved);
  expect(result.visibleKeys).toEqual(['name','amount','date']);
  expect(result.widths.name).toBe(600);expect(result.widths.amount).toBe(80);
  expect(normalizeColumnPreferences(assetModule,{version:2})).toEqual(defaults);
  const old={version:1,knownKeys:choices.map(c=>c.key),visibleKeys:choices.map(c=>c.key),widths:{name:251}};
  expect(normalizeColumnPreferences(assetModule,old).resizedKeys).toContain('name');
  expect(defaults.resizedKeys).toEqual([]);
});

it('COL-003 宽屏分配剩余空间时保留手动设置，容不下时保留横滚',()=>{
  const preferences=normalizeColumnPreferences(assetModule,null);
  preferences.widths.name=251;
  preferences.resizedKeys=['name'];
  const wide=resolveColumnWidths(assetModule,preferences,1600);
  expect(wide.widths.name).toBe(251);
  expect(Object.values(wide.widths).reduce((sum,width)=>sum+width,150)+wide.filler).toBe(1600);
  expect(wide.widths.code).toBeGreaterThan(preferences.widths.code);
  const narrow=resolveColumnWidths(assetModule,preferences,390);
  expect(narrow.widths.name).toBe(251);
  expect(narrow.filler).toBe(0);
  expect(Object.values(narrow.widths).reduce((sum,width)=>sum+width,150)).toBeGreaterThan(390);
});

it('COL-004 旧偏好迁移、固定分组与安全排序',()=>{
  const choices=columnChoices(assetModule);const keys=choices.map(c=>c.key);
  const old={version:1,knownKeys:keys,visibleKeys:['name','amount'],widths:{name:251}};
  const prefs=normalizeColumnPreferences(assetModule,old);
  expect(prefs.orderKeys).toEqual(keys);expect(prefs.fixedKeys).toEqual({});
  expect(prefs.visibleKeys).toEqual(['name','amount']);expect(prefs.widths.name).toBe(251);
  const left=setColumnFixed(prefs,'amount','left');
  expect(left.orderKeys[0]).toBe('amount');expect(left.fixedKeys.amount).toBe('left');
  const right=setColumnFixed(left,'status','right');
  expect(right.orderKeys.at(-1)).toBe('status');
  expect(moveColumn(right,'amount','name')).toEqual(right);
  const moved=moveColumn(right,'date','name');
  expect(moved.orderKeys.indexOf('date')).toBeLessThan(moved.orderKeys.indexOf('name'));
  const legacy={...old,orderKeys:['date','date','unknown','name'],fixedKeys:{date:'right',name:'left',unknown:'left',amount:'invalid'}};
  const normalized=normalizeColumnPreferences(assetModule,legacy);
  expect(normalized.orderKeys[0]).toBe('name');expect(normalized.orderKeys.at(-1)).toBe('date');
  expect(normalized.orderKeys).toHaveLength(keys.length);expect(normalized.fixedKeys).toEqual({date:'right',name:'left'});
});
