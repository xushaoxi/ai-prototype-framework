import {test,expect} from './fixtures';
import type {Page} from '@playwright/test';
import {patternCatalog} from '../../src/app/patterns/catalog';
import type {FormPayload,PatternAction,PatternSnapshot} from '../../src/core/patterns/types';

async function snapshot(page:Page):Promise<PatternSnapshot>{
 return page.evaluate(async()=>{const response=await fetch('/api/patterns/snapshot');if(!response.ok)throw new Error(`snapshot HTTP ${response.status}`);return response.json() as Promise<PatternSnapshot>;});
}
async function action(page:Page,mutation:PatternAction):Promise<PatternSnapshot>{
 return page.evaluate(async next=>{const currentResponse=await fetch('/api/patterns/snapshot');if(!currentResponse.ok)throw new Error(`snapshot HTTP ${currentResponse.status}`);const current=await currentResponse.json() as PatternSnapshot;const response=await fetch('/api/patterns/actions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({version:current.version,action:next})});if(!response.ok)throw new Error(`action HTTP ${response.status}: ${await response.text()}`);return response.json() as Promise<PatternSnapshot>;},mutation);
}
const details:FormPayload={name:'回归详情记录',category:'设备',owner:'回归人员',amount:450,date:'2026-10-29',notes:'原始说明',classification:'special',reason:'特殊分类联动原因',tags:['重点'],items:[{id:'regression-line',name:'明细设备',quantity:3,price:150}],files:[{id:'regression-file',name:'回归附件.txt',size:64,type:'text/plain'}]};
async function openData(page:Page,id='advanced-table'){
 await page.goto(`/#/patterns/${id}`);await expect(page.getByRole('heading',{name:patternCatalog.find(item=>item.id===id)?.title,exact:true})).toBeVisible();
 await expect(page.locator('.pattern-surface:visible')).toBeVisible();
}
async function search(page:Page,name:string){await page.getByLabel('模板关键词',{exact:true}).fill(name);await page.getByRole('button',{name:'查询',exact:true}).click();}

test('PAT-REG-001 inline and dialog editing preserve details, attachments and linked fields through HTTP',async({page})=>{
 await openData(page);
 const saved=await action(page,{type:'record.save',record:{name:details.name,category:details.category,owner:details.owner,amount:details.amount,date:details.date,notes:details.notes,tags:details.tags,status:'draft',details}});
 const id=saved.records.find(record=>record.name===details.name)?.id;if(!id)throw new Error('API未返回创建记录');
 await page.reload();await expect(page.locator('.pattern-surface:visible')).toBeVisible();await search(page,details.name);
 let row=page.locator(`tr[data-row-key="${id}"]`);await row.getByRole('button',{name:'行内编辑',exact:true}).click();
 const inlineName=`${details.name}-行内`;await row.getByLabel('行内名称',{exact:true}).fill(inlineName);await row.getByRole('button',{name:'保存行',exact:true}).click();
 await expect(row.getByRole('button',{name:'行内编辑',exact:true})).toBeVisible();
 let record=(await snapshot(page)).records.find(item=>item.id===id);expect(record?.name).toBe(inlineName);expect(record?.details).toEqual({...details,name:inlineName});
 row=page.getByRole('row').filter({hasText:inlineName});await row.getByRole('button',{name:'编辑',exact:true}).click();
 const editor=page.getByRole('dialog',{name:'编辑示例记录',exact:true});await editor.getByLabel('备注',{exact:true}).fill('弹窗更新备注');
 await editor.getByRole('button',{name:'保存',exact:true}).click();await expect(editor).toBeHidden();
 await page.reload();await expect(page.locator('.pattern-surface:visible')).toBeVisible();record=(await snapshot(page)).records.find(item=>item.id===id);
 expect(record?.notes).toBe('弹窗更新备注');expect(record?.tags).toEqual(details.tags);expect(record?.details).toEqual({...details,name:inlineName,notes:'弹窗更新备注'});
 expect((await snapshot(page)).files).toContainEqual(details.files[0]);
});

test('PAT-REG-002 approval and rejection persist decisions and reason, and disappear from pending tasks',async({page})=>{
 await openData(page,'tasks');const initial=await snapshot(page);const pending=initial.tasks.filter(task=>task.status==='pending');expect(pending.length).toBeGreaterThanOrEqual(2);
 const approved=pending[0];const rejected=pending[1];
 await page.getByRole('row').filter({hasText:approved.title}).getByRole('button',{name:'处理审批',exact:true}).click();
 let dialog=page.getByRole('dialog',{name:'处理审批',exact:true});await dialog.getByLabel('审批意见',{exact:true}).fill('资料完整，审核通过');await dialog.getByRole('button',{name:'确认处理',exact:true}).click();await expect(dialog).toBeHidden();
 await expect(page.getByRole('row').filter({hasText:approved.title})).toHaveCount(0);
 await page.getByRole('row').filter({hasText:rejected.title}).getByRole('button',{name:'处理审批',exact:true}).click();
 dialog=page.getByRole('dialog',{name:'处理审批',exact:true});await dialog.getByRole('radio',{name:'驳回',exact:true}).check();
 await dialog.getByRole('button',{name:'确认处理',exact:true}).click();await expect(page.getByText('驳回时请输入原因',{exact:true})).toBeVisible();
 expect((await snapshot(page)).tasks.find(task=>task.id===rejected.id)?.status).toBe('pending');
 await dialog.getByLabel('审批意见',{exact:true}).fill('材料缺失，请补充附件');await dialog.getByRole('button',{name:'确认处理',exact:true}).click();await expect(dialog).toBeHidden();
 await page.reload();await expect(page.locator('.pattern-surface:visible')).toBeVisible();const final=await snapshot(page);
 expect(final.tasks.find(task=>task.id===approved.id)).toMatchObject({status:'approved',comment:'资料完整，审核通过'});
 expect(final.tasks.find(task=>task.id===rejected.id)).toMatchObject({status:'rejected',comment:'材料缺失，请补充附件'});
 await expect(page.getByRole('row').filter({hasText:approved.title})).toHaveCount(0);await expect(page.getByRole('row').filter({hasText:rejected.title})).toHaveCount(0);
 await page.goto('/#/patterns/approval');await expect(page.getByRole('row').filter({hasText:rejected.title})).toContainText('已驳回');
});

test('PAT-REG-003 directory links navigate to all 24 actual template routes',async({page})=>{
 test.setTimeout(90000);
 expect(patternCatalog).toHaveLength(24);const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/#/patterns');await expect(page.getByRole('heading',{name:'能力组合目录',exact:true})).toBeVisible();
 for(const pattern of patternCatalog){
  const compatibility=page.locator('.pattern-compatibility');if(await compatibility.locator(`a[href="#/patterns/${pattern.id}"]`).count()&&await compatibility.getAttribute('open')===null)await compatibility.locator('summary').click();const link=page.getByRole('link',{name:`打开${pattern.title}`,exact:true});await expect(link).toHaveAttribute('href',`#/patterns/${pattern.id}`);await link.click();
  await expect(page).toHaveURL(new RegExp(`#/patterns/${pattern.id}$`));await expect(page.getByRole('heading',{name:pattern.title,exact:true})).toBeVisible();
  await page.getByRole('link',{name:'返回组合目录',exact:true}).click();
 }
 expect(errors).toEqual([]);
});

test('PAT-REG-004 data templates fit desktop and mobile with horizontal scrolling limited to tables',async({page})=>{
 test.setTimeout(90000);
 const ids=['advanced-table','tree-table','card-list','master-detail','recycle','approval','tasks','import'];const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 for(const size of [{name:'desktop',width:1440,height:1000},{name:'mobile',width:390,height:844}]){
  await page.setViewportSize({width:size.width,height:size.height});
  for(const id of ids){await openData(page,id);await expect(page.locator('.pattern-surface:visible')).toBeVisible();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),`${size.name} ${id}整页横溢出`).toBeTruthy();
   await page.screenshot({path:`/tmp/pattern-regression-${size.name}-${id}.png`,fullPage:true});
  }
 }
 expect(errors).toEqual([]);
});

test('PAT-REG-005 modal draft survives switching pattern workspace tabs',async({page})=>{
 await openData(page);await page.getByRole('button',{name:'新增示例记录',exact:true}).click();const editor=page.getByRole('dialog',{name:'新增示例记录',exact:true});await editor.getByLabel('名称',{exact:true}).fill('切换标签后保留草稿');
 await page.goto('/#/patterns/card-list');await expect(page.getByRole('dialog',{name:'新增示例记录',exact:true})).toBeHidden();
 await page.getByRole('tab',{name:'高级表格',exact:true}).click();await expect(editor).toBeVisible();await expect(editor.getByLabel('名称',{exact:true})).toHaveValue('切换标签后保留草稿');
});

test('PAT-REG-006 AST-007/009 failing refresh preserves mounted editor and entered draft fields',async({page})=>{
 await openData(page);
 await page.getByRole('button',{name:'演示设置',exact:true}).click();const settings=page.getByRole('dialog',{name:'演示设置',exact:true});await settings.getByRole('radio',{name:'错误响应',exact:true}).check();await settings.getByRole('button',{name:'关闭',exact:true}).click();
 await page.getByRole('button',{name:'新增示例记录',exact:true}).click();const editor=page.getByRole('dialog',{name:'新增示例记录',exact:true});await editor.getByLabel('名称',{exact:true}).fill('错误刷新仍保留草稿');
 // Simulate another template announcing a data change while this modal is open.
 await page.evaluate(()=>window.dispatchEvent(new Event('pattern-data-changed')));
 await expect(page.getByText('刷新失败，保留当前内容',{exact:true})).toBeVisible();await expect(editor.getByLabel('名称',{exact:true})).toHaveValue('错误刷新仍保留草稿');
 await page.goto('/#/patterns/card-list');await expect(editor).toBeHidden();
 await page.getByRole('button',{name:'演示设置',exact:true}).click();const recoverySettings=page.getByRole('dialog',{name:'演示设置',exact:true});await recoverySettings.getByRole('radio',{name:'正常响应',exact:true}).check();await recoverySettings.getByRole('button',{name:'关闭',exact:true}).click();
 await page.getByRole('tab',{name:'高级表格',exact:true}).click();
 await expect(page.getByText('刷新失败，保留当前内容',{exact:true})).toBeHidden();await expect(editor.getByLabel('名称',{exact:true})).toHaveValue('错误刷新仍保留草稿');
});
