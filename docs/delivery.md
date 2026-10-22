# 本地交付、启动与限制

## 正式生成交付包

```bash
npm ci
npx playwright install chromium
npm run deliver
# 若使用本机 Chrome，浏览器命令与交付命令会继承该设置
PLAYWRIGHT_CHANNEL=chrome npm run test:e2e
PLAYWRIGHT_CHANNEL=chrome npm run deliver
```

deliver 先运行 `npm run verify`，再运行 `npm run test:e2e`。任一命令非零退出则不生成本次交付结果。成功后 `release/latest.json` 指向带时间戳的目录和 `.tar.gz`，另有压缩包 `.sha256`；旧包保留，但不会被当作本次成功。

解压结构：

```text
<项目名>-<版本>-<时间>/
  source/                 # 可重新安装构建的源码与规范
  dist/                   # 实际静态构建
  business-specs/          # 独立规范副本
  evidence/verify.log      # 本次真实命令输出
  evidence/e2e.log
  evidence/test-results/  # 若测试有生成，含截图/trace
  evidence/playwright-report/
  manifest.json           # 命令时间、退出码、完整性、逐文件 SHA-256
```

清单不对自身做循环校验；压缩包外部 SHA-256 保护整体。源码排除依赖、Git、`.env*`、work、release、构建缓存、个人编辑器目录和符号链接。测试证据只从本次浏览器关口运行后收集。交付脚本依赖系统 tar（macOS/Linux 默认具备）。

`npm run deliver -- --skip-e2e` 可显式生成临时包：manifest.complete 为 false、e2e 为 skipped，并写明证据不完整。它不会复用旧浏览器报告伪装本次通过。正式交付应重新执行默认命令。

## 启动与静态预览

```bash
npm run dev
# 或在构建后
npm run preview
```

静态资源和 hash 路由支持子目录。通过 localhost 或 HTTPS 提供 dist 内容；Service Worker 在普通远程 HTTP 与 file:// 下不可用。不要直接双击 index.html。预览也启用 MSW，因此仍是离线业务仿真。

## Node 与桌面启动差异

Vite 8 的引擎要求为 Node 20.19+ 或 22.12+；本项目验证环境为 20.20.0。系统旧 Node 可能报引擎、crypto、模块加载等错误，与页面业务无关。桌面启动的环境变量可能不加载交互终端的 nvm。

`start.command` 先验证 PATH 中的 Node，再按本机 nvm 版本目录查找兼容版本，将该 bin 仅添加到脚本当前进程 PATH。没有兼容版本就给出明确提示并退出，不执行 nvm alias、不替换系统 Node，也不自动下载。已有依赖才启动；首次仍需用户运行 npm ci。它会打印实际版本和路径，便于定位问题。

## 交付范围

本版本交付源码、两个可运行模块、通用 T01、规范与命令、自动测试和本地证据。权限仅为演示，数据仅在浏览器；无真实账号、多端同步、数据库、线上部署或公网地址。接入生产前需要单独设计后端、安全、认证和运维。浏览器测试和人工视觉检查能降低风险，不能承诺没有任何缺陷。
