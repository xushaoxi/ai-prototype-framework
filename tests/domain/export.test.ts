import { describe, expect, it } from 'vitest';
import { escapeCsv, recordsToCsv } from '../../src/core/export-csv';
import { assetModule } from '../../src/modules/assets/definition';
import type { BusinessRecord } from '../../src/core/types';
const record:BusinessRecord={id:'test',code:'AST-2026-999',name:'测试,设备',status:'active',owner:'林晓',category:'电子设备',amount:100,date:'2026-10-22',notes:'私有备注',updatedAt:'2026-10-22T00:00:00.000Z',version:1};
describe('EXPORT-001 业务导出',()=>{
  it('导出可读的业务状态并排除非列表备注',()=>{
    const csv=recordsToCsv(assetModule,[record]);
    expect(csv).toContain('"状态"');
    expect(csv).toContain('"使用中"');
    expect(csv).toContain('"测试,设备"');
    expect(csv).not.toContain('私有备注');
  });
  it('公式前缀与引号换行按安全CSV转义',()=>{
    expect(escapeCsv('=1+1')).toBe('"\'=1+1"');
    expect(escapeCsv('  @SUM(A1)')).toBe('"\'  @SUM(A1)"');
    expect(escapeCsv('a"b\nc')).toBe('"a""b\nc"');
  });
});

it('COL-002 导出选定列及顺序，拒绝空列和非列表字段',()=>{
  const csv=recordsToCsv(assetModule,[record],['status','name']);
  expect(csv.split('\r\n')[0]).toBe('\uFEFF"状态","资产名称"');
  expect(csv).toContain('"使用中","测试,设备"');
  expect(csv).not.toContain('负责人');
  expect(()=>recordsToCsv(assetModule,[record],[])).toThrow();
  expect(()=>recordsToCsv(assetModule,[record],['notes'])).toThrow();
});
