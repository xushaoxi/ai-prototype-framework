# AI 原型开发框架 · V1.0

V1 完整示例入口：侧栏「组件与状态示例」集中体验按钮、状态、加载、空态、错误恢复、危险确认和格式，均为本地仿真。表单修改后取消、返回或关闭功能标签需确认；切换页面保留输入，恢复初始内容可直接退出。刷新使用浏览器原生提示，不提供自动草稿。

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

- 设计指南：侧栏阅读 16 章大纲与设计规则；台账页点击「对照指南」，桌面并排查看，窄屏使用抽屉。内容来自项目设计文档，未完善章节明确标记。
- 表单容器示例：从左侧菜单或设计指南第 09、11 章进入，用同一组资产字段体验弹窗、右侧抽屉和完整页面；关闭标签后可从菜单重新打开，示例提交不写入台账。
- 新增资产同时作为通用控件示例，展示单选、复选、可搜索多选、整数和金额单位、日期、时间及日期范围。新字段可选，可保存并在详情查看；新建金额、日期不自动填0或今天。
- 资产台账：36 条确定性示例，使用带计数的状态标签，不显示重复统计卡片；支持组合查询、分页、新增、编辑、详情、活动记录、状态流转及初始状态删除。
- 供应商台账：独立字段标签、枚举和流转，复用相同页面与业务仿真层。
- CSV 导出遵循当前查询；JSON 备份包含所有模块。导入会完整校验后再替换。
- 「只读」仅模拟产品交互，不是安全权限；浏览器数据不等同于服务器数据。

资产台账现已确认为标准查询表格 V1：后续搜索查询表格以其布局与交互为基准，常规台账复用共享容器，字段、筛选条件和业务操作按实际场景适配。完整约定见[设计指南 PAGE-003](docs/design/design-guidelines.md)。

## 交给AI生成新原型

把明确的业务需求交给AI，以[统一接入契约](docs/ai-workflow.md)为入口。AI先匹配设计规则、页面结构和共享接口，再实现业务适配并提供可运行预览。工作台的示例数量不代表覆盖所有后台需求；实际支持范围和未验证内容分别记录。

建设目标与实际进度见[建设方案](docs/design/prototype-workbench-blueprint.md)和[对抗审查](docs/design/prototype-workbench-adversarial-review.md)。

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
- [设计指南大纲](docs/design/outline.md) · [设计规则](docs/design/design-guidelines.md) · [设计研究](docs/design/design-guidelines-research.md)

资产台账支持登记日期范围与状态组合查询：「更多筛选」可展开收起并提示隐藏生效条件数，状态下拉与标签联动，点击查询或关键词框 Enter 统一提交。

查询区显示最近一次已应用的关键词、类别和日期条件，可逐项移除；输入与已应用条件不一致时会提示结果尚未更新。状态由上方状态标签表示并与筛选下拉联动。有筛选无结果时可快速清除；表格真实横向溢出时提示查看其余列，长文本可聚焦查看全文。

多页面工作台：左侧菜单打开或激活顶部功能标签，切换保留查询、分页、展开和滚动现场；关闭标签释放该页状态，刷新仅打开当前地址。标准台账去掉重复标题说明，新增放在列表操作栏，对照指南位于顶栏。

列表「列设置」支持选择显示列、拖动或用键盘调整数据列宽度，按模块在当前浏览器保存，可恢复默认。导出时单独选择列，默认当前显示列，也可选择隐藏的数据列；仍导出当前已提交查询的全部页。

列设置支持拖动或用上下箭头排序，也可将数据列固定在左侧或右侧；固定列在同一区域内排序，窄屏空间不足时固定效果暂时关闭。列顺序和固定偏好按模块保存在浏览器，导出列的默认顺序与列表一致。

表单遵循 FORM-007：首次保存统一校验，显示错误数量并定位首个错误；已报错字段修改后即时复查，保存失败保留输入，保存中防止重复提交。

## 后台通用模式库

现有内部样例包含24类页面（旧业务名称仅作兼容示例，不代表24种独立页面结构）：高级表格、树表、卡片、主从、详情、CSV/Excel导入、回收站、审批待办、分组/分步/明细表单、草稿/文件、组织用户角色权限、仪表盘、设置/资料、消息日志、登录和结果。通用组件页新增基础控件组合。

它们共用独立仿真数据域，经HTTP/MSW/store校验并持久保存；可备份恢复，和原有台账隔离。附件保存元数据，登录权限审批为仿真，不提供真实认证、文件上传或流程服务器。

- [能力与覆盖清单](docs/design/backend-pattern-library.md)
- [新后台项目复用与业务适配](docs/backend-pattern-reuse.md)
- [模式需求与接口动作](business-specs/pattern-library/requirements.json)

Excel读取采用按需加载的read-excel-file 9.3.13（[官方用法](https://github.com/catamphetamine/read-excel-file)），仅处理首个工作表，旧.xls需另存为.xlsx；基础组件继续复用Ant Design。

主导航按设计参考与可复用结构整理，同构业务不重复占用主入口；旧地址继续兼容。变体及专用能力在对应结构中查找，复杂建设目标不以空壳菜单冒充落地。

2026-10-30工作台收敛：能力组合目录按任务聚合，不将24个旧样例地址当作24种结构；设置、账号等留在兼容入口。主题由src/core/theme.ts同时生成Ant配置与CSS变量，规则PAGE-004提供主体结构/容器/组合的选择依据，THEME-001约束主题适配。


## Loop Agent 已确认流程接入

执行前读取 `docs/loop/decisions.md`、`docs/loop/workflow.md` 和 `project-state/status.md`。DEC-017 未确认；已有业务样例不代表试点。新项目状态从 `templates/project-state` 初始化；已有设计指南、源码规范和验证命令继续有效。
