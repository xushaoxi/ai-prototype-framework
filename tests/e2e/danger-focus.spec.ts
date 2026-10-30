import {test,expect} from './fixtures';

test('RISK-001 删除与重置确认默认聚焦安全选项',async({page})=>{
 await page.goto('/#/assets');
 await page.getByRole('textbox',{name:'关键词',exact:true}).fill('AST-2026-001');
 await page.getByRole('button',{name:'查询',exact:true}).click();
 const row=page.getByRole('row').filter({hasText:'AST-2026-001'});
 await row.getByRole('button',{name:'更多操作'}).click();
 await page.getByRole('menuitem',{name:'删除',exact:true}).click();
 let confirm=page.getByRole('dialog',{name:'删除资产',exact:true});
 await expect(confirm.getByRole('button',{name:'取消',exact:true})).toBeFocused();
 await confirm.getByRole('button',{name:'取消',exact:true}).click();
 await page.getByRole('button',{name:'演示设置',exact:true}).click();
 await page.getByRole('button',{name:/重置演示数据/}).click();
 confirm=page.getByRole('dialog',{name:'重置演示数据',exact:true});
 await expect(confirm.getByRole('button',{name:'取消',exact:true})).toBeFocused();
 await confirm.getByRole('button',{name:'取消',exact:true}).click();
 await page.getByRole('dialog',{name:'演示设置',exact:true}).getByRole('button',{name:'关闭',exact:true}).click();
 await expect(row).toHaveCount(1);
});
