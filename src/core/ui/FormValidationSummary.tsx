import {Button} from 'antd';

export function FormValidationSummary({count,onLocate}:{count:number;onLocate:()=>void}) {
  return count>0?<div className="form-validation-summary" role="status" aria-live="polite"><span>有 {count} 项需要修改，请查看字段下的提示。</span><Button type="link" size="small" onClick={onLocate}>定位第一个错误</Button></div>:null;
}
