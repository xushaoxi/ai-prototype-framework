import { describe, expect, it } from 'vitest';
import { createStore, STORAGE_KEY } from '../../src/mocks/store';
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
});
