import { test as base, expect } from '@playwright/test';
export const test=base.extend<{browserErrors:string[]}>({
  browserErrors:[async({page},use,testInfo)=>{
    const errors:string[]=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',message=>{
      if(message.type()!=='error')return;
      const text=message.text();
      // 仅错误场景用例中明确预期的503资源日志，不屏蔽应用异常。
      if(testInfo.title.includes('AST-007/009')&&text.startsWith('Failed to load resource:')&&text.includes('503'))return;
      if(testInfo.title.includes('FORM-007/API-400')&&text.startsWith('Failed to load resource:')&&text.includes('400'))return;
      // This case asserts that the real API rejects deleting a referenced organization.
      if(testInfo.title.startsWith('STR-RECOVERY')&&text.startsWith('Failed to load resource:')&&text.includes('409'))return;
      if(testInfo.title.startsWith('PAT-ADMIN-010')&&text.startsWith('Failed to load resource:')&&text.includes('409'))return;
      // Only this explicit failure-isolation demo expects React's caught render error.
      if(testInfo.title.startsWith('STR-WIDGET-BOUNDARY')&&text.includes('STRUCTURE_WIDGET_DEMO_FAILURE'))return;
      errors.push(text);
    });
    await use(errors);
    expect(errors,'从首次导航开始记录的浏览器异常').toEqual([]);
  },{auto:true}],
});
export { expect };
