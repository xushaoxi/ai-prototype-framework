import type {ReactNode} from 'react';
import {Alert,Form} from 'antd';
import type {FormInstance} from 'antd';
export function SharedForm<T extends object>({state,children}:{state:{form:FormInstance<T>;initialValues:T;disabled:boolean;errors:number;onValuesChange:(changed:Partial<T>)=>void};children?:ReactNode}){
 return <>{state.errors>0&&<Alert title={`请修正 ${state.errors} 项表单错误`} type="error" showIcon/>}<Form form={state.form} layout="vertical" initialValues={state.initialValues} validateTrigger={[]} disabled={state.disabled} onValuesChange={state.onValuesChange}>{children}</Form></>;
}
