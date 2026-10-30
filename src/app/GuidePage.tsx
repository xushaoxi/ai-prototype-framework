import { Alert, Button, Collapse, Steps } from 'antd';
import { ArrowRightOutlined, BookOutlined } from '@ant-design/icons';
export function GuidePage() {
  return <div className="guide-page"><div className="page-heading"><div><h1>使用指南</h1><p>复制母版，描述需求，按已确认规则推进原型与交付。</p></div></div>
    <section className="guide-intro"><div className="guide-symbol"><BookOutlined/></div><h2>统一框架，同类页面保持一致。</h2><p>菜单、顶部与内容区参考项目管理平台的整体框架；查询列表、表单、详情等页面遵循本项目设计指南，通过共享组件保持结构与交互一致。字段、条件和操作按业务适配，有依据的例外单独记录。</p><Button type="primary" href="#/design-guide" icon={<ArrowRightOutlined/>} iconPlacement="end">查看设计指南</Button></section>
    <section className="guide-section"><h2>从自然语言需求开始</h2><p>在 Codex 或 Claude Code 中打开新项目文件夹，直接说明目标、使用者和核心任务。AI 读取共享规则与项目状态，只询问影响核心闭环的必要问题。</p><Steps orientation="vertical" current={-1} items={[
      {title:'最小澄清与分级确认',content:'记录已确认范围、假设与待确认项。高风险业务需明确确认，未决事项不得自动放行。'},
      {title:'业务建模与产品全景',content:'统一对象、字段来源、关联、状态、动作和权限；展示产品全景，优先实现一条核心闭环。'},
      {title:'统一页面与 Mock 仿真',content:'按设计指南选择共享结构，准备正常、异常和边界场景。资产、供应商及其他示例不代表新项目需求。'},
      {title:'分层检查与有限修复',content:'依次检查规则、单功能、模块闭环和跨模块任务，保存可重复证据；独立审查按风险触发；最多三轮修复，同一问题连续两轮无改善即停止并报告阻断。'},
      {title:'版本化变更与交接',content:'低风险调整快速执行；业务规则变化先确认并同步规格和回归。会话结束更新项目状态。'},
      {title:'最小研发交付契约',content:'交付已确认范围、关键字段与规则、状态操作、异常、验收场景和版本证据；正式研发可使用自己的技术栈。'},
      {title:'真实环境验收与经验沉淀',content:'具备授权和真实测试环境后验证正式系统，关键问题人工确认；没有环境标为未验证。经验脱敏并获确认后再推广到公共母版。'},
    ]}/><Alert type="info" showIcon title="流程规则与实际验证分开记录" description="当前已建立公共规范和可操作示例，首个业务试点尚未确认；跨工具完整闭环、第二场景通用性及正式系统验收仍需实际验证。网页用于参考和体验，在编码工具中执行项目工作。"/></section>
    <section className="guide-section"><h2>开始下一个项目</h2><p>让 AI 创建独立副本、重置项目状态并检查脱敏，再描述业务需求。复制脚本会排除部分本地产物，但不会自动清除旧业务规范、替换样例或重置项目状态。</p><div className="command-card"><span>以下命令由 AI 在项目中执行；目标目录必须不存在</span><code>npm run create:project -- ../my-project</code><span>进入副本后，先从 templates/project-state 初始化项目状态，检查业务数据与历史材料，再安装依赖并启动</span><code>npm ci</code><code>npm run dev</code><span>需要交付时执行；只以实际生成的日志与清单为证据</span><code>npm run deliver</code></div><p>标准模块生成器仅生成台账骨架，不能把默认字段和状态当作已确认业务规则；复杂场景按实际共享能力适配。</p></section>
    <section className="guide-section"><h2>常见问题</h2><Collapse items={[
      {key:'data',label:'我的修改保存在哪里？',children:'台账、能力组合和复杂结构分别管理演示数据。浏览器允许本地存储时可保留已保存数据；组件示例和未保存输入不能据此承诺跨刷新保留。演示设置中的 JSON 备份只包含已注册台账及其活动记录；能力组合使用页面内的模板备份工具，复杂结构不包含在这两种备份中。请勿使用真实敏感数据。'},
      {key:'role',label:'只读角色是真实权限系统吗？',children:'角色和数据范围仅用于交互仿真，不提供真实身份认证或服务端授权；具体示例的作用范围需按页面说明核对。'},
      {key:'mock',label:'静态部署后还能操作吗？',children:'在支持 Service Worker 的浏览器，通过 HTTPS 或 localhost 提供静态服务并正确部署资源时，可以操作 Mock 示例。需要保留 mockServiceWorker.js；不支持直接双击 index.html。'},
      {key:'extend',label:'遇到特殊业务怎么办？',children:'先按设计指南选择页面结构与共享能力，业务差异通过配置或有限扩展表达。例外记录原因和验收，不复制整页，也不强行把所有需求塞入标准台账。'},
      {key:'acceptance',label:'原型测试通过就代表正式系统验收通过吗？',children:'不代表。正式系统须在获授权的真实测试环境中按交付契约另行验证接口、数据关联、持久化、权限和关键体验；自动化盲区与关键问题由人工确认。'},
    ]}/></section>
  </div>;
}
