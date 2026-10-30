import { useEffect, useId, useRef, useState } from 'react';
import { Alert, Button, Tag } from 'antd';
import { ArrowRightOutlined, CloseOutlined } from '@ant-design/icons';
import outline from '../../../docs/design/outline.md?raw';
import {chapterRuleIds,guideRules,guideRoute,resolveGuideTarget,exampleLabel} from './rule-index';
import research from '../../../docs/design/design-guidelines-research.md?raw';
import { parseChapters, safeExternalUrl } from './content';
import { MarkdownContent } from './MarkdownContent';

const chapters=parseChapters(outline);
const rules=guideRules;
const sources=[...new Map([...research.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g)]
  .flatMap(match=>{const href=safeExternalUrl(match[2]);return href?[[href,{label:match[1],href}] as const]:[];})).values()];

export function DesignGuideReader({selected,onSelect,compact=false,ruleId,onLocate,focusVersion=0}:{selected:string;onSelect:(id:string)=>void;compact?:boolean;ruleId?:string;onLocate?:(id:string)=>void;focusVersion?:number}){
  const prefix=useId();const root=useRef<HTMLDivElement>(null);const [localRule,setLocalRule]=useState<string>();const focusRule=ruleId??localRule;
  useEffect(()=>{if(!focusRule)return;const frame=requestAnimationFrame(()=>{const node=root.current?.querySelector<HTMLElement>(`[data-rule-id="${focusRule}"]`);node?.scrollIntoView({block:'start'});node?.focus({preventScroll:true});});return()=>cancelAnimationFrame(frame);},[focusRule,selected,focusVersion]);
  const locate=(id:string)=>{const chapter=Object.entries(chapterRuleIds).find(([,ids])=>ids.includes(id))?.[0];if(!chapter)return;if(onLocate)onLocate(id);else{setLocalRule(id);onSelect(chapter);}};
  const chapter=chapters.find(item=>item.id===selected)??chapters[0];
  const chapterRules=rules.filter(rule=>chapterRuleIds[chapter.id]?.includes(rule.id));
  return <div ref={root} className={`design-reader${compact?' compact':''}`}>
    <div className="design-chapter-picker"><label>选择设计章节<select aria-label="选择设计章节" value={chapter.id} onChange={event=>{setLocalRule(undefined);onSelect(event.target.value);}}>{chapters.map(item=><option key={item.id} value={item.id}>{item.id} {item.title}</option>)}</select></label></div>
    <label className="design-rule-picker">定位规则<select aria-label="定位设计规则" value={focusRule??''} onChange={event=>locate(event.target.value)}><option value="" disabled>选择规则编号或名称</option>{rules.map(rule=><option key={rule.id} value={rule.id}>{rule.id} · {rule.title}</option>)}</select></label>
    <article className="design-chapter" aria-label={`${chapter.title}章节`}>
      <div className="design-chapter-eyebrow">设计指南 / {chapter.id}</div>
      <h2>{chapter.title}</h2><Tag>{chapterRules.length?'V1 基础规则 · 实现与验证分别记录':'章节待完善'}</Tag>
      <MarkdownContent source={chapter.body}/>
      {chapter.id==='05'||chapter.id==='12'?<Button href="#/component-demo" aria-label="体验通用组件示例" icon={<ArrowRightOutlined/>}>体验通用组件示例</Button>:null}
      <Button href="#/patterns">查看结构与能力组合目录</Button>{chapter.id==='09'||chapter.id==='11'?<Button href="#/form-demo" aria-label="体验表单容器示例" icon={<ArrowRightOutlined/>}>体验表单容器示例</Button>:null}
      {chapterRules.length?chapterRules.map(rule=><section className="design-rule" data-rule-id={rule.id} id={`${prefix}-${rule.id}`} tabIndex={-1} key={rule.id}><Tag>{rule.id}</Tag><Tag color={rule.decision==='已确认'||rule.decision.startsWith('已采纳')?'green':'gold'}>决策：{rule.decision}</Tag><Tag>实现：{rule.implementation}</Tag><h3>{rule.title}</h3><dl className="rule-coverage"><dt>覆盖能力</dt><dd>{rule.coverage}</dd><dt>未覆盖</dt><dd>{rule.remaining}</dd><dt>验证状态</dt><dd>{rule.verification}</dd><dt>证据入口</dt><dd>{rule.evidence}</dd></dl><div className="rule-examples" aria-label={`${rule.id}对应示例`}>{rule.examples.filter(route=>exampleLabel(route)).map(route=><Button key={route} href={`#/${route}`} aria-label={`查看${rule.id}示例：${exampleLabel(route)}`}>{exampleLabel(route)} ↗</Button>)}<a href={guideRoute(rule.id)}>完整规则链接</a></div><MarkdownContent source={rule.body.replace(/^(决策状态|实现状态|覆盖能力|未覆盖|验证状态|证据入口|示例入口)：.*$/gm,'')}/></section>):<div className="design-next-step">本章尚无规则记录。</div>}
      <details className="design-sources"><summary>参考资料与官方指南</summary><p>来源的阅读范围见研究清单；规则是本项目适配，不代表厂商统一标准。</p><ul>{sources.map(source=><li key={source.href}><a href={source.href} target="_blank" rel="noopener noreferrer">{source.label} ↗</a></li>)}</ul></details>
    </article>
  </div>;
}
export function DesignGuidePage(){
  const [target,setTarget]=useState(()=>resolveGuideTarget(location.hash));const selected=target.chapter;const lastTarget=useRef(target);const [focusVersion,setFocusVersion]=useState(0);
  useEffect(()=>{lastTarget.current=target;},[target]);
  useEffect(()=>{const sync=()=>{if(!/^#\/design-guide(?:\?|$)/.test(location.hash))return;if(!location.hash.includes('?')){const previous=lastTarget.current;const hash=previous.rule?guideRoute(previous.rule):`#/design-guide?chapter=${previous.chapter}`;history.replaceState(null,'',hash);setTarget(resolveGuideTarget(hash));}else setTarget(resolveGuideTarget(location.hash));setFocusVersion(value=>value+1);};window.addEventListener('hashchange',sync);return()=>window.removeEventListener('hashchange',sync);},[]);
  const chooseChapter=(id:string)=>{setTarget({chapter:id});history.replaceState(null,'',`#/design-guide?chapter=${id}`);};
  const locate=(id:string)=>{setTarget(resolveGuideTarget(guideRoute(id)));location.hash=guideRoute(id).slice(1);};
  return <div className="design-guide-page"><div className="page-heading"><div><h1>设计指南</h1><p>从业务问题形成规则，在真实界面中验证。</p></div><Button href="#/assets" icon={<ArrowRightOutlined/>}>查看台账</Button></div>
    {target.error&&<Alert type="warning" className="rule-target-error" title={target.error}/>}<div className="design-guide-intro"><strong>16 个章节 · V1 基础规则</strong><p>基础规则已覆盖全部章节；能力边界、当前实现与验证结果分别记录；在台账页点击「对照指南」，可以边看规则边操作。</p></div>
    <div className="design-guide-layout"><nav className="design-chapter-nav" aria-label="设计章节">{chapters.map(item=><button key={item.id} type="button" aria-current={selected===item.id?'true':undefined} onClick={()=>chooseChapter(item.id)}><span>{item.id}</span>{item.title}</button>)}</nav><DesignGuideReader selected={selected} onSelect={chooseChapter} ruleId={target.rule} onLocate={locate} focusVersion={focusVersion}/></div>
  </div>;
}
export function DesignReference({selected,onSelect,onClose}:{selected:string;onSelect:(id:string)=>void;onClose:()=>void}){
  return <aside className="design-reference" aria-label="设计参考"><header><div><strong>设计参考</strong><p>规则与当前界面对照</p></div><Button type="text" aria-label="关闭设计参考" icon={<CloseOutlined/>} onClick={onClose}/></header><DesignGuideReader selected={selected} onSelect={onSelect} compact/></aside>;
}
