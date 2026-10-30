import {test,expect} from './fixtures';

for(const module of [{id:'assets',title:'资产台账',code:'AST-2026-001',category:'电子设备',total:36},{id:'vendors',title:'供应商台账',code:'VEN-2026-001',category:'设备供应',total:12}]){
  test(`QUERY-001 ${module.title} 点击与Enter应用组合条件并回到第一页`,async({page})=>{
    await page.goto(`/#/${module.id}`);
    await expect(page.getByRole('tab',{name:`全部 ${module.total}`,exact:true})).toBeVisible();
    await page.getByRole('listitem',{name:'2',exact:true}).click();
    await expect(page.getByRole('listitem',{name:'2',exact:true})).toHaveClass(/ant-pagination-item-active/);
    const keyword=page.getByRole('textbox',{name:'关键词',exact:true});
    await keyword.fill(module.code);
    await page.getByRole('combobox',{name:'类别筛选'}).click();
    await page.locator('.ant-select-dropdown:visible').getByText(module.category,{exact:true}).last().click();
    await expect(page.getByRole('tab',{name:`全部 ${module.total}`,exact:true})).toBeVisible();
    const clickResponse=page.waitForResponse(response=>{const url=new URL(response.url());return url.pathname===`/api/modules/${module.id}/records`&&url.searchParams.get('keyword')===module.code;});
    await page.getByRole('button',{name:'查询',exact:true}).click();
    const clicked=await clickResponse;
    const clickedUrl=new URL(clicked.url());
    expect(clickedUrl.searchParams.get('category')).toBe(module.category);
    expect(clickedUrl.searchParams.get('page')).toBe('1');
    await expect(page.getByRole('row').filter({hasText:module.code})).toBeVisible();
    await expect(page.getByRole('tab',{name:'全部 1',exact:true})).toBeVisible();
    await page.getByRole('button',{name:'重置',exact:true}).click();
    await expect(page.getByRole('tab',{name:`全部 ${module.total}`,exact:true})).toBeVisible();
    await page.getByRole('listitem',{name:'2',exact:true}).click();
    await keyword.fill(module.code);
    await page.getByRole('combobox',{name:'类别筛选'}).click();
    await page.locator('.ant-select-dropdown:visible').getByText(module.category,{exact:true}).last().click();
    const enterResponse=page.waitForResponse(response=>{const url=new URL(response.url());return url.pathname===`/api/modules/${module.id}/records`&&url.searchParams.get('keyword')===module.code;});
    await keyword.press('Enter');
    expect((await enterResponse).url()).toBe(clicked.url());
    await expect(page.getByRole('tab',{name:'全部 1',exact:true})).toBeVisible();
    await expect(page.getByRole('row').filter({hasText:module.code})).toBeVisible();
    const status=module.id==='assets'?'draft':'pending';
    const statusLabel=module.id==='assets'?'草稿':'待评估';
    const statusResponse=page.waitForResponse(response=>{const url=new URL(response.url());return url.pathname===`/api/modules/${module.id}/records`&&url.searchParams.get('status')===status;});
    await page.getByRole('tab',{name:`${statusLabel} 1`,exact:true}).click();
    const statusUrl=new URL((await statusResponse).url());
    expect(statusUrl.searchParams.get('keyword')).toBe(module.code);
    expect(statusUrl.searchParams.get('category')).toBe(module.category);
    await expect(page.getByRole('row').filter({hasText:module.code})).toBeVisible();
    if(module.id==='assets'){
      await expect(page.getByText('点击「查询」或在关键词框按 Enter 查询',{exact:true})).toBeVisible();
      await page.screenshot({path:'test-results/query-desktop.png',animations:'disabled'});
      await page.setViewportSize({width:390,height:844});
      await expect(page.getByText('点击「查询」或在关键词框按 Enter 查询',{exact:true})).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await page.screenshot({path:'test-results/query-mobile.png',animations:'disabled'});
    }
  });
}

test('QUERY-001 输入法选词Enter不查询；状态切换不应用待提交条件',async({page})=>{
  await page.goto('/');
  await expect(page.getByRole('tab',{name:'全部 36',exact:true})).toBeVisible();
  const urls:string[]=[];
  page.on('request',request=>{if(new URL(request.url()).pathname==='/api/modules/assets/records')urls.push(request.url());});
  const keyword=page.getByRole('textbox',{name:'关键词',exact:true});
  await keyword.fill('AST-2026-001');
  await keyword.dispatchEvent('keydown',{key:'Enter',code:'Enter',keyCode:13,which:13,bubbles:true,isComposing:true});
  await page.getByRole('tab',{name:/^草稿 /}).click();
  await expect(page.getByText('共 8 条',{exact:true})).toBeVisible();
  expect(urls.length).toBeGreaterThan(0);
  expect(urls.every(url=>!new URL(url).searchParams.has('keyword'))).toBe(true);
  const applied=page.waitForResponse(response=>new URL(response.url()).searchParams.get('keyword')==='AST-2026-001');
  await keyword.press('Enter');
  expect(new URL((await applied).url()).searchParams.get('status')).toBe('draft');
  await expect(page.getByRole('tab',{name:'草稿 1',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'重置',exact:true}).click();
  await expect(keyword).toHaveValue('');
  await expect(page.getByRole('tab',{name:'全部 36',exact:true})).toBeVisible();
});

test('QUERY-001 第06章展示已确认的点击与Enter查询规则',async({page})=>{
  await page.goto('/#/design-guide');
  await page.getByRole('navigation',{name:'设计章节'}).getByRole('button',{name:'06 查询与筛选'}).click();
  await expect(page.getByRole('heading',{name:'点击查询，支持关键词框按 Enter 提交',exact:true})).toBeVisible();
  await expect(page.locator('.design-rule').filter({has:page.getByRole('heading',{name:'点击查询，支持关键词框按 Enter 提交',exact:true})}).getByText('决策：已确认',{exact:true})).toBeVisible();
});
