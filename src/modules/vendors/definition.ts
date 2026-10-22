import type { ModuleDefinition } from '../../core/types';
export const vendorModule: ModuleDefinition = {
  id:'vendors',name:'供应商台账',singularName:'供应商',icon:'team',codePrefix:'VEN',
  description:'集中维护合作方资料，让评估、合作与停用有据可查。',
  fields:[
    {key:'code',label:'供应商编号',type:'text',inTable:true,inForm:false,inDetail:true,width:154},
    {key:'name',label:'供应商名称',type:'text',required:true,searchable:true,inTable:true,inForm:true,inDetail:true,maxLength:80,width:200},
    {key:'category',label:'合作类别',type:'select',required:true,searchable:true,inTable:true,inForm:true,inDetail:true,options:[{label:'设备供应',value:'设备供应'},{label:'技术服务',value:'技术服务'},{label:'行政服务',value:'行政服务'},{label:'其他',value:'其他'}]},
    {key:'owner',label:'对接人',type:'text',required:true,searchable:true,inTable:true,inForm:true,inDetail:true,maxLength:30},
    {key:'amount',label:'合同金额',type:'number',required:true,inTable:true,inForm:true,inDetail:true,min:0,max:999999999},
    {key:'date',label:'登记日期',type:'date',required:true,inTable:true,inForm:true,inDetail:true},
    {key:'notes',label:'合作备注',type:'textarea',inTable:false,inForm:true,inDetail:true,maxLength:500},
  ],
  statuses:[{value:'pending',label:'待评估',color:'default'},{value:'active',label:'合作中',color:'green'},{value:'disabled',label:'已停用',color:'default'}],
  actions:[{key:'approve',label:'通过评估',from:['pending'],to:'active',tone:'primary'},{key:'disable',label:'停用合作',from:['active'],to:'disabled',tone:'danger'},{key:'reopen',label:'重新评估',from:['disabled'],to:'pending'}],
  defaultValues:{status:'pending',category:'设备供应',amount:0,notes:''},
};
