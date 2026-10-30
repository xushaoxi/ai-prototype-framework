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
import {installTheme,workbenchTheme} from './core/theme';
installTheme(document.documentElement);
dayjs.locale('zh-cn');
const root=createRoot(document.getElementById('root')!);
async function bootstrap() {
  const { startMocks }=await import('./mocks/browser');
  await startMocks();
  root.render(<StrictMode><ConfigProvider locale={zhCN} button={{autoInsertSpace:false}} theme={workbenchTheme.antd}><AntApp><App/></AntApp></ConfigProvider></StrictMode>);
}
void bootstrap().catch(error=>{
  root.render(<StartupRecovery error={error}/>);
});
