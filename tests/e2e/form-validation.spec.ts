import {test,expect} from './fixtures';

test('FORM-007 首次保存才校验，修正复查、计数与定位',async({page})=>{
  await page.goto('/#/assets');
  await page.getByRole('button',{name:'新增资产',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'新增资产',exact:true});
  const name=dialog.getByLabel('资产名称',{exact:true});
  await name.fill(' ');await name.press('Tab');
  await expect(dialog.locator('.ant-form-item-explain-error')).toHaveCount(0);
  await dialog.getByRole('button',{name:'保存',exact:true}).click();
  await expect(dialog.getByRole('status')).toContainText('4 项');
  await expect(name).toBeFocused();
  await name.fill('校验示例');
  await expect(dialog.getByRole('status')).toContainText('3 项');
  await expect(dialog.getByText('请输入资产名称',{exact:true})).toHaveCount(0);
  await name.fill(' ');
  await expect(dialog.getByRole('status')).toContainText('4 项');
  await name.fill('校验示例');
  await expect(dialog.getByText('请输入资产名称',{exact:true})).toHaveCount(0);
  await page.screenshot({path:'/tmp/form-validation-desktop.png',animations:'disabled'});
  await page.setViewportSize({width:390,height:844});
  await dialog.getByRole('button',{name:'定位第一个错误'}).click();
  await expect(dialog.getByLabel('负责人',{exact:true})).toBeFocused();
  await expect(dialog.getByLabel('负责人',{exact:true})).toBeInViewport();
  await expect(dialog.getByRole('button',{name:'保存',exact:true})).toBeInViewport();
  await page.screenshot({path:'/tmp/form-validation-mobile.png',animations:'disabled'});
});

for(const surface of ['modal','drawer','page'] as const){
  test(`FORM-007 ${surface}示例共享首次提交与复查`,async({page})=>{
    await page.goto(surface==='page'?'/#/form-demo/full/new':'/#/form-demo');
    if(surface!=='page'){
      if(surface==='drawer')await page.getByText('右侧抽屉',{exact:true}).click();
      await page.getByRole('button',{name:'新增示例资产',exact:true}).click();
    }
    const form=page.locator('form:visible');
    await form.getByLabel('资产名称',{exact:true}).fill(' ');
    await expect(form.locator('.ant-form-item-explain-error')).toHaveCount(0);
    await page.getByRole('button',{name:'保存示例',exact:true}).click();
    await expect(form.getByRole('status')).toContainText('4 项');
    await expect(form.getByLabel('资产名称',{exact:true})).toBeFocused();
    await form.getByLabel('资产名称',{exact:true}).fill('示例');
    await expect(form.getByRole('status')).toContainText('3 项');
  });
}

test('FORM-007 网络失败保留输入，重试保存中不能重复提交或关闭',async({page})=>{
  await page.goto('/#/assets');
  await page.evaluate(()=>{
    const original=window.fetch.bind(window);
    const state=window as Window&{saveAttempts?:number;releaseSave?:()=>void};
    state.saveAttempts=0;
    window.fetch=async(input,init)=>{
      if(String(input)==='/api/modules/assets/records'&&init?.method==='POST'){
        state.saveAttempts=(state.saveAttempts??0)+1;
        if(state.saveAttempts===1)throw new TypeError('模拟网络断开');
        await new Promise<void>(resolve=>{state.releaseSave=resolve;});
      }
      return original(input,init);
    };
  });
  await page.getByRole('button',{name:'新增资产',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'新增资产',exact:true});
  await dialog.getByLabel('资产名称',{exact:true}).fill('失败后重试示例');
  await dialog.getByLabel('负责人',{exact:true}).fill('测试人员');
  await dialog.getByLabel('资产金额',{exact:true}).fill('10');
  await dialog.getByLabel('登记日期',{exact:true}).fill('2026-10-29');
  await dialog.getByLabel('登记日期',{exact:true}).press('Tab');
  await dialog.getByRole('button',{name:'保存',exact:true}).click();
  await expect(page.getByText(/无法连接演示服务/)).toBeVisible();
  await expect(dialog.getByLabel('资产名称',{exact:true})).toHaveValue('失败后重试示例');
  await expect(dialog.getByLabel('负责人',{exact:true})).toHaveValue('测试人员');
  await dialog.getByRole('button',{name:'保存',exact:true}).click();
  await page.waitForFunction(()=>Boolean((window as Window&{releaseSave?:()=>void}).releaseSave));
  await expect(dialog.getByRole('button',{name:'取消',exact:true})).toBeDisabled();
  await expect(dialog.getByLabel('资产名称',{exact:true})).toBeDisabled();
  await page.keyboard.press('Escape');
  // Dispatch a second click even while the button is in loading state: the synchronous lock must hold.
  await dialog.getByRole('button',{name:'保存',exact:true}).dispatchEvent('click');
  await expect(dialog).toBeVisible();
  expect(await page.evaluate(()=>(window as Window&{saveAttempts?:number}).saveAttempts)).toBe(2);
  await page.evaluate(()=>(window as Window&{releaseSave?:()=>void}).releaseSave?.());
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('row').filter({hasText:'失败后重试示例'})).toHaveCount(1);
  await page.getByRole('textbox',{name:'关键词',exact:true}).fill('失败后重试示例');
  await page.getByRole('button',{name:'查询',exact:true}).click();
  await page.getByRole('row').filter({hasText:'失败后重试示例'}).getByRole('button',{name:'查看',exact:true}).click();
  const detail=page.getByRole('dialog');
  await expect(detail.getByRole('heading',{name:'失败后重试示例',exact:true})).toBeVisible();
  await detail.getByRole('button',{name:'关闭',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'关键词',exact:true})).toHaveValue('失败后重试示例');
  await expect(page.getByRole('tab',{name:'全部 1',exact:true})).toBeVisible();

});

test('FORM-007/API-400 接口字段错误计数、聚焦并允许修改复查',async({page})=>{
  await page.goto('/#/assets');
  await page.evaluate(()=>{
    const original=window.fetch.bind(window);let first=true;
    // Exercise the real MSW/store validation with a transport-side invalid field;
    // the UI's normal validation would otherwise prevent this request.
    window.fetch=async(input,init)=>{
      if(first&&String(input)==='/api/modules/assets/records'&&init?.method==='POST'){
        first=false;return original(input,{...init,body:JSON.stringify({...JSON.parse(String(init.body)),owner:''})});
      }
      return original(input,init);
    };
  });
  await page.getByRole('button',{name:'新增资产',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'新增资产',exact:true});
  await dialog.getByLabel('资产名称',{exact:true}).fill('接口字段校验示例');
  const owner=dialog.getByLabel('负责人',{exact:true});
  await owner.fill('原填写人');
  await dialog.getByLabel('资产金额',{exact:true}).fill('10');
  await dialog.getByLabel('登记日期',{exact:true}).fill('2026-10-29');
  await dialog.getByLabel('登记日期',{exact:true}).press('Tab');
  await dialog.getByRole('button',{name:'保存',exact:true}).click();
  await expect(dialog.getByRole('status')).toContainText('1 项');
  await expect(owner).toBeFocused();
  await expect(owner).toHaveValue('原填写人');
  await owner.fill('新填写人');
  await expect(dialog.getByRole('status')).toHaveCount(0);
  await dialog.getByRole('button',{name:'保存',exact:true}).click();
  await expect(dialog).toBeHidden();
});
