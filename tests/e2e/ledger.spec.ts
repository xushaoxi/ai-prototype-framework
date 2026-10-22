import { test, expect } from '@playwright/test';

test.beforeEach(async ({page}) => {
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'资产台账',exact:true})).toBeVisible();
});

test('AST-001/008 组合查询、空态和模块隔离',async({page})=>{
  await expect(page.getByTestId('summary-total')).toHaveText('36');
  await page.getByPlaceholder('搜索名称、编号或负责人').fill('不存在的资产');
  await page.getByRole('button',{name:'查询',exact:true}).click();
  await expect(page.getByText('暂无符合条件的记录')).toBeVisible();
  await page.getByRole('button',{name:'重置',exact:true}).click();
  await expect(page.getByTestId('summary-total')).toHaveText('36');
  await page.getByRole('link',{name:'供应商台账'}).click();
  await expect(page.getByRole('heading',{name:'供应商台账',exact:true})).toBeVisible();
  await expect(page.getByTestId('summary-total')).toHaveText('12');
  await page.getByPlaceholder('搜索名称、编号或负责人').fill('VEN-2026-001');
  await page.getByRole('button',{name:'查询',exact:true}).click();
  await expect(page.getByText('VEN-2026-001')).toBeVisible();
});

test('AST-002/003/004/005 新建→编辑→详情→业务流转→刷新持久化',async({page})=>{
  await page.getByRole('button',{name:'新增资产',exact:true}).click();
  const dialog=page.getByRole('dialog');
  await dialog.getByRole('button',{name:'保存',exact:true}).click();
  await expect(dialog.getByText('请输入资产名称')).toBeVisible();
  await dialog.getByLabel('资产名称',{exact:true}).fill('端到端测试设备');
  await dialog.getByLabel('负责人',{exact:true}).fill('测试负责人');
  await dialog.getByLabel('资产金额',{exact:true}).fill('12345');
  await dialog.getByRole('button',{name:'保存',exact:true}).click();
  await expect(dialog).toBeHidden();
  const row=page.getByRole('row').filter({hasText:'端到端测试设备'});
  await expect(row).toBeVisible();
  await row.getByRole('button',{name:'编辑',exact:true}).click();
  await page.getByRole('dialog').getByLabel('资产名称',{exact:true}).fill('端到端测试设备已编辑');
  await page.getByRole('dialog').getByRole('button',{name:'保存',exact:true}).click();
  const edited=page.getByRole('row').filter({hasText:'端到端测试设备已编辑'});
  await edited.getByRole('button',{name:'查看',exact:true}).click();
  const drawer=page.getByRole('dialog');
  await expect(drawer.getByRole('heading',{name:'端到端测试设备已编辑',exact:true})).toBeVisible();
  await expect(drawer.getByText('活动记录',{exact:true})).toBeVisible();
  await drawer.getByRole('button',{name:'关闭',exact:true}).click();
  await edited.getByRole('button',{name:'更多操作'}).click();
  await page.getByRole('menuitem',{name:'投入使用',exact:true}).click();
  await page.getByRole('button',{name:'确认操作',exact:true}).click();
  await expect(edited.getByText('使用中',{exact:true})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('row').filter({hasText:'端到端测试设备已编辑'}).getByText('使用中',{exact:true})).toBeVisible();
});

test('AST-007/009 只读仿真与错误恢复',async({page})=>{
  await page.getByRole('button',{name:'演示设置'}).click();
  const settings=page.getByRole('dialog');
  await settings.getByLabel('只读浏览').check();
  await settings.getByRole('button',{name:'关闭',exact:true}).click();
  await expect(page.getByRole('button',{name:'新增资产',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'演示设置'}).click();
  await page.getByRole('dialog').getByLabel('错误响应').check();
  await page.getByRole('dialog').getByRole('button',{name:'关闭',exact:true}).click();
  await expect(page.getByText('数据加载失败')).toBeVisible();
  await page.getByRole('button',{name:'演示设置'}).click();
  await page.getByRole('dialog').getByLabel('正常响应').check();
  await page.getByRole('dialog').getByRole('button',{name:'关闭',exact:true}).click();
  await expect(page.getByTestId('summary-total')).toHaveText('36');
});

test('UI-001 桌面与手机界面可用且无相关浏览器错误',async({page})=>{
  const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  await expect(page.getByText('AST-2026-036')).toBeVisible();
  await page.screenshot({path:'work/desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await expect(page.getByRole('button',{name:'新增资产',exact:true})).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:'work/mobile.png',fullPage:true});
  await page.getByRole('button',{name:'展开导航'}).click();
  await page.getByRole('link',{name:'供应商台账'}).click();
  await expect(page.getByRole('heading',{name:'供应商台账',exact:true})).toBeVisible();
  expect(errors).toEqual([]);
});

test('DATA-RECOVERY 损坏本地数据可先备份再恢复，不进入重载死循环',async({page})=>{
  await page.evaluate(()=>localStorage.setItem('prototype-workbench:data:v1','{"broken":true}'));
  await page.reload();
  await expect(page.getByRole('heading',{name:'演示环境未能启动',exact:true})).toBeVisible();
  const backup=page.waitForEvent('download');
  await page.getByRole('button',{name:'备份现有本地数据',exact:true}).click();
  await expect((await backup).suggestedFilename()).toContain('recovery');
  await page.getByRole('button',{name:'重置本框架数据',exact:true}).click();
  await expect(page.getByRole('button',{name:'确认清除并恢复',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'确认清除并恢复',exact:true}).click();
  await expect(page.getByRole('heading',{name:'资产台账',exact:true})).toBeVisible();
  await expect(page.getByTestId('summary-total')).toHaveText('36');
});
