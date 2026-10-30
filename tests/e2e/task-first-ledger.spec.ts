import {test,expect} from './fixtures';

test('PAGE-001/LIST-001 日常台账取消重复卡片并保留可操作状态计数',async({page})=>{
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'资产台账',exact:true})).toBeVisible();
  await expect(page.getByRole('region',{name:'当前筛选统计'})).toHaveCount(0);
  await expect(page.getByRole('tab',{name:'全部 36',exact:true})).toBeVisible();
  await expect(page.getByRole('tab',{name:'使用中 24',exact:true})).toBeVisible();
  await expect(page.getByRole('tab',{name:'草稿 8',exact:true})).toBeVisible();
  await page.getByRole('tab',{name:'草稿 8',exact:true}).click();
  await expect(page.getByRole('tab',{name:'全部 36',exact:true})).toBeVisible();
  await expect(page.getByText('共 8 条',{exact:true})).toBeVisible();
  await page.getByRole('tab',{name:'全部 36',exact:true}).click();
  await page.getByRole('textbox',{name:'关键词',exact:true}).fill('AST-2026-001');
  await page.getByRole('button',{name:'查询',exact:true}).click();
  await expect(page.getByRole('tab',{name:'全部 1',exact:true})).toBeVisible();
  await expect(page.getByRole('tab',{name:'草稿 1',exact:true})).toBeVisible();
  await expect(page.getByRole('row').filter({hasText:'AST-2026-001'})).toBeVisible();
  await page.getByRole('textbox',{name:'关键词',exact:true}).fill('不存在的记录');
  await page.getByRole('button',{name:'查询',exact:true}).click();
  await expect(page.getByRole('tab',{name:'全部 0',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'重置',exact:true}).click();
  await expect(page.getByRole('tab',{name:'全部 36',exact:true})).toBeVisible();
  await page.screenshot({path:'test-results/task-first-desktop.png',animations:'disabled'});
  await page.getByRole('link',{name:'供应商台账'}).click();
  await expect(page.getByRole('tab',{name:'全部 12',exact:true})).toBeVisible();
  await expect(page.getByRole('region',{name:'当前筛选统计'})).toHaveCount(0);
  await page.setViewportSize({width:390,height:844});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/task-first-mobile.png',animations:'disabled'});
});

test('LIST-001 慢响应首次请求时未知计数不显示为0',async({page})=>{
  await page.addInitScript(()=>{
    const original=window.fetch.bind(window);
    window.fetch=(input,init)=>{
      const headers=new Headers(init?.headers);
      headers.set('x-demo-scenario','slow');
      return original(input,{...init,headers});
    };
  });
  await page.goto('/');
  await expect(page.getByRole('tab',{name:'全部 —',exact:true})).toBeVisible();
  await expect(page.getByRole('tab',{name:'使用中 —',exact:true})).toBeVisible();
  await expect(page.getByRole('tab',{name:'全部 36',exact:true})).toBeVisible();
});
