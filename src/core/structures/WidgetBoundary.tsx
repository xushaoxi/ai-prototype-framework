import {Component} from 'react';
import type {ReactNode} from 'react';
import {Alert,Button} from 'antd';
export class WidgetBoundary extends Component<{children:ReactNode;onRetry:()=>void},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<Alert type="error" title="此组件暂时无法显示" description="其他组件仍可使用。" action={<Button onClick={()=>{this.props.onRetry();this.setState({failed:false});}}>重试组件</Button>}/>:this.props.children;}
}
export function WidgetFailureProbe({failed,children}:{failed:boolean;children:ReactNode}){if(failed)throw new Error('STRUCTURE_WIDGET_DEMO_FAILURE');return children;}
