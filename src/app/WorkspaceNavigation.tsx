import {structureTitles} from '../core/structures/types';
import {useEffect,useId,useRef} from 'react';
import {BookOutlined,FileTextOutlined,LayoutOutlined,TeamOutlined} from '@ant-design/icons';
import {modules} from '../modules/registry';
import {findPattern} from './patterns/catalog';
interface NavigationItem {route:string;title:string;icon:'page'|'team'|'book'|'layout'}
const queryModule=modules.find(item=>item.id==='assets')??modules[0];
const customModules=modules.filter(item=>!['assets','vendors'].includes(item.id));
const groups:{title:string;items:NavigationItem[]}[]=[
 {title:'规范与基础',items:[{route:'design-guide',title:'设计指南',icon:'book'},{route:'component-demo',title:'组件与状态示例',icon:'layout'},{route:'guide',title:'使用指南',icon:'book'}]},
 {title:'页面结构',items:[...(queryModule?[{route:queryModule.id,title:'查询表格',icon:'page' as const}]:[]),{route:'patterns/grouped-form',title:'表单录入',icon:'layout'},...Object.entries(structureTitles).map(([id,title])=>({route:`structures/${id}`,title,icon:'layout' as const})),{route:'form-demo',title:'布局与容器',icon:'layout'}]},
 {title:'组合与反馈',items:[{route:'patterns',title:'能力组合目录',icon:'layout'}]},
 ...(customModules.length?[{title:'业务模块',items:customModules.filter(item=>item.id!==queryModule?.id).map(item=>({route:item.id,title:item.name,icon:'page' as const}))}].filter(group=>group.items.length):[]),
];
export function WorkspaceNavigation({route}:{route:string}){
 const prefix=useId();const nav=useRef<HTMLElement>(null);
 const currentPattern=route.startsWith('patterns/')?findPattern(route.slice(9)):undefined;
 const selected=route==='patterns/record-detail'?'structures/detail':route==='patterns/dashboard'?'structures/analysis':route.startsWith('form-demo')?'form-demo':['assets','vendors'].includes(route)?queryModule?.id??route:currentPattern?.family==='form'?'patterns/grouped-form':route==='patterns/record-detail'||route==='patterns/dashboard'?route:currentPattern?'patterns':route;
 useEffect(()=>{
  const root=nav.current;const item=root?.querySelector<HTMLElement>('[aria-current="page"]');
  if(!root||!item||root.clientHeight===0)return;
  const area=root.getBoundingClientRect();const box=item.getBoundingClientRect();
  if(box.top<area.top)root.scrollTop-=area.top-box.top;
  else if(box.bottom>area.bottom)root.scrollTop+=box.bottom-area.bottom;
 },[selected]);
 return <><a className="brand" href={`#/${queryModule?.id??'patterns'}`} aria-label="原型工作台首页"><span className="brand-mark"><span/><span/></span><span><strong>原型工作台</strong><small>业务原型框架</small></span></a>
 <nav ref={nav} className="main-navigation flat-navigation" aria-label="主导航">{groups.map((group,index)=><section className="nav-group" key={group.title} aria-labelledby={`${prefix}-${index}`}><h2 className="nav-group-title" id={`${prefix}-${index}`}>{group.title}</h2>{group.items.map(item=><a key={item.route} href={`#/${item.route}`} aria-label={item.title} title={item.title} className={selected===item.route?'nav-item selected':'nav-item'} aria-current={selected===item.route?'page':undefined}>{item.icon==='team'?<TeamOutlined aria-hidden/>:item.icon==='book'?<BookOutlined aria-hidden/>:item.icon==='page'?<FileTextOutlined aria-hidden/>:<LayoutOutlined aria-hidden/>}<span>{item.title}</span></a>)}</section>)}</nav>
 <div className="sidebar-footer"><span className="version-label">V1.0</span><span><i/>Mock 演示环境</span></div></>;
}
