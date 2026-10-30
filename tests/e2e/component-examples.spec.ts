import {test,expect} from './fixtures';

test('COMP-001 状态示例支持空态恢复、加载、错误重试及危险确认且不写入业务',async({page})=>{
  const writes:string[]=[];
  page.on('request',request=>{if(request.url().includes('/api/')&&request.method()!=='GET')writes.push(request.url());});
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('/#/component-demo');
  await expect(page.getByRole('heading',{name:'通用组件与状态示例',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'当前不可提交',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'执行主要操作',exact:true}).click();
  await expect(page.getByRole('status').filter({hasText:'主要操作已完成'})).toBeVisible();
  await page.getByRole('button',{name:'初始空态',exact:true}).click();
  await expect(page.getByText('尚无示例记录',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'创建示例',exact:true}).click();
  await expect(page.getByText('示例文档 A',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'筛选无结果',exact:true}).click();
  await expect(page.getByText('没有符合条件的示例',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'清除示例筛选',exact:true}).click();
  await expect(page.getByText('示例文档 A',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'加载中',exact:true}).click();
  await expect(page.getByText('正在加载示例，请稍候…',{exact:true})).toBeVisible();
  await expect(page.getByText('示例文档 A',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'错误状态',exact:true}).click();
  await expect(page.getByText('示例加载失败',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'重试示例请求',exact:true}).click();
  await expect(page.getByText('示例文档 A',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'删除示例文档',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'删除示例文档 A？',exact:true});
  await expect(dialog.getByText('确认后将从本页示例列表移除，当前页面内无法撤销。')).toBeVisible();
  await dialog.getByRole('button',{name:'取消',exact:true}).click();
  await expect(page.getByText('示例文档 A',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'删除示例文档',exact:true}).click();
  await dialog.getByRole('button',{name:'确认删除',exact:true}).click();
  await expect(page.getByText('已删除示例文档 A，仅影响本页演示。',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'删除示例文档',exact:true})).toBeDisabled();
  expect(writes).toEqual([]);
});

test('COMP-002 格式和视觉参考桌面手机可读且无整页溢出',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('/#/component-demo');
  await expect(page.getByText('¥0.00',{exact:true})).toBeVisible();
  await expect(page.getByText('未填写（—）',{exact:true})).toBeVisible();
  await page.screenshot({path:'/tmp/component-examples-desktop.png',fullPage:true,animations:'disabled'});
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'/tmp/component-examples-mobile.png',fullPage:true,animations:'disabled'});
});
