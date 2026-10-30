import {Button,Popover} from 'antd';
import {BookOutlined} from '@ant-design/icons';
import {guideRoute,guideRules,rulesForExample} from './rule-index';
export function RuleLinks({ids}:{ids:string[]}){return <span className="rule-links">{ids.filter(id=>guideRules.some(rule=>rule.id===id)).map(id=><a key={id} href={guideRoute(id)}>{id}</a>)}</span>;}
export function ApplicableRules({route}:{route:string}){
 const rules=rulesForExample(route.startsWith('form-demo/')?'form-demo':route);
 return rules.length?<Popover trigger="click" title="适用规则" content={<nav className="applicable-rules" aria-label="适用设计规则">{rules.map(rule=><a key={rule.id} href={guideRoute(rule.id)}>{rule.id} · {rule.title}</a>)}</nav>}><Button icon={<BookOutlined/>} aria-label="适用规则"><span className="topbar-control-label">适用规则</span></Button></Popover>:null;
}
