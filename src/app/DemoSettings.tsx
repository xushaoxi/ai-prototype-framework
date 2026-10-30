import { useRef, useState } from 'react';
import { App, Alert, Button, Divider, Drawer, Radio, Space } from 'antd';
import { DownloadOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons';
import { api } from '../core/api';
import type { DemoRole, DemoScenario } from '../core/types';
import { downloadText } from '../core/export-csv';

export function DemoSettings({open,onClose,role,onRole,scenario,onScenario,onDataChange}:{open:boolean;onClose:()=>void;role:DemoRole;onRole:(role:DemoRole)=>void;scenario:DemoScenario;onScenario:(scenario:DemoScenario)=>void;onDataChange:()=>void}) {
  const {message,modal}=App.useApp();
  const inputRef=useRef<HTMLInputElement>(null);
  const [busy,setBusy]=useState(false);
  const restore=()=>modal.confirm({focusable:{autoFocusButton:'cancel'},title:'重置演示数据',content:'当前浏览器中的已注册台账及其活动记录将恢复初始演示数据；能力组合与复杂结构不受影响。台账新增和修改的记录将被替换，建议先导出台账备份。',okText:'确认重置',cancelText:'取消',okButtonProps:{danger:true},onOk:async()=>{try{await api.reset();onDataChange();message.success('演示数据已重置');}catch(error){message.error(error instanceof Error?error.message:'重置失败，请稍后重试');throw error;}}});
  const backup=async()=>{setBusy(true);try{downloadText(await api.exportData(),`原型数据备份-${new Date().toISOString().slice(0,10)}.json`,'application/json');message.success('备份已导出');}catch(e){message.error(e instanceof Error?e.message:'备份失败');}finally{setBusy(false);}};
  const importFile=async(file:File)=>{
    if(file.size>2*1024*1024){message.error('备份文件不能超过 2MB');return;}
    const text=await file.text();
    modal.confirm({focusable:{autoFocusButton:'cancel'},title:'导入数据备份',content:'校验通过后将替换已注册台账及其活动记录；不影响能力组合和复杂结构。校验失败不会改动已有数据。',okText:'确认导入',cancelText:'取消',onOk:async()=>{try{await api.importData(text);onDataChange();message.success('备份已导入');}catch(e){message.error(e instanceof Error?e.message:'备份导入失败');throw e;}}});
  };
  return <Drawer title="演示设置" open={open} onClose={onClose} size={440}>
    <Alert type="info" showIcon title="独立业务仿真环境" description="无需后端服务。这里的角色与响应仅用于原型验证，演示数据在当前浏览器处理，不连接正式业务后端。"/>
    <section className="settings-section"><h3>演示角色</h3><p className="muted">切换界面的操作权限，验证不同使用方式。</p><Radio.Group value={role} onChange={event=>onRole(event.target.value)}><Space orientation="vertical"><Radio value="editor">业务编辑</Radio><Radio value="viewer">只读浏览</Radio></Space></Radio.Group><p className="settings-note">角色限制属于交互仿真，不提供服务端安全控制。</p></section>
    <Divider/>
    <section className="settings-section"><h3>响应场景</h3><p className="muted">验证加载反馈与失败恢复。</p><Radio.Group value={scenario} onChange={event=>onScenario(event.target.value)}><Space orientation="vertical"><Radio value="normal">正常响应</Radio><Radio value="slow">慢速响应</Radio><Radio value="error">错误响应</Radio></Space></Radio.Group></section>
    <Divider/>
    <section className="settings-section"><h3>数据备份</h3><p className="muted">仅备份已注册台账及其活动记录，不包含能力组合、复杂结构、界面偏好或未保存输入。可在兼容版本中恢复。</p><Space wrap><Button icon={<DownloadOutlined/>} onClick={()=>void backup()} loading={busy}>导出 JSON</Button><Button icon={<UploadOutlined/>} disabled={role==='viewer'} onClick={()=>inputRef.current?.click()}>导入 JSON</Button></Space><input ref={inputRef} type="file" accept="application/json,.json" hidden aria-label="选择数据备份" onChange={event=>{const file=event.target.files?.[0];if(file)void importFile(file);event.target.value='';}}/></section>
    <Divider/>
    <section className="settings-section"><h3>重新开始</h3><p className="muted">仅清除已注册台账及其活动记录的修改，恢复初始台账数据。</p><Button danger icon={<ReloadOutlined/>} disabled={role==='viewer'} onClick={restore}>重置演示数据</Button></section>
  </Drawer>;
}
