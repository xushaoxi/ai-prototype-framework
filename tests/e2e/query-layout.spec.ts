import {expect,test} from './fixtures';

for(const moduleId of ['assets','vendors']){
  test(`QUERY-002 ${moduleId} 查询条件按可用宽度排列`,async({page})=>{
    await page.goto(`/#/${moduleId}`);
    await expect(page.getByRole('tab',{name:/^全部 \d+/})).toBeVisible();
    const keyword=page.getByRole('textbox',{name:'关键词',exact:true});
    const fieldBox=()=>page.locator('.query-fields .ant-select').boundingBox();
    const check=async(stacked:boolean)=>{
      const a=await keyword.locator('..').boundingBox();
      const b=await fieldBox();
      expect(a).not.toBeNull();expect(b).not.toBeNull();
      if(!a||!b)throw new Error('查询条件不可见');
      if(stacked){expect(b.y).toBeGreaterThanOrEqual(a.y+a.height);expect(Math.abs(a.width-b.width)).toBeLessThan(2);}
      else expect(Math.abs(a.y-b.y)).toBeLessThan(2);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    };
    await check(false);
    await page.setViewportSize({width:820,height:900});
    expect((await page.locator('.ledger-primary').boundingBox())?.width).toBeLessThan(600);
    await check(true);
    await page.setViewportSize({width:1440,height:1000});
    await page.getByRole('button',{name:'对照指南',exact:true}).click();
    await check(false);
    await page.screenshot({path:`test-results/query-layout-${moduleId}-desktop.png`,animations:'disabled',fullPage:true});
    await page.getByRole('button',{name:'关闭设计参考',exact:true}).click();
    await page.setViewportSize({width:390,height:844});
    await check(true);
    await page.screenshot({path:`test-results/query-layout-${moduleId}-mobile.png`,animations:'disabled',fullPage:true});
  });
}
