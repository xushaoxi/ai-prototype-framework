import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync, renameSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { copySource, requireAbsent, fail } from './files.mjs';

try {
  const args = process.argv.slice(2);
  if (args.length !== 1 || args[0].startsWith('--')) throw new Error('用法：npm run create:project -- ../my-demo（不自动安装依赖）');
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const destination = resolve(process.cwd(), args[0]);
  const inside = relative(root, destination);
  if (!inside || (!inside.startsWith('..') && !isAbsolute(inside))) throw new Error('项目副本须位于当前项目之外');
  requireAbsent(destination);
  const name = basename(destination).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  if (!name || !/^[a-z]/.test(name)) throw new Error('目标目录名称须能转换为字母开头的英文项目名');
  const stage = mkdtempSync(join(dirname(destination), '.framework-copy-'));
  try {
    copySource(root, stage);
    for (const file of ['package.json', 'package-lock.json']) {
      const packageFile = join(stage, file); const data = JSON.parse(readFileSync(packageFile, 'utf8'));
      data.name = name;
      if (data.packages?.['']) data.packages[''].name = name;
      writeFileSync(packageFile, JSON.stringify(data, null, 2) + '\n');
    }
    requireAbsent(destination); renameSync(stage, destination);
  } finally { rmSync(stage, { recursive: true, force: true }); }
  console.log(`已创建 ${destination}\n下一步：进入目录，运行 npm ci，再运行 npm run dev。`);
} catch (error) { fail(error); }
