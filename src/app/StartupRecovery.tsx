import { useState } from 'react';
import { STORAGE_KEY } from '../core/storage-key';
import { downloadText } from '../core/export-csv';
export function StartupRecovery({error}:{error:unknown}) {
  const [confirm,setConfirm]=useState(false);
  const [storageError,setStorageError]=useState('');
  const backup=()=>{try{const raw=localStorage.getItem(STORAGE_KEY);downloadText(raw??'{}',`prototype-recovery-${Date.now()}.json`,'application/json');}catch{setStorageError('浏览器不允许读取本地存储，请检查浏览器设置。');}};
  const reset=()=>{try{localStorage.removeItem(STORAGE_KEY);location.reload();}catch{setStorageError('无法清除本地数据，请检查浏览器存储权限。');}};
  return <main className="startup-recovery"><div className="recovery-symbol">!</div><h1>演示环境未能启动</h1><p>请通过本地服务或 HTTPS 访问，并确认浏览器允许 Service Worker。若本地数据损坏或版本不兼容，可先备份原始数据，再恢复演示。</p><pre>{error instanceof Error?error.message:'启动失败'}</pre>{storageError?<p role="alert">{storageError}</p>:null}<div className="recovery-actions"><button onClick={()=>location.reload()}>重新加载</button><button onClick={backup}>备份现有本地数据</button><button className="danger" onClick={()=>setConfirm(true)}>重置本框架数据</button></div>{confirm?<div className="recovery-confirm" role="alert"><strong>此操作会清除本框架的演示数据。</strong><p>其他网站与应用的浏览器数据不会被修改。请确认已导出需要保留的原始备份。</p><div className="recovery-actions"><button onClick={()=>setConfirm(false)}>取消</button><button className="danger" onClick={reset}>确认清除并恢复</button></div></div>:null}</main>;
}
