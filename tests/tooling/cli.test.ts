import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, mkdirSync, symlinkSync, rmSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = resolve('.');
const scratch: string[] = [];
function temp() { const dir = mkdtempSync(join(tmpdir(), 'framework-cli-')); scratch.push(dir); return dir; }
function run(script: string, args: string[], cwd = root) {
  return spawnSync(process.execPath, [join(root, 'scripts', script), ...args], { cwd, encoding: 'utf8', timeout: 90000 });
}
afterEach(() => scratch.splice(0).forEach(dir => rmSync(dir, { recursive: true, force: true })));

describe('TOOL-001 安全复制与生成', () => {
  it('真实复制设置名称、排除私有目录并拒绝覆盖', () => {
    const base = temp(); const destination = join(base, 'fresh-demo');
    const result = run('create-project.mjs', [destination]);
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(readFileSync(join(destination, 'package.json'), 'utf8')).name).toBe('fresh-demo');
    for (const name of ['node_modules', '.git', 'release', 'work', '.superpowers', '.env', 'test-results']) expect(existsSync(join(destination, name)), name).toBe(false);
    expect(existsSync(join(destination, 'src/modules/registry.ts'))).toBe(true);
    const before = readFileSync(join(destination, 'package.json'), 'utf8');
    expect(run('create-project.mjs', [destination]).status).not.toBe(0);
    expect(readFileSync(join(destination, 'package.json'), 'utf8')).toBe(before);
  });

  it('dry-run 无写入，拒绝穿越与已有模块，实际模块可校验、构建和生成种子数据', () => {
    const destination = join(temp(), 'generated-demo');
    expect(run('create-project.mjs', [destination]).status).toBe(0);
    symlinkSync(join(root, 'node_modules'), join(destination, 'node_modules'), 'dir');
    const before = readFileSync(join(destination, 'src/modules/registry.ts'), 'utf8');
    expect(run('generate-module.mjs', ['contracts', '合同', '--dry-run'], destination).status).toBe(0);
    expect(existsSync(join(destination, 'src/modules/contracts'))).toBe(false);
    expect(readFileSync(join(destination, 'src/modules/registry.ts'), 'utf8')).toBe(before);
    for (const slug of ['../escape', 'a/b', 'UPPER', '.hidden', 'assets']) expect(run('generate-module.mjs', [slug, '合同'], destination).status, slug).not.toBe(0);
    expect(run('generate-module.mjs', ['contracts', '合同'], destination).status).toBe(0);
    expect(run('generate-module.mjs', ['contracts', '重复'], destination).status).not.toBe(0);
    const spec = JSON.parse(readFileSync(join(destination, 'business-specs/contracts.json'), 'utf8'));
    expect(spec.id).toBe('contracts'); expect(spec.name).toBe('合同台账');
    expect(run('check-spec.mjs', [], destination).status).toBe(0);
    const build = spawnSync('npm', ['run', 'build'], { cwd: destination, encoding: 'utf8', timeout: 90000 });
    expect(build.status, build.stdout + build.stderr).toBe(0);
    writeFileSync(join(destination, 'check-seed.mjs'), "import {loadProjectModule} from './scripts/project-modules.mjs'; const {createSeed} = await loadProjectModule(process.cwd(),'src/mocks/seed.ts'); if (!Array.isArray(createSeed().records.contracts)) process.exit(1); const {createStore} = await loadProjectModule(process.cwd(),'src/mocks/store.ts'); const store = createStore(); const record = store.create('contracts',{name:'测试合同',owner:'测试人',category:'电子设备',amount:10,date:'2026-10-22'}); if(record.status!=='draft'||store.list('contracts').total!==1) process.exit(2);");
    const seed = spawnSync(process.execPath, ['check-seed.mjs'], { cwd: destination, encoding: 'utf8' });
    expect(seed.status, seed.stderr).toBe(0);
    const definitionPath = join(destination, 'src/modules/contracts/definition.ts');
    const definition = readFileSync(definitionPath, 'utf8');
    writeFileSync(definitionPath, definition.replaceAll('电子设备', '新业务类别'));
    expect(run('check-spec.mjs', [], destination).status).not.toBe(0);
    writeFileSync(definitionPath, definition);
    spec.fields[0].type = 'number';
    writeFileSync(join(destination, 'business-specs/contracts.json'), JSON.stringify(spec));
    expect(run('check-spec.mjs', [], destination).status).not.toBe(0);
  }, 120000);

  it('不同合法 slug 生成独立导出，连续生成后规范和构建均通过', () => {
    const destination = join(temp(), 'slug-demo');
    expect(run('create-project.mjs', [destination]).status).toBe(0);
    symlinkSync(join(root, 'node_modules'), join(destination, 'node_modules'), 'dir');
    for (const slug of ['a-1', 'a1']) {
      const generated = run('generate-module.mjs', [slug, '业务'], destination);
      expect(generated.status, generated.stderr).toBe(0);
    }
    const checked = run('check-spec.mjs', [], destination);
    expect(checked.status, checked.stderr).toBe(0);
    const build = spawnSync('npm', ['run', 'build'], { cwd: destination, encoding: 'utf8', timeout: 90000 });
    expect(build.status, build.stdout + build.stderr).toBe(0);
  }, 120000);

  it('模板带业务校验函数仍可生成，且新模块不继承资产特定规则', () => {
    const destination = join(temp(), 'hook-demo');
    expect(run('create-project.mjs', [destination]).status).toBe(0);
    symlinkSync(join(root, 'node_modules'), join(destination, 'node_modules'), 'dir');
    const definitionPath = join(destination, 'src/modules/assets/definition.ts');
    writeFileSync(definitionPath, readFileSync(definitionPath, 'utf8') + "\nassetModule.validate = () => ({ name: 'asset-only validation' });\n");
    const generated = run('generate-module.mjs', ['contracts', '合同'], destination);
    expect(generated.status, generated.stderr).toBe(0);
    const checked = run('check-spec.mjs', [], destination);
    expect(checked.status, checked.stderr).toBe(0);
    writeFileSync(join(destination, 'check-hook.mjs'), "import {loadProjectModule} from './scripts/project-modules.mjs'; const {modules} = await loadProjectModule(process.cwd()); if(modules.find(module=>module.id==='assets').validate({}).name!=='asset-only validation') process.exit(1); if(modules.find(module=>module.id==='contracts').validate!==undefined) process.exit(2);");
    const hook = spawnSync(process.execPath, ['check-hook.mjs'], { cwd: destination, encoding: 'utf8' });
    expect(hook.status, hook.stderr).toBe(0);
    const build = spawnSync('npm', ['run', 'build'], { cwd: destination, encoding: 'utf8', timeout: 90000 });
    expect(build.status, build.stdout + build.stderr).toBe(0);
  }, 120000);

  it('存在孤立规范时拒绝生成且不会部分写入', () => {
    const destination = join(temp(), 'atomic-demo');
    expect(run('create-project.mjs', [destination]).status).toBe(0);
    symlinkSync(join(root, 'node_modules'), join(destination, 'node_modules'), 'dir');
    const before = readFileSync(join(destination, 'src/modules/registry.ts'), 'utf8');
    writeFileSync(join(destination, 'business-specs/contracts.json'), '{}');
    expect(run('generate-module.mjs', ['contracts', '合同'], destination).status).not.toBe(0);
    expect(existsSync(join(destination, 'src/modules/contracts'))).toBe(false);
    expect(readFileSync(join(destination, 'src/modules/registry.ts'), 'utf8')).toBe(before);
  });
});

describe('TOOL-002 实际交付编排和内容', () => {
  function fixture(fail = false) {
    const destination = temp(); mkdirSync(join(destination, 'scripts'));
    for (const file of ['deliver.mjs', 'files.mjs']) cpSync(join(root, 'scripts', file), join(destination, 'scripts', file));
    writeFileSync(join(destination, 'package.json'), JSON.stringify({ name: 'delivery-fixture', version: '1.0.0', type: 'module', scripts: {
      verify: fail ? 'node -e "process.exit(7)"' : 'node -e "require(\'fs\').mkdirSync(\'dist\');require(\'fs\').writeFileSync(\'dist/index.html\',\'built\');console.log(\'actual verify output\')"',
      'test:e2e': 'node -e "console.log(\'actual e2e output\')"',
    } }));
    writeFileSync(join(destination, '.env'), 'PRIVATE_VALUE=secret');
    for (const name of ['node_modules', '.git', 'work']) { mkdirSync(join(destination, name)); writeFileSync(join(destination, name, 'private.txt'), 'excluded'); }
    mkdirSync(join(destination, 'business-specs')); writeFileSync(join(destination, 'business-specs/demo.json'), '{}');
    return destination;
  }
  it('默认运行两道关口并打包实际输出、静态文件、清单校验和', () => {
    const destination = fixture(); const result = run('deliver.mjs', [], destination);
    expect(result.status, result.stdout + result.stderr).toBe(0);
    const release = JSON.parse(readFileSync(join(destination, 'release/latest.json'), 'utf8'));
    const manifest = JSON.parse(readFileSync(join(destination, 'release', release.directory, 'manifest.json'), 'utf8'));
    expect(manifest.evidence.e2e).toBe('passed'); expect(manifest.complete).toBe(true);
    expect(readFileSync(join(destination, 'release', release.directory, 'evidence/verify.log'), 'utf8')).toContain('actual verify output');
    expect(readFileSync(join(destination, 'release', release.directory, 'evidence/e2e.log'), 'utf8')).toContain('actual e2e output');
    const builtFile = manifest.files.find((file: {path: string; sha256: string}) => file.path === 'dist/index.html');
    expect(builtFile.sha256).toBe(createHash('sha256').update(readFileSync(join(destination, 'release', release.directory, 'dist/index.html'))).digest('hex'));
    const listing = spawnSync('tar', ['-tzf', join(destination, 'release', release.archive)], { encoding: 'utf8' });
    expect(listing.status).toBe(0); expect(listing.stdout).toContain('manifest.json'); expect(listing.stdout).toContain('dist/index.html');
    for (const privatePath of ['/.env', '/node_modules/', '/.git/', '/work/']) expect(listing.stdout).not.toContain(privatePath);
  });
  it('失败关口阻止交付，显式跳过浏览器标记证据不完整', () => {
    const failed = fixture(true); expect(run('deliver.mjs', [], failed).status).not.toBe(0); expect(existsSync(join(failed, 'release/latest.json'))).toBe(false);
    const skipped = fixture(); expect(run('deliver.mjs', ['--skip-e2e'], skipped).status).toBe(0);
    const release = JSON.parse(readFileSync(join(skipped, 'release/latest.json'), 'utf8'));
    const manifest = JSON.parse(readFileSync(join(skipped, 'release', release.directory, 'manifest.json'), 'utf8'));
    expect(manifest.complete).toBe(false); expect(manifest.evidence.e2e).toBe('skipped');
  });
});
