import {test,expect} from './fixtures';

test('指南说明完整流程，区分原型、真实验收与分域备份',async({page})=>{
 await page.goto('/#/guide');
 await expect(page.getByRole('heading',{name:'使用指南',exact:true})).toBeVisible();
 await expect(page.locator('main')).toContainText('最小澄清与分级确认');
 await expect(page.locator('main')).toContainText('最小研发交付契约');
 await expect(page.locator('main')).toContainText('首个业务试点尚未确认');
 await page.getByText('我的修改保存在哪里？',{exact:true}).click();
 await expect(page.locator('main')).toContainText('复杂结构不包含在这两种备份中');
 await page.getByText('原型测试通过就代表正式系统验收通过吗？',{exact:true}).click();
 await expect(page.locator('main')).toContainText('不代表。正式系统须在获授权的真实测试环境中');
 await page.getByRole('button',{name:'演示设置',exact:true}).click();
 await expect(page.getByText('仅备份已注册台账及其活动记录，不包含能力组合、复杂结构、界面偏好或未保存输入。可在兼容版本中恢复。',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:/重置演示数据/}).click();
 await expect(page.getByText(/当前浏览器中的已注册台账及其活动记录将恢复/)).toBeVisible();
 await page.getByRole('button',{name:'取消',exact:true}).click();
});
