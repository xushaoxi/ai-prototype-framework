import { describe, expect, it } from 'vitest';
import { assetModule } from '../../src/modules/assets/definition';
import { createStore } from '../../src/mocks/store';
const input={name:'配置验证设备',owner:'配置验证人',category:'电子设备',amount:10,date:'2026-10-22'};
describe('CONFIG-002 声明的模块配置必须实际生效',()=>{
  it('额外可搜索字段参与关键词查询',()=>{
    const fields=assetModule.fields;
    try {
      assetModule.fields=[...fields,{key:'contactPhone',label:'联系电话',type:'text',searchable:true}];
      const store=createStore();
      const record=store.create('assets',{...input,contactPhone:'13800138000'});
      expect(store.list('assets',{keyword:'13800138000'}).items.map(item=>item.id)).toEqual([record.id]);
    }finally{assetModule.fields=fields;}
  });
  it('重排状态展示顺序不会改变初始草稿删除规则',()=>{
    const statuses=assetModule.statuses;
    try {
      assetModule.statuses=[statuses[1],statuses[0],statuses[2]];
      const store=createStore();const record=store.create('assets',input);
      expect(()=>store.remove('assets',record.id)).not.toThrow();
      expect(store.list('assets',{keyword:'配置验证设备'}).total).toBe(0);
    }finally{assetModule.statuses=statuses;}
  });
});
