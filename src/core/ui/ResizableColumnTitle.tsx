import {useRef} from 'react';
export function ResizableColumnTitle({label,width,onWidthChange}:{label:string;width:number;onWidthChange:(width:number)=>void}){
  const drag=useRef<{x:number;width:number}|null>(null);
  const change=(value:number)=>onWidthChange(Math.max(80,Math.min(600,Math.round(value))));
  return <><span className="column-resize-title">{label}</span><span className="column-resize-handle" role="separator" aria-orientation="vertical" aria-label={`调整${label}列宽`} aria-valuemin={80} aria-valuemax={600} aria-valuenow={width} aria-valuetext={`${width}像素`} tabIndex={0}
    onClick={event=>{event.preventDefault();event.stopPropagation();}}
    onPointerDown={event=>{if(event.button!==0)return;event.preventDefault();event.stopPropagation();drag.current={x:event.clientX,width};event.currentTarget.setPointerCapture(event.pointerId);}}
    onPointerMove={event=>{if(drag.current)change(drag.current.width+event.clientX-drag.current.x);}}
    onPointerUp={event=>{drag.current=null;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);}}
    onPointerCancel={()=>{drag.current=null;}}
    onLostPointerCapture={()=>{drag.current=null;}}
    onKeyDown={event=>{const value=event.key==='ArrowLeft'?width-10:event.key==='ArrowRight'?width+10:event.key==='Home'?80:event.key==='End'?600:undefined;if(value===undefined)return;event.preventDefault();event.stopPropagation();change(value);}}
  ><span/></span></>;
}
