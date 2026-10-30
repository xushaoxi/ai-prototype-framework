import {test,expect} from './fixtures';

test('DG-005 rule deep link refresh and bidirectional example navigation use one guide tab',async({page})=>{
 await page.goto('/#/design-guide?rule=PAGE-003');
 const rule=page.locator('[data-rule-id="PAGE-003"]');await expect(rule).toBeFocused();
 await expect(rule.getByText('覆盖能力',{exact:true})).toBeVisible();await expect(rule.getByText('未覆盖',{exact:true})).toBeVisible();
 await page.reload();await expect(rule).toBeFocused();
 await rule.getByRole('link',{name:'查看PAGE-003示例：标准查询表格',exact:true}).click();await expect(page.getByRole('button',{name:'新增资产',exact:true})).toBeVisible();
 await page.goBack();await expect(rule).toBeFocused();await page.goForward();await expect(page.getByRole('button',{name:'新增资产',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'对照指南',exact:true}).click();
 const reference=page.getByRole('complementary',{name:'设计参考'});await reference.getByRole('combobox',{name:'定位设计规则',exact:true}).selectOption('COL-002');
 await expect(reference.locator('[data-rule-id="COL-002"]')).toBeFocused();
 await reference.locator('[data-rule-id="COL-002"]').getByRole('link',{name:'完整规则链接',exact:true}).click();await expect(page).toHaveURL(/design-guide\?rule=COL-002$/);
 await expect(page.getByRole('tabpanel').locator('[data-rule-id="COL-002"]')).toBeFocused();
 await expect(page.getByRole('tablist',{name:'已打开页面'}).getByRole('tab',{name:'设计指南',exact:true})).toHaveCount(1);
 await page.getByRole('navigation',{name:'主导航'}).getByRole('link',{name:'查询表格',exact:true}).click();await page.getByRole('tab',{name:'设计指南',exact:true}).click();await expect(page).toHaveURL(/rule=COL-002$/);await expect(page.getByRole('tabpanel').locator('[data-rule-id="COL-002"]')).toBeFocused();
});

test('DG-005 example applicable rules and unknown targets are safe on mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/#/structures/analysis');await page.getByRole('button',{name:'适用规则',exact:true}).click();
 await page.getByRole('navigation',{name:'适用设计规则',exact:true}).getByRole('link',{name:/METRIC-001/}).click();
 await expect(page.getByRole('tabpanel').locator('[data-rule-id="METRIC-001"]')).toBeFocused();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'/tmp/design-rule-mobile.png',animations:'disabled'});
 await page.goto('/#/design-guide?rule=UNKNOWN-999');await expect(page.getByRole('alert')).toContainText('未找到规则');
 await page.getByRole('combobox',{name:'定位设计规则',exact:true}).selectOption('THEME-001');await expect(page).toHaveURL(/rule=THEME-001$/);await page.reload();await expect(page.getByRole('tabpanel').locator('[data-rule-id="THEME-001"]')).toBeFocused();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
