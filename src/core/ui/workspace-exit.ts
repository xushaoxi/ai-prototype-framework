import {createContext,useCallback,useContext,useEffect,useLayoutEffect,useMemo,useRef} from 'react';

type Guard={shouldWarn:()=>boolean;request:(leave:()=>void)=>void};
export type Registry={register:(page:string,guard:Guard)=>()=>void;request:(page:string,leave:()=>void)=>void};
export const ExitRegistry=createContext<Registry|null>(null);
export const ExitPage=createContext('');
export function useWorkspaceExitRegistry():Registry {
 const guards=useRef(new Map<string,Guard>());
 const register=useCallback((page:string,guard:Guard)=>{guards.current.set(page,guard);return()=>{if(guards.current.get(page)===guard)guards.current.delete(page);};},[]);
 const request=useCallback((page:string,leave:()=>void)=>{const guard=guards.current.get(page);if(guard)guard.request(leave);else leave();},[]);
 useEffect(()=>{const warn=(event:BeforeUnloadEvent)=>{if([...guards.current.values()].some(guard=>guard.shouldWarn())){event.preventDefault();event.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[]);
 return useMemo(()=>({register,request}),[register,request]);
}
export function useRegisterWorkspaceExit(guard:Guard){
 const registry=useContext(ExitRegistry);const page=useContext(ExitPage);
 const latest=useRef(guard);
 useLayoutEffect(()=>{latest.current=guard;},[guard]);
 useEffect(()=>registry?.register(page,{shouldWarn:()=>latest.current.shouldWarn(),request:leave=>latest.current.request(leave)}),[registry,page]);
}
