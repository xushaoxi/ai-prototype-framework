import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App as AntApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import 'antd/dist/reset.css';
import { App } from './app/App';
import { StartupRecovery } from './app/StartupRecovery';
import './styles.css';
dayjs.locale('zh-cn');
const root=createRoot(document.getElementById('root')!);
async function bootstrap() {
  const { startMocks }=await import('./mocks/browser');
  await startMocks();
  root.render(<StrictMode><ConfigProvider locale={zhCN} button={{autoInsertSpace:false}} theme={{token:{colorPrimary:'#0f766e',colorInfo:'#0f766e',colorText:'#172b34',colorTextSecondary:'#73828e',colorBorder:'#dfe5eb',colorBgLayout:'#f5f7fa',borderRadius:8,fontSize:14,controlHeight:36,fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif'},components:{Table:{headerBg:'#f5f7fa',headerColor:'#526471',rowHoverBg:'#f4faf9',cellPaddingBlockMD:9},Button:{primaryShadow:'none'},Tabs:{horizontalItemGutter:30},Layout:{siderBg:'#fff'}}}}><AntApp><App/></AntApp></ConfigProvider></StrictMode>);
}
void bootstrap().catch(error=>{
  root.render(<StartupRecovery error={error}/>);
});
