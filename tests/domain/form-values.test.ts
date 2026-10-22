import { describe, expect, it } from 'vitest';
import dayjs from 'dayjs';
import { initialFormValues, serializeFormValues } from '../../src/core/form-values';
import { assetModule } from '../../src/modules/assets/definition';
import type { ModuleDefinition } from '../../src/core/types';
const definition:ModuleDefinition={...assetModule,fields:[...assetModule.fields,{key:'expiry',label:'保修到期日',type:'date',inForm:true}]};
describe('CONFIG-001 可配置表单日期',()=>{
  it('额外日期字段与标准日期一起序列化，而非泄漏日期对象给API',()=>{
    const input=serializeFormValues(definition,{name:'设备',owner:'林晓',category:'电子设备',amount:100,date:dayjs('2026-10-22'),expiry:dayjs('2027-10-22'),notes:''});
    expect(input).toMatchObject({date:'2026-10-22',expiry:'2027-10-22',amount:100});
  });
  it('可选日期清空可保存，已有日期可用于编辑',()=>{
    const input=serializeFormValues(definition,{expiry:null});
    expect(input).toMatchObject({expiry:''});
    const initial=initialFormValues(definition,{...assetModule.defaultValues,expiry:'2027-01-03'});
    expect(dayjs.isDayjs(initial.expiry)).toBe(true);
    expect((initial.expiry as ReturnType<typeof dayjs>).format('YYYY-MM-DD')).toBe('2027-01-03');
  });
});
