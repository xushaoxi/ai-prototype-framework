import {test,expect} from './fixtures';

test('FORM-009 明细字段提交报错后修改即时清除',async({page})=>{
 await page.goto('/#/patterns/detail-form');
 await page.getByRole('button',{name:'添加明细',exact:true}).click();
 await page.getByRole('button',{name:'提交记录',exact:true}).click();
 await expect(page.getByText('请输入明细名称',{exact:true})).toBeVisible();
 await page.getByLabel('明细名称 1',{exact:true}).fill('修正后的明细');
 await expect(page.getByText('请输入明细名称',{exact:true})).toHaveCount(0);
 await expect(page.getByText('请输入申请名称',{exact:true})).toBeVisible();
 // A newly added sibling has never failed and must retain submit-first validation.
 await page.getByRole('button',{name:'添加明细',exact:true}).click();
 await page.getByLabel('明细名称 1',{exact:true}).fill('');
 await expect(page.getByText('请输入明细名称',{exact:true})).toHaveCount(1);
 await expect(page.getByLabel('明细名称 2',{exact:true})).not.toHaveAttribute('aria-invalid','true');
});
