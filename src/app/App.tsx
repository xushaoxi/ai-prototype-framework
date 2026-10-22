import { useEffect, useState } from 'react';
import { Avatar, Breadcrumb, Button, Drawer, Result, Tag } from 'antd';
import { BookOutlined, DatabaseOutlined, FileTextOutlined, MenuOutlined, SettingOutlined, TeamOutlined } from '@ant-design/icons';
import { modules, getModule } from '../modules/registry';
import { setScenario } from '../core/api';
import type { DemoRole, DemoScenario } from '../core/types';
import { LedgerPage } from '../core/ui/LedgerPage';
import { DemoSettings } from './DemoSettings';
import { GuidePage } from './GuidePage';
const currentRoute=()=>location.hash.replace(/^#\/?/,'')||'assets';
export function App() {
  const [route,setRoute]=useState(currentRoute);
  const [mobileNav,setMobileNav]=useState(false);
  const [settings,setSettings]=useState(false);
  const [role,setRole]=useState<DemoRole>('editor');
  const [scenario,changeScenario]=useState<DemoScenario>('normal');
  const [revision,setRevision]=useState(0);
  useEffect(()=>{const listener=()=>{setRoute(currentRoute());setMobileNav(false);window.scrollTo(0,0);};window.addEventListener('hashchange',listener);return()=>window.removeEventListener('hashchange',listener);},[]);
  const module=getModule(route);
  const title=module?.name??(route==='guide'?'使用指南':'页面未找到');
  useEffect(()=>{document.title=`${title} · 原型工作台`;},[title]);
  const nav=<><a className="brand" href="#/assets" aria-label="原型工作台首页"><span className="brand-mark"><span/><span/></span><span><strong>原型工作台</strong><small>业务原型框架</small></span></a><nav className="main-navigation" aria-label="主导航">{modules.map(item=><a key={item.id} href={`#/${item.id}`} className={route===item.id?'nav-item selected':'nav-item'} aria-current={route===item.id?'page':undefined}>{item.icon==='team'?<TeamOutlined/>:<FileTextOutlined/>}<span>{item.name}</span></a>)}<a className={route==='guide'?'nav-item selected':'nav-item'} href="#/guide" aria-current={route==='guide'?'page':undefined}><BookOutlined/><span>使用指南</span></a></nav><div className="sidebar-footer"><span className="version-label">V1.0</span><span><i/>Mock 演示环境</span></div></>;
  return <div className="workspace"><aside className="sidebar">{nav}</aside><Drawer placement="left" open={mobileNav} onClose={()=>setMobileNav(false)} size={256} styles={{body:{padding:0}}}>{nav}</Drawer><div className="workspace-body"><header className="topbar"><div className="topbar-left"><Button className="mobile-menu" type="text" aria-label="展开导航" icon={<MenuOutlined/>} onClick={()=>setMobileNav(true)}/><Breadcrumb items={[{title:'工作空间'},{title}]}/></div><div className="topbar-right">{role==='viewer'?<Tag color="default">只读演示</Tag>:null}{scenario!=='normal'?<Tag color="warning">{scenario==='slow'?'慢速响应':'错误响应'}</Tag>:null}<Button aria-label="演示设置" icon={<SettingOutlined/>} onClick={()=>setSettings(true)}>演示设置</Button><Avatar className="user-avatar">林</Avatar></div></header><main className="main-content" id="main-content">{module?<LedgerPage key={module.id} module={module} role={role} scenario={scenario} revision={revision}/>:route==='guide'?<GuidePage/>:<Result status="404" title="页面未找到" subTitle="该模块尚未注册，或链接已变更。" extra={<Button type="primary" href="#/assets">返回资产台账</Button>}/>}</main><div className="mobile-environment"><DatabaseOutlined/> 本地 Mock 演示</div></div><DemoSettings open={settings} onClose={()=>setSettings(false)} role={role} onRole={setRole} scenario={scenario} onScenario={value=>{setScenario(value);changeScenario(value);}} onDataChange={()=>setRevision(value=>value+1)}/></div>;
}
