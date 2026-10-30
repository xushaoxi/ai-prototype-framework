import {test,expect} from './fixtures';

test('PAT-FORM 草稿允许缺项，刷新恢复并载入',async({page})=>{
 await page.goto('/#/patterns/drafts');
 await page.getByLabel('申请名称',{exact:true}).fill('未完成的原型草稿');
 await page.getByRole('button',{name:'暂存草稿',exact:true}).click();
 await expect(page.getByRole('row').filter({hasText:'未完成的原型草稿'})).toBeVisible();
 await page.reload();
 await page.getByRole('row').filter({hasText:'未完成的原型草稿'}).getByRole('button',{name:'载入'}).click();
 await expect(page.getByLabel('申请名称',{exact:true})).toHaveValue('未完成的原型草稿');
 await page.getByRole('button',{name:'提交记录',exact:true}).click();
 await expect(page.getByText('请选择所属类别',{exact:true})).toBeVisible();
 await page.getByLabel('所属类别',{exact:true}).click();
 await page.getByText('设备采购',{exact:true}).click();
 await page.getByLabel('所属部门',{exact:true}).click();
 await page.getByText('示例集团',{exact:true}).hover();
 await page.getByText('技术中心',{exact:true}).hover();
 await page.getByText('研发部',{exact:true}).click();
 await page.getByLabel('申请日期',{exact:true}).fill('2026-10-29');
 await page.getByRole('button',{name:'提交记录',exact:true}).click();
 await expect(page.getByRole('row').filter({hasText:'未完成的原型草稿'})).toHaveCount(0);
 await expect(page.getByLabel('申请名称',{exact:true})).toHaveValue('');
 const snapshot=await page.evaluate(async()=>{const response=await fetch('/api/patterns/snapshot');return response.json() as Promise<{records:{name:string}[];drafts:unknown[]}>;});
 expect(snapshot.records.some(record=>record.name==='未完成的原型草稿')).toBe(true);
 expect(snapshot.drafts).toHaveLength(0);
});

test('PAT-FORM 联动校验、明细计算、附件元数据与桌面手机布局',async({page})=>{
 await page.goto('/#/patterns/detail-form');
 await page.getByRole('radio',{name:'特殊申请'}).check();
 await page.getByRole('button',{name:'提交记录',exact:true}).click();
 await expect(page.getByText('请输入特殊申请原因',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'添加明细'}).click();
 await page.getByLabel('明细名称 1').fill('测试物料');
 await page.getByLabel('数量 1',{exact:true}).fill('3');
 await page.getByLabel('单价 1',{exact:true}).fill('12.50');
 await expect(page.getByRole('status').filter({hasText:'明细合计'})).toContainText('37.50');
 await page.getByLabel('选择附件',{exact:true}).setInputFiles({name:'说明.pdf',mimeType:'application/pdf',buffer:Buffer.from('demo')});
 await expect(page.getByText('说明.pdf',{exact:true})).toBeVisible();
 await page.screenshot({path:'/tmp/pattern-form-desktop.png',animations:'disabled'});
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'/tmp/pattern-form-mobile.png',animations:'disabled'});
 await page.getByRole('switch',{name:'只读角色（演示仿真）'}).click();
 await expect(page.getByRole('button',{name:'提交记录',exact:true})).toBeDisabled();
 await expect(page.getByLabel('选择附件',{exact:true})).toBeDisabled();
});

test('PAT-FORM 步骤按阶段校验且未保存退出可继续编辑',async({page})=>{
 await page.goto('/#/patterns/step-form');
 await page.getByRole('button',{name:'下一步'}).click();
 await expect(page.getByText('请输入申请名称',{exact:true})).toBeVisible();
 await page.getByLabel('申请名称',{exact:true}).fill('保留输入');
 await page.getByRole('button',{name:'清空表单'}).click();
 const confirm=page.getByRole('dialog',{name:'放弃未保存的修改？'});
 await confirm.getByRole('button',{name:'继续编辑'}).click();
 await expect(page.getByLabel('申请名称',{exact:true})).toHaveValue('保留输入');
});

test('PAT-FILE 文件只存元数据并支持移除和恢复读取',async({page})=>{
 await page.goto('/#/patterns/files');
 await expect(page.getByText(/不提供远端文件下载/)).toBeVisible();
 await page.getByLabel('选择附件',{exact:true}).setInputFiles({name:'元数据示例.pdf',mimeType:'application/pdf',buffer:Buffer.from('demo')});
 const row=page.getByRole('row').filter({hasText:'元数据示例.pdf'});
 await expect(row).toBeVisible();
 await page.reload();
 await expect(row).toBeVisible();
 await row.getByRole('button',{name:'删除'}).click();
 await page.getByRole('button',{name:'确认删除',exact:true}).click();
 await expect(row).toHaveCount(0);
});
