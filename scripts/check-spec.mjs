import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { loadProjectModule } from './project-modules.mjs';
import { fail } from './files.mjs';

try {
  const root = process.cwd(); const { modules } = await loadProjectModule(root);
  const specs = readdirSync(join(root, 'business-specs')).filter(file => file.endsWith('.json')).map(file => JSON.parse(readFileSync(join(root, 'business-specs', file), 'utf8')));
  const ids = new Set(); const requirementIds = new Set();
  for (const module of modules) {
    if (ids.has(module.id)) throw new Error(`重复模块 ${module.id}`); ids.add(module.id);
    const spec = specs.find(item => item.id === module.id);
    if (!spec || spec.schemaVersion !== 1 || spec.template !== 'T01') throw new Error(`缺少有效规范：${module.id}`);
    const expected = {
      id: module.id, name: module.name, codePrefix: module.codePrefix,
      fields: module.fields.map(field => ({ ...field, required: !!field.required })),
      statuses: module.statuses.map(({ value, label }) => ({ value, label })),
      actions: module.actions.map(({ key, from, to }) => ({ key, from, to })),
    };
    for (const [key, value] of Object.entries(expected)) if (!isDeepStrictEqual(spec[key], value)) throw new Error(`规范与真实模块不一致：${module.id}.${key}`);
    const statuses = new Set(module.statuses.map(status => status.value));
    if (statuses.size !== module.statuses.length || !statuses.has(module.defaultValues.status)) throw new Error(`无效状态：${module.id}`);
    const fields = new Set(); const actions = new Set();
    for (const field of module.fields) {
      if (fields.has(field.key) || !['text', 'textarea', 'number', 'select', 'date'].includes(field.type)) throw new Error(`无效字段：${module.id}.${field.key}`);
      fields.add(field.key);
    }
    for (const action of module.actions) {
      if (actions.has(action.key) || !action.from.length || !statuses.has(action.to) || action.from.some(status => !statuses.has(status))) throw new Error(`无效流转：${module.id}.${action.key}`);
      actions.add(action.key);
    }
    if (!Array.isArray(spec.requirements) || !spec.requirements.length) throw new Error(`缺少验收条件：${module.id}`);
    for (const requirement of spec.requirements) {
      if (typeof requirement.id !== 'string' || !requirement.id.trim() || requirementIds.has(requirement.id) || typeof requirement.acceptance !== 'string' || !requirement.acceptance.trim()) throw new Error(`验收条件 ID 重复或内容为空：${module.id}`);
      requirementIds.add(requirement.id);
    }
  }
  if (specs.length !== modules.length || specs.some(spec => !ids.has(spec.id))) throw new Error('业务规范存在未注册或重复模块');
  console.log(`SPEC-001：${modules.length} 个真实模块的字段类型、标签、状态、动作与规范一致；${requirementIds.size} 项验收条件。`);
} catch (error) { fail(error); }
