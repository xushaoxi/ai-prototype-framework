import {test,expect} from './fixtures';
test('STR stage block recovery and persistent history',async({page})=>{
 await page.goto('/#/structures/stages');
 await expect(page.getByRole('button',{name:'推进下一阶段'})).toBeVisible();
 await page.getByRole('textbox',{name:'阻塞原因'}).fill('等待验收材料');
 await page.getByRole('button',{name:'标记阻塞',exact:true}).click();
 await expect(page.getByRole('button',{name:'推进下一阶段'})).toBeDisabled();
 await page.getByRole('button',{name:'恢复推进',exact:true}).click();
 await page.getByRole('button',{name:'推进下一阶段'}).click();
 await expect(page.getByRole('button',{name:'重开上一阶段'})).toBeEnabled();
 await page.reload();await expect(page.getByText('标记阻塞：等待验收材料',{exact:false})).toBeVisible();
});
test('STR workbench cancel and save, report preview, relation keyboard',async({page})=>{
 await page.goto('/#/structures/workbench');await page.getByRole('button',{name:'编辑布局'}).click();
 await page.getByRole('button',{name:'添加指标',exact:true}).click();await expect(page.getByRole('heading',{name:'任务概况'})).toHaveCount(2);
 await page.getByRole('button',{name:'取消编辑'}).click();await expect(page.getByRole('heading',{name:'任务概况'})).toHaveCount(1);
 await page.getByRole('button',{name:'编辑布局'}).click();await page.getByRole('button',{name:'添加指标',exact:true}).click();await page.getByRole('button',{name:'保存布局'}).click();
 await page.reload();await expect(page.getByRole('heading',{name:'任务概况'})).toHaveCount(2);
 await page.goto('/#/structures/wizard');await page.getByRole('button',{name:'下一步'}).click();await page.getByRole('button',{name:'下一步'}).click();await page.getByRole('spinbutton').fill('100');await page.getByRole('button',{name:'下一步'}).click();await expect(page.getByText('预览 1 条 · 条件：进度≥100%')).toBeVisible();await page.getByRole('button',{name:'保存配置'}).click();
 await page.goto('/#/structures/graph');await page.getByRole('button',{name:'林青',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.getByRole('dialog')).toContainText('类型：人员');
});
test('STR schedule validation preserves input and detail tabs',async({page})=>{
 await page.goto('/#/structures/schedule');await page.getByRole('button',{name:'添加子任务'}).click();await page.getByRole('button',{name:'保存任务'}).click();await expect(page.getByText('请输入任务名称')).toBeVisible();await expect(page.getByRole('dialog')).toBeVisible();
});

test('STR wizard aliases and finite text condition persist',async({page})=>{
 await page.goto('/#/structures/wizard');await page.getByRole('button',{name:'下一步'}).click();await page.getByRole('textbox',{name:'任务名称别名'}).fill('工作项');await page.getByRole('button',{name:'下一步'}).click();await page.getByRole('button',{name:'添加条件'}).click();await page.getByRole('textbox',{name:'条件1值'}).fill('核对');await page.getByRole('button',{name:'下一步'}).click();await expect(page.getByRole('columnheader',{name:'工作项'})).toBeVisible();await expect(page.getByRole('cell',{name:'材料核对'})).toBeVisible();await expect(page.getByRole('cell',{name:'现场验证'})).toHaveCount(0);await page.getByRole('button',{name:'保存配置'}).click();await page.reload();await page.getByRole('button',{name:'下一步'}).click();await expect(page.getByRole('textbox',{name:'任务名称别名'})).toHaveValue('工作项');
});
test('STR WBS collapse, plan actual milestone, month calendar',async({page})=>{
 await page.goto('/#/structures/schedule');
 await expect(page.getByRole('button',{name:'材料核对',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'交付准备收起子任务'}).click();
 await expect(page.getByRole('button',{name:'材料核对',exact:true})).toBeHidden();
 await page.getByRole('button',{name:'交付准备展开子任务'}).click();
 await expect(page.getByRole('button',{name:'材料核对',exact:true})).toBeVisible();
 await page.getByRole('tab',{name:'计划甘特'}).click();
 await expect(page.getByRole('button',{name:'材料核对计划里程碑 2026-10-28至2026-10-28'})).toBeVisible();
 await expect(page.getByRole('button',{name:'材料核对实际 2026-10-28至2026-10-28'})).toBeVisible();
 await page.getByRole('tab',{name:'日期日历'}).click();await expect(page.locator('.ant-picker-calendar')).toBeVisible();await expect(page.getByRole('heading',{name:'2026-10-28 当天任务'})).toBeVisible();
});
test('STR graph fullscreen minimap and Space activation',async({page})=>{
 await page.goto('/#/structures/graph');await page.getByRole('button',{name:'全屏查看'}).click();await expect(page.getByRole('dialog',{name:'关系图全貌'})).toBeVisible();
 await page.getByRole('button',{name:'小地图定位林青'}).focus();await page.keyboard.press('Space');await expect(page.locator('.minimap-viewport')).toBeVisible();
 await page.getByRole('button',{name:'查看全貌'}).click();await page.getByRole('button',{name:'林青',exact:true}).focus();await page.keyboard.press('Space');await expect(page.getByRole('dialog',{name:'关联详情'})).toContainText('类型：人员');
 await page.getByRole('dialog',{name:'关联详情'}).locator('.ant-drawer-close').click();await page.keyboard.press('Escape');await expect(page.getByRole('dialog',{name:'关系图全貌'})).toHaveCount(0);await expect(page.getByRole('button',{name:'全屏查看'})).toBeFocused();
});
test('STR analysis chart drills into the same task scope',async({page})=>{
 await page.goto('/#/structures/analysis');await page.getByRole('button',{name:'已完成 1项',exact:true}).click();await expect(page.getByRole('button',{name:'材料核对',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'现场验证',exact:true})).toHaveCount(0);await page.getByRole('button',{name:'返回全部口径'}).click();await expect(page.getByRole('button',{name:'现场验证',exact:true})).toBeVisible();
});
test('STR-WIDGET-BOUNDARY scope save cancel and isolated render recovery',async({page})=>{
 await page.goto('/#/structures/workbench');await page.getByRole('button',{name:'编辑布局'}).click();await page.getByRole('combobox',{name:'组件2范围'}).click();await page.getByRole('option',{name:'已完成',exact:true}).click();await page.getByRole('spinbutton',{name:'组件2条数'}).fill('1');await page.getByRole('button',{name:'保存布局'}).click();await page.reload();await expect(page.locator('tbody tr').filter({hasText:'材料核对'})).toBeVisible();await expect(page.locator('tbody tr').filter({hasText:'现场验证'})).toHaveCount(0);
 await page.getByRole('button',{name:'编辑布局'}).click();await page.getByRole('combobox',{name:'组件2范围'}).click();await page.getByRole('option',{name:'全部',exact:true}).click();await page.getByRole('button',{name:'取消编辑'}).click();await expect(page.locator('tbody tr').filter({hasText:'现场验证'})).toHaveCount(0);
 await page.getByRole('button',{name:'演示首组件异常'}).click();await expect(page.getByText('此组件暂时无法显示')).toBeVisible();await expect(page.locator('tbody tr').filter({hasText:'材料核对'})).toBeVisible();await page.getByRole('button',{name:'重试组件'}).click();await expect(page.getByText('此组件暂时无法显示')).toHaveCount(0);await expect(page.getByText('3 项任务 · 1 项完成', {exact:false})).toBeVisible();
});

test('STR readonly preserves browsing but disables configuration inputs',async({page})=>{
 await page.goto('/#/structures/wizard');await page.getByRole('button',{name:'下一步',exact:true}).click();
 await page.getByRole('button',{name:'演示设置',exact:true}).click();
 const settings=page.getByRole('dialog',{name:'演示设置',exact:true});
 await settings.getByRole('radio',{name:'只读浏览',exact:true}).check();
 await settings.locator('.ant-drawer-close').click();
 await expect(page.getByRole('textbox',{name:'任务名称别名',exact:true})).toBeDisabled();
 await expect(page.getByRole('button',{name:'上移',exact:true}).last()).toBeDisabled();
 await expect(page.getByRole('button',{name:'下一步',exact:true})).toBeEnabled();
});

test('STR layout edit sessions protect drafts and reset undo',async({page})=>{
 await page.goto('/#/structures/workbench');await page.getByRole('button',{name:'编辑布局',exact:true}).click();
 await page.getByRole('button',{name:'添加指标',exact:true}).click();
 await expect(page.getByRole('button',{name:'编辑布局',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'保存布局',exact:true}).click();
 await page.getByRole('button',{name:'编辑布局',exact:true}).click();
 await expect(page.getByRole('button',{name:'撤销布局操作',exact:true})).toBeDisabled();
 await expect(page.getByRole('heading',{name:'任务概况',exact:true})).toHaveCount(2);
});

test('STR-RECOVERY readonly cannot reset a damaged structure namespace',async({page})=>{
 await page.goto('/#/assets');await page.getByRole('button',{name:'演示设置',exact:true}).click();
 const settings=page.getByRole('dialog',{name:'演示设置',exact:true});await settings.getByRole('radio',{name:'只读浏览',exact:true}).check();await settings.locator('.ant-drawer-close').click();
 await page.evaluate(()=>{localStorage.setItem('prototype.structures.v1','broken');location.hash='/structures/stages';});
 await expect(page.getByRole('button',{name:'重置结构数据',exact:true})).toBeDisabled();
});

test('STR graph search respects zoom and expands the target',async({page})=>{
 await page.goto('/#/structures/graph');for(let i=0;i<5;i++)await page.getByRole('button',{name:'放大',exact:true}).click();
 await page.getByRole('button',{name:'收起关系',exact:true}).click();
 const search=page.getByLabel('搜索关系节点',{exact:true});await search.fill('材料核对');await search.press('Enter');
 await page.getByRole('dialog',{name:'关联详情',exact:true}).locator('.ant-drawer-close').click();
 const node=page.getByRole('button',{name:'材料核对',exact:true});await expect(node).toBeVisible();
 const canvas=await page.getByRole('group',{name:'对象关系图',exact:true}).boundingBox();const box=await node.boundingBox();expect(canvas&&box).toBeTruthy();
 expect(box!.x).toBeGreaterThanOrEqual(canvas!.x);expect(box!.x+box!.width).toBeLessThanOrEqual(canvas!.x+canvas!.width);
});

test('AST-007/009 STR failed task save shows the error inside the editor and retains input',async({page})=>{
 await page.goto('/#/structures/schedule');await expect(page.getByRole('button',{name:'添加子任务',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'演示设置',exact:true}).click();const settings=page.getByRole('dialog',{name:'演示设置',exact:true});
 await settings.getByRole('radio',{name:'错误响应',exact:true}).check();await settings.locator('.ant-drawer-close').click();
 await page.getByRole('button',{name:'添加子任务',exact:true}).click();const editor=page.getByRole('dialog',{name:'任务详情与编辑',exact:true});
 await editor.getByLabel('任务名称',{exact:true}).fill('失败后保留的任务');await editor.getByLabel('责任人',{exact:true}).fill('示例人员');
 await editor.getByRole('button',{name:'保存任务',exact:true}).click();
 await expect(editor.getByRole('alert')).toContainText('这是演示错误场景');
 await expect(editor.getByLabel('任务名称',{exact:true})).toHaveValue('失败后保留的任务');
});

test('STR-RECOVERY stale task drafts do not overwrite a newer save after tab refresh',async({page})=>{
 await page.goto('/#/structures/schedule');await page.getByRole('button',{name:'材料核对',exact:true}).click();
 const editor=page.getByRole('dialog',{name:'任务详情与编辑',exact:true});await editor.getByLabel('任务名称',{exact:true}).fill('保留的旧草稿');
 await page.evaluate(async()=>{const snapshot=await(await fetch('/api/structures/snapshot')).json();const task={...snapshot.tasks.find((item:{id:string})=>item.id==='t2'),name:'另一个页面保存'};const response=await fetch('/api/structures/actions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({version:snapshot.version,action:{type:'task.save',task}})});if(!response.ok)throw Error('concurrent save fixture failed');location.hash='/structures/stages';});
 await expect(page.getByRole('button',{name:'推进下一阶段',exact:true})).toBeVisible();
 await page.getByRole('tab',{name:'任务与排程',exact:true}).click();
 await expect(page.getByRole('tabpanel').getByText('版本 2',{exact:true})).toBeVisible();
 await editor.getByRole('button',{name:'保存任务',exact:true}).click();
 await expect(editor.getByRole('alert')).toContainText('数据已更新');
 await expect(editor.getByLabel('任务名称',{exact:true})).toHaveValue('保留的旧草稿');
 expect(await page.evaluate(async()=>{const snapshot=await(await fetch('/api/structures/snapshot')).json();return snapshot.tasks.find((item:{id:string})=>item.id==='t2').name;})).toBe('另一个页面保存');
});
