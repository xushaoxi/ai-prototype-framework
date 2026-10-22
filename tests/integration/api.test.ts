import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { setupServer } from 'msw/node';
import { createStore } from '../../src/mocks/store';
import { createHandlers } from '../../src/mocks/handlers';
import { api, getScenario, setScenario } from '../../src/core/api';
const store = createStore();
const server = setupServer(...createHandlers(store));
const input = { name: '网络交换机', category: '电子设备', owner: '张晓明', amount: 5600, date: '2026-10-22' };
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => { store.reset(); setScenario('normal'); });
afterEach(() => { server.resetHandlers(); setScenario('normal'); });
afterAll(() => server.close());

describe('T01 HTTP integration: actual API + MSW + domain store', () => {
  it('executes query/create/edit/detail/transition/history/delete over fetch', async () => {
    expect((await api.list('assets', { status: 'draft', pageSize: 100 })).total).toBe(8);
    const r = await api.create('assets', input);
    expect((await api.get('assets', r.id)).name).toBe(input.name);
    const edited = await api.update('assets', r.id, { name: '核心网络交换机', version: r.version });
    const active = await api.transition('assets', r.id, 'activate', edited.version);
    expect(active.status).toBe('active');
    expect((await api.history('assets', r.id)).map(h => h.action)).toEqual(['create', 'update', 'activate']);
    await expect(api.remove('assets', r.id)).rejects.toMatchObject({ code: 'DELETE_NOT_ALLOWED', status: 409 });
    const draft = await api.create('assets', { ...input, name: '待采购设备' }); await api.remove('assets', draft.id);
    await expect(api.get('assets', draft.id)).rejects.toMatchObject({ status: 404 });
  });
  it('reports validation, conflict, missing records and malformed JSON as 4xx', async () => {
    await expect(api.create('assets', { ...input, amount: -1 })).rejects.toMatchObject({ code: 'VALIDATION_ERROR', fields: { amount: expect.any(String) } });
    const r = await api.create('assets', input);
    await expect(api.update('assets', r.id, { name: 'conflict', version: 0 })).rejects.toMatchObject({ status: 409 });
    await expect(api.transition('assets', r.id, 'archive', 1)).rejects.toMatchObject({ code: 'ILLEGAL_TRANSITION' });
    await expect(api.list('unknown')).rejects.toMatchObject({ status: 404 });
    const response = await fetch('http://localhost/api/modules/assets/records', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{invalid' });
    expect(response.status).toBe(400); expect(await response.json()).toMatchObject({ code: 'INVALID_JSON' });
    expect((await fetch('http://localhost/api/modules/assets/records?page=abc')).status).toBe(400);
  });
  it('isolates modules and sends scenario header while recovery routes remain available', async () => {
    const r = await api.create('assets', input); await expect(api.get('vendors', r.id)).rejects.toMatchObject({ status: 404 });
    setScenario('error'); expect(getScenario()).toBe('error');
    await expect(api.list('assets')).rejects.toMatchObject({ code: 'DEMO_ERROR', status: 503 });
    const backup = await api.exportData(); expect(JSON.parse(backup).schemaVersion).toBe(1);
    await api.reset(); await api.importData(backup); setScenario('normal');
    expect((await api.get('assets', r.id)).name).toBe(input.name);
    expect((await api.list('vendors')).total).toBe(12);
  });
  it('handles slow scenario through the real HTTP handler', async () => {
    setScenario('slow'); const before = Date.now(); expect((await api.list('assets')).total).toBe(36); expect(Date.now() - before).toBeGreaterThanOrEqual(650);
  });
});
