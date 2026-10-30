import {test,expect} from './fixtures';
test('PAT-DATA 高级表格编辑、批量与回收恢复',async({page})=>{
 await page.goto('/#/patterns/advanced-table');
 await expect(page.getByRole('heading',{name:'高级表格',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'新增示例记录',exact:true}).click();
 const editor=page.getByRole('dialog',{name:'新增示例记录',exact:true});
 await editor.getByLabel('名称',{exact:true}).fill('模式库测试记录');
 await editor.getByLabel('负责人',{exact:true}).fill('测试人员');
 await editor.getByLabel('金额',{exact:true}).fill('15');
 await editor.getByLabel('日期',{exact:true}).fill('2026-10-29');
 await editor.getByRole('button',{name:'保存',exact:true}).click();
 await expect(editor).toBeHidden();
 await page.getByLabel('模板关键词',{exact:true}).fill('模式库测试记录');
 await page.getByRole('button',{name:'查询',exact:true}).click();
 const row=page.getByRole('row').filter({hasText:'模式库测试记录'});
 await row.getByRole('button',{name:'删除',exact:true}).click();
 await page.getByRole('dialog',{name:'移入回收站？',exact:true}).getByRole('button',{name:'确认移入',exact:true}).click();
 await expect(row).toHaveCount(0);
 await page.goto('/#/patterns/recycle');
 await page.getByRole('row').filter({hasText:'模式库测试记录'}).getByRole('button',{name:'恢复',exact:true}).click();
 await expect(page.getByRole('row').filter({hasText:'模式库测试记录'})).toHaveCount(0);
});
test('PAT-IMPORT CSV映射校验后真实导入并记录审计',async({page})=>{
 await page.goto('/#/patterns/import');
 await page.getByLabel('选择CSV或Excel文件').setInputFiles({name:'records.csv',mimeType:'text/csv',buffer:Buffer.from('名称,负责人,类别,金额,日期\n导入模式测试,测试人,其他,0,2026-10-29')});
 await page.getByRole('button',{name:'校验数据',exact:true}).click();
 await expect(page.getByText('校验通过：1 行，可整体导入。',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'确认导入',exact:true}).click();
 await expect(page.getByText('已导入 1 行',{exact:true})).toBeVisible();
});

test('PAT-IMPORT XLSX真实解析后沿用映射及导入',async({page})=>{
 await page.goto('/#/patterns/import');
 await page.getByLabel('选择CSV或Excel文件').setInputFiles('tests/fixtures/pattern-import.xlsx');
 await page.getByRole('button',{name:'校验数据',exact:true}).click();
 await expect(page.getByText('校验通过：1 行，可整体导入。',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'确认导入',exact:true}).click();
 await expect(page.getByText('已导入 1 行',{exact:true})).toBeVisible();
});
