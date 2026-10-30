import guidelines from '../../../docs/design/design-guidelines.md?raw';
import {parseRules} from './content';
export const chapterRuleIds:Record<string,string[]>={
  '01':['PAGE-004','PATTERN-001','PAGE-001','PRINCIPLE-001'],
  '02':['NAV-002','NAV-001','LAYOUT-001','FORM-008'],
  '03':['PAGE-002','PAGE-003','LAYOUT-001'],
  '04':['THEME-001','VISUAL-001'],
  '05':['COMPONENT-001','FORM-006'],
  '06':['PAGE-003','QUERY-001','QUERY-002','QUERY-003','QUERY-004'],
  '07':['PAGE-002','PAGE-003','COL-001','COL-004','LIST-002','TABLE-001'],
  '08':['LIST-001','METRIC-001'],
  '09':['FORM-001','FORM-004','FORM-005','FORM-006','FORM-007','FORM-008','EDIT-001'],
  '10':['DETAIL-001'],
  '11':['FORM-001','FORM-008','CONTAINER-001'],
  '12':['FEEDBACK-001','FORM-007'],
  '13':['COL-002','RISK-001'],
  '14':['CONTENT-001'],
  '15':['ACCESS-001','LIST-002'],
  '16':['MAINTAIN-001'],
};
export const guideRules=parseRules(guidelines);
export const guideRoute=(id:string)=>`#/design-guide?rule=${encodeURIComponent(id)}`;
export function resolveGuideTarget(hash:string):{chapter:string;rule?:string;error?:string}{
 const params=new URLSearchParams(hash.split('?')[1]??'');const id=params.get('rule');
 if(id){const chapter=Object.entries(chapterRuleIds).find(([,ids])=>ids.includes(id))?.[0];return chapter&&guideRules.some(rule=>rule.id===id)?{chapter,rule:id}:{chapter:'01',error:`未找到规则：${id}`};}
 const chapter=params.get('chapter')??'01';return Object.hasOwn(chapterRuleIds,chapter)?{chapter}:{chapter:'01',error:'未找到所选章节'};
}
export function rulesForExample(route:string){return guideRules.filter(rule=>rule.examples.includes(route));}

export function exampleLabel(route:string){
 const names:Record<string,string>={assets:'标准查询表格',vendors:'供应商适配样例','component-demo':'组件与状态','form-demo':'布局与容器','patterns':'能力组合目录'};
 return (Object.hasOwn(names,route)?names[route]:undefined)??(route.startsWith('structures/')&&Object.hasOwn(structureTitles,route.slice(11))?structureTitles[route.slice(11)]:undefined)??(route.startsWith('patterns/')?patternCatalog.find(item=>item.id===route.slice(9))?.title:undefined);
}
import {structureTitles} from '../../core/structures/types';
import {patternCatalog} from '../patterns/catalog';
