# 技术选择与官方依据

研究日期：2026-10-22。锁定版本见 package.json 与 package-lock.json；升级时重新验证 peerDependencies、Node 引擎、构建和浏览器交互。

## React 与 Vue

两者都能实现本框架。React 官方列出了用 Vite 从零构建的路径，同时提醒自建项目需要自行处理路由与数据请求。本项目范围限于本地原型，无 SSR/RSC，因此接受这项取舍。[React 官方说明](https://react.dev/learn/build-a-react-app-from-scratch)

Vue 原生支持 TypeScript，Vue + Element Plus 也有成熟表格与表单能力。它适合偏好单文件组件和模板语法的团队，不能因为使用 Vue 就断言不适合 AI。[Vue TypeScript](https://vuejs.org/guide/typescript/overview)、[Element Plus Table](https://element-plus.org/en-US/component/table.html)

| 维度 | 本项目 React + Ant Design | Vue + Element Plus 可行方案 |
| --- | --- | --- |
| 配置表达 | TS 对象直接传递组件，统一类型契约 | TS 配置与单文件组件模板结合 |
| 企业控件 | Table / Form / Drawer / Modal 满足 T01 | 同样有表格、表单、弹窗等控件 |
| 项目成本 | 当前已建立实现及测试，保持连续性 | 需重建组件实现和交互测试 |
| AI 协作 | 统一配置、HTTP 契约、规范与测试限制漂移 | 同样能用这些工程约束 |

选择 React 是结合当前组件生态与 TS 配置方式的**工程推断**，不是 React 比 Vue 的 AI 生成稳定性更高的实测结论。这里没有做模型、提示词、任务规模和样本量受控的 benchmark；AI 的稳定性主要通过可执行规范、测试、受控上下文与审查来保证。

## 为什么不直接装 Ant Design Pro

V1 使用 Ant Design 基础控件与一个轻量 T01 容器，避免把路由、构建、权限和后端假设一并引入。Ant Design 官方提供 Vite 接入指南。[官方指南](https://ant.design/docs/react/use-with-vite/)

2026-10-22 实际执行 `npm view @ant-design/pro-components@2.8.10 peerDependencies --json`，结果：

```json
{"antd":"^4.24.15 || ^5.11.2","react":">=17.0.0","react-dom":">=17.0.0"}
```

当前安装 antd **6.6.7**，不在这一声明范围内，因此没有用 `--force` 安装不受支持的组合。应核实发布版本元数据，而非仅依据仓库 master。[npm 官方发布元数据](https://registry.npmjs.org/@ant-design/pro-components/2.8.10)、[官方仓库](https://github.com/ant-design/pro-components)

## 其余选择

- TypeScript strict：把字段和动作契约前置，禁止用 any 掩盖不一致。
- Vite：开发与静态构建，Node 引擎须兼容；本机用 Node 20.20.0。[Vite 官方指南](https://vite.dev/guide/)
- MSW 2：在网络层拦截请求，浏览器与 Node 共用 Mock。此处保留兼容 Node 20 的安装组合，不盲目升级主版本。[MSW 文档](https://mswjs.io/docs/)
- Vitest + Playwright：领域规则与 HTTP 集成快速回归，浏览器验证可见行为和隔离状态。[Playwright 最佳实践](https://playwright.dev/docs/best-practices)
- localStorage：可刷新演示数据与备份，但容量、授权与多端同步均不等同数据库。真实业务应替换后端。
