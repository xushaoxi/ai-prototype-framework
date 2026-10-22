import { BusinessError } from '../core/types';
import type { BusinessRecord, ListQuery, ListResult, SaveInput, AuditEntry, ModuleDefinition } from '../core/types';
import { modules, getModule } from '../modules/registry';
import { createSeed } from './seed';
import type { DataSnapshot } from './seed';
export const STORAGE_KEY = 'prototype-workbench:data:v1';
export interface BusinessStore {
  list(moduleId: string, query?: ListQuery): ListResult;
  get(moduleId: string, id: string): BusinessRecord;
  create(moduleId: string, input: SaveInput): BusinessRecord;
  update(moduleId: string, id: string, input: SaveInput): BusinessRecord;
  transition(moduleId: string, id: string, actionKey: string, version?: number): BusinessRecord;
  remove(moduleId: string, id: string): void;
  reset(): void;
  exportData(): string;
  importData(text: string): void;
  history(moduleId: string, id: string): AuditEntry[];
}
const recordKeys = ['id', 'code', 'name', 'status', 'owner', 'category', 'amount', 'date', 'notes', 'updatedAt', 'version'];
const copy = <T>(data: T): T => structuredClone(data);
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
function fail(message: string, code = 'VALIDATION_ERROR', status = 400, fields?: Record<string, string>): never { throw new BusinessError(code, message, status, fields); }
function moduleFor(id: string) { return getModule(id) ?? fail('业务模块不存在', 'MODULE_NOT_FOUND', 404); }
function validDate(value: unknown): boolean { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00.000Z`)) && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value; }
function validTime(value: unknown): value is string { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value; }
function validateRecord(module: ModuleDefinition, data: unknown, current?: BusinessRecord): asserts data is BusinessRecord {
  if (!object(data) || Object.keys(data).length !== recordKeys.length || Object.keys(data).some(k => !recordKeys.includes(k))) fail('记录字段结构不正确');
  const fields: Record<string, string> = {};
  for (const key of ['id', 'code', 'name', 'owner', 'category', 'status']) if (typeof data[key] !== 'string' || !data[key].trim()) fields[key] = '此项不能为空';
  if (typeof data.id === 'string' && (data.id.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(data.id))) fields.id = '记录标识格式不正确';
  if (typeof data.code !== 'string' || !new RegExp(`^${module.codePrefix}-\\d{4}-\\d{3,}$`).test(data.code)) fields.code = '编号格式不正确';
  if (!module.statuses.some(s => s.value === data.status)) fields.status = '状态不合法';
  if (!validDate(data.date)) fields.date = '请输入有效日期';
  if (typeof data.amount !== 'number' || !Number.isFinite(data.amount) || data.amount < 0) fields.amount = '金额须为有限的非负数值';
  if (typeof data.notes !== 'string') fields.notes = '备注须为文本';
  if (!Number.isSafeInteger(data.version) || Number(data.version) < 1) fields.version = '版本号不合法';
  if (!validTime(data.updatedAt)) fields.updatedAt = '更新时间不合法';
  for (const field of module.fields) {
    const value = data[field.key];
    if (field.required && (value === undefined || value === null || (typeof value === 'string' && !value.trim()))) fields[field.key] = `${field.label}不能为空`;
    if (field.options && !field.options.some(option => option.value === value)) fields[field.key] = `${field.label}选项不合法`;
    if (field.maxLength && typeof value === 'string' && value.length > field.maxLength) fields[field.key] = `最多${field.maxLength}个字符`;
    if (typeof value === 'number' && ((field.min !== undefined && value < field.min) || (field.max !== undefined && value > field.max))) fields[field.key] = `${field.label}超出允许范围`;
  }
  if (Object.keys(fields).length) fail('请检查填写内容', 'VALIDATION_ERROR', 400, fields);
  const customFields = module.validate?.(copy(data as unknown as BusinessRecord), current ? copy(current) : undefined);
  if (customFields && Object.keys(customFields).length) fail('请检查业务规则', 'VALIDATION_ERROR', 400, customFields);
}
function parseSnapshot(text: string): DataSnapshot {
  if (new TextEncoder().encode(text).byteLength > 2 * 1024 * 1024) fail('备份文件不能超过 2MB', 'IMPORT_INVALID');
  let parsed: unknown; try { parsed = JSON.parse(text); } catch { fail('备份不是有效 JSON', 'IMPORT_INVALID'); }
  if (!object(parsed) || Object.keys(parsed).some(k => !['schemaVersion', 'records', 'history'].includes(k)) || parsed.schemaVersion !== 1 || !object(parsed.records) || !Array.isArray(parsed.history)) fail('备份格式或版本不受支持', 'IMPORT_INVALID');
  const records = parsed.records;
  if (Object.keys(records).length !== modules.length || modules.some(m => !Object.hasOwn(records, m.id)) || Object.keys(records).some(id => !getModule(id))) fail('备份必须包含全部且仅包含已知业务模块', 'IMPORT_INVALID');
  const ids = new Set<string>(); const codes = new Set<string>(); const references = new Set<string>();
  for (const module of modules) {
    const entries = records[module.id]; if (!Array.isArray(entries)) fail('业务记录必须为数组', 'IMPORT_INVALID');
    for (const entry of entries) {
      validateRecord(module, entry);
      if (ids.has(entry.id) || codes.has(entry.code)) fail('备份包含重复标识或编号', 'IMPORT_INVALID');
      ids.add(entry.id); codes.add(entry.code); references.add(`${module.id}/${entry.id}`);
    }
  }
  const auditIds = new Set<string>();
  for (const entry of parsed.history) {
    if (!object(entry) || Object.keys(entry).length !== 6 || Object.keys(entry).some(k => !['id', 'recordId', 'moduleId', 'action', 'at', 'summary'].includes(k)) || ['id', 'recordId', 'moduleId', 'action', 'summary'].some(k => typeof entry[k] !== 'string' || !entry[k].trim()) || !validTime(entry.at) || typeof entry.id !== 'string' || auditIds.has(entry.id) || !references.has(`${String(entry.moduleId)}/${String(entry.recordId)}`)) fail('活动记录格式或关联不合法', 'IMPORT_INVALID');
    const module = moduleFor(String(entry.moduleId));
    if (!['create', 'update', ...module.actions.map(a => a.key)].includes(String(entry.action))) fail('活动记录操作不合法', 'IMPORT_INVALID');
    auditIds.add(entry.id);
  }
  return parsed as unknown as DataSnapshot;
}
function browserStorage(): Storage | undefined { try { return typeof localStorage === 'undefined' ? undefined : localStorage; } catch { return undefined; } }
export function createStore(storage: Storage | undefined = browserStorage()): BusinessStore {
  let saved: string | null = null;
  try { saved = storage?.getItem(STORAGE_KEY) ?? null; } catch { storage = undefined; }
  let state = saved === null ? createSeed() : parseSnapshot(saved);
  function commit(next: DataSnapshot) {
    if (storage) { try { storage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { fail('演示数据保存失败，请释放浏览器存储空间后重试；本次更改未生效。', 'STORAGE_ERROR', 507); } }
    state = next;
  }
  function find(moduleId: string, id: string) { moduleFor(moduleId); return state.records[moduleId].find(r => r.id === id) ?? fail('记录不存在或已删除', 'RECORD_NOT_FOUND', 404); }
  function audit(next: DataSnapshot, moduleId: string, record: BusinessRecord, action: string, summary: string) { next.history.push({ id: globalThis.crypto.randomUUID(), recordId: record.id, moduleId, action, at: record.updatedAt, summary }); }
  function checkInput(input: SaveInput) { if (!object(input) || Object.keys(input).some(k => !recordKeys.includes(k))) fail('提交字段不正确'); }
  function checkVersion(record: BusinessRecord, version?: number) { if (version !== record.version) fail('记录已更新或缺少版本号，请刷新后重试', 'VERSION_CONFLICT', 409); }
  const api: BusinessStore = {
    list(moduleId, query = {}) {
      const module = moduleFor(moduleId); const source = state.records[moduleId];
      if (query.status && !module.statuses.some(s => s.value === query.status)) fail('查询状态不合法');
      if (query.category && !module.fields.find(f => f.key === 'category')?.options?.some(o => o.value === query.category)) fail('查询类别不合法');
      if (query.sortBy && !['updatedAt', 'amount', 'date'].includes(query.sortBy)) fail('排序字段不合法');
      if (query.sortOrder && !['asc', 'desc'].includes(query.sortOrder)) fail('排序方向不合法');
      const page = query.page ?? 1; const size = query.pageSize ?? 10;
      if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(size) || size < 1 || size > 10000) fail('分页参数不合法');
      const keyword = query.keyword?.trim().toLocaleLowerCase() ?? '';
      const base = source.filter(r => (!keyword || [r.code, r.name, r.owner].some(value => value.toLocaleLowerCase().includes(keyword))) && (!query.category || r.category === query.category));
      const counts = Object.fromEntries(module.statuses.map(s => [s.value, base.filter(r => r.status === s.value).length]));
      const matched = base.filter(r => !query.status || r.status === query.status); const key = query.sortBy ?? 'updatedAt'; const direction = query.sortOrder === 'asc' ? 1 : -1;
      matched.sort((a, b) => ((a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : a.code.localeCompare(b.code)) * direction));
      return copy({ items: matched.slice((page - 1) * size, page * size), total: matched.length, counts, amountTotal: matched.reduce((sum, r) => sum + r.amount, 0) });
    },
    get(moduleId, id) { return copy(find(moduleId, id)); },
    create(moduleId, input) {
      const module = moduleFor(moduleId); checkInput(input);
      if (input.id !== undefined || input.code !== undefined || input.version !== undefined || input.updatedAt !== undefined || (input.status !== undefined && input.status !== module.defaultValues.status)) fail('编号、标识、版本和初始状态由系统生成');
      const now = new Date().toISOString(); const year = now.slice(0, 4); const prefix = `${module.codePrefix}-${year}-`;
      const last = state.records[moduleId].reduce((max, r) => r.code.startsWith(prefix) ? Math.max(max, Number(r.code.slice(prefix.length))) : max, 0);
      const record: BusinessRecord = { name: '', category: '', owner: '', amount: 0, date: '', notes: '', status: module.statuses[0].value, ...module.defaultValues, ...input, id: globalThis.crypto.randomUUID(), code: `${prefix}${String(last + 1).padStart(3, '0')}`, version: 1, updatedAt: now };
      for (const key of ['name', 'owner', 'notes'] as const) if (typeof record[key] === 'string') record[key] = record[key].trim();
      validateRecord(module, record); const next = copy(state); next.records[moduleId].push(record); audit(next, moduleId, record, 'create', `登记${module.singularName}：${record.name}`); commit(next); return copy(record);
    },
    update(moduleId, id, input) {
      const module = moduleFor(moduleId); const old = find(moduleId, id); checkInput(input); checkVersion(old, input.version);
      if ((input.id !== undefined && input.id !== id) || (input.code !== undefined && input.code !== old.code) || (input.status !== undefined && input.status !== old.status) || input.updatedAt !== undefined) fail('标识、编号和状态不能直接修改');
      const record = { ...old, ...input, version: old.version + 1, updatedAt: new Date().toISOString() };
      for (const key of ['name', 'owner', 'notes'] as const) if (typeof record[key] === 'string') record[key] = record[key].trim();
      validateRecord(module, record, old); const next = copy(state); next.records[moduleId] = next.records[moduleId].map(r => r.id === id ? record : r); audit(next, moduleId, record, 'update', `更新${module.singularName}信息`); commit(next); return copy(record);
    },
    transition(moduleId, id, actionKey, version) {
      const module = moduleFor(moduleId); const old = find(moduleId, id); checkVersion(old, version); const action = module.actions.find(a => a.key === actionKey);
      if (!action || !action.from.includes(old.status)) fail('当前状态不允许此业务操作', 'ILLEGAL_TRANSITION', 409);
      const record = { ...old, status: action.to, version: old.version + 1, updatedAt: new Date().toISOString() }; const next = copy(state); next.records[moduleId] = next.records[moduleId].map(r => r.id === id ? record : r); audit(next, moduleId, record, action.key, action.label); commit(next); return copy(record);
    },
    remove(moduleId, id) {
      const module = moduleFor(moduleId); const old = find(moduleId, id); if (old.status !== module.statuses[0].value) fail('仅草稿或待评估记录可以删除', 'DELETE_NOT_ALLOWED', 409);
      const next = copy(state); next.records[moduleId] = next.records[moduleId].filter(r => r.id !== id); next.history = next.history.filter(h => !(h.moduleId === moduleId && h.recordId === id)); commit(next);
    },
    reset() { commit(createSeed()); },
    exportData() { return JSON.stringify(state, null, 2); },
    importData(text) { commit(parseSnapshot(text)); },
    history(moduleId, id) { find(moduleId, id); return copy(state.history.filter(h => h.moduleId === moduleId && h.recordId === id)); },
  };
  return api;
}
export const store = createStore();
