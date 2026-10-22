import { describe, expect, it } from 'vitest';
import { createStore, STORAGE_KEY } from '../../src/mocks/store';
import { modules } from '../../src/modules/registry';
import type { BusinessRecord } from '../../src/core/types';
import { assetModule } from '../../src/modules/assets/definition';

class MemoryStorage implements Storage {
  data = new Map<string, string>();
  failWrite = false;
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(key: string) { return this.data.get(key) ?? null; }
  key(index: number) { return [...this.data.keys()][index] ?? null; }
  removeItem(key: string) { this.data.delete(key); }
  setItem(key: string, value: string) { if (this.failWrite) throw new Error('quota'); this.data.set(key, value); }
}
const input = { name: '会议室终端', owner: '李明', category: '电子设备', amount: 12000, date: '2026-10-22', notes: '新购设备' };
const fresh = () => createStore(new MemoryStorage());

describe('T01 store: ASSET-CRUD/QUERY/STATE/PERSIST and COMMON-DATA', () => {
  it('seeds deterministic rich records, counts and paginated filtered queries', () => {
    const s = fresh();
    expect(s.list('assets').total).toBe(36);
    expect(s.list('assets').counts).toEqual({ draft: 8, active: 24, archived: 4 });
    expect(s.list('vendors').total).toBe(12);
    expect(s.list('assets', { status: 'draft', page: 1, pageSize: 3 }).items).toHaveLength(3);
    const all = s.list('assets', { pageSize: 100, sortBy: 'amount', sortOrder: 'asc' });
    expect(all.items[0].amount).toBeLessThanOrEqual(all.items[35].amount);
    expect(s.list('assets', { keyword: all.items[0].code }).total).toBe(1);
    expect(s.list('assets', { category: '软件许可' }).items.every(r => r.category === '软件许可')).toBe(true);
  });
  it('creates, updates, transitions, audits and deletes only draft records', () => {
    const s = fresh(); const r = s.create('assets', input);
    expect(r.code).toBe('AST-2026-037'); expect(r.status).toBe('draft'); expect(r.version).toBe(1);
    const edited = s.update('assets', r.id, { name: '会议室终端 Pro', version: 1 });
    expect(edited.version).toBe(2);
    const active = s.transition('assets', r.id, 'activate', 2);
    expect(active.status).toBe('active');
    expect(() => s.transition('assets', r.id, 'activate', 3)).toThrow();
    expect(() => s.remove('assets', r.id)).toThrow();
    const archived = s.transition('assets', r.id, 'archive', 3);
    expect(archived.status).toBe('archived');
    s.transition('assets', r.id, 'restore', 4);
    expect(s.history('assets', r.id).map(h => h.action)).toEqual(['create', 'update', 'activate', 'archive', 'restore']);
    s.remove('assets', r.id); expect(() => s.get('assets', r.id)).toThrow();
  });
  it('requires optimistic versions and preserves immutable identities', () => {
    const s = fresh(); const r = s.create('assets', input);
    expect(() => s.update('assets', r.id, { name: 'changed' })).toThrow();
    expect(() => s.transition('assets', r.id, 'activate')).toThrow();
    expect(() => s.update('assets', r.id, { version: 0, name: 'changed' })).toThrow();
    expect(() => s.update('assets', r.id, { version: 1, id: 'other' })).toThrow();
    expect(() => s.update('assets', r.id, { version: 1, code: 'OTHER' })).toThrow();
    expect(() => s.update('assets', r.id, { version: 1, status: 'active' })).toThrow();
    expect(s.get('assets', r.id).version).toBe(1);
  });
  it('rejects missing fields, enum errors, invalid dates and nonfinite/negative amounts', () => {
    const s = fresh();
    for (const bad of [{ name: ' ' }, { owner: '' }, { category: 'unknown' }, { date: '2026-02-30' }, { amount: -1 }, { amount: Infinity }, { status: 'active' }]) {
      expect(() => s.create('assets', { ...input, ...bad })).toThrow();
    }
    expect(() => s.get('unknown', '1')).toThrow();
    expect(() => s.get('assets', 'missing')).toThrow();
    expect(s.list('assets').total).toBe(36);
  });
  it('persists records and histories, isolates modules, and returns defensive copies', () => {
    const storage = new MemoryStorage(); const s = createStore(storage); const r = s.create('assets', input);
    const next = createStore(storage); expect(next.get('assets', r.id).name).toBe(input.name);
    expect(next.history('assets', r.id)).toHaveLength(1);
    expect(() => next.get('vendors', r.id)).toThrow();
    r.name = 'mutated'; const copy = next.get('assets', r.id); copy.name = 'mutated again';
    expect(next.get('assets', r.id).name).toBe(input.name);
    expect(next.list('vendors').total).toBe(12);
    const vendor = next.create('vendors', { ...input, category: '技术服务' });
    expect(vendor.status).toBe('pending');
    const approved = next.transition('vendors', vendor.id, 'approve', 1); expect(approved.status).toBe('active');
    const disabled = next.transition('vendors', vendor.id, 'disable', 2); expect(disabled.status).toBe('disabled');
    next.transition('vendors', vendor.id, 'reopen', 3); next.remove('vendors', vendor.id);
  });
  it('rolls back failed storage writes and resets only its own key', () => {
    const storage = new MemoryStorage(); storage.setItem('other-product', 'keep');
    const s = createStore(storage); const before = s.exportData();
    storage.failWrite = true; expect(() => s.create('assets', input)).toThrow(); expect(s.exportData()).toBe(before);
    const draft = s.list('assets', { status: 'draft' }).items[0];
    for (const mutate of [() => s.update('assets', draft.id, { ...input, version: draft.version }), () => s.transition('assets', draft.id, 'activate', draft.version), () => s.remove('assets', draft.id), () => s.reset(), () => s.importData(before)]) {
      expect(mutate).toThrow(); expect(s.exportData()).toBe(before);
    }
    storage.failWrite = false; s.create('assets', input); s.reset();
    expect(s.list('assets').total).toBe(36); expect(storage.getItem('other-product')).toBe('keep');
    expect(storage.getItem(STORAGE_KEY)).not.toBeNull();
  });
  it('uses memory only when storage is unavailable on read', () => {
    const unavailable = new MemoryStorage(); unavailable.getItem = () => { throw new Error('blocked'); };
    const s = createStore(unavailable); expect(s.create('assets', input).name).toBe(input.name);
  });
  it('rejects corrupt stored state rather than silently replacing user data', () => {
    const storage = new MemoryStorage(); storage.setItem(STORAGE_KEY, '{broken');
    expect(() => createStore(storage)).toThrow(); expect(storage.getItem(STORAGE_KEY)).toBe('{broken');
  });
  it('runs explicit module validation on create, update and backup import', () => {
    const s = fresh(); const r = s.create('assets', input); const backup = s.exportData();
    assetModule.validate = (values, current): Record<string, string> => values.amount === 12000 ? { amount: current ? '存量记录需要复核' : '此金额需要专项审批' } : {};
    try {
      expect(() => s.create('assets', input)).toThrow();
      expect(() => s.update('assets', r.id, { version: 1, name: '变更' })).toThrow();
      expect(() => s.importData(backup)).toThrow();
      expect(s.exportData()).toBe(backup);
    } finally { delete assetModule.validate; }
  });
  it('imports valid backups with histories atomically; rejects malformed/duplicate/oversized/unknown data', () => {
    const s = fresh(); const r = s.create('assets', input); const exported = s.exportData();
    const next = fresh(); next.importData(exported); expect(next.get('assets', r.id)).toEqual(r); expect(next.history('assets', r.id)).toHaveLength(1);
    const data = JSON.parse(exported) as { records: Record<string, unknown[]>; history: unknown[] };
    const badCases = ['{bad', 'x'.repeat(2 * 1024 * 1024 + 1), JSON.stringify({ ...data, schemaVersion: 99 }), JSON.stringify({ ...data, records: { ...data.records, mystery: [] } }), JSON.stringify({ ...data, records: { ...data.records, assets: [...data.records.assets, data.records.assets[0]] } }), JSON.stringify({ ...data, history: [{ id: 'h1', recordId: 'missing', moduleId: 'assets', action: 'update', at: 'bad', summary: 'bad' }] })];
    for (const text of badCases) { expect(() => next.importData(text)).toThrow(); expect(next.exportData()).toBe(exported); }
  });
  it('refreshes sequential shared stores before reads and writes and rejects stale versions', () => {
    const storage = new MemoryStorage(); const a = createStore(storage); const b = createStore(storage);
    const first = a.get('assets', 'asset-1'); const stale = b.get('assets', first.id);
    const changed = a.update('assets', first.id, { name: '甲窗口修改', version: first.version });
    expect(() => b.update('assets', first.id, { name: '乙窗口过期修改', version: stale.version })).toThrowError(expect.objectContaining({ code: 'VERSION_CONFLICT' }));
    expect(() => b.transition('assets', first.id, 'activate', stale.version)).toThrowError(expect.objectContaining({ code: 'VERSION_CONFLICT' }));
    expect(b.get('assets', first.id).name).toBe(changed.name);
    const second = b.get('assets', 'asset-2'); b.update('assets', second.id, { name: '乙窗口另一条记录', version: second.version });
    a.create('vendors', { ...input, category: '技术服务' });
    expect(createStore(storage).get('assets', first.id).name).toBe('甲窗口修改');
    expect(a.get('assets', second.id).name).toBe('乙窗口另一条记录'); expect(b.list('vendors').total).toBe(13);
  });
  it('validates special business rules before state transitions and preserves histories on rejection', () => {
    const s = fresh(); const r = s.create('assets', input); const before = s.exportData();
    assetModule.validate = (values): Record<string, string> => values.id === r.id && values.status === 'active' ? { status: '需要专项审批' } : {};
    try { expect(() => s.transition('assets', r.id, 'activate', r.version)).toThrowError(expect.objectContaining({ fields: { status: '需要专项审批' } })); expect(s.exportData()).toBe(before); }
    finally { delete assetModule.validate; }
  });
  it('rejects unsafe imported numbering atomically and refuses to increment exhausted safe codes', () => {
    const s = fresh(); const before = s.exportData(); const parsed = JSON.parse(before) as { records: Record<string, BusinessRecord[]> };
    for (const suffix of ['9007199254740992', '0009007199254740992']) {
      parsed.records.assets[0].code = `AST-2026-${suffix}`;
      expect(() => s.importData(JSON.stringify(parsed))).toThrow(); expect(s.exportData()).toBe(before);
    }
    parsed.records.assets[0].code = 'AST-2026-9007199254740991'; s.importData(JSON.stringify(parsed)); const full = s.exportData();
    expect(() => s.create('assets', input)).toThrow(); expect(s.exportData()).toBe(full);
  });
  it('keeps successful near-limit snapshots reopenable and rejects an audited mutation beyond 2MB atomically', () => {
    const storage = new MemoryStorage(); const s = createStore(storage);
    const parsed = JSON.parse(s.exportData()) as { records: Record<string, BusinessRecord[]>; history: unknown[] };
    const template = parsed.records.assets[0]; parsed.records.assets = []; parsed.records.vendors = []; parsed.history = [];
    let bytes = new TextEncoder().encode(JSON.stringify(parsed)).byteLength;
    for (let i = 0; bytes < 2 * 1024 * 1024 - 1200; i++) {
      const record = { ...template, id: `bulk-${i}`, code: `AST-2026-${String(i + 1).padStart(3, '0')}`, notes: '中'.repeat(500) };
      const added = new TextEncoder().encode(JSON.stringify(record)).byteLength + (i ? 1 : 0);
      if (bytes + added > 2 * 1024 * 1024 - 1200) break;
      parsed.records.assets.push(record); bytes += added;
    }
    // Fill the remaining bytes using valid audit summaries so the following create crosses the limit.
    const first = parsed.records.assets[0];
    parsed.history.push({ id: 'boundary-history', recordId: first.id, moduleId: 'assets', action: 'create', at: first.updatedAt, summary: '导入历史' });
    const spare = 2 * 1024 * 1024 - new TextEncoder().encode(JSON.stringify(parsed)).byteLength - 400;
    (parsed.history[0] as { summary: string }).summary += 'x'.repeat(spare);
    s.importData(JSON.stringify(parsed)); const before = s.exportData(); const saved = storage.getItem(STORAGE_KEY);
    expect(new TextEncoder().encode(before).byteLength).toBeLessThanOrEqual(2 * 1024 * 1024);
    expect(createStore(storage).exportData()).toBe(before); const restored = fresh(); restored.importData(before); expect(restored.exportData()).toBe(before);
    expect(() => s.create('assets', { ...input, notes: '中'.repeat(500) })).toThrowError(expect.objectContaining({ code: 'STORAGE_LIMIT' }));
    expect(s.exportData()).toBe(before); expect(storage.getItem(STORAGE_KEY)).toBe(saved);
    let auditLimitReached = false;
    for (let i = 0; i < 5; i++) {
      const checkpoint = s.exportData(); const current = s.get('assets', first.id);
      try { s.update('assets', first.id, { version: current.version, name: current.name }); }
      catch (error) { expect(error).toMatchObject({ code: 'STORAGE_LIMIT' }); expect(s.exportData()).toBe(checkpoint); auditLimitReached = true; break; }
      expect(createStore(storage).exportData()).toBe(s.exportData());
    }
    expect(auditLimitReached).toBe(true);
  });
  it('migrates persisted missing newly registered modules while explicit backups remain exact', () => {
    const storage = new MemoryStorage(); const s = createStore(storage); const r = s.create('assets', input); const backup = s.exportData();
    modules.push({ ...assetModule, id: 'locations', name: '地点台账', codePrefix: 'LOC' });
    try {
      const next = createStore(storage); expect(next.get('assets', r.id).name).toBe(input.name); expect(next.list('locations').total).toBe(0);
      expect(s.list('locations').total).toBe(0); expect(() => next.importData(backup)).toThrow();
      expect(next.get('assets', r.id).name).toBe(input.name);
    } finally { modules.pop(); }
  });
  it('accepts only declared scalar fields and validates configured types through create, update and import', () => {
    const s = fresh(); const empty = JSON.parse(s.exportData()) as { records: Record<string, BusinessRecord[]> }; empty.records.assets = []; s.importData(JSON.stringify(empty));
    const previous = assetModule.fields;
    assetModule.fields = [...previous, { key: 'contactPhone', label: '联系电话', type: 'text', required: true, maxLength: 20 }, { key: 'expiry', label: '到期日期', type: 'date' }, { key: 'seats', label: '席位数', type: 'number', min: 1, max: 100 }, { key: 'channel', label: '渠道', type: 'select', options: [{ label: '直采', value: 'direct' }] }];
    try {
      const r = s.create('assets', { ...input, contactPhone: '13800000000', expiry: '', seats: 3, channel: '' });
      const changed = s.update('assets', r.id, { version: 1, expiry: '2027-01-31', contactPhone: '13900000000' });
      const text = s.exportData(); const other = fresh(); other.importData(text); expect(other.get('assets', r.id)).toEqual(changed);
      for (const bad of [{ contactPhone: '' }, { contactPhone: 123 }, { expiry: '2027-02-30' }, { seats: '3' }, { seats: 0 }, { channel: 'bad' }, { mystery: 'undeclared' }]) expect(() => s.create('assets', { ...input, contactPhone: '13800000000', ...bad })).toThrow();
      expect(() => s.update('assets', r.id, { version: changed.version, contactPhone: 123 })).toThrow();
      const invalid = JSON.parse(text) as { records: Record<string, BusinessRecord[]> }; invalid.records.assets[0].expiry = 2027;
      expect(() => s.importData(JSON.stringify(invalid))).toThrow(); expect(s.get('assets', r.id)).toEqual(changed);
    } finally { assetModule.fields = previous; }
  });

});
