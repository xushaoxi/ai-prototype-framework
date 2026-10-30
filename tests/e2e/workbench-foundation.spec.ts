import {test,expect} from './fixtures';

test('WB-001 任务目录、语义关联和维护工具归位',async({page})=>{
 await page.goto('/#/patterns');
 await expect(page.getByRole('heading',{name:'能力组合目录',exact:true})).toBeVisible();
 await expect(page.getByRole('heading',{name:'系统管理',exact:true})).toHaveCount(0);
 const compatibility=page.locator('.pattern-compatibility');await expect(compatibility).not.toHaveAttribute('open');
 await expect(page.getByRole('link',{name:'打开系统设置',exact:true})).toHaveCount(0);
 await page.getByRole('textbox',{name:'查找页面模板'}).fill('审批');
 await expect(page.locator('.pattern-grid>.ant-card')).toHaveCount(1);
 await expect(page.getByText('状态处理与恢复',{exact:true})).toBeVisible();
 await page.goto('/#/patterns/advanced-table');
 const variants=page.getByRole('navigation',{name:'相关结构变体'});
 await expect(variants.getByRole('link',{name:'树形表格',exact:true})).toBeVisible();
 await expect(variants.getByRole('link',{name:'审批工作台',exact:true})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'备份模板数据',exact:true})).toHaveCount(0);
 await page.getByText('演示数据工具',{exact:true}).click();
 await expect(page.getByRole('button',{name:'备份模板数据',exact:true})).toBeVisible();
 await page.screenshot({path:'/tmp/workbench-structure-desktop.png',animations:'disabled'});
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'/tmp/workbench-structure-mobile.png',animations:'disabled'});
});


test('COMBO-001 分配组件行上限、总量及修正反馈',async({page})=>{
 await page.goto('/#/component-demo');
 const allocation=page.locator('.allocation-editor');
 await allocation.getByLabel(/^事项甲/).fill('80');
 await allocation.getByLabel(/^事项乙/).fill('30');
 await expect(allocation.getByRole('alert')).toContainText('分配合计不能超过总量');
 await allocation.getByLabel(/^事项乙/).fill('20');
 await expect(allocation.getByRole('alert')).toHaveCount(0);
 await expect(allocation.getByRole('status')).toContainText('剩余：0.00');
 await page.getByRole('switch',{name:'禁用控件示例',exact:true}).click();
 await expect(allocation.getByLabel(/^事项甲/)).toBeDisabled();
});
