import {useCallback,useEffect,useRef,useState} from 'react';
import {App} from 'antd';
import {BusinessError} from '../types';
import {usePatternService} from './service';
import type {PatternAction,PatternSnapshot} from './types';
export function usePatterns(){
 const client=usePatternService();
 const [data,setData]=useState<PatternSnapshot|null>(null);
 const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const snapshot=useRef<PatternSnapshot|null>(null);
 const locked=useRef(false);const latest=useRef(0);const {message}=App.useApp();
 const reload=useCallback(async()=>{const id=++latest.current;setLoading(true);setError('');try{const value=await client.get();if(id===latest.current){snapshot.current=value;setData(value);}}catch(e){if(id===latest.current)setError(e instanceof Error?e.message:'加载失败，请重试');}finally{if(id===latest.current)setLoading(false);}},[client]);
 const invalidate=useCallback(()=>{latest.current++;},[]);
 useEffect(()=>{let mounted=true;queueMicrotask(()=>{if(mounted)void reload();});return()=>{mounted=false;invalidate();};},[reload,invalidate]);
 useEffect(()=>{const change=()=>{if(!locked.current)void reload();};const storage=(event:StorageEvent)=>{if(event.key==='prototype-workbench:patterns:v1')change();};window.addEventListener('pattern-data-changed',change);window.addEventListener('storage',storage);return()=>{window.removeEventListener('pattern-data-changed',change);window.removeEventListener('storage',storage);};},[reload]);
 const run=async(action:PatternAction)=>{
  if(locked.current||(!snapshot.current&&!['reset','backup.restore'].includes(action.type)))return false;
  locked.current=true;setBusy(true);++latest.current;
  try{const value=await client.act(snapshot.current?.version??1,action);snapshot.current=value;setData(value);window.dispatchEvent(new Event('pattern-data-changed'));setError('');return true;}
  catch(e){message.error(e instanceof Error?e.message:'保存失败，请重试');if(e instanceof BusinessError&&e.code==='VERSION_CONFLICT')await reload();return false;}
  finally{locked.current=false;setBusy(false);setLoading(false);}
 };
 return {data,loading,busy,error,reload,run};
}
