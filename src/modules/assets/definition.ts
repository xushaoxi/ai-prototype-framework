import type { ModuleDefinition } from '../../core/types';
export const assetModule: ModuleDefinition = {
  id:'assets', name:'资产台账', singularName:'资产', icon:'ledger', codePrefix:'AST',
  description:'统一管理资产信息，跟踪从登记到归档的完整过程。',
  fields:[
    {key:'code',label:'资产编号',type:'text',inTable:true,inForm:false,inDetail:true,width:154},
    {key:'name',label:'资产名称',type:'text',required:true,searchable:true,inTable:true,inForm:true,inDetail:true,maxLength:80,width:200},
    {key:'category',label:'类别',type:'select',required:true,searchable:true,inTable:true,inForm:true,inDetail:true,options:[{label:'电子设备',value:'电子设备'},{label:'办公家具',value:'办公家具'},{label:'软件许可',value:'软件许可'},{label:'其他',value:'其他'}]},
    {key:'owner',label:'负责人',type:'text',required:true,searchable:true,inTable:true,inForm:true,inDetail:true,maxLength:30},
    {key:'amount',label:'资产金额',type:'number',required:true,inTable:true,inForm:true,inDetail:true,min:0,max:999999999},
    {key:'date',label:'登记日期',type:'date',required:true,inTable:true,inForm:true,inDetail:true},
    {key:'notes',label:'备注',type:'textarea',inTable:false,inForm:true,inDetail:true,maxLength:500},
  ],
  statuses:[{value:'draft',label:'草稿',color:'default'},{value:'active',label:'使用中',color:'green'},{value:'archived',label:'已归档',color:'default'}],
  actions:[{key:'activate',label:'投入使用',from:['draft'],to:'active',tone:'primary'},{key:'archive',label:'归档',from:['active'],to:'archived'},{key:'restore',label:'恢复草稿',from:['archived'],to:'draft'}],
  defaultValues:{status:'draft',category:'电子设备',amount:0,notes:''},
};
