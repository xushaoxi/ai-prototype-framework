import {test,expect} from './fixtures';

test('PAT-ADMIN-001 organization save and reload persists',async({page})=>{
 await page.goto('/#/patterns/organization');
 await page.getByRole('button',{name:'新增组织',exact:true}).click();
 await page.getByLabel('组织名称',{exact:true}).fill('测试组织');
 await page.getByRole('button',{name:'保存组织',exact:true}).click();
 await expect(page.getByRole('tree').getByText('测试组织')).toBeVisible();
 await page.reload();await expect(page.getByRole('tree').getByText('测试组织')).toBeVisible();
});
test('PAT-ADMIN-002 role permissions are persisted',async({page})=>{
 await page.goto('/#/patterns/roles');await page.getByRole('button',{name:'新增角色',exact:true}).click();
 await page.getByLabel('角色名称',{exact:true}).fill('测试审核员');
 await page.getByText('审批处理',{exact:true}).click();
 await page.getByRole('button',{name:'保存角色',exact:true}).click();
 await expect(page.getByRole('tree').getByText('测试审核员')).toBeVisible();
 await page.reload();await page.getByRole('tree').getByText('测试审核员').click();
 await expect(page.getByLabel('审批处理',{exact:true})).toBeChecked();
});
test('PAT-ADMIN-003 user creation validates required fields',async({page})=>{
 await page.goto('/#/patterns/users');await page.getByRole('button',{name:'新增用户',exact:true}).click();
 await page.getByRole('button',{name:'保存用户',exact:true}).click();await expect(page.getByText('请输入用户姓名',{exact:true})).toBeVisible();
 await page.getByLabel('用户姓名',{exact:true}).fill('测试用户');await page.getByLabel('邮箱',{exact:true}).fill('invalid');
 await page.getByRole('button',{name:'保存用户',exact:true}).click();await expect(page.getByText('请输入有效邮箱',{exact:true})).toBeVisible();
});
test('PAT-ADMIN-004 settings save and persist',async({page})=>{
 await page.goto('/#/patterns/settings');await page.getByLabel('系统名称',{exact:true}).fill('配置持久化测试');
 await page.getByRole('button',{name:'保存设置',exact:true}).click();await expect(page.getByRole('status').getByText('设置已保存')).toBeVisible();
 await page.reload();await expect(page.getByLabel('系统名称',{exact:true})).toHaveValue('配置持久化测试');
});
test('PAT-ADMIN-005 dashboard metrics and accessible charts',async({page})=>{
 await page.goto('/#/patterns/dashboard');await expect(page.getByRole('img',{name:'记录状态柱状图'})).toBeVisible();
 await expect(page.getByRole('img',{name:'登记日期趋势图'})).toBeVisible();await expect(page.getByRole('img',{name:'审批进度环图'})).toBeVisible();
});
test('PAT-ADMIN-006 login simulation validates and recovers',async({page})=>{
 await page.goto('/#/patterns/login');await page.getByRole('button',{name:'模拟登录',exact:true}).click();
 await expect(page.getByText('请输入演示账号',{exact:true})).toBeVisible();
 await page.getByLabel('演示账号',{exact:true}).fill('demo');await page.getByRole('button',{name:'模拟登录',exact:true}).click();
 await expect(page.getByText('登录仿真成功',{exact:true})).toBeVisible();
});
test('PAT-ADMIN-007 mobile admin pages avoid full page overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 for(const route of ['organization','users','roles','dashboard','settings','account','messages','audit','login','results']){
  await page.goto(`/#/patterns/${route}`);await expect(page.locator('.admin-patterns:visible')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
 }
});
test('PAT-ADMIN-008 messages marking read persists',async({page})=>{
 await page.goto('/#/patterns/messages');await page.getByRole('button',{name:'全部标为已读',exact:true}).click();
 await expect(page.getByRole('button',{name:'全部标为已读',exact:true})).toBeDisabled();
 await page.reload();await expect(page.getByRole('button',{name:'全部标为已读',exact:true})).toBeDisabled();
});
test('PAT-ADMIN-009 readonly simulation disables writing',async({page})=>{
 await page.goto('/#/patterns/organization');await page.getByRole('switch',{name:'只读角色（仿真）',exact:true}).click();
 await expect(page.getByRole('button',{name:'新增组织',exact:true})).toBeDisabled();
});
test('PAT-ADMIN-010 referenced organization deletion is rejected',async({page})=>{
 await page.goto('/#/patterns/organization');await page.getByRole('tree').getByText('示例集团',{exact:true}).click();
 await page.getByRole('button',{name:'删除组织',exact:true}).click();await page.getByRole('button',{name:'确认删除',exact:true}).click();
 await expect(page.getByText('组织被子组织或用户引用',{exact:true})).toBeVisible();await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByRole('tree').getByText('示例集团',{exact:true})).toBeVisible();
});
test('PAT-ADMIN-011 account profile save persists',async({page})=>{
 await page.goto('/#/patterns/account');await page.getByLabel('用户姓名',{exact:true}).fill('资料测试用户');
 await page.getByRole('button',{name:'保存资料',exact:true}).click();await expect(page.getByRole('status').getByText('个人资料已保存')).toBeVisible();
 await page.reload();await expect(page.getByLabel('用户姓名',{exact:true})).toHaveValue('资料测试用户');
});
test('PAT-ADMIN-012 error result supports recovery',async({page})=>{
 await page.goto('/#/patterns/results');await page.getByRole('button',{name:'返回演示内容',exact:true}).click();
 await expect(page.getByText('已恢复演示内容',{exact:true})).toBeVisible();
});
test('PAT-ADMIN-013 user organization role and disabled status persist',async({page})=>{
 await page.goto('/#/patterns/users');await page.getByRole('button',{name:'新增用户',exact:true}).click();
 await page.getByLabel('用户姓名',{exact:true}).fill('持久化用户');await page.getByLabel('邮箱',{exact:true}).fill('saved@example.test');
 await page.getByLabel('所属组织',{exact:true}).click();await page.locator('.ant-select-dropdown:visible').getByText('研发部',{exact:true}).click();
 await page.getByLabel('用户角色',{exact:true}).click();await page.locator('.ant-select-dropdown:visible').getByText('演示查看者',{exact:true}).click();
 await page.getByLabel('用户姓名',{exact:true}).click();await page.getByLabel('启用用户',{exact:true}).click();
 await page.getByRole('button',{name:'保存用户',exact:true}).click();
 await expect(page.getByRole('row').filter({hasText:'持久化用户'})).toContainText('停用');
 await page.reload();await expect(page.getByRole('row').filter({hasText:'持久化用户'})).toContainText('演示查看者');
});
test('PAT-ADMIN-014 pristine user dialog closes directly and dirty dialog protects input',async({page})=>{
 await page.goto('/#/patterns/users');await page.getByRole('button',{name:'新增用户',exact:true}).click();
 await page.getByRole('button',{name:'关闭',exact:true}).click();await expect(page.getByRole('dialog')).not.toBeVisible();
 await page.getByRole('button',{name:'新增用户',exact:true}).click();await page.getByLabel('用户姓名',{exact:true}).fill('未保存用户');
 await page.getByRole('button',{name:'关闭',exact:true}).click();await expect(page.getByRole('dialog',{name:'放弃未保存的修改？',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'继续编辑',exact:true}).click();await expect(page.getByLabel('用户姓名',{exact:true})).toHaveValue('未保存用户');
});
test('PAT-ADMIN-015 switching organization protects edits',async({page})=>{
 await page.goto('/#/patterns/organization');await page.getByRole('tree').getByText('技术中心',{exact:true}).click();
 await page.getByLabel('组织名称',{exact:true}).fill('技术中心修改');await page.getByRole('tree').getByText('运营中心',{exact:true}).click();
 await expect(page.getByRole('dialog',{name:'放弃未保存的修改？',exact:true})).toBeVisible();await page.getByRole('button',{name:'继续编辑',exact:true}).click();
 await expect(page.getByLabel('组织名称',{exact:true})).toHaveValue('技术中心修改');
});
test('PAT-ADMIN-016 settings closing workspace tab protects edits',async({page})=>{
 await page.goto('/#/patterns/settings');await page.getByLabel('系统名称',{exact:true}).fill('未保存设置');
 await page.getByRole('link',{name:'返回组合目录',exact:true}).click();
 await page.getByRole('button',{name:'关闭系统设置标签页',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'放弃未保存的修改？',exact:true})).toBeVisible();
});
test('PAT-ADMIN-017 FORM-007 validates on first submit then rechecks failed fields and focuses summary',async({page})=>{
 await page.goto('/#/patterns/users');await page.getByRole('button',{name:'新增用户',exact:true}).click();const dialog=page.getByRole('dialog',{name:'新增用户',exact:true});
 const name=dialog.getByLabel('用户姓名',{exact:true});await name.fill('临时输入');await name.clear();await dialog.getByLabel('邮箱',{exact:true}).focus();
 await expect(dialog.getByText('请输入用户姓名',{exact:true})).toHaveCount(0);
 await dialog.getByRole('button',{name:'保存用户',exact:true}).click();await expect(dialog.getByText('有 4 项需要修改，请查看字段下的提示。',{exact:true})).toBeVisible();await expect(name).toBeFocused();
 await name.fill('修复姓名');await expect(dialog.getByText('有 3 项需要修改，请查看字段下的提示。',{exact:true})).toBeVisible();
 await dialog.getByRole('button',{name:'定位第一个错误',exact:true}).click();await expect(dialog.getByLabel('邮箱',{exact:true})).toBeFocused();
});
