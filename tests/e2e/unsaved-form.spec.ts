import {test,expect} from './fixtures';

test('FORM-008 修改后取消需确认，恢复初值直接退出',async({page})=>{
 await page.goto('/#/assets');await page.getByRole('button',{name:'新增资产',exact:true}).click();
 const form=page.getByRole('dialog',{name:'新增资产',exact:true});
 await form.getByLabel('资产名称',{exact:true}).fill('未保存内容');
 await form.getByRole('button',{name:'取消',exact:true}).click();
 const confirm=page.getByRole('dialog',{name:'放弃未保存的修改？',exact:true});
 await expect(confirm).toBeVisible();await confirm.getByRole('button',{name:'继续编辑',exact:true}).click();
 await expect(form.getByLabel('资产名称',{exact:true})).toHaveValue('未保存内容');
 await form.getByLabel('资产名称',{exact:true}).fill('');
 await form.getByRole('button',{name:'取消',exact:true}).click();await expect(form).toBeHidden();
});

test('FORM-008 完整页面切换保留，后台标签关闭确认，浏览器退出提示',async({page})=>{
 await page.goto('/#/form-demo/full/new');
 await page.getByLabel('资产名称',{exact:true}).fill('保留的示例');
 await page.getByRole('navigation',{name:'主导航'}).getByRole('link',{name:'查询表格',exact:true}).click();
 await page.getByRole('tab',{name:'新增示例资产',exact:true}).click();
 await expect(page.getByLabel('资产名称',{exact:true})).toHaveValue('保留的示例');
 await page.getByRole('navigation',{name:'主导航'}).getByRole('link',{name:'查询表格',exact:true}).click();
 await page.getByRole('button',{name:'关闭新增示例资产标签页',exact:true}).click();
 const confirm=page.getByRole('dialog',{name:'放弃未保存的修改？',exact:true});
 await expect(confirm).toBeVisible();await confirm.getByRole('button',{name:'继续编辑',exact:true}).click();
 const native=page.waitForEvent('dialog');const reload=page.reload();
 const warning=await native;expect(warning.type()).toBe('beforeunload');await warning.accept();await reload;
});

for(const surface of ['弹窗','右侧抽屉','完整页面'])test(`FORM-008 ${surface}示例放弃退出`,async({page})=>{
 await page.goto('/#/form-demo');await page.getByText(surface,{exact:true}).first().click();
 await page.getByRole('button',{name:'新增示例资产',exact:true}).click();
 await page.getByLabel('资产名称',{exact:true}).fill('放弃内容');
 await page.getByRole('button',{name:'取消',exact:true}).click();
 const confirm=page.getByRole('dialog',{name:'放弃未保存的修改？',exact:true});
 await confirm.getByRole('button',{name:'放弃修改',exact:true}).click();
 await expect(page.getByLabel('资产名称',{exact:true})).toHaveCount(0);
});

test('FORM-008 保存期间不能关闭后台功能标签',async({page})=>{
 await page.goto('/#/assets');
 await page.evaluate(()=>{const original=window.fetch.bind(window);window.fetch=async(input,init)=>{if(String(input)==='/api/modules/assets/records'&&init?.method==='POST')await new Promise<void>(resolve=>{(window as Window&{releaseSave?:()=>void}).releaseSave=resolve;});return original(input,init);};});
 await page.getByRole('button',{name:'新增资产',exact:true}).click();
 const form=page.getByRole('dialog',{name:'新增资产',exact:true});
 await form.getByLabel('资产名称',{exact:true}).fill('后台保存保护');
 await form.getByLabel('负责人',{exact:true}).fill('演示人员');
 await form.getByLabel('资产金额',{exact:true}).fill('10');
 await form.getByLabel('登记日期',{exact:true}).fill('2026-10-29');await form.getByLabel('登记日期',{exact:true}).press('Tab');
 await form.getByRole('button',{name:'保存',exact:true}).click();
 await page.waitForFunction(()=>Boolean((window as Window&{releaseSave?:()=>void}).releaseSave));
 await page.evaluate(()=>{location.hash='#/vendors';});
 await expect(form).toBeHidden();
 await page.getByRole('button',{name:'关闭资产台账标签页',exact:true}).click();
 await expect(page.getByRole('tab',{name:'资产台账',exact:true})).toHaveCount(1);
 await page.evaluate(()=>(window as Window&{releaseSave?:()=>void}).releaseSave?.());
 await page.getByRole('tab',{name:'资产台账',exact:true}).click();
 await expect(page.getByRole('row').filter({hasText:'后台保存保护'})).toHaveCount(1);
 await page.getByRole('button',{name:'关闭资产台账标签页',exact:true}).click();
 await expect(page.getByRole('tab',{name:'资产台账',exact:true})).toHaveCount(0);
});
