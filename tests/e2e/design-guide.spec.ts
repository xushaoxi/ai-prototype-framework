import { test, expect } from './fixtures';

test('DG-001 指南直达、完整目录和已确认规则', async ({page}) => {
  await page.goto('/#/design-guide');
  await expect(page.getByRole('heading', {name:'设计指南', exact:true})).toBeVisible();
  const chapters=page.getByRole('navigation', {name:'设计章节'});
  await expect(chapters.getByRole('button')).toHaveCount(16);
  await expect(page.getByRole('heading',{name:'默认台账以日常查找和处理记录为主',exact:true})).toBeVisible();
  for(const name of ['03 页面类型与布局','06 查询与筛选','07 列表与表格']){
    await chapters.getByRole('button',{name,exact:true}).click();
    await expect(page.getByRole('heading',{name:'标准查询表格 V1',exact:true})).toBeVisible();
  }
  for(const name of ['09 表单与编辑','11 弹层与任务容器']){
    await chapters.getByRole('button',{name,exact:true}).click();
    await expect(page.getByRole('heading',{name:'新增与编辑的容器选择',exact:true})).toBeVisible();
  }
  await chapters.getByRole('button', {name:'08 数字指标与可视化'}).click();
  await expect(page.getByRole('heading', {name:'查询列表页什么时候需要数字卡片', exact:true})).toBeVisible();
  await expect(page.getByText('决策：已确认', {exact:true})).toBeVisible();
  await page.getByRole('link', {name:'查询表格',exact:true}).click();
  await page.getByRole('link', {name:'设计指南', exact:true}).click();
  await page.reload();
  await expect(page.getByRole('heading', {name:'设计指南', exact:true})).toBeVisible();
  await page.screenshot({path:'test-results/design-guide-desktop.png', fullPage:true, animations:'disabled'});
});

test('DG-002 同屏参考不丢失查询、支持实际详情操作', async ({page}) => {
  await page.goto('/');
  await page.getByRole('textbox',{name:'关键词',exact:true}).fill('AST-2026-001');
  await page.getByRole('button', {name:'查询', exact:true}).click();
  await expect(page.getByRole('row').filter({hasText:'AST-2026-001'})).toBeVisible();
  await page.getByRole('button', {name:'对照指南', exact:true}).click();
  const reference=page.getByRole('complementary', {name:'设计参考'});
  await expect(reference).toBeVisible();
  await reference.getByRole('combobox', {name:'选择设计章节'}).selectOption('08');
  await expect(reference.getByRole('heading', {name:'查询列表页什么时候需要数字卡片'})).toBeVisible();
  await expect(page.getByRole('textbox',{name:'关键词',exact:true})).toHaveValue('AST-2026-001');
  await page.getByRole('row').filter({hasText:'AST-2026-001'}).getByRole('button', {name:'查看', exact:true}).click();
  await expect(page.getByRole('dialog').getByText('活动记录', {exact:true})).toBeVisible();
  await page.getByRole('dialog').getByRole('button', {name:'关闭', exact:true}).click();
  await page.getByRole('row').filter({hasText:'AST-2026-001'}).getByRole('button', {name:'编辑',exact:true}).click();
  await expect(page.getByRole('dialog').getByLabel('资产名称', {exact:true})).toHaveValue('MacBook Pro 研发工作站');
  await page.getByRole('dialog').getByRole('button', {name:'取消',exact:true}).click();
  await expect(reference).toBeVisible();
  await expect(page.getByRole('textbox',{name:'关键词',exact:true})).toHaveValue('AST-2026-001');
  await page.screenshot({path:'test-results/design-reference-desktop.png', fullPage:true, animations:'disabled'});
  await page.setViewportSize({width:1000,height:900});
  const narrow=page.getByRole('dialog', {name:'设计参考'});
  await expect(narrow).toBeVisible();
  await expect(narrow.getByRole('combobox', {name:'选择设计章节'})).toHaveValue('08');
  await page.setViewportSize({width:1440,height:1000});
  await expect(narrow).toBeHidden();
  await expect(reference).toBeVisible();
  await reference.getByRole('button', {name:'关闭设计参考'}).click();
  await expect(reference).toBeHidden();
  await expect(page.getByRole('textbox',{name:'关键词',exact:true})).toHaveValue('AST-2026-001');
  await page.getByRole('button', {name:'对照指南', exact:true}).click();
  await page.getByRole('link', {name:'供应商台账'}).click();
  await expect(reference).toBeHidden();
  await expect(page.getByRole('heading', {name:'供应商台账',exact:true})).toBeVisible();
});

test('DG-003 手机指南阅读与参考抽屉无整体溢出', async ({page}) => {
  await page.setViewportSize({width:390, height:844});
  await page.goto('/#/design-guide');
  await expect(page.getByRole('heading', {name:'设计指南', exact:true})).toBeVisible();
  await page.getByRole('combobox', {name:'选择设计章节'}).selectOption('08');
  await expect(page.getByRole('heading', {name:'查询列表页什么时候需要数字卡片'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/design-guide-mobile.png', fullPage:true, animations:'disabled'});
  await page.goto('/#/assets');
  await page.getByRole('button', {name:'对照指南', exact:true}).click();
  const drawer=page.getByRole('dialog', {name:'设计参考'});
  await expect(drawer).toBeVisible();
  await drawer.getByRole('combobox', {name:'选择设计章节'}).selectOption('08');
  await expect(drawer.getByText('决策：已确认', {exact:true})).toBeVisible();
  await expect(drawer).toBeInViewport({ratio:1});
  await page.screenshot({path:'test-results/design-reference-mobile.png', fullPage:true, animations:'disabled'});
  await drawer.getByRole('button', {name:'关闭', exact:true}).click();
  await expect(drawer).toBeHidden();
  await expect(page.getByRole('heading', {name:'资产台账', exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('DG-004 V1全部16章有可执行规则并可进入组件示例',async({page})=>{
 await page.goto('/#/design-guide');
 const chapters=page.getByRole('navigation',{name:'设计章节'}).getByRole('button');
 await expect(chapters).toHaveCount(16);
 for(let index=0;index<16;index++){
  await chapters.nth(index).click();
  await expect(page.locator('.design-rule').first()).toBeVisible();
  await expect(page.getByText('章节待完善',{exact:true})).toHaveCount(0);
 }
 await chapters.nth(4).click();
 await page.getByRole('link',{name:'体验通用组件示例'}).click();
 await expect(page.getByRole('heading',{name:'通用组件与状态示例',exact:true})).toBeVisible();
});
