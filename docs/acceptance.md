# 测试验收与需求追踪

业务规范位于 business-specs。资产使用 AST-001—009，供应商使用 VEN-001—009；测试名称携带需求 ID。规范一致性使用 SPEC-001，脚本复用使用 TOOL-001/002。

| 需求 | 可观察的接受条件 | 主要证据 |
| --- | --- | --- |
| AST/VEN-001 | 关键词、类别、状态组合查询，分页和统计正确 | tests/domain/store.test.ts；tests/e2e/ledger.spec.ts |
| AST/VEN-002 | 必填、枚举、金额/日期校验；自动唯一编号 | store.test.ts；tests/integration/api.test.ts；ledger.spec.ts |
| AST/VEN-003 | 完整详情与动作历史 | store.test.ts；api.test.ts；ledger.spec.ts |
| AST/VEN-004 | 编辑持久化，旧 version 拒绝覆盖 | store.test.ts；api.test.ts；ledger.spec.ts |
| AST/VEN-005 | 合法状态转移成功，非法操作 HTTP 4xx | store.test.ts；api.test.ts；ledger.spec.ts |
| AST/VEN-006 | 仅初始状态可删除 | store.test.ts；api.test.ts；ledger.spec.ts |
| AST/VEN-007 | 只读演示角色无法通过界面写入 | ledger.spec.ts；人工检查设置说明 |
| AST/VEN-008 | 模块隔离、确定性重置 | store.test.ts；api.test.ts；ledger.spec.ts |
| AST/VEN-009 | 错误恢复，非法导入/持久化失败无部分写入 | store.test.ts；api.test.ts；ledger.spec.ts |
| SPEC-001 | 所有注册模块的真实字段、标签、类型、选项、约束、状态、动作与规范相符 | npm run spec:check；tests/domain/spec.test.ts |
| TOOL-001 | 真实副本、拒绝覆盖/路径穿越、dry-run、规范同步、生成项目可构建和创建记录 | tests/tooling/cli.test.ts |
| TOOL-002 | 交付默认两关，失败阻止打包，跳过标记不完整，包内日志和校验和正确 | tests/tooling/cli.test.ts |

表中路径表示测试所属层，不表示每个浏览器测试逐个完整覆盖两模块全部组合。请结合实际测试名称、断言和日志审查；新生成业务需要补业务专属测试，不能自动继承「已验收」结论。

## 两道关口

第一关 `npm run verify` 顺序执行 spec:check → typecheck → lint → test → build，任何一步失败即停止。脚本测试使用临时目录，真实执行复制、生成、种子/存储加载与构建，结束清理。领域与 HTTP 测试应自行初始化数据，不借用其他测试状态。

第二关 `npm run test:e2e` 用 Chromium 访问真实应用与 MSW，覆盖查询、新增、编辑、详情、状态操作、刷新持久化、只读、空态、错误恢复、CSV/备份等可见行为。不能用另一套 route mock 替换业务层。

## 人工补充检查

桌面 1440×1000 检查层级、表格、弹层和中文；手机 390×844 检查导航收起、表格容器滚动和整个页面无横向溢出。实际查看截图，关注长标题、错误文案、键盘焦点和危险操作确认。检查控制台无相关异常。自动截图存在不等于视觉已审阅。

每次完整交付的实际状态见 release/latest.json 和 manifest.json；正文标准和测试存在不能代替当次执行证据。CI 保存浏览器报告；本地 deliver 保存完整日志和已有报告/截图。
