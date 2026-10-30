import { BusinessError } from '../core/types';
import type { BusinessRecord, ListQuery, ListResult, SaveInput, AuditEntry, ModuleDefinition } from '../core/types';
import { modules, getModule } from '../modules/registry';
import { createSeed } from './seed';
import type { DataSnapshot } from './seed';
import { STORAGE_KEY } from '../core/storage-key';
export { STORAGE_KEY } from '../core/storage-key';
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
const MAX_SNAPSHOT_BYTES = 2 * 1024 * 1024;
const snapshotSize = (text: string) => new TextEncoder().encode(text).byteLength;
const recordKeys = ['id', 'code', 'name', 'status', 'owner', 'category', 'amount', 'date', 'notes', 'updatedAt', 'version'];
const allowedKeys = (module: ModuleDefinition) => new Set([...recordKeys, ...module.fields.map(field => field.key)]);
const copy = <T>(data: T): T => structuredClone(data);
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
function fail(message: string, code = 'VALIDATION_ERROR', status = 400, fields?: Record<string, string>): never { throw new BusinessError(code, message, status, fields); }
function moduleFor(id: string) { return getModule(id) ?? fail('业务模块不存在', 'MODULE_NOT_FOUND', 404); }
function validDate(value: unknown): boolean { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00.000Z`)) && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value; }
function validTime(value: unknown): value is string { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value; }
function validateRecord(module: ModuleDefinition, data: unknown, current?: BusinessRecord, runBusinessRule = true, snapshot = false): asserts data is BusinessRecord {
  const keys = allowedKeys(module);
  if (!object(data) || recordKeys.some(k => !Object.hasOwn(data, k)) || Object.keys(data).some(k => !keys.has(k)) || Object.values(data).some(value => typeof value !== 'string' && typeof value !== 'number' && !(Array.isArray(value) && Array.from(value).every(item=>typeof item==='string')))) fail('记录字段结构不正确');
  const fields: Record<string, string> = {};
  for (const key of ['id', 'code', 'name', 'owner', 'category', 'status']) if (typeof data[key] !== 'string' || !data[key].trim()) fields[key] = '此项不能为空';
  if (typeof data.id === 'string' && (data.id.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(data.id))) fields.id = '记录标识格式不正确';
  const codeParts = typeof data.code === 'string' && data.code.startsWith(`${module.codePrefix}-`) ? /^(\d{4})-(\d{3,})$/.exec(data.code.slice(module.codePrefix.length + 1)) : null;
  if (!codeParts || !Number.isSafeInteger(Number(codeParts[2])) || Number(codeParts[2]) < 1) fields.code = '编号须含四位年份和安全整数序号';
  if (!module.statuses.some(s => s.value === data.status)) fields.status = '状态不合法';
  if (!validDate(data.date)) fields.date = '请输入有效日期';
  if (typeof data.amount !== 'number' || !Number.isFinite(data.amount) || data.amount < 0) fields.amount = '金额须为有限的非负数值';
  if (typeof data.notes !== 'string') fields.notes = '备注须为文本';
  if (!Number.isSafeInteger(data.version) || Number(data.version) < 1) fields.version = '版本号不合法';
  if (!validTime(data.updatedAt)) fields.updatedAt = '更新时间不合法';
  for (const field of module.fields) {
    const value = data[field.key];
    const multiple=field.type==='checkbox'||field.type==='multiselect'||field.type==='dateRange';
    if(multiple){
      if(value===undefined||value===''){if(field.required)fields[field.key]=`${field.label}不能为空`;continue;}
      if(!Array.isArray(value)||Array.from(value).some(item=>typeof item!=='string')){fields[field.key]=`${field.label}须为文本数组`;continue;}
      if(!value.length){if(field.required)fields[field.key]=`${field.label}不能为空`;continue;}
      if(field.type==='dateRange'){
        if(value.length!==2||!value.every(validDate)||value[0]>value[1])fields[field.key]=`${field.label}须为有效且顺序正确的起止日期`;
      }else if(new Set(value).size!==value.length||!field.options||value.some(item=>!field.options!.some(option=>option.value===item)))fields[field.key]=`${field.label}选项不合法或重复`;
      continue;
    }
    const empty = value === undefined || value === null || (typeof value === 'string' && !value.trim());
    if (empty) {
      if (field.required) fields[field.key] = `${field.label}不能为空`;
      continue;
    }
    if (field.type === 'number') {
      if (typeof value !== 'number' || !Number.isFinite(value)) fields[field.key] = `${field.label}须为有效数字`;
      else if ((field.min !== undefined && value < field.min) || (field.max !== undefined && value > field.max)) fields[field.key] = `${field.label}超出允许范围`;
      // 旧版金额没有精度约束；恢复快照或保持旧金额时保留原值，新写入仍按当前规则校验。
      else if(field.precision!==undefined&&!(field.key==='amount'&&(snapshot||current?.amount===value))&&Number(value.toFixed(field.precision))!==value)fields[field.key]=`${field.label}最多保留${field.precision}位小数`;
    } else {
      if (typeof value !== 'string') fields[field.key] = `${field.label}须为文本`;
      else {
        if (field.type === 'date' && !validDate(value)) fields[field.key] = `${field.label}须为有效日期`;
        if (field.type === 'time' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) fields[field.key] = `${field.label}须为有效时间（HH:mm）`;
        if (field.maxLength !== undefined && value.length > field.maxLength) fields[field.key] = `最多${field.maxLength}个字符`;
      }
    }
    if (field.options && !field.options.some(option => option.value === value)) fields[field.key] = `${field.label}选项不合法`;
  }
  if (Object.keys(fields).length) fail('请检查填写内容', 'VALIDATION_ERROR', 400, fields);
  const customFields = runBusinessRule ? module.validate?.(copy(data as unknown as BusinessRecord), current ? copy(current) : undefined) : undefined;
  if (customFields && Object.keys(customFields).length) fail('请检查业务规则', 'VALIDATION_ERROR', 400, customFields);
}
function parseSnapshot(text: string, persisted = false): DataSnapshot {
  if (snapshotSize(text) > MAX_SNAPSHOT_BYTES) fail('备份文件不能超过 2MB', 'IMPORT_INVALID');
  let parsed: unknown; try { parsed = JSON.parse(text); } catch { fail('备份不是有效 JSON', 'IMPORT_INVALID'); }
  if (!object(parsed) || Object.keys(parsed).some(k => !['schemaVersion', 'records', 'history'].includes(k)) || parsed.schemaVersion !== 1 || !object(parsed.records) || !Array.isArray(parsed.history)) fail('备份格式或版本不受支持', 'IMPORT_INVALID');
  const records = parsed.records;
  if (persisted) for (const module of modules) if (!Object.hasOwn(records, module.id)) records[module.id] = [];
  if (Object.keys(records).length !== modules.length || modules.some(m => !Object.hasOwn(records, m.id)) || Object.keys(records).some(id => !getModule(id))) fail('备份必须包含全部且仅包含已知业务模块', 'IMPORT_INVALID');
  const ids = new Set<string>(); const codes = new Set<string>(); const references = new Set<string>();
  for (const module of modules) {
    const entries = records[module.id]; if (!Array.isArray(entries)) fail('业务记录必须为数组', 'IMPORT_INVALID');
    for (const entry of entries) {
      // Stored snapshots replay validated data; current-dependent business hooks run only on commands/import.
      validateRecord(module, entry, undefined, !persisted, true);
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
  if (snapshotSize(JSON.stringify(parsed)) > MAX_SNAPSHOT_BYTES) fail('演示数据超过 2MB，请导出并精简数据后重试。', 'STORAGE_LIMIT', 507);
  return parsed as unknown as DataSnapshot;
}
function browserStorage(): Storage | undefined { try { return typeof localStorage === 'undefined' ? undefined : localStorage; } catch { return undefined; } }
export function createStore(storage: Storage | undefined = browserStorage()): BusinessStore {
  let saved: string | null = null;
  try { saved = storage?.getItem(STORAGE_KEY) ?? null; } catch { storage = undefined; }
  let state = saved === null ? createSeed() : parseSnapshot(saved, true);
  function sync() {
    if (!storage) return;
    let latest: string | null;
    try { latest = storage.getItem(STORAGE_KEY); } catch { storage = undefined; return; }
    state = latest === null ? createSeed() : parseSnapshot(latest, true);
  }
  function commit(next: DataSnapshot) {
    const serialized = JSON.stringify(next);
    if (snapshotSize(serialized) > MAX_SNAPSHOT_BYTES) fail('演示数据超过 2MB，本次更改未生效。请导出备份并精简记录后重试。', 'STORAGE_LIMIT', 507);
    if (storage) { try { storage.setItem(STORAGE_KEY, serialized); } catch { fail('演示数据保存失败，请释放浏览器存储空间后重试；本次更改未生效。', 'STORAGE_ERROR', 507); } }
    state = next;
  }
  function find(moduleId: string, id: string) { moduleFor(moduleId); return state.records[moduleId].find(r => r.id === id) ?? fail('记录不存在或已删除', 'RECORD_NOT_FOUND', 404); }
  function audit(next: DataSnapshot, moduleId: string, record: BusinessRecord, action: string, summary: string) { next.history.push({ id: globalThis.crypto.randomUUID(), recordId: record.id, moduleId, action, at: record.updatedAt, summary }); }
  function checkInput(module: ModuleDefinition, input: SaveInput) { if (!object(input) || Object.keys(input).some(k => !allowedKeys(module).has(k))) fail('提交字段不正确'); }
  function checkVersion(record: BusinessRecord, version?: number) { if (version !== record.version) fail('记录已更新或缺少版本号，请刷新后重试', 'VERSION_CONFLICT', 409); }
  const api: BusinessStore = {
    list(moduleId, query = {}) {
      sync();
      const module = moduleFor(moduleId); const source = state.records[moduleId];
      if (query.status && !module.statuses.some(s => s.value === query.status)) fail('查询状态不合法');
      if (query.category && !module.fields.find(f => f.key === 'category')?.options?.some(o => o.value === query.category)) fail('查询类别不合法');
      if ((query.dateFrom !== undefined && !validDate(query.dateFrom)) || (query.dateTo !== undefined && !validDate(query.dateTo))) fail('查询日期格式不合法');
      if (query.dateFrom && query.dateTo && query.dateFrom > query.dateTo) fail('开始日期不能晚于结束日期');
      if (query.sortBy && !['updatedAt', 'amount', 'date'].includes(query.sortBy)) fail('排序字段不合法');
      if (query.sortOrder && !['asc', 'desc'].includes(query.sortOrder)) fail('排序方向不合法');
      const page = query.page ?? 1; const size = query.pageSize ?? 10;
      if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(size) || size < 1 || size > 10000) fail('分页参数不合法');
      const keyword = query.keyword?.trim().toLocaleLowerCase() ?? '';
      const searchKeys = [...new Set(['code', 'name', 'owner', ...module.fields.filter(field => field.searchable).map(field => field.key)])];
      const base = source.filter(r => (!keyword || searchKeys.some(key => String(r[key] ?? '').toLocaleLowerCase().includes(keyword))) && (!query.category || r.category === query.category) && (!query.dateFrom || r.date >= query.dateFrom) && (!query.dateTo || r.date <= query.dateTo));
      const counts = Object.fromEntries(module.statuses.map(s => [s.value, base.filter(r => r.status === s.value).length]));
      const matched = base.filter(r => !query.status || r.status === query.status); const key = query.sortBy ?? 'updatedAt'; const direction = query.sortOrder === 'asc' ? 1 : -1;
      matched.sort((a, b) => ((a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : a.code.localeCompare(b.code)) * direction));
      return copy({ items: matched.slice((page - 1) * size, page * size), total: matched.length, counts, amountTotal: matched.reduce((sum, r) => sum + r.amount, 0) });
    },
    get(moduleId, id) { sync(); return copy(find(moduleId, id)); },
    create(moduleId, input) {
      sync();
      const module = moduleFor(moduleId); checkInput(module, input);
      if (input.id !== undefined || input.code !== undefined || input.version !== undefined || input.updatedAt !== undefined || (input.status !== undefined && input.status !== module.defaultValues.status)) fail('编号、标识、版本和初始状态由系统生成');
      const now = new Date().toISOString(); const year = now.slice(0, 4); const prefix = `${module.codePrefix}-${year}-`;
      const last = state.records[moduleId].reduce((max, r) => r.code.startsWith(prefix) ? Math.max(max, Number(r.code.slice(prefix.length))) : max, 0);
      if (!Number.isSafeInteger(last + 1)) fail('当前年度编号已达到安全上限，请检查备份中的编号。', 'CODE_LIMIT', 409);
      const record: BusinessRecord = { name: '', category: '', owner: '', amount: Number.NaN, date: '', notes: '', status: module.statuses[0].value, ...module.defaultValues, ...input, id: globalThis.crypto.randomUUID(), code: `${prefix}${String(last + 1).padStart(3, '0')}`, version: 1, updatedAt: now };
      for (const key of ['name', 'owner', 'notes'] as const) if (typeof record[key] === 'string') record[key] = record[key].trim();
      validateRecord(module, record); const next = copy(state); next.records[moduleId].push(copy(record)); audit(next, moduleId, record, 'create', `登记${module.singularName}：${record.name}`); commit(next); return copy(record);
    },
    update(moduleId, id, input) {
      sync();
      const module = moduleFor(moduleId); const old = find(moduleId, id); checkInput(module, input); checkVersion(old, input.version);
      if ((input.id !== undefined && input.id !== id) || (input.code !== undefined && input.code !== old.code) || (input.status !== undefined && input.status !== old.status) || input.updatedAt !== undefined) fail('标识、编号和状态不能直接修改');
      const record = { ...old, ...input, version: old.version + 1, updatedAt: new Date().toISOString() };
      for (const key of ['name', 'owner', 'notes'] as const) if (typeof record[key] === 'string') record[key] = record[key].trim();
      validateRecord(module, record, old); const next = copy(state); next.records[moduleId] = next.records[moduleId].map(r => r.id === id ? copy(record) : r); audit(next, moduleId, record, 'update', `更新${module.singularName}信息`); commit(next); return copy(record);
    },
    transition(moduleId, id, actionKey, version) {
      sync();
      const module = moduleFor(moduleId); const old = find(moduleId, id); checkVersion(old, version); const action = module.actions.find(a => a.key === actionKey);
      if (!action || !action.from.includes(old.status)) fail('当前状态不允许此业务操作', 'ILLEGAL_TRANSITION', 409);
      const record = { ...old, status: action.to, version: old.version + 1, updatedAt: new Date().toISOString() }; validateRecord(module, record, old); const next = copy(state); next.records[moduleId] = next.records[moduleId].map(r => r.id === id ? record : r); audit(next, moduleId, record, action.key, action.label); commit(next); return copy(record);
    },
    remove(moduleId, id) {
      sync();
      const module = moduleFor(moduleId); const old = find(moduleId, id); if (old.status !== (module.defaultValues.status ?? module.statuses[0].value)) fail('仅初始状态的记录可以删除', 'DELETE_NOT_ALLOWED', 409);
      const next = copy(state); next.records[moduleId] = next.records[moduleId].filter(r => r.id !== id); next.history = next.history.filter(h => !(h.moduleId === moduleId && h.recordId === id)); commit(next);
    },
    reset() { sync(); commit(createSeed()); },
    exportData() { sync(); return JSON.stringify(state); },
    importData(text) { sync(); commit(parseSnapshot(text)); },
    history(moduleId, id) { sync(); find(moduleId, id); return copy(state.history.filter(h => h.moduleId === moduleId && h.recordId === id)); },
  };
  return api;
}
export const store = createStore();

// The pattern workbench deliberately owns a separate snapshot and storage namespace.
import type { PatternSnapshot, PatternRecord, FormPayload, FileMeta, OrgNode, PatternRole, PatternUser, ApprovalTask, PatternSettings, PatternNotice, PatternAudit, PatternDraft } from '../core/patterns/types';
import { PERMISSION_OPTIONS } from '../core/patterns/types';
export const PATTERN_STORAGE_KEY = 'prototype-workbench:patterns:v1';
const patternLimit = 2 * 1024 * 1024;
const patternMimes = ['text/csv', 'application/pdf', 'image/png', 'image/jpeg', 'text/plain', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
function pObject(value: unknown, keys: string[], optional: string[] = []): Record<string, unknown> {
  if (!object(value) || keys.some(k => !Object.hasOwn(value, k)) || Object.keys(value).some(k => !keys.includes(k) && !optional.includes(k))) fail('模式数据结构不正确');
  return value;
}
function pText(value: unknown, empty = false): string {
  if (typeof value !== 'string' || (!empty && !value.trim()) || value.length > 10000) fail('文本字段不正确或超长');
  return value;
}
function pId(value: unknown): string { const id = pText(value); if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) fail('标识格式不正确'); return id; }
function pNumber(value: unknown, minimum = 0): number { if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum) fail('数值字段不正确'); return value; }
function pBool(value: unknown): boolean { if (typeof value !== 'boolean') fail('布尔字段不正确'); return value; }
function pEnum<T extends string>(value: unknown, options: readonly T[]): T { for (const option of options) if (value === option) return option; return fail('选项值不合法'); }
function pArray<T>(value: unknown, parse: (item: unknown) => T): T[] { if (!Array.isArray(value) || value.length > 10000) fail('数组字段不正确'); return Array.from(value, parse); }
function pUnique<T extends { id: string }>(items: T[]): T[] { if (new Set(items.map(i => i.id)).size !== items.length) fail('标识不能重复'); return items; }
function pStrings(value: unknown): string[] { const values = pArray(value, v => pText(v)); if (new Set(values).size !== values.length) fail('选项不能重复'); return values; }
function pDate(value: unknown): string { if (!validDate(value)) fail('日期格式不正确'); return pText(value); }
function pTime(value: unknown): string { if (!validTime(value)) fail('时间格式不正确'); return value; }
function pFile(value: unknown): FileMeta {
  const v = pObject(value, ['id', 'name', 'size', 'type']); const name = pText(v.name);
  if (name.length > 255 || /[/\\]/.test(name) || Array.from(name).some(c=>c.charCodeAt(0)<32) || name === '.' || name === '..') fail('附件名称不安全');
  const size = pNumber(v.size, 1); if (!Number.isSafeInteger(size) || size > 5 * 1024 * 1024) fail('附件最大5MB');
  const type=pEnum(v.type, patternMimes);
  const extensions:Record<string,string[]>={'application/pdf':['pdf'],'image/png':['png'],'image/jpeg':['jpg','jpeg'],'text/plain':['txt'],'text/csv':['csv'],'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':['xlsx']};
  if(!extensions[type].includes(name.split('.').at(-1)?.toLowerCase()??''))fail('附件扩展名与类型不匹配');
  return { id: pId(v.id), name, size, type };
}
function pForm(value: unknown, draft = false): FormPayload {
  const v = pObject(value, ['name','category','owner','amount','date','notes','classification','reason','tags','items','files']);
  if(!Array.isArray(v.files)||v.files.length>5)fail('表单附件最多5个');
  const classification = pEnum(v.classification, ['basic','special']);
  const reason = pText(v.reason, draft || classification !== 'special');
  const items = pUnique(pArray(v.items, item => { const line = pObject(item, ['id','name','quantity','price']); const quantity=pNumber(line.quantity,draft?0:1); if(!Number.isSafeInteger(quantity)) fail('明细数量须为正整数'); return {id:pId(line.id),name:pText(line.name,draft),quantity,price:pNumber(line.price)}; }));
  return { name:pText(v.name,draft),category:pText(v.category,draft),owner:pText(v.owner,draft),amount:pNumber(v.amount),date:draft&&v.date===''?'':pDate(v.date),notes:pText(v.notes,true),classification,reason,tags:pStrings(v.tags),items,files:pUnique(pArray(v.files,pFile)) };
}
function pRecord(value: unknown): PatternRecord {
  const v = pObject(value, ['id','code','name','category','owner','amount','date','status','notes','tags'], ['details']);
  const record: PatternRecord = {id:pId(v.id),code:pText(v.code),name:pText(v.name),category:pText(v.category),owner:pText(v.owner),amount:pNumber(v.amount),date:pDate(v.date),status:pEnum(v.status,['draft','active','archived']),notes:pText(v.notes,true),tags:pStrings(v.tags)};
  if(v.details!==undefined) { record.details=pForm(v.details); for(const key of ['name','category','owner','amount','date','notes'] as const) if(record.details[key]!==record[key]) fail('表单详情与记录字段不一致'); }
  return record;
}
function pNode(value: unknown): OrgNode {const v=pObject(value,['id','name','parentId','enabled']);return {id:pId(v.id),name:pText(v.name),parentId:v.parentId===null?null:pId(v.parentId),enabled:pBool(v.enabled)};}
function pRole(value: unknown): PatternRole {const v=pObject(value,['id','name','permissions','scope']);const permissions=pStrings(v.permissions);if(permissions.some(p=>!PERMISSION_OPTIONS.some(o=>o.value===p)))fail('权限值不在白名单');return{id:pId(v.id),name:pText(v.name),permissions,scope:pEnum(v.scope,['all','department','self'])};}
function pUser(value: unknown): PatternUser {const v=pObject(value,['id','name','email','orgId','roleIds','enabled']);const email=pText(v.email);if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail('邮箱格式不正确');return{id:pId(v.id),name:pText(v.name),email,orgId:pId(v.orgId),roleIds:pStrings(v.roleIds),enabled:pBool(v.enabled)};}
function pTask(value: unknown): ApprovalTask {const v=pObject(value,['id','title','applicant','assignee','status','comment','createdAt']);const status=pEnum(v.status,['pending','approved','rejected']);return{id:pId(v.id),title:pText(v.title),applicant:pText(v.applicant),assignee:pText(v.assignee),status,comment:pText(v.comment,status!=='rejected'),createdAt:pTime(v.createdAt)};}
function pSettings(value: unknown): PatternSettings {const v=pObject(value,['systemName','notifications','timezone']);const timezone=pText(v.timezone);try{new Intl.DateTimeFormat('zh-CN',{timeZone:timezone});}catch{fail('时区无效');}return {systemName:pText(v.systemName),notifications:pBool(v.notifications),timezone};}
function pNotice(value: unknown): PatternNotice {const v=pObject(value,['id','title','read','createdAt']);return{id:pId(v.id),title:pText(v.title),read:pBool(v.read),createdAt:pTime(v.createdAt)};}
function pAudit(value: unknown): PatternAudit {const v=pObject(value,['id','action','summary','at']);return{id:pId(v.id),action:pText(v.action),summary:pText(v.summary),at:pTime(v.at)};}
function pDraft(value: unknown): PatternDraft {const v=pObject(value,['id','title','values','updatedAt']);return{id:pId(v.id),title:pText(v.title),values:pForm(v.values,true),updatedAt:pTime(v.updatedAt)};}
function pSnapshot(value: unknown): PatternSnapshot {
  const v=pObject(value,['version','records','deletedRecords','nodes','roles','users','tasks','settings','notices','audit','drafts','files']);
  const version=pNumber(v.version,1);if(!Number.isSafeInteger(version))fail('版本号无效');
  const s:PatternSnapshot={version,records:pArray(v.records,pRecord),deletedRecords:pArray(v.deletedRecords,pRecord),nodes:pUnique(pArray(v.nodes,pNode)),roles:pUnique(pArray(v.roles,pRole)),users:pUnique(pArray(v.users,pUser)),tasks:pUnique(pArray(v.tasks,pTask)),settings:pSettings(v.settings),notices:pUnique(pArray(v.notices,pNotice)),audit:pUnique(pArray(v.audit,pAudit)),drafts:pUnique(pArray(v.drafts,pDraft)),files:pUnique(pArray(v.files,pFile))};
  const records=pUnique([...s.records,...s.deletedRecords]); if(new Set(records.map(r=>r.code)).size!==records.length)fail('业务编号重复');
  if(s.deletedRecords.some(r=>r.status!=='draft'))fail('回收站仅接受草稿');
  for(const node of s.nodes){ const seen=new Set([node.id]);let parent=node.parentId;while(parent!==null){if(seen.has(parent))fail('组织不能循环引用');seen.add(parent);const found=s.nodes.find(n=>n.id===parent);if(!found)fail('父组织不存在');parent=found.parentId;} }
  for(const user of s.users) if(!s.nodes.some(n=>n.id===user.orgId)||user.roleIds.some(id=>!s.roles.some(r=>r.id===id)))fail('用户引用的组织或角色不存在');
  for(const details of [...records.flatMap(r=>r.details?[r.details]:[]),...s.drafts.map(d=>d.values)])for(const file of details.files)if(!s.files.some(f=>f.id===file.id&&f.name===file.name&&f.type===file.type&&f.size===file.size))fail('表单附件不存在或元数据不一致');
  if(new TextEncoder().encode(JSON.stringify(s)).length>patternLimit)fail('模式备份不能超过2MB');
  return s;
}
function patternSeed(): PatternSnapshot {
  const at='2026-10-29T00:00:00.000Z';
  return {version:1,records:Array.from({length:24},(_,i)=>({id:`pattern-${i+1}`,code:`PAT-${String(i+1).padStart(4,'0')}`,name:`${['办公设备','服务采购','项目建设','运营物资'][i%4]}申请 ${i+1}`,category:['设备','服务','项目'][i%3],owner:['张晓明','李华','王宁'][i%3],amount:(i+1)*500,date:`2026-10-${String(i%28+1).padStart(2,'0')}`,status:i%3===0?'draft':i%3===1?'active':'archived',notes:'确定性演示数据',tags:i%2===0?['重点']:[]})),deletedRecords:[],nodes:[{id:'org-root',name:'示例集团',parentId:null,enabled:true},{id:'org-tech',name:'技术中心',parentId:'org-root',enabled:true},{id:'org-ops',name:'运营中心',parentId:'org-root',enabled:true},{id:'org-dev',name:'研发部',parentId:'org-tech',enabled:true}],roles:[{id:'role-admin',name:'演示管理员',permissions:PERMISSION_OPTIONS.map(p=>p.value),scope:'all'},{id:'role-reader',name:'演示查看者',permissions:['record.read'],scope:'self'}],users:[{id:'user-1',name:'张晓明',email:'zhang@example.test',orgId:'org-dev',roleIds:['role-admin'],enabled:true},{id:'user-2',name:'李华',email:'li@example.test',orgId:'org-ops',roleIds:['role-reader'],enabled:true}],tasks:Array.from({length:4},(_,i)=>({id:`task-${i+1}`,title:`采购申请审批 ${i+1}`,applicant:['张晓明','李华'][i%2],assignee:'演示审批人',status:'pending',comment:'',createdAt:at})),settings:{systemName:'后台通用原型工作台',notifications:true,timezone:'Asia/Shanghai'},notices:[{id:'notice-1',title:'待审批事项提醒',read:false,createdAt:at},{id:'notice-2',title:'欢迎体验后台模式库（演示仿真）',read:false,createdAt:at}],audit:[],drafts:[],files:[]};
}
export interface PatternStore { get(): PatternSnapshot; act(version: unknown, action: unknown): PatternSnapshot }
export function createPatternStore(storage?:Storage): PatternStore {
  let state=patternSeed();
  const sync=()=>{if(!storage)return;let text:string|null;try{text=storage.getItem(PATTERN_STORAGE_KEY);}catch{fail('模式存储读取失败','STORAGE_ERROR',503);}if(text===null)return;try{if(new TextEncoder().encode(text).length>patternLimit)fail('模式快照超过2MB');const parsed:unknown=JSON.parse(text);state=pSnapshot(parsed);}catch{fail('模式数据损坏，请导入有效的模式备份或重置模式库','PATTERN_STORAGE_CORRUPT',409);}};
  const commit=(next:PatternSnapshot)=>{const checked=pSnapshot(next);const text=JSON.stringify(checked);if(storage)try{storage.setItem(PATTERN_STORAGE_KEY,text);}catch{fail('模式数据保存失败，请检查存储空间','STORAGE_ERROR',507);}state=checked;return copy(state);};
  const find=<T extends {id:string}>(items:T[],id:string):T=>items.find(i=>i.id===id)??fail('模式数据不存在','NOT_FOUND',404);
  const upsert=<T extends {id:string}>(items:T[],value:T)=>{const index=items.findIndex(i=>i.id===value.id);if(index<0)items.push(value);else items[index]=value;};
  return {get(){sync();return copy(state);},act(version,action){
    if(!object(action)||typeof action.type!=='string')fail('操作结构不正确');
    const known=['record.save','record.delete','record.restore','record.purge','record.status','record.import','node.save','node.delete','role.save','role.delete','user.save','user.delete','task.decide','settings.save','notice.read','draft.save','draft.delete','file.add','file.delete','reset','backup.restore'];
    if(!known.includes(action.type))fail('不支持的模式操作');
    // Recovery actions can replace a damaged snapshot; their caller still supplies a valid version.
    let damaged=false;try{sync();}catch(error){if(error instanceof BusinessError&&error.code==='PATTERN_STORAGE_CORRUPT'&&['reset','backup.restore'].includes(action.type))damaged=true;else throw error;}
    if(typeof version!=='number'||!Number.isSafeInteger(version)||version<1)fail('版本号不正确');
    if(!damaged&&version!==state.version)fail('数据已更新，请刷新后重试','VERSION_CONFLICT',409);
    let next=copy(state);const now=new Date().toISOString();const uid=(prefix:string)=>`${prefix}-${crypto.randomUUID()}`;
    const ids=()=>{const values=pStrings(action.ids);if(!values.length)fail('请至少选择一项');return values;};
    const registerFiles=(files:FileMeta[])=>{for(const file of files){const existing=next.files.find(f=>f.id===file.id);if(existing&&(existing.name!==file.name||existing.size!==file.size||existing.type!==file.type))fail('同一附件标识不能指向不同元数据');if(!existing)next.files.push(file);}};
    const recordInput=(value:unknown,current?:PatternRecord)=>{const v=pObject(value,['name','category','owner','amount','date','status','notes','tags'],['id','details']);if(!current&&v.id!==undefined)fail('导入或新增不能指定标识');const input={...v,id:current?.id??uid('record'),code:current?.code??uid('PAT')};const record=pRecord(input);if(current&&record.status!==current.status)fail('请通过状态操作更改状态');if(!current&&record.status!=='draft')fail('新记录必须为草稿');registerFiles(record.details?.files??[]);return record;};
    switch(action.type){
      case 'record.save':{pObject(action,['type','record']);if(!object(action.record))fail('记录结构不正确');const id=action.record.id===undefined?undefined:pId(action.record.id);const current=id?find(next.records,id):undefined;const record=recordInput(action.record,current);upsert(next.records,record);break;}
      case 'record.import':{pObject(action,['type','records']);const imported=pArray(action.records,r=>recordInput(r));if(!imported.length)fail('导入记录不能为空');next.records.push(...imported);break;}
      case 'record.status':{pObject(action,['type','ids','status']);const status=pEnum(action.status,['draft','active','archived']);for(const id of ids()){const r=find(next.records,id);if(!((r.status==='draft'&&status==='active')||(r.status==='active'&&status==='archived')||(r.status==='archived'&&status==='draft')))fail('状态流转不合法','ILLEGAL_TRANSITION',409);r.status=status;}break;}
      case 'record.delete':{pObject(action,['type','ids']);const selected=ids().map(id=>find(next.records,id));if(selected.some(r=>r.status!=='draft'))fail('只有草稿可以删除','DELETE_NOT_ALLOWED',409);next.deletedRecords.push(...selected);next.records=next.records.filter(r=>!selected.some(s=>s.id===r.id));break;}
      case 'record.restore':case 'record.purge':{pObject(action,['type','ids']);const selected=ids().map(id=>find(next.deletedRecords,id));if(action.type==='record.restore')next.records.push(...selected);next.deletedRecords=next.deletedRecords.filter(r=>!selected.some(s=>s.id===r.id));break;}
      case 'node.save':pObject(action,['type','node']);upsert(next.nodes,pNode(action.node));break;
      case 'node.delete':{pObject(action,['type','id']);const id=pId(action.id);find(next.nodes,id);if(next.nodes.some(n=>n.parentId===id)||next.users.some(u=>u.orgId===id))fail('组织被子组织或用户引用','IN_USE',409);next.nodes=next.nodes.filter(n=>n.id!==id);break;}
      case 'role.save':pObject(action,['type','role']);upsert(next.roles,pRole(action.role));break;
      case 'role.delete':{pObject(action,['type','id']);const id=pId(action.id);find(next.roles,id);if(next.users.some(u=>u.roleIds.includes(id)))fail('角色正在被用户使用','IN_USE',409);next.roles=next.roles.filter(r=>r.id!==id);break;}
      case 'user.save':pObject(action,['type','user']);upsert(next.users,pUser(action.user));break;
      case 'user.delete':{pObject(action,['type','id']);const id=pId(action.id);find(next.users,id);next.users=next.users.filter(u=>u.id!==id);break;}
      case 'task.decide':{pObject(action,['type','id','decision','comment']);const task=find(next.tasks,pId(action.id));if(task.status!=='pending')fail('该审批已处理','TASK_ALREADY_DECIDED',409);const decision=pEnum(action.decision,['approved','rejected']);task.comment=pText(action.comment,decision!=='rejected');task.status=decision;break;}
      case 'settings.save':pObject(action,['type','settings']);next.settings=pSettings(action.settings);break;
      case 'notice.read':pObject(action,['type','ids']);for(const id of ids())find(next.notices,id).read=true;break;
      case 'draft.save':{pObject(action,['type','draft']);if(!object(action.draft))fail('草稿结构不正确');const draftInput=pObject(action.draft,['id','title','values']);const draft=pDraft({...draftInput,updatedAt:now});registerFiles(draft.values.files);upsert(next.drafts,draft);break;}
      case 'draft.delete':{pObject(action,['type','id']);const id=pId(action.id);find(next.drafts,id);next.drafts=next.drafts.filter(d=>d.id!==id);break;}
      case 'file.add':{pObject(action,['type','files']);const files=pUnique(pArray(action.files,pFile));if(!files.length)fail('请选择文件');if(files.some(f=>next.files.some(old=>old.id===f.id)))fail('文件标识重复');next.files.push(...files);break;}
      case 'file.delete':{pObject(action,['type','id']);const id=pId(action.id);find(next.files,id);const forms=[...next.records,...next.deletedRecords].flatMap(r=>r.details?[r.details]:[]).concat(next.drafts.map(d=>d.values));if(forms.some(f=>f.files.some(file=>file.id===id)))fail('文件被表单或草稿引用','IN_USE',409);next.files=next.files.filter(f=>f.id!==id);break;}
      case 'reset':pObject(action,['type']);next=patternSeed();break;
      case 'backup.restore':pObject(action,['type','snapshot']);next=pSnapshot(action.snapshot);break;
    }
    next.version=state.version+1;if(!Number.isSafeInteger(next.version))fail('版本号已达上限');next.audit.push({id:uid('audit'),action:action.type,summary:`执行模式操作：${action.type}`,at:now});return commit(next);
  }};
}
let patternStorage:Storage|undefined;try{if(typeof localStorage!=='undefined')patternStorage=localStorage;}catch{ /* memory-only demo when browser storage is unavailable */ }
export const patternStore=createPatternStore(patternStorage);

// Finite structure demonstrations have their own namespace and atomic snapshot.
import type {StructureSnapshot,ScheduleTask,LayoutWidget,ReportConfig} from '../core/structures/types';
export const STRUCTURE_STORAGE_KEY='prototype.structures.v1';
const structureSeed=():StructureSnapshot=>({schema:1,nodes:[{id:'object',label:'交付准备',kind:'对象',x:320,y:40},{id:'person',label:'林青',kind:'人员',x:100,y:230},{id:'task',label:'材料核对',kind:'任务',x:550,y:230}],edges:[{id:'e1',source:'object',target:'person',label:'负责'},{id:'e2',source:'object',target:'task',label:'包含'}],version:1,stage:0,blocked:false,history:[],tasks:[{id:'t1',parentId:null,name:'交付准备',owner:'林青',start:'2026-10-26',end:'2026-10-30',progress:60},{id:'t2',parentId:'t1',name:'材料核对',owner:'林青',start:'2026-10-28',end:'2026-10-28',progress:100,milestone:true,actualStart:'2026-10-28',actualEnd:'2026-10-28'},{id:'t3',parentId:'t1',name:'现场验证',owner:'周宁',start:'2026-10-28',end:'2026-10-30',progress:20,actualStart:'2026-10-29'}],widgets:[{id:'w1',kind:'metric',width:1},{id:'w2',kind:'tasks',width:2}],report:{fields:['name','owner','progress'],minimum:0}});
function structureKeys(value:Record<string,unknown>,keys:string[]){if(Object.keys(value).some(key=>!keys.includes(key)))fail('存在不支持的字段');}
function validateStructures(value:unknown):asserts value is StructureSnapshot{
 if(!object(value)||value.schema!==1||!Number.isSafeInteger(value.version)||Number(value.version)<1||!Number.isInteger(value.stage)||Number(value.stage)<0||Number(value.stage)>3||typeof value.blocked!=='boolean')fail('结构快照无效');
 structureKeys(value,['schema','nodes','edges','version','stage','blocked','history','tasks','widgets','report']);
 if(!Array.isArray(value.nodes)||!Array.isArray(value.edges)||value.nodes.length>100||value.edges.length>200)fail('关系图数据无效');
 const nodeIds=new Set<string>();for(const n of value.nodes){if(!object(n)||typeof n.id!=='string'||!n.id||n.id.length>80||nodeIds.has(n.id)||typeof n.label!=='string'||!n.label||n.label.length>100||typeof n.kind!=='string'||n.kind.length>40||typeof n.x!=='number'||!Number.isFinite(n.x)||typeof n.y!=='number'||!Number.isFinite(n.y))fail('关系节点无效');structureKeys(n,['id','label','kind','x','y']);nodeIds.add(n.id);}
 const edgeIds=new Set<string>();for(const e of value.edges){if(!object(e)||typeof e.id!=='string'||!e.id||e.id.length>80||nodeIds.has(e.id)||edgeIds.has(e.id)||!nodeIds.has(String(e.source))||!nodeIds.has(String(e.target))||typeof e.label!=='string'||!e.label||e.label.length>100)fail('关系边无效');structureKeys(e,['id','source','target','label']);edgeIds.add(e.id);}
 if(!Array.isArray(value.tasks)||value.tasks.length>100||!Array.isArray(value.widgets)||value.widgets.length>12||!Array.isArray(value.history)||value.history.length>500||!object(value.report))fail('结构集合无效');
 const ids=new Set<string>();for(const task of value.tasks){if(!object(task)||typeof task.id!=='string'||!task.id||ids.has(task.id)||task.id.length>80||typeof task.name!=='string'||!task.name.trim()||task.name.length>100||typeof task.owner!=='string'||!task.owner.trim()||!validDate(task.start)||!validDate(task.end)||String(task.end)<String(task.start)||typeof task.progress!=='number'||!Number.isFinite(task.progress)||task.progress<0||task.progress>100||(task.parentId!==null&&typeof task.parentId!=='string'))fail('任务字段、日期或进度无效');structureKeys(task,['id','parentId','name','owner','start','end','progress','milestone','actualStart','actualEnd']);if(task.milestone!==undefined&&(typeof task.milestone!=='boolean'||(task.milestone&&task.start!==task.end)))fail('里程碑开始与结束计划日期须相同');if(task.actualStart!==undefined&&!validDate(task.actualStart))fail('实际开始日期无效');if(task.actualEnd!==undefined&&(!validDate(task.actualEnd)||task.actualStart===undefined||String(task.actualEnd)<String(task.actualStart)))fail('实际结束须不早于实际开始');ids.add(task.id);}
 for(const task of value.tasks as ScheduleTask[]){const visited=new Set([task.id]);let parent=task.parentId;while(parent){if(visited.has(parent)||!ids.has(parent))fail('任务层级存在循环或父任务缺失');visited.add(parent);parent=(value.tasks as ScheduleTask[]).find(t=>t.id===parent)?.parentId??null;}}
 const widgets=new Set<string>();for(const w of value.widgets){if(!object(w)||typeof w.id!=='string'||!w.id||widgets.has(w.id)||w.id.length>80||!['metric','tasks'].includes(String(w.kind))||!Number.isInteger(w.width)||Number(w.width)<1||Number(w.width)>3)fail('组件标识或尺寸无效');structureKeys(w,['id','kind','width','scope','fields','limit']);if(w.scope!==undefined&&!['all','done','pending'].includes(String(w.scope)))fail('组件范围无效');if(w.fields!==undefined&&(!Array.isArray(w.fields)||!w.fields.length||new Set(w.fields).size!==w.fields.length||w.fields.some(field=>!['name','owner','progress'].includes(String(field)))))fail('组件字段无效');if(w.limit!==undefined&&(!Number.isInteger(w.limit)||Number(w.limit)<1||Number(w.limit)>20))fail('组件条数须为1至20');widgets.add(w.id);}
 if(!Array.isArray(value.report.fields)||!value.report.fields.length||new Set(value.report.fields).size!==value.report.fields.length||value.report.fields.some(f=>!['name','owner','progress'].includes(String(f)))||typeof value.report.minimum!=='number'||!Number.isFinite(value.report.minimum)||value.report.minimum<0||value.report.minimum>100)fail('报表字段或条件无效');
 structureKeys(value.report,['fields','minimum','aliases','conditions']);
 if(value.report.aliases!==undefined){if(!object(value.report.aliases))fail('字段别名无效');structureKeys(value.report.aliases,['name','owner','progress']);for(const alias of Object.values(value.report.aliases))if(typeof alias!=='string'||!alias.trim()||alias.length>40)fail('别名须为1至40字');}
 if(value.report.conditions!==undefined){if(!Array.isArray(value.report.conditions)||value.report.conditions.length>8)fail('最多8个条件');for(const c of value.report.conditions){if(!object(c))fail('条件无效');structureKeys(c,['field','operator','value']);if(c.field==='progress'){if(c.operator!=='gte'||typeof c.value!=='number'||!Number.isFinite(c.value)||c.value<0||c.value>100)fail('进度条件须为0至100的数值下限');}else if(!['name','owner'].includes(String(c.field))||!['contains','eq'].includes(String(c.operator))||typeof c.value!=='string'||!c.value.trim()||c.value.length>100)fail('文本条件须选择包含或等于并填写1至100字');}}

 for(const h of value.history){if(!object(h)||!validTime(h.at)||typeof h.summary!=='string'||h.summary.length>300)fail('历史无效');structureKeys(h,['at','summary']);}
}
export function createStructureStore(storage?:Pick<Storage,'getItem'|'setItem'>){
 let state=structureSeed();let damaged=false;
 try{const raw=storage?.getItem(STRUCTURE_STORAGE_KEY);if(raw){const parsed:unknown=JSON.parse(raw);validateStructures(parsed);state=parsed;}}catch{damaged=true;}
 const read=()=>{if(damaged)fail('结构数据损坏，请备份浏览器存储后明确重置','CORRUPT_DATA',409);const raw=storage?.getItem(STRUCTURE_STORAGE_KEY);if(raw){try{const parsed:unknown=JSON.parse(raw);validateStructures(parsed);state=parsed;}catch{damaged=true;fail('结构数据损坏，请明确重置','CORRUPT_DATA',409);}}return copy(state);};
 const commit=(next:StructureSnapshot)=>{validateStructures(next);try{storage?.setItem(STRUCTURE_STORAGE_KEY,JSON.stringify(next));}catch{fail('保存失败，输入已保留，请释放浏览器空间后重试','PERSISTENCE_ERROR',507);}state=next;damaged=false;return copy(state);};
 return {get:read,reset:()=>commit({...structureSeed(),version:state.version+1}),act:(version:unknown,action:unknown)=>{
 const next=read();if(version!==next.version)fail('数据已更新，请刷新后重新操作','VERSION_CONFLICT',409);if(!object(action)||typeof action.type!=='string')fail('操作无效');
 const actionKeys:Record<string,string[]>={'stage.advance':['type'],'stage.reopen':['type'],'stage.resume':['type'],'stage.block':['type','note'],'task.save':['type','task'],'task.delete':['type','id'],'layout.save':['type','widgets'],'report.save':['type','report']};structureKeys(action,actionKeys[action.type]??[]);
 switch(action.type){
 case 'stage.reopen':if(next.blocked||next.stage===0)fail('当前阶段不可重开');next.stage--;break;
 case 'stage.advance':if(next.blocked||next.stage===3)fail('当前阶段不能推进','ILLEGAL_TRANSITION',409);next.stage++;break;
 case 'stage.block':if(next.blocked||next.stage===3||typeof action.note!=='string'||!action.note.trim()||action.note.length>200)fail('请填写阻塞原因，完成阶段不可阻塞');next.blocked=true;break;
 case 'stage.resume':if(!next.blocked)fail('当前阶段未阻塞');next.blocked=false;break;
 case 'task.save':{if(!object(action.task))fail('任务无效');const task=action.task as unknown as ScheduleTask;const index=next.tasks.findIndex(t=>t.id===task.id);if(index<0)next.tasks.push(copy(task));else next.tasks[index]=copy(task);break;}
 case 'task.delete':if(!next.tasks.some(t=>t.id===action.id)||next.tasks.some(t=>t.parentId===action.id))fail('任务不存在或仍有子任务');next.tasks=next.tasks.filter(t=>t.id!==action.id);break;
 case 'layout.save':next.widgets=copy(action.widgets) as LayoutWidget[];break;
 case 'report.save':next.report=copy(action.report) as ReportConfig;break;
 default:fail('不支持的结构操作');}
 next.version++;next.history.push({at:new Date().toISOString(),summary:({'stage.advance':'推进下一阶段','stage.reopen':'重开上一阶段','stage.resume':'恢复推进','stage.block':'标记阻塞','task.save':'保存任务','task.delete':'删除任务','layout.save':'保存工作台布局','report.save':'保存报表配置'}[action.type]??action.type)+(typeof action.note==='string'?`：${action.note}`:'')});return commit(next);
 }};
}
export const structureStore=createStructureStore(patternStorage);
