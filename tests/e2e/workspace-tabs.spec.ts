import {expect,test} from './fixtures';

test('NAV-001 功能标签保留两模块查询、分页、滚动并支持关闭重开',async({page})=>{
  await page.setViewportSize({width:1440,height:600});
  await page.goto('/');
  const tabs=page.getByRole('tablist',{name:'已打开页面'});
  await expect(tabs.getByRole('tab',{name:'资产台账',exact:true})).toBeVisible();
  await expect(page.locator('.ledger-primary > .page-heading')).toHaveCount(0);
  await expect(page.locator('.design-reference-toolbar')).toHaveCount(0);
  await expect(page.locator('.topbar').getByRole('button',{name:'对照指南',exact:true})).toBeVisible();
  await expect(page.getByRole('tab',{name:'全部 36',exact:true})).toBeVisible();
  // Open the variant once, then use fixed workspace tabs for scroll-preserving switches.
  await page.getByRole('link',{name:'供应商台账',exact:true}).click();
  await tabs.getByRole('tab',{name:'资产台账',exact:true}).click();
  await page.getByRole('region',{name:'资产台账列表',exact:true}).getByTitle('2',{exact:true}).click();
  await page.getByRole('textbox',{name:'关键词',exact:true}).fill('尚未提交的资产词');
  await page.getByRole('button',{name:'更多筛选',exact:true}).click();
  await page.evaluate(()=>window.scrollTo(0,300));
  const scroll=await page.evaluate(()=>scrollY);
  expect(scroll).toBeGreaterThan(0);
  await tabs.getByRole('tab',{name:'供应商台账',exact:true}).click();
  await expect(tabs.getByRole('tab')).toHaveCount(2);
  await page.getByRole('textbox',{name:'关键词',exact:true}).fill('VEN-2026-001');
  await page.getByRole('button',{name:'查询',exact:true}).click();
  await expect(page.getByRole('tab',{name:'全部 1',exact:true})).toBeVisible();
  await tabs.getByRole('tab',{name:'资产台账',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'关键词',exact:true})).toHaveValue('尚未提交的资产词');
  await expect(page.getByRole('region',{name:'资产台账列表',exact:true}).getByTitle('2',{exact:true})).toHaveClass(/ant-pagination-item-active/);
  await expect(page.getByRole('button',{name:'收起筛选',exact:true})).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBeCloseTo(scroll,0);
  await tabs.getByRole('tab',{name:'资产台账',exact:true}).click();
  await expect(tabs.getByRole('tab')).toHaveCount(2);
  await tabs.getByRole('tab',{name:'供应商台账',exact:true}).click();
  await expect(page.getByRole('tab',{name:'全部 1',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'关闭供应商台账标签页',exact:true}).click();
  await expect(tabs.getByRole('tab',{name:'资产台账',exact:true})).toHaveAttribute('aria-selected','true');
  await page.getByRole('link',{name:/供应商台账/}).click();
  await expect(page.getByRole('textbox',{name:'关键词',exact:true})).toHaveValue('');
  await expect(page.getByRole('tab',{name:'全部 12',exact:true})).toBeVisible();
  await page.setViewportSize({width:1440,height:1000});
  await page.screenshot({path:'test-results/workspace-tabs-desktop.png',animations:'disabled',fullPage:true});
});

test('NAV-001 手机页签键盘切换、关闭和布局不溢出',async({page})=>{
  await page.goto('/');
  await page.getByRole('link',{name:/供应商台账/}).click();
  await page.getByRole('link',{name:'设计指南',exact:true}).click();
  await page.setViewportSize({width:390,height:844});
  const tabs=page.getByRole('tablist',{name:'已打开页面'});
  await tabs.getByRole('tab',{name:'设计指南',exact:true}).press('ArrowLeft');
  await expect(tabs.getByRole('tab',{name:'供应商台账',exact:true})).toHaveAttribute('aria-selected','true');
  await tabs.getByRole('tab',{name:'供应商台账',exact:true}).press('Delete');
  await expect(tabs.getByRole('tab',{name:'资产台账',exact:true})).toHaveAttribute('aria-selected','true');
  await expect(page.getByRole('button',{name:'新增资产',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/workspace-tabs-mobile.png',animations:'disabled',fullPage:true});
});

test('NAV-001 后台页弹层隐藏，返回保留未保存表单',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'新增资产',exact:true}).click();
  await page.getByRole('dialog').getByLabel('资产名称',{exact:true}).fill('尚未保存的名称');
  await page.evaluate(()=>{location.hash='/vendors';});
  await expect(page.getByRole('tab',{name:'供应商台账',exact:true})).toHaveAttribute('aria-selected','true');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('tablist',{name:'已打开页面'}).getByRole('tab',{name:'资产台账',exact:true}).click();
  await expect(page.getByRole('dialog').getByLabel('资产名称',{exact:true})).toHaveValue('尚未保存的名称');
  await page.getByRole('dialog').getByRole('button',{name:'取消',exact:true}).click();
});

test('NAV-001 失活页面的危险操作确认框必须关闭',async({page})=>{
  await page.goto('/');
  await page.getByRole('tab',{name:'草稿 8',exact:true}).click();
  await page.getByRole('row').filter({hasText:'AST-2026-001'}).getByRole('button',{name:'更多操作',exact:true}).click();
  await page.getByRole('menuitem',{name:'删除',exact:true}).click();
  await expect(page.getByRole('button',{name:'确认删除',exact:true})).toBeVisible();
  await page.evaluate(()=>{location.hash='/vendors';});
  await expect(page.getByRole('tab',{name:'供应商台账',exact:true})).toHaveAttribute('aria-selected','true');
  await expect(page.getByRole('button',{name:'确认删除',exact:true})).toHaveCount(0);
  await page.getByRole('tablist',{name:'已打开页面'}).getByRole('tab',{name:'资产台账',exact:true}).click();
  await expect(page.getByRole('row').filter({hasText:'AST-2026-001'})).toBeVisible();
});
