import {useRef,useState} from 'react';
import {Button,Checkbox,Dropdown,Popover} from 'antd';
import {ArrowDownOutlined,ArrowUpOutlined,HolderOutlined,PushpinOutlined,SettingOutlined} from '@ant-design/icons';
import type {ColumnChoice,ColumnFixed} from '../columns';

export function ColumnPicker({choices,selected,onChange,lockName=false,disabled=false}:{choices:ColumnChoice[];selected:string[];onChange:(keys:string[])=>void;lockName?:boolean;disabled?:boolean}){
  return <div className="column-picker"><div className="column-picker-actions"><Button type="link" size="small" disabled={disabled} onClick={()=>onChange(choices.map(choice=>choice.key))}>全选</Button><Button type="link" size="small" disabled={disabled} onClick={()=>onChange(lockName?['name']:[])}>{lockName?'仅保留名称':'清空选择'}</Button></div>{choices.map(choice=><Checkbox key={choice.key} checked={selected.includes(choice.key)} disabled={disabled||(lockName&&choice.key==='name')} onChange={event=>onChange(choices.filter(item=>item.key===choice.key?event.target.checked:selected.includes(item.key)).map(item=>item.key))}>{choice.label}</Checkbox>)}</div>;
}
export function ColumnSettings({choices,visible,fixed,onChange,onMove,onFixed,onReset,active=true}:{active?:boolean;choices:ColumnChoice[];visible:string[];fixed:Record<string,ColumnFixed>;onChange:(keys:string[])=>void;onMove:(from:string,to:string)=>void;onFixed:(key:string,pin:ColumnFixed|undefined)=>void;onReset:()=>void}){
  const [open,setOpen]=useState(false);
  const dragging=useRef<string|null>(null);
  const group=(key:string)=>fixed[key]??'none';
  const content=<div className="column-settings"><strong>显示和排列列</strong>
    <div className="column-picker-actions"><Button type="link" size="small" onClick={()=>onChange(choices.map(choice=>choice.key))}>全选</Button><Button type="link" size="small" onClick={()=>onChange(['name'])}>仅保留名称</Button></div>
    <div className="column-settings-list">{choices.map((choice,index)=>{
      const previous=choices[index-1];const next=choices[index+1];const pin=fixed[choice.key];
      const label=pin==='left'?'左侧固定':pin==='right'?'右侧固定':'不固定';
      return <div className="column-settings-row" key={choice.key} onDragOver={event=>{if(dragging.current&&group(dragging.current)===group(choice.key)){event.preventDefault();event.dataTransfer.dropEffect='move';}}} onDrop={event=>{event.preventDefault();const from=dragging.current;dragging.current=null;if(from&&group(from)===group(choice.key))onMove(from,choice.key);}}>
        <Button type="text" size="small" className="column-order-drag" draggable aria-label={`拖动${choice.label}调整顺序`} title="拖动调整顺序" icon={<HolderOutlined/>} onDragStart={event=>{dragging.current=choice.key;event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',choice.key);}} onDragEnd={()=>{dragging.current=null;}}/>
        <Checkbox className="column-row-checkbox" checked={visible.includes(choice.key)} disabled={choice.key==='name'} onChange={event=>onChange(choices.filter(item=>item.key===choice.key?event.target.checked:visible.includes(item.key)).map(item=>item.key))}>{choice.label}</Checkbox>
        <Button type="text" size="small" aria-label={`上移${choice.label}`} title="上移" icon={<ArrowUpOutlined/>} disabled={!previous||group(previous.key)!==group(choice.key)} onClick={()=>previous&&onMove(choice.key,previous.key)}/>
        <Button type="text" size="small" aria-label={`下移${choice.label}`} title="下移" icon={<ArrowDownOutlined/>} disabled={!next||group(next.key)!==group(choice.key)} onClick={()=>next&&onMove(choice.key,next.key)}/>
        <Dropdown trigger={['click']} menu={{selectable:true,selectedKeys:[pin??'none'],items:[{key:'none',label:'不固定'},{key:'left',label:'固定在左侧'},{key:'right',label:'固定在右侧'}],onClick:({key})=>onFixed(choice.key,key==='left'||key==='right'?key:undefined)}}><Button type="text" size="small" className="column-pin" aria-label={`设置${choice.label}固定`} title={`当前：${label}`} icon={<PushpinOutlined/>}>{pin?<span aria-hidden="true">{pin==='left'?'左':'右'}</span>:null}</Button></Dropdown>
      </div>;
    })}</div>
    <p>名称和操作列保留。拖拽或用箭头在同一固定区域内排序；更改固定方式可切换区域。表头边界可调整列宽。</p><Button size="small" onClick={onReset}>恢复默认</Button>
  </div>;
  return <Popover open={active&&open} onOpenChange={setOpen} trigger="click" placement="bottom" content={content}><Button aria-label="列设置" title="列设置" icon={<SettingOutlined/>}/></Popover>;
}
