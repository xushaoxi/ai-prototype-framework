import {it,expect} from 'vitest';
import {parseCsv,previewImport,patternCsv} from '../../src/core/patterns/import';
it('CSV supports quoted separators/newlines and rejects malformed quotes',()=>{
 expect(parseCsv('\ufeff名称,备注\r\n"办公,设备","跨\n行"')).toEqual([['名称','备注'],['办公,设备','跨\n行']]);
 expect(()=>parseCsv('名称\n"未闭合')).toThrow();
});
it('mapping validates each row before any write; zero amount is valid',()=>{
 const map={name:'名称',owner:'负责人',category:'类别',amount:'金额',date:'日期'};
 const rows=parseCsv('名称,负责人,类别,金额,日期\n设备,张三,其他,0,2026-10-29\n错误,张三,其他,-1,2026-02-30');
 const result=previewImport(rows,map);
 expect(result[0].record?.amount).toBe(0);expect(result[0].errors).toEqual([]);
 expect(result[1].errors).toHaveLength(2);
 expect(()=>previewImport([['名称','名称']],map)).toThrow();
});

it('exports protect formulas after leading whitespace',()=>{
 const csv=patternCsv([{id:'x',code:'X',name:' =2+2',owner:'a',category:'b',amount:0,date:'2026-10-29',status:'draft',notes:'',tags:[]}]);
 expect(csv).toContain(`"' =2+2"`);
});
