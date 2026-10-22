# AI 原型框架协作约定

先阅读 README、docs/architecture.md、docs/superpowers/specs/2026-10-22-framework-design.md 与相关 business-specs。按照当前用户授权范围工作；历史设计记录不代表新项目的部署、推送或外部写入授权。

- 以业务模块为单元。模块定义在 src/modules/<id>/definition.ts，经 registry 注册；T01 页面在 src/core/ui。第二模块应复用容器，不复制整页。
- 数据只由 src/mocks/store.ts 管理，UI 经 src/core/api.ts + MSW HTTP。状态流转、删除与校验在 store 执行，按钮显隐不能代替业务规则。
- TypeScript strict，不用 any 绕过；不加无依据依赖。规范、模块定义、验收条件、测试同步修改。特殊业务用显式扩展点，避免无限扩张配置引擎。
- 使用 npm 和 package-lock.json；Node 需满足当前 Vite 引擎（20.19+ 的 20.x，或 22.12+）。不得为启动项目擅自修改系统 Node；本机兼容版本可通过 start.command 选择。
- 关键规则先写失败测试，再实现。测试隔离，不依赖执行顺序；保持需求 ID 可追踪。脚本测试实际启动子进程并使用临时项目。
- 提交前 npm run verify；UI 变更加跑 npm run test:e2e，并检查桌面/移动截图与控制台。测试红灯必须报告原因，禁止把计划写成已通过。
- 不实现真实认证、服务端权限、大模型服务。只读角色和网络场景均明确标记为演示仿真。
- 交付运行 npm run deliver；仅成功执行后的实际日志与清单作为证据。--skip-e2e 产生不完整证据，不得标记完整验收。
- 不提交 node_modules、dist、release、.env、个人数据、浏览器备份和本地工作目录。生成新模块使用安全 slug；新增项目不覆盖已有路径。
