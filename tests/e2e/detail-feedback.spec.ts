import {test,expect} from './fixtures';

test('DETAIL-001 详情与活动记录分别反馈失败并可重试，保留摘要',async({page})=>{
  await page.goto('/#/assets');
  await page.getByRole('button',{name:'查看',exact:true}).first().waitFor();
  await page.evaluate(()=>{
    const original=window.fetch.bind(window);
    const failed=new Set<string>();
    window.fetch=async(input,init)=>{
      const url=String(input);
      if(/^\/api\/modules\/assets\/records\/[^/?]+(?:\/history)?$/.test(url)&&!failed.has(url)){
        failed.add(url);throw new TypeError('演示断网');
      }
      return original(input,init);
    };
  });
  const code=await page.locator('tbody tr').first().locator('td').first().innerText();
  await page.getByRole('button',{name:'查看',exact:true}).first().click();
  const drawer=page.getByRole('dialog',{name:'资产详情'});
  await expect(drawer.getByText('详情加载失败',{exact:true})).toBeVisible();
  await expect(drawer.getByText('活动记录加载失败',{exact:true})).toBeVisible();
  await expect(drawer).toContainText(code);
  await drawer.getByRole('button',{name:'重试详情',exact:true}).click();
  await expect(drawer.getByText('详情加载失败',{exact:true})).toHaveCount(0);
  await expect(drawer.getByText('活动记录加载失败',{exact:true})).toBeVisible();
  await drawer.getByRole('button',{name:'重试活动记录',exact:true}).click();
  await expect(drawer.getByText('活动记录加载失败',{exact:true})).toHaveCount(0);
  await expect(drawer.getByText('暂无活动记录',{exact:true})).toBeVisible();
  await page.screenshot({path:'/tmp/detail-feedback-desktop.png',animations:'disabled'});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'/tmp/detail-feedback-mobile.png',animations:'disabled'});
});

test('DETAIL-002 关闭后打开其他记录，旧详情和活动响应不能覆盖新记录',async({page})=>{
  await page.goto('/#/assets');
  await page.getByRole('button',{name:'查看',exact:true}).first().waitFor();
  await page.evaluate(()=>{
    const original=window.fetch.bind(window);
    const state=window as Window&{releaseOldDetail?:()=>void;detailPending?:number};
    state.detailPending=0;
    let firstId='';
    const gate=new Promise<void>(resolve=>{state.releaseOldDetail=resolve;});
    window.fetch=async(input,init)=>{
      const match=String(input).match(/^\/api\/modules\/assets\/records\/([^/?]+)(?:\/history)?$/);
      if(match){
        firstId ||= match[1];
        if(firstId===match[1]){
          const response=await original(input,init);
          state.detailPending=(state.detailPending??0)+1;
          await gate;
          return response;
        }
      }
      return original(input,init);
    };
  });
  await page.getByRole('button',{name:'查看',exact:true}).first().click();
  await expect.poll(()=>page.evaluate(()=>(window as Window&{detailPending?:number}).detailPending)).toBe(2);
  const drawer=page.getByRole('dialog',{name:'资产详情'});
  const firstCode=await drawer.locator('.detail-code').innerText();
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'查看',exact:true}).nth(1).click();
  const secondCode=await drawer.locator('.detail-code').innerText();
  expect(secondCode).not.toBe(firstCode);
  await expect(drawer.getByText('暂无活动记录',{exact:true})).toBeVisible();
  await page.evaluate(()=>(window as Window&{releaseOldDetail?:()=>void}).releaseOldDetail?.());
  // 浏览器完成旧 fetch 的 promise 后才检查最终摘要。
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  await expect(drawer.locator('.detail-code')).toHaveText(secondCode);
  await expect(drawer).not.toContainText(firstCode);
});
