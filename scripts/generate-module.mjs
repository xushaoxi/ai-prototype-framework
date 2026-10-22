import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { loadProjectModule } from './project-modules.mjs';
import { requireAbsent, fail } from './files.mjs';

try {
  const args = process.argv.slice(2); const dryRun = args.includes('--dry-run');
  const positional = args.filter(arg => arg !== '--dry-run');
  if (positional.length !== 2 || args.some(arg => arg.startsWith('--') && arg !== '--dry-run')) throw new Error('用法：npm run generate:module -- contracts 合同 [--dry-run]');
  const [slug, title] = positional;
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 40) throw new Error('模块 ID 须为不超过 40 字符的小写英文 slug，禁止路径');
  if (!title.trim() || title.length > 30 || [...title].some(character => character.codePointAt(0) < 32)) throw new Error('业务名称须为 1—30 个可见字符');
  const root = process.cwd(); const modulePath = join(root, 'src/modules', slug); const specPath = join(root, 'business-specs', `${slug}.json`);
  requireAbsent(modulePath); requireAbsent(specPath);
  const { modules } = await loadProjectModule(root);
  if (modules.some(module => module.id === slug)) throw new Error('模块已经注册');
  const base = modules.find(module => module.id === 'assets');
  if (!base) throw new Error('缺少 T01 资产模板');
  let prefix = slug.replace(/-/g, '').slice(0, 6).toUpperCase();
  const basePrefix = prefix; let suffix = 2;
  while (modules.some(module => module.codePrefix === prefix)) prefix = basePrefix + suffix++;
  const module = structuredClone(base);
  Object.assign(module, { id: slug, name: `${title}台账`, singularName: title, description: `统一管理${title}信息，跟踪登记、启用与归档过程。`, codePrefix: prefix });
  module.fields = module.fields.map(field => ({ ...field, label: field.label.replaceAll('资产', title) }));
  module.statuses = [{ value: 'draft', label: '草稿', color: 'default' }, { value: 'active', label: '已启用', color: 'green' }, { value: 'archived', label: '已归档', color: 'default' }];
  module.actions = [{ key: 'activate', label: '启用', from: ['draft'], to: 'active', tone: 'primary' }, { key: 'archive', label: '归档', from: ['active'], to: 'archived' }, { key: 'restore', label: '恢复草稿', from: ['archived'], to: 'draft' }];
  const spec = { schemaVersion: 1, id: slug, name: module.name, template: 'T01', codePrefix: prefix,
    fields: module.fields.map(field => ({ ...field, required: !!field.required })),
    statuses: module.statuses.map(({ value, label }) => ({ value, label })), actions: module.actions.map(({ key, from, to }) => ({ key, from, to })),
    requirements: [ { id: `${prefix}-001`, acceptance: '组合查询、分页与模块数据隔离正确' }, { id: `${prefix}-002`, acceptance: '新增编辑校验、持久化及版本冲突检查正确' }, { id: `${prefix}-003`, acceptance: '状态流转、初始状态删除和活动记录符合规范' } ],
  };
  const registryPath = join(root, 'src/modules/registry.ts'); const original = readFileSync(registryPath, 'utf8');
  const array = /export\s+const\s+modules\s*:\s*ModuleDefinition\[\]\s*=\s*\[([^\]]*)\]/;
  if (!array.test(original)) throw new Error('registry 格式无法安全更新，请保留标准 modules 数组');
  const identifier = `generated${slug.replace(/-([a-z0-9])/g, (_, character) => character.toUpperCase())}Module`;
  const updated = `import { ${identifier} } from './${slug}/definition';\n` + original.replace(array, (_, members) => `export const modules: ModuleDefinition[] = [${members.trim()}${members.trim() ? ', ' : ''}${identifier}]`);
  if (dryRun) { console.log(`预览：新增 ${modulePath}/definition.ts\n新增 ${specPath}\n更新 ${registryPath}\n不写入任何文件。`); }
  else {
    const registryTemporary = `${registryPath}.${process.pid}.tmp`;
    let moduleCreated = false; let specCreated = false;
    try {
      // All validation happens before this synchronous transaction; rollback on I/O failure.
      mkdirSync(modulePath); moduleCreated = true;
      writeFileSync(join(modulePath, 'definition.ts'), `import type { ModuleDefinition } from '../../core/types';\nexport const ${identifier}: ModuleDefinition = ${JSON.stringify(module, null, 2)};\n`, { flag: 'wx' });
      writeFileSync(specPath, JSON.stringify(spec, null, 2) + '\n', { flag: 'wx' }); specCreated = true;
      writeFileSync(registryTemporary, updated, { flag: 'wx' });
      renameSync(registryTemporary, registryPath);
    } catch (error) {
      if (moduleCreated) rmSync(modulePath, { recursive: true, force: true });
      if (specCreated) rmSync(specPath, { force: true });
      throw error;
    } finally { if (existsSync(registryTemporary)) rmSync(registryTemporary); }
    console.log(`已生成 ${module.name}（${slug}），路由由 registry 自动发现；运行 npm run verify。`);
  }
} catch (error) { fail(error); }
