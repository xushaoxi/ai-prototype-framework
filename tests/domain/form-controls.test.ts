import {describe,it,expect} from 'vitest';
import dayjs from 'dayjs';
import {assetModule} from '../../src/modules/assets/definition';
import {createStore,STORAGE_KEY} from '../../src/mocks/store';
import {initialFormValues,serializeFormValues} from '../../src/core/form-values';
import type {FieldDefinition,ModuleDefinition,SaveInput} from '../../src/core/types';

const options=[{label:'甲',value:'a'},{label:'乙',value:'b'}];
const fields:FieldDefinition[]=[
  {key:'controlRadio',label:'单选',type:'radio',options},
  {key:'controlChecks',label:'复选',type:'checkbox',options},
  {key:'controlTags',label:'多选',type:'multiselect',options},
  {key:'controlTime',label:'时间',type:'time'},
  {key:'controlRange',label:'日期范围',type:'dateRange'},
  {key:'controlCount',label:'数量',type:'number',min:0,precision:0},
  {key:'controlMoney',label:'金额示例',type:'number',min:0,precision:2},
];
const input={name:'控件验证设备',owner:'验证人',category:'电子设备',amount:100,date:'2026-10-29'};
class MemoryStorage implements Storage {
  values=new Map<string,string>();
  get length(){return this.values.size;}
  clear(){this.values.clear();}
  getItem(key:string){return this.values.get(key)??null;}
  key(index:number){return [...this.values.keys()][index]??null;}
  removeItem(key:string){this.values.delete(key);}
  setItem(key:string,value:string){this.values.set(key,value);}
}

describe('AST-015/FORM-006 控件值与业务存储一致',()=>{
  it('新增表单不推断金额0或日期今天',()=>{
    const initial=initialFormValues(assetModule);
    expect(initial.amount).toBeUndefined();
    expect(initial.date).toBeUndefined();
  });
  it('时间、日期范围与多选序列化为明确的字符串或字符串数组',()=>{
    const module:ModuleDefinition={...assetModule,fields:[...assetModule.fields,...fields]};
    const value=serializeFormValues(module,{controlTime:dayjs('2000-01-01T09:30'),controlRange:[dayjs('2026-10-29'),dayjs('2026-11-01')],controlChecks:['a','b'],controlTags:['b']});
    expect(value).toMatchObject({controlTime:'09:30',controlRange:['2026-10-29','2026-11-01'],controlChecks:['a','b'],controlTags:['b']});
    const initial=initialFormValues(module,value);
    expect((initial.controlTime as ReturnType<typeof dayjs>).format('HH:mm')).toBe('09:30');
    expect((initial.controlRange as ReturnType<typeof dayjs>[])[1].format('YYYY-MM-DD')).toBe('2026-11-01');
    expect(serializeFormValues(module,{controlChecks:[],controlTime:null,controlRange:null})).toMatchObject({controlChecks:[],controlTime:'',controlRange:[]});
    expect(()=>serializeFormValues(module,{controlChecks:Array<string>(1)})).toThrow();
  });
  it('校验选项、数组类型、时间、日期顺序和精度，支持备份和旧记录',()=>{
    const previous=assetModule.fields;
    assetModule.fields=[...previous,...fields];
    try{
      const store=createStore();
      const values={controlRadio:'a',controlChecks:['a'],controlTags:['b'],controlTime:'09:30',controlRange:['2026-10-29','2026-11-01'],controlCount:2,controlMoney:12.34};
      const record=store.create('assets',{...input,...values});
      values.controlChecks.push('b');
      expect(store.get('assets',record.id).controlChecks).toEqual(['a']);
      const changed=store.update('assets',record.id,{version:1,controlChecks:['b'],controlTime:'18:00'});
      const backup=store.exportData();const restored=createStore();restored.importData(backup);
      expect(restored.get('assets',record.id)).toEqual(changed);
      expect(restored.get('assets','asset-1').controlChecks).toBeUndefined();
      const before=store.exportData();
      for(const invalid of [{controlChecks:'a'},{controlChecks:['bad']},{controlChecks:['a','a']},{controlChecks:Array<string>(1)},{controlRange:Array<string>(2)},{controlTags:[1]},{controlRadio:['a']},{controlTime:'24:00'},{controlTime:'09:70'},{controlRange:['2026-11-01','2026-10-29']},{controlRange:['2026-02-30','2026-11-01']},{controlRange:['2026-10-29']},{controlCount:1.5},{controlMoney:1.234},{controlCount:[]}]){
        expect(()=>store.create('assets',{...input,...invalid} as unknown as SaveInput)).toThrow();
      }
      expect(store.exportData()).toBe(before);
      const invalidBackup=JSON.parse(backup) as {records:Record<string,Record<string,unknown>[]>};
      invalidBackup.records.assets.find(value=>value.id===record.id)!.controlTime='99:00';
      expect(()=>store.importData(JSON.stringify(invalidBackup))).toThrow();
      expect(store.exportData()).toBe(before);
    }finally{assetModule.fields=previous;}
  });
  it('旧版金额精度在加载、备份恢复和未改金额的编辑中保持兼容',()=>{
    const previous=assetModule.fields;
    let backup='';let id='';
    try{
      assetModule.fields=previous.map(field=>field.key==='amount'?{...field,precision:undefined}:field);
      const old=createStore();id=old.create('assets',{...input,amount:12.345}).id;backup=old.exportData();
    }finally{assetModule.fields=previous;}
    const storage=new MemoryStorage();storage.setItem(STORAGE_KEY,backup);
    const store=createStore(storage);
    expect(store.get('assets',id).amount).toBe(12.345);
    expect(store.update('assets',id,{version:1,name:'旧金额保留'}).amount).toBe(12.345);
    expect(()=>store.update('assets',id,{version:2,amount:13.456})).toThrow();
    expect(()=>store.create('assets',{...input,amount:12.345})).toThrow();
    const restored=createStore();restored.importData(backup);
    expect(restored.get('assets',id).amount).toBe(12.345);
  });
});
