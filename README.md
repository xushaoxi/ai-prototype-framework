# AI 原型开发框架 · V1.0

一个独立、可复制的中文业务原型工作台。通过同一个 T01 台账页面承载资产和供应商两个模块，用配置表达字段、状态与动作，用确定性 Mock 支持完整业务演示。适合验证需求、交互和业务规则；不提供真实账号、服务端权限或后端服务。

## 快速开始

需要 Node **20.19+（20.x）或 22.12+**、npm。项目已在 Node 20.20.0 验证；依赖版本以 package-lock.json 为准。

```bash
npm ci
npm run dev
```

打开终端显示的本地地址，默认 http://127.0.0.1:5173。首次进入会启动 MSW；数据保存在当前浏览器的 localStorage。用「演示设置」切换只读角色、慢响应、错误响应，或备份、导入、重置数据。请使用模拟数据。

macOS 可双击 `start.command`：它优先使用兼容的当前 Node，再查找已经安装的 nvm Node，仅改变本次进程的 PATH；不会安装 Node、修改系统版本或静默安装依赖。若提示缺少依赖，先在本目录执行 `npm ci`。**终端能启动、桌面双击却失败通常是两者 PATH 不同**；脚本会打印实际 Node 路径与版本，详见 [交付指南](docs/delivery.md)。

## 直接使用

- 资产台账：36 条确定性示例，支持组合查询、分页、新增、编辑、详情、活动记录、状态流转及初始状态删除。
- 供应商台账：独立字段标签、枚举和流转，复用相同页面与业务仿真层。
- CSV 导出遵循当前查询；JSON 备份包含所有模块。导入会完整校验后再替换。
- 「只读」仅模拟产品交互，不是安全权限；浏览器数据不等同于服务器数据。

## 复用为新项目

```bash
npm run create:project -- ../my-prototype
cd ../my-prototype
npm ci
npm run dev
```

目标目录必须不存在，项目名默认取目标目录英文 slug。不复制依赖、Git 历史、构建/交付缓存、个人 `.env`、本地工作记录或测试输出；不会自动安装。

```bash
npm run generate:module -- contracts 合同 --dry-run
npm run generate:module -- contracts 合同
npm run verify
```

生成业务模块定义、业务规范并同步注册导航，默认空数据；不用复制页面。业务字段沿用现有 T01 合同，调整规范与定义后再补充对应规则和样例。详见 [新模块指南](docs/new-module.md)。

## 质量和交付

```bash
npm run verify
npx playwright install chromium
npm run test:e2e
npm run deliver
```

`verify` 包含规范一致性、类型、lint、领域/HTTP/脚本测试及静态构建。`deliver` 默认重新执行 verify 和浏览器测试，两者通过才生成 `release/*.tar.gz`、SHA-256 和清单，**不是仅将当前目录压缩**。首次浏览器测试须先安装浏览器；也可显式设置 `PLAYWRIGHT_CHANNEL=chrome` 使用本机 Chrome。需要 HTTPS 或 localhost 提供静态网页才能运行 Service Worker，不能双击 dist/index.html。

`npm run deliver -- --skip-e2e` 仅适合明确接受缺失浏览器证据的临时包，清单会标记 `complete: false`，不能视作完整验收。

- [技术选型与研究](docs/technology-decisions.md) · [架构](docs/architecture.md) · [新增模块](docs/new-module.md)
- [AI 七步工作流](docs/ai-workflow.md) · [验收与需求追踪](docs/acceptance.md) · [交付说明](docs/delivery.md)
- [AI 协作约定](AGENTS.md) · [架构基线](docs/superpowers/specs/2026-10-22-framework-design.md)
