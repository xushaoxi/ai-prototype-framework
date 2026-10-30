import {it,expect} from 'vitest';
import {readFileSync,existsSync} from 'node:fs';
import {parseRules} from '../../src/app/design-guide/content';
import {chapterRuleIds,resolveGuideTarget,guideRoute,exampleLabel} from '../../src/app/design-guide/rule-index';
const requirePath=(path:string)=>existsSync(path);
it('DG-005 resolves known rules, chapter reload and unknown targets explicitly',()=>{
 expect(resolveGuideTarget('#/design-guide?rule=COL-002')).toMatchObject({chapter:'13',rule:'COL-002'});
 expect(resolveGuideTarget('#/design-guide?rule=UNKNOWN-999').error).toBeTruthy();
 expect(resolveGuideTarget('#/design-guide?chapter=08').chapter).toBe('08');
 expect(guideRoute('PAGE-003')).toBe('#/design-guide?rule=PAGE-003');
});
it('DG-006 all rules have scoped coverage, verification and known examples',()=>{
 const rules=parseRules(readFileSync('docs/design/design-guidelines.md','utf8'));
 for(const rule of rules){expect(Object.values(chapterRuleIds).flat()).toContain(rule.id);expect(rule.coverage,rule.id).not.toBe('未记录');expect(rule.remaining,rule.id).not.toBe('未记录');expect(rule.verification,rule.id).not.toBe('未记录');expect(rule.evidence,rule.id).not.toBe('未记录');expect(rule.examples.length,rule.id).toBeGreaterThan(0);for(const route of rule.examples)expect(typeof exampleLabel(route),route).toBe('string');for(const path of rule.evidence.split('、'))expect(requirePath(path),path).toBe(true);}
});
