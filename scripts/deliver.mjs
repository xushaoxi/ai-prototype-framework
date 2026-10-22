import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { copySource, fail } from './files.mjs';

try {
  const args = process.argv.slice(2);
  if (args.some(argument => argument !== '--skip-e2e')) throw new Error('用法：npm run deliver -- [--skip-e2e]');
  const skipE2e = args.includes('--skip-e2e'); const root = process.cwd();
  const evidence = {};
  for (const command of ['verify', ...(skipE2e ? [] : ['test:e2e'])]) {
    console.log(`运行交付关口：npm run ${command}`);
    const started = new Date().toISOString();
    const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', command], { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, env: process.env });
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`; process.stdout.write(output);
    evidence[command] = { command: `npm run ${command}`, started, ended: new Date().toISOString(), exitCode: result.status, output };
    if (result.error || result.status !== 0) throw new Error(`质量关口失败：${command}。未生成本次交付包。${result.error?.message ?? ''}`);
  }
  if (!existsSync(join(root, 'dist/index.html'))) throw new Error('缺少实际静态构建 dist/index.html');
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const safeName = `${pkg.name}-${pkg.version}`.replace(/[^a-zA-Z0-9._-]/g, '-');
  const directory = `${safeName}-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  const release = join(root, 'release'); const stage = join(release, directory); mkdirSync(stage, { recursive: true });
  try {
    copySource(root, join(stage, 'source')); copySource(join(root, 'dist'), join(stage, 'dist'));
    if (existsSync(join(root, 'business-specs'))) copySource(join(root, 'business-specs'), join(stage, 'business-specs'));
    mkdirSync(join(stage, 'evidence'));
    for (const [command, record] of Object.entries(evidence)) writeFileSync(join(stage, 'evidence', command === 'verify' ? 'verify.log' : 'e2e.log'), record.output);
    for (const folder of ['test-results', 'playwright-report']) if (!skipE2e && existsSync(join(root, folder))) copySource(join(root, folder), join(stage, 'evidence', folder));
    const files = [];
    function inventory(folder, prefix = '') {
      for (const entry of readdirSync(folder, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        const path = prefix + entry.name;
        if (entry.isDirectory()) inventory(join(folder, entry.name), `${path}/`);
        else files.push({ path, sha256: createHash('sha256').update(readFileSync(join(folder, entry.name))).digest('hex') });
      }
    }
    inventory(stage);
    const manifest = { name: pkg.name, version: pkg.version, createdAt: new Date().toISOString(), node: process.version, complete: !skipE2e,
      evidence: { verify: 'passed', e2e: skipE2e ? 'skipped' : 'passed', runs: Object.values(evidence).map(record => ({ command: record.command, started: record.started, ended: record.ended, exitCode: record.exitCode })) },
      limitations: skipE2e ? ['显式跳过浏览器验收，证据不完整，不应标记为完整交付。'] : ['权限、网络和数据均为本地演示仿真，不含真实后端。'], files };
    // Keep the log out of JSON while retaining command, timestamps and real exit codes.
    writeFileSync(join(stage, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    const archive = `${directory}.tar.gz`;
    const tar = spawnSync('tar', ['-czf', join(release, archive), '-C', release, directory], { encoding: 'utf8' });
    if (tar.status !== 0) throw new Error(`压缩失败：${tar.stderr}`);
    const checksum = createHash('sha256').update(readFileSync(join(release, archive))).digest('hex');
    writeFileSync(join(release, `${archive}.sha256`), `${checksum}  ${archive}\n`);
    writeFileSync(join(release, 'latest.json'), JSON.stringify({ directory, archive, sha256: checksum, complete: !skipE2e }, null, 2) + '\n');
    console.log(`交付包：${join(release, archive)}${skipE2e ? '\n证据不完整：已显式跳过浏览器验收。' : '\n核心与浏览器关口均已通过。'}`);
  } catch (error) { rmSync(stage, { recursive: true, force: true }); throw error; }
} catch (error) { fail(error); }
