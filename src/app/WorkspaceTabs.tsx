import {useEffect,useRef} from 'react';
import type {KeyboardEvent} from 'react';
import {CloseOutlined} from '@ant-design/icons';

export function WorkspaceTabs({pages,active,title,onSelect,onClose}:{pages:string[];active:string;title:(page:string)=>string;onSelect:(page:string)=>void;onClose:(page:string)=>void}){
  const strip=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const root=strip.current;
    const item=root?.querySelector<HTMLElement>('[aria-selected="true"]')?.parentElement;
    if(!root||!item)return;
    const a=root.getBoundingClientRect();const b=item.getBoundingClientRect();
    if(b.left<a.left)root.scrollLeft-=a.left-b.left;
    else if(b.right>a.right)root.scrollLeft+=b.right-a.right;
  },[active,pages]);
  const keyDown=(event:KeyboardEvent<HTMLButtonElement>,index:number)=>{
    if(event.key==='Delete'){if(pages.length>1){event.preventDefault();onClose(pages[index]);}return;}
    const next=event.key==='ArrowLeft'?(index-1+pages.length)%pages.length:event.key==='ArrowRight'?(index+1)%pages.length:event.key==='Home'?0:event.key==='End'?pages.length-1:undefined;
    if(next===undefined)return;
    event.preventDefault();
    document.getElementById(`workspace-tab-${pages[next]}`)?.focus({preventScroll:true});
    onSelect(pages[next]);
  };
  return <div className="workspace-tab-strip" role="tablist" aria-label="已打开页面" ref={strip}>{pages.map((page,index)=><div className={`workspace-tab${page===active?' active':''}`} role="presentation" key={page}>
    <button type="button" role="tab" id={`workspace-tab-${page}`} aria-controls={`workspace-panel-${page}`} aria-selected={page===active} tabIndex={page===active?0:-1} onClick={()=>onSelect(page)} onKeyDown={event=>keyDown(event,index)}>{title(page)}</button>
    {pages.length>1?<button type="button" className="workspace-tab-close" aria-label={`关闭${title(page)}标签页`} onClick={()=>onClose(page)}><CloseOutlined/></button>:null}
  </div>)}</div>;
}
