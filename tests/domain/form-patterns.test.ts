import {describe,it,expect} from 'vitest';
import {attachmentError,formSignature,lineTotal,emptyForm} from '../../src/app/patterns/form-pattern-values';
describe('PAT-FORM 附件与表单值',()=>{
 it('只接收明确允许的MIME且限制大小和数量',()=>{
  expect(attachmentError({name:'a.pdf',type:'application/pdf',size:100},0)).toBe('');
  expect(attachmentError({name:'a.pdf',type:'text/html',size:100},0)).toContain('类型');
  expect(attachmentError({name:'a.html',type:'application/pdf',size:100},0)).toContain('扩展名');
  expect(attachmentError({name:'a.pdf',type:'application/pdf',size:5*1024*1024+1},0)).toContain('5 MB');
  expect(attachmentError({name:'a.pdf',type:'application/pdf',size:10},5)).toContain('5 个');
 });
 it('计算明细合计并按分币取整',()=>expect(lineTotal([{id:'1',name:'物料',quantity:3,price:0.1}])).toBe(0.3));
 it('忽略多选次序但保留明细次序以检测实际丢失内容',()=>{
  const a={...emptyForm(),tags:['review','urgent']};
  expect(formSignature(a)).toBe(formSignature({...a,tags:['urgent','review']}));
  expect(formSignature(a)).not.toBe(formSignature({...a,name:'变更'}));
 });
});
