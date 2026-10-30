import {Button,Card,Input,Tag} from 'antd';
import {useState} from 'react';
import {RuleLinks} from '../design-guide/RuleLinks';
import {pageStructures} from '../structures/catalog';
import {patternCatalog} from './catalog';
import {compatibilityPatterns,patternRecipes} from './recipes';
import './patterns.css';
export function PatternLibrary(){
 const [keyword,setKeyword]=useState('');const query=keyword.trim();
 const structures=pageStructures.filter(item=>`${item.title}${item.task}${item.keywords}`.includes(query));
 const filtered=patternRecipes.filter(recipe=>[recipe.title,recipe.task,recipe.when,...recipe.variants.map(id=>patternCatalog.find(item=>item.id===id)?.title??'')].some(text=>text.includes(query)));
 return <div className="pattern-library"><h1>能力组合目录</h1><p>从任务选择结构，再按需组合能力。业务名称仅解释样例；每个入口说明适用与不适用条件。</p><Input aria-label="查找页面模板" placeholder="按任务、能力或样例名称查找" value={keyword} onChange={event=>setKeyword(event.target.value)} allowClear/><div className="pattern-links"><Button href="#/assets">标准查询表格</Button><Button href="#/component-demo">基础组件与状态</Button><Button href="#/form-demo">容器选择</Button><Button href="#/design-guide">设计指南</Button></div><h2>页面结构</h2><div className="pattern-grid">{structures.map(item=><Card key={item.id} title={item.title} size="small"><p>{item.task}</p><p className="pattern-reuse">规则：<RuleLinks ids={item.rule.split('/').map(id=>id.trim())}/> · 复用：{item.reuse}</p><Button type="link" href={`#/${item.route}`} aria-label={`体验${item.title}`}>体验结构</Button></Card>)}</div><h2>组合能力与变体</h2><div className="pattern-grid">{filtered.map(recipe=><Card key={recipe.id} title={recipe.title} size="small"><p>{recipe.task}</p><p className="pattern-reuse">适用：{recipe.when}</p><p className="pattern-reuse">边界：{recipe.avoid}</p><Tag>本地仿真示例</Tag><div className="pattern-links">{recipe.variants.map(id=>{const pattern=patternCatalog.find(item=>item.id===id)!;return <Button type="link" key={id} href={`#/patterns/${id}`} aria-label={`打开${pattern.title}`}>{pattern.title}</Button>;})}</div></Card>)}</div>{!filtered.length&&!structures.length&&<p role="status">没有匹配的结构，请调整关键词；无法匹配的需求使用显式扩展。</p>}<details className="pattern-compatibility"><summary>旧业务样例兼容入口</summary><p>保留已有地址与演示数据，以下是组合适配样例，不作为新页面结构或完整业务系统。</p>{compatibilityPatterns.filter(pattern=>`${pattern.title}${pattern.purpose}`.includes(query)).map(pattern=><Button key={pattern.id} type="link" href={`#/patterns/${pattern.id}`} aria-label={`打开${pattern.title}`}>{pattern.title}</Button>)}</details></div>;
}
