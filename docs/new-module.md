# 新项目和新业务模块

## 创建干净副本

在框架根目录执行：

```bash
npm run create:project -- ../purchase-demo
cd ../purchase-demo
npm ci
npm run dev
```

目标父目录必须存在，目标目录必须不存在；即使目标是空目录也拒绝覆盖。新 package 名默认取目录英文 slug，并同步锁文件名称。脚本不跟随符号链接，不复制 `.git`、`node_modules`、dist、release、work、`.superpowers`、`.env*`、测试缓存及日志，也不自动安装依赖。浏览器数据属于原 origin，不是源码文件；新项目演示前使用「重置数据」。

## 生成一个 T01 模块

```bash
npm run generate:module -- contracts 合同 --dry-run
npm run generate:module -- contracts 合同
```

第一个参数为最多 40 字符、字母开头的小写英文 slug，可含数字和中划线；第二个参数为业务单数名称。空格名称请加引号。`../`、斜杠、大写、隐藏路径、重复模块或已有规范都会拒绝。dry-run 只显示计划，无文件修改。

实际生成三处变更：

1. `src/modules/contracts/definition.ts`：复用 T01 字段，替换名称、标签、编号前缀与状态动作文案。
2. `business-specs/contracts.json`：与定义同步的字段、状态、动作和稳定验收 ID。
3. `src/modules/registry.ts`：导入并注册。导航和 Mock 自动识别，新模块种子为空。

所有内容先在内存校验，再同步写入，最后原子替换 registry；写入失败会回滚本次创建的模块和规范。脚本不会修改现有业务定义。不要同时运行两个模块生成进程，也不要在生成期间手动编辑 registry。

## 调整和验证

默认字段为编号、名称、类别、负责人、金额、日期、备注。按业务更改类别 options、标签和初始值；同步 JSON 规范。若改变状态 ID，要同步动作、初始状态与验收条件。特殊逻辑先扩展 store 校验及测试，特殊视图通过显式扩展点实现。模板模块的 validate 业务校验函数不会复制到新模块，避免继承资产专属规则；新业务规则需要显式定义并测试。

```bash
npm run spec:check
npm run verify
npm run test:e2e
```

脚本回归会真实复制到临时目录，生成合同模块，执行规范检查、TypeScript/静态构建，并加载真实 seed 与 store 验证新增模块创建记录。临时测试为节约安装使用依赖符号链接；实际创建的项目不会携带该链接。

新增业务验收必须补上自己的测试和需求映射，生成器提供的通用三个验收条目不代表新业务已经测过。完成后运行 `npm run deliver` 形成新的质量证据。
