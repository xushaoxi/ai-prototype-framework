import {describe,it,expect} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {App,Form,Input} from 'antd';
import {SharedForm} from '../../src/core/ui/SharedForm';
import {useSharedForm} from '../../src/core/ui/useSharedForm';
describe('FORM-009 heterogeneous content',()=>{
 it('renders a consumer without procurement fields',()=>{
  function Registration(){
   const state=useSharedForm({initial:{session:'秋季培训',participants:['林青']},signature:JSON.stringify});
   return createElement(SharedForm<{session:string;participants:string[]}>,{state},createElement(Form.Item,{name:'session',label:'培训场次'},createElement(Input)));
  }
  const html=renderToStaticMarkup(createElement(App,null,createElement(Registration)));
  expect(html).toContain('秋季培训');expect(html).not.toContain('申请金额');
 });
});
