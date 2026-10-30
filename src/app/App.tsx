import {StructurePage} from './structures/StructurePage';
import {structureTitles} from '../core/structures/types';
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Avatar, Breadcrumb, Button, Drawer, Result, Tag } from 'antd';
import { BookOutlined, DatabaseOutlined, MenuOutlined, MenuFoldOutlined, MenuUnfoldOutlined, SettingOutlined } from '@ant-design/icons';
import { getModule } from '../modules/registry';
import { setScenario } from '../core/api';
import type { DemoRole, DemoScenario } from '../core/types';
import { LedgerPage } from '../core/ui/LedgerPage';
import { DemoSettings } from './DemoSettings';
import { GuidePage } from './GuidePage';
import {useWorkspaceExitRegistry} from '../core/ui/workspace-exit';
import {PatternLibrary} from './patterns/PatternLibrary';
import {PatternPage} from './patterns/PatternPage';
import {findPattern} from './patterns/catalog';
import {ComponentExamples} from './design-guide/ComponentExamples';
import {WorkspaceExitProvider,WorkspaceExitScope} from '../core/ui/WorkspaceExit';
import {WorkspaceNavigation} from './WorkspaceNavigation';
import { WorkspaceTabs } from './WorkspaceTabs';
import {ApplicableRules} from './design-guide/RuleLinks';
import { DesignGuidePage, DesignGuideReader, DesignReference } from './design-guide/DesignGuide';
import { FormContainerExample, FormContainerFullPage } from './design-guide/FormContainerExample';
const wideQuery=window.matchMedia('(min-width: 1360px)');
const subscribeWide=(listener:()=>void)=>{wideQuery.addEventListener('change',listener);return ()=>wideQuery.removeEventListener('change',listener);};
const currentRoute=()=>{const value=location.hash.replace(/^#\/?/,'')||'assets';return value.startsWith('design-guide?')?'design-guide':value;};
const knownRoute=(route:string)=>Boolean(route.startsWith('structures/')&&Object.hasOwn(structureTitles,route.slice(11)))||Boolean(getModule(route))||route==='patterns'||(route.startsWith('patterns/')&&Boolean(findPattern(route.slice(9))))||['guide','design-guide','component-demo','form-demo','form-demo/full/new','form-demo/full/edit'].includes(route);
const navigationGroup=(route:string)=>{
 if(['guide','design-guide','component-demo'].includes(route))return '规范与基础';
 if(route.startsWith('structures/')||route.startsWith('form-demo')||['assets','vendors','patterns/record-detail','patterns/dashboard'].includes(route))return '页面结构';
 if(route.startsWith('patterns/')&&findPattern(route.slice(9))?.family==='form')return '页面结构';
 return route==='patterns'||route.startsWith('patterns/')?'组合与反馈':'业务模块';
};
const pageTitle=(route:string)=>(route.startsWith('structures/')&&Object.hasOwn(structureTitles,route.slice(11))?structureTitles[route.slice(11)]:undefined)??getModule(route)?.name??(route==='patterns'?'能力组合目录':route.startsWith('patterns/')?findPattern(route.slice(9))?.title??'页面未找到':route==='guide'?'使用指南':route==='design-guide'?'设计指南':route==='component-demo'?'组件与状态示例':route==='form-demo'?'表单容器示例':route==='form-demo/full/new'?'新增示例资产':route==='form-demo/full/edit'?'编辑示例资产':'页面未找到');
export function App() {
  const exits=useWorkspaceExitRegistry();
  const [route,setRoute]=useState(currentRoute);
  const [pages,setPages]=useState<string[]>(()=>knownRoute(currentRoute())?[currentRoute()]:[]);
  const activeRoute=useRef(currentRoute());
  const scrollPositions=useRef(new Map<string,number>());
  const closingRoute=useRef<string|null>(null);
  const [mobileNav,setMobileNav]=useState(false);
  const [collapsed,setCollapsed]=useState(false);
  const [settings,setSettings]=useState(false);
  const [referenceOpen,setReferenceOpen]=useState(false);
  const [chapter,setChapter]=useState('08');
  const wide=useSyncExternalStore(subscribeWide,()=>wideQuery.matches);
  const [role,setRole]=useState<DemoRole>('editor');
  const [scenario,changeScenario]=useState<DemoScenario>('normal');
  const [revision,setRevision]=useState(0);
  useEffect(()=>{
    const listener=()=>{
      const next=currentRoute();
      if(closingRoute.current!==activeRoute.current)scrollPositions.current.set(activeRoute.current,window.scrollY);
      closingRoute.current=null;
      activeRoute.current=next;
      setPages(current=>knownRoute(next)&&!current.includes(next)?[...current,next]:current);
      setRoute(next);setMobileNav(false);setReferenceOpen(false);if(next.startsWith('patterns/'))window.dispatchEvent(new Event('pattern-data-changed'));
    };
    window.addEventListener('hashchange',listener);
    return()=>window.removeEventListener('hashchange',listener);
  },[]);
  useLayoutEffect(()=>{
    const frame=requestAnimationFrame(()=>window.scrollTo(0,scrollPositions.current.get(route)??0));
    return()=>cancelAnimationFrame(frame);
  },[route]);
  const navigate=(page:string)=>{window.location.assign(`#/${page}`);};
  const closePage=(page:string)=>{if(pages.length<2)return;exits.request(page,()=>removePage(page));};
  const removePage=(page:string)=>{
    if(pages.length<2)return;
    const index=pages.indexOf(page);
    const next=pages[Math.max(0,index-1)]===page?pages[index+1]:pages[Math.max(0,index-1)];
    setPages(current=>current.filter(item=>item!==page));
    scrollPositions.current.delete(page);
    if(route===page){closingRoute.current=page;navigate(next);}
    requestAnimationFrame(()=>document.getElementById(`workspace-tab-${route===page?next:route}`)?.focus({preventScroll:true}));
  };
  const closeExampleFull=(page:string)=>{
    closingRoute.current=page;
    setPages(current=>current.filter(item=>item!==page));
    scrollPositions.current.delete(page);
    navigate('form-demo');
  };
  const module=getModule(route);
  const title=pageTitle(route);
  useEffect(()=>{document.title=`${title} · 原型工作台`;},[title]);
  const nav=<WorkspaceNavigation route={route}/>;
  return <WorkspaceExitProvider value={exits}><div className={`workspace${collapsed?' sidebar-collapsed':''}`}><aside className="sidebar">{nav}</aside><Drawer placement="left" open={mobileNav} onClose={()=>setMobileNav(false)} size={256} className="workspace-mobile-nav" styles={{body:{padding:0,display:'flex',flexDirection:'column',overflow:'hidden'}}}>{nav}</Drawer>
    <div className="workspace-body">
      <header className="topbar"><div className="topbar-left"><Button className="mobile-menu" type="text" aria-label="展开导航" icon={<MenuOutlined/>} onClick={()=>setMobileNav(true)}/><Button className="desktop-menu" type="text" aria-label={collapsed?'展开侧栏':'收起侧栏'} aria-expanded={!collapsed} icon={collapsed?<MenuUnfoldOutlined/>:<MenuFoldOutlined/>} onClick={()=>setCollapsed(value=>!value)}/><Breadcrumb items={[{title:'原型工作台'},{title:navigationGroup(route)},{title}]}/></div>
        <div className="topbar-right">{!module&&route!=='design-guide'?<ApplicableRules route={route}/>:null}{role==='viewer'?<Tag color="default">只读演示</Tag>:null}{scenario!=='normal'?<Tag color="warning">{scenario==='slow'?'慢速响应':'错误响应'}</Tag>:null}
          {module?<Button aria-label="对照指南" title="对照指南" icon={<BookOutlined/>} onClick={()=>setReferenceOpen(value=>!value)} aria-expanded={referenceOpen}><span className="topbar-control-label">对照指南</span></Button>:null}
          <Button aria-label="演示设置" title="演示设置" icon={<SettingOutlined/>} onClick={()=>setSettings(true)}><span className="topbar-control-label">演示设置</span></Button><Avatar className="user-avatar">林</Avatar>
        </div>
      </header>
      <div className="workspace-page-tabs"><WorkspaceTabs pages={pages} active={route} title={pageTitle} onSelect={navigate} onClose={closePage}/></div>
      <main className={`main-content${module&&referenceOpen&&wide?' with-design-reference':''}`} id="main-content">
        {pages.map(page=>{
          const item=getModule(page);const active=page===route;
          return <section key={page} id={`workspace-panel-${page}`} role="tabpanel" aria-labelledby={`workspace-tab-${page}`} hidden={!active}>
            <WorkspaceExitScope page={page}>{item?<div className="ledger-with-reference"><div className="ledger-primary"><LedgerPage module={item} active={active} role={role} scenario={scenario} revision={revision}/></div>{active&&referenceOpen&&wide?<DesignReference selected={chapter} onSelect={setChapter} onClose={()=>setReferenceOpen(false)}/>:null}</div>:page.startsWith('structures/')?<StructurePage id={page.slice(11)} active={active} readOnly={role==='viewer'}/>:page==='guide'?<GuidePage/>:page==='design-guide'?<DesignGuidePage/>:page==='patterns'?<PatternLibrary/>:page.startsWith('patterns/')?<PatternPage id={page.slice(9)} active={active}/>:page==='component-demo'?<ComponentExamples/>:page==='form-demo'?<FormContainerExample active={active}/>:<FormContainerFullPage mode={page==='form-demo/full/edit'?'edit':'new'} active={active} onClose={()=>closeExampleFull(page)}/>}</WorkspaceExitScope>
          </section>;
        })}
        {!knownRoute(route)?<Result status="404" title="页面未找到" subTitle="该模块尚未注册，或链接已变更。" extra={<Button type="primary" href="#/assets">返回资产台账</Button>}/>:null}
      </main><div className="mobile-environment"><DatabaseOutlined/> 本地 Mock 演示</div>
    </div>
    <Drawer title="设计参考" open={Boolean(module)&&referenceOpen&&!wide} onClose={()=>setReferenceOpen(false)} size="min(440px, 100vw)" destroyOnHidden><DesignGuideReader selected={chapter} onSelect={setChapter} compact/></Drawer>
    <DemoSettings open={settings} onClose={()=>setSettings(false)} role={role} onRole={setRole} scenario={scenario} onScenario={value=>{setScenario(value);changeScenario(value);window.dispatchEvent(new Event('pattern-data-changed'));}} onDataChange={()=>setRevision(value=>value+1)}/>
  </div></WorkspaceExitProvider>;
}
