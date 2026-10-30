import type {ThemeConfig} from 'antd';

/** Single semantic source for Ant Design and custom surfaces. */
export const defaultThemeTokens={
 primary:'#0f766e',
 primaryStrong:'#185f59',
 primarySoft:'#e9f3f2',
 primaryBorder:'#cfe3df',
 primaryHover:'#d7e9e5',
 primaryTint:'#f4faf9',
 primaryInk:'#4b6662',
 primaryAlpha:'#0f766e20',
 text:'#172b34',
 textSecondary:'#526470',
 textMuted:'#63727d',
 border:'#dfe5eb',
 borderSubtle:'#e8edf1',
 borderStrong:'#c5d4d8',
 background:'#f5f7fa',
 surface:'#ffffff',
 surfaceMuted:'#f4f7f8',
 surfaceHover:'#f5f8fa',
 success:'#2da58c',
 danger:'#a8071a',
 dangerBorder:'#ffccc7',
 dangerBackground:'#fff2f0',
 warning:'#8a6325',
 warningBackground:'#fff8e8',
 spacingUnit:4,fontSize:14,controlHeight:36,radius:8,smallRadius:4,panelRadius:10,sidebarWidth:220,topbarHeight:64,contentPadding:32,
 fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif',
};
export type ThemeTokens=typeof defaultThemeTokens;
function mixColor(foreground:string,background:string,weight:number){
 if(!/^#[a-f0-9]{6}$/i.test(foreground)||!/^#[a-f0-9]{6}$/i.test(background))throw new Error('主题颜色须使用六位十六进制值');
 return '#'+[1,3,5].map(index=>Math.round(parseInt(foreground.slice(index,index+2),16)*weight+parseInt(background.slice(index,index+2),16)*(1-weight)).toString(16).padStart(2,'0')).join('');
}
export function createTheme(tokens:ThemeTokens=defaultThemeTokens){
 const palette={...tokens};
 if(tokens.primary!==defaultThemeTokens.primary){
  for(const [key,weight] of [['primarySoft',0.08],['primaryBorder',0.2],['primaryHover',0.16],['primaryTint',0.03],['primaryAlpha',0.12]] as const)if(tokens[key]===defaultThemeTokens[key])palette[key]=mixColor(tokens.primary,tokens.surface,weight);
  if(tokens.primaryStrong===defaultThemeTokens.primaryStrong)palette.primaryStrong=mixColor(tokens.primary,'#000000',0.8);
  if(tokens.primaryInk===defaultThemeTokens.primaryInk)palette.primaryInk=mixColor(tokens.primary,tokens.text,0.6);
 }
 const variables:Record<string,string>={
  '--color-primary':tokens.primary,
  '--color-primary-strong':palette.primaryStrong,
  '--color-primary-soft':palette.primarySoft,
  '--color-primary-border':palette.primaryBorder,
  '--color-primary-hover':palette.primaryHover,
  '--color-primary-tint':palette.primaryTint,
  '--color-primary-ink':palette.primaryInk,
  '--color-primary-alpha':palette.primaryAlpha,
  '--color-text':tokens.text,
  '--color-text-secondary':tokens.textSecondary,
  '--color-text-muted':tokens.textMuted,
  '--color-border':tokens.border,
  '--color-border-subtle':tokens.borderSubtle,
  '--color-border-strong':tokens.borderStrong,
  '--color-background':tokens.background,
  '--color-surface':tokens.surface,
  '--color-surface-muted':tokens.surfaceMuted,
  '--color-surface-hover':tokens.surfaceHover,
  '--color-success':tokens.success,
  '--color-danger':tokens.danger,
  '--color-danger-border':tokens.dangerBorder,
  '--color-danger-background':tokens.dangerBackground,
  '--color-warning':tokens.warning,
  '--color-warning-background':tokens.warningBackground,
  '--font-size':`${tokens.fontSize}px`,'--font-family':tokens.fontFamily,'--control-height':`${tokens.controlHeight}px`,'--radius-small':`${tokens.smallRadius}px`,'--radius-control':`${tokens.radius}px`,'--radius-panel':`${tokens.panelRadius}px`,'--sidebar-width':`${tokens.sidebarWidth}px`,'--topbar-height':`${tokens.topbarHeight}px`,'--content-padding':`${tokens.contentPadding}px`,
 };
 for(const size of [11,12,13,14,15,16,17,18,19,20,21,22,24,26,28])variables[`--font-${size}`]=`${size/14*tokens.fontSize}px`;
 for(const space of [4,6,8,10,12,14,16,18,20,22,24,25,27,28,30,32,40,48])variables[`--space-${space}`]=`${space*tokens.spacingUnit/4}px`;
 const antd:ThemeConfig={token:{colorPrimary:tokens.primary,colorInfo:tokens.primary,colorText:tokens.text,colorTextSecondary:tokens.textSecondary,colorBorder:tokens.border,colorBgLayout:tokens.background,colorBgContainer:tokens.surface,colorError:tokens.danger,colorWarning:tokens.warning,colorSuccess:tokens.success,sizeUnit:tokens.spacingUnit,borderRadius:tokens.radius,borderRadiusLG:tokens.panelRadius,borderRadiusSM:tokens.smallRadius,fontSize:tokens.fontSize,controlHeight:tokens.controlHeight,fontFamily:tokens.fontFamily},components:{Table:{headerBg:tokens.background,headerColor:tokens.textSecondary,rowHoverBg:palette.primaryTint,cellPaddingBlockMD:9},Button:{primaryShadow:'none'},Tabs:{horizontalItemGutter:30},Layout:{siderBg:tokens.surface}}};
 return {antd,variables};
}
export const workbenchTheme=createTheme();
export function installTheme(root:HTMLElement,theme=workbenchTheme){for(const [key,value] of Object.entries(theme.variables))root.style.setProperty(key,value);}
