import {it,expect} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ObjectSummary,RelationCanvas,TimelineView} from '../../src/core/structures/StructureViews';
import type {RelationNode,RelationEdge,ScheduleTask} from '../../src/core/structures/types';

it('REUSE-002 adapts service dependencies without task/person/object domain fields',()=>{
 const services=[{slug:'gateway',display:'接入网关',dependsOn:['catalog']},{slug:'catalog',display:'资料检索',dependsOn:[]}];
 const nodes:RelationNode[]=services.map((service,index)=>({id:service.slug,label:service.display,kind:'服务',x:index*220,y:20}));
 const edges:RelationEdge[]=services.flatMap(service=>service.dependsOn.map(target=>({id:`${service.slug}-${target}`,source:service.slug,target,label:'依赖'})));
 const html=renderToStaticMarkup(createElement(RelationCanvas,{nodes,edges,zoom:1,offset:{x:0,y:0},onSelect:()=>{}}));
 expect(html).toContain('接入网关');expect(html).toContain('资料检索');expect(html).toContain('关系：依赖');expect(html).not.toContain('林青');
});
it('REUSE-003 adapts training sessions into a timeline and custom detail content',()=>{
 const sessions=[{reference:'lesson-a',topic:'安全培训',instructor:'讲师甲',period:['2026-11-01','2026-11-02'] as const,completion:0}];
 const tasks:ScheduleTask[]=sessions.map(session=>({id:session.reference,name:session.topic,parentId:null,owner:session.instructor,start:session.period[0],end:session.period[1],progress:session.completion}));
 const html=renderToStaticMarkup(createElement(ObjectSummary,{title:'培训安排',status:'待开始',children:[createElement('p',{key:'summary'},'参与者：三人'),createElement(TimelineView,{key:'timeline',tasks,onSelect:()=>{}})]}));
 expect(html).toContain('培训安排');expect(html).toContain('参与者：三人');expect(html).toContain('安全培训');expect(html).not.toContain('金额');expect(html).not.toContain('交付准备');
});
