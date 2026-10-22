import { Button, Collapse, Steps } from 'antd';
import { ArrowRightOutlined, CheckCircleOutlined } from '@ant-design/icons';
export function GuidePage() {
  return <div className="guide-page"><div className="page-heading"><div><h1>使用指南</h1><p>从业务想法到可验证的原型，每一步都有清晰的交付。</p></div></div>
    <section className="guide-intro"><div className="guide-symbol"><CheckCircleOutlined/></div><h2>一套规则，复用到下一个项目。</h2><p>这是一套独立运行的业务原型框架。资产台账和供应商台账使用同一个 T01 容器，字段、状态、业务操作由模块定义驱动。</p><Button type="primary" href="#/assets" icon={<ArrowRightOutlined/>} iconPlacement="end">体验标准台账</Button></section>
    <section className="guide-section"><h2>先验证业务，再进入研发</h2><Steps orientation="vertical" items={[
      {title:'描述业务模块',content:'明确使用者、字段、状态和关键业务操作，记录稳定的需求编号。'},
      {title:'对齐接受条件',content:'将成功、失败、空数据、只读和状态流转写成可检查的规则。'},
      {title:'优先复用 T01',content:'常规查询、列表、详情和表单使用配置；特殊逻辑接入模块扩展点。'},
      {title:'统一演示数据',content:'所有页面与测试通过同一套 Mock HTTP 和业务规则运行。'},
      {title:'生成并验证',content:'AI 按业务规范增量实现，执行类型、规范、领域及浏览器测试。'},
      {title:'业务验收',content:'按需求编号核对真实流程、失败恢复和演示限制。'},
      {title:'交付可追踪结果',content:'自动打包源码、静态构建、规范及验证证据，交给下一阶段研发。'},
    ]}/></section>
    <section className="guide-section"><h2>开始下一个项目</h2><div className="command-card"><span>复制一份独立项目</span><code>npm run create:project -- ../my-project</code><span>增加一套标准模块</span><code>npm run generate:module -- contracts 合同台账</code><span>执行质量关口并生成交付包</span><code>npm run deliver</code></div></section>
    <section className="guide-section"><h2>常见问题</h2><Collapse items={[
      {key:'data',label:'我的修改保存在哪里？',children:'演示数据按版本保存在当前浏览器的本地存储中。刷新页面会保留；更换浏览器请先在演示设置中导出 JSON。请勿使用真实敏感数据。'},
      {key:'role',label:'只读角色是真实权限系统吗？',children:'当前是 B 级业务仿真，只读用于验证界面行为。正式研发需要服务端身份认证、鉴权与审计。'},
      {key:'mock',label:'静态部署后还能操作吗？',children:'可以。在 HTTPS 或 localhost 中，Mock Service Worker 会在浏览器内拦截接口。部署时要同时保留 mockServiceWorker.js，不支持直接双击 index.html。'},
      {key:'extend',label:'遇到特殊业务怎么办？',children:'保留公共 T01 的标准流程，在业务模块内编写 validate 校验和详情展示扩展。不要复制整页或增加无边界的低代码配置。'},
    ]}/></section>
  </div>;
}
