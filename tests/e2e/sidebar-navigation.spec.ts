import {test,expect} from './fixtures';
import {structureTitles} from '../../src/core/structures/types';
import {patternCatalog} from '../../src/app/patterns/catalog';

test('NAV-002 模板在分组平铺菜单中全部直达，当前页唯一高亮',async({page})=>{
 await page.goto('/#/assets');
 const nav=page.getByRole('navigation',{name:'主导航'});
 await expect(nav.getByRole('link')).toHaveText(['设计指南','组件与状态示例','使用指南','查询表格','表单录入',...Object.values(structureTitles),'布局与容器','能力组合目录']);
 const titles=await nav.locator('.nav-group-title').allTextContents();
 expect(titles).toEqual(['规范与基础','页面结构','组合与反馈']);
 await expect(nav.getByRole('link',{name:'查询表格',exact:true})).toHaveAttribute('href','#/assets');
 await nav.getByRole('link',{name:'能力组合目录',exact:true}).click();
 await page.locator('.pattern-compatibility summary').click();
 for(const pattern of patternCatalog)await expect(page.getByRole('link',{name:`打开${pattern.title}`,exact:true})).toHaveAttribute('href',`#/patterns/${pattern.id}`);
 await page.getByRole('link',{name:'打开草稿管理',exact:true}).click();
 await expect(page.getByRole('heading',{name:'草稿管理',exact:true})).toBeVisible();
 await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
 await expect(nav.getByRole('link',{name:'表单录入',exact:true})).toHaveAttribute('aria-current','page');
 await page.screenshot({path:'/tmp/sidebar-navigation-desktop.png',animations:'disabled'});
});

test('NAV-002 手机菜单独立滚动、直达并关闭抽屉',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/#/assets');
 await page.getByRole('button',{name:'展开导航',exact:true}).click();
 const nav=page.getByRole('navigation',{name:'主导航'});
 await nav.getByRole('link',{name:'能力组合目录',exact:true}).scrollIntoViewIfNeeded();
 expect(await nav.evaluate(element=>getComputedStyle(element).overflowY)).toBe('auto');
 await page.screenshot({path:'/tmp/sidebar-navigation-mobile.png',animations:'disabled'});
 await nav.getByRole('link',{name:'能力组合目录',exact:true}).click();
 await expect(page.getByRole('heading',{name:'能力组合目录',exact:true})).toBeVisible();
 await expect(nav).toBeHidden();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});


test('整体框架：面包屑与侧栏折叠保持页面和导航可用',async({page})=>{
 const errors:string[]=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/#/assets');
 await expect(page.locator('.topbar .ant-breadcrumb')).toContainText('页面结构');
 await page.getByRole('button',{name:'收起侧栏',exact:true}).click();
 await expect(page.locator('.sidebar')).toHaveCSS('width','72px');
 await page.getByRole('navigation',{name:'主导航'}).getByRole('link',{name:'设计指南',exact:true}).click();
 await expect(page.locator('.topbar .ant-breadcrumb')).toContainText('设计指南');
 await page.getByRole('button',{name:'展开侧栏',exact:true}).click();
 await expect(page.locator('.sidebar')).not.toHaveCSS('width','72px');
 await expect(page.getByRole('tablist',{name:'已打开页面'}).getByRole('tab',{name:'资产台账',exact:true})).toBeVisible();
 await page.screenshot({path:'/tmp/framework-shell-desktop.png',animations:'disabled'});
 expect(errors).toEqual([]);
});
