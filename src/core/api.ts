import { BusinessError } from './types';
import type { AuditEntry, BusinessRecord, DemoScenario, ListQuery, ListResult, SaveInput } from './types';
let scenario: DemoScenario = 'normal';
export function setScenario(value: DemoScenario) { scenario = value; }
export function getScenario(): DemoScenario { return scenario; }
const path = (moduleId: string, id?: string) => `/api/modules/${encodeURIComponent(moduleId)}/records${id ? `/${encodeURIComponent(id)}` : ''}`;
async function request<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(typeof window === 'undefined' ? `http://localhost${url}` : url, { method, headers: { 'Content-Type': 'application/json', 'x-demo-scenario': scenario }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  } catch { throw new BusinessError('NETWORK_ERROR', '无法连接演示服务，请检查网络后重试。', 0); }
  if (!response.ok) {
    let data: unknown;
    try { data = await response.json(); } catch { throw new BusinessError('HTTP_ERROR', `请求失败（${response.status}），请重试。`, response.status); }
    if (typeof data === 'object' && data !== null && 'code' in data && 'message' in data && typeof data.code === 'string' && typeof data.message === 'string') {
      const fields = 'fields' in data && typeof data.fields === 'object' && data.fields !== null ? Object.fromEntries(Object.entries(data.fields).filter((entry): entry is [string, string] => typeof entry[1] === 'string')) : undefined;
      throw new BusinessError(data.code, data.message, response.status, fields);
    }
    throw new BusinessError('HTTP_ERROR', `请求失败（${response.status}），请重试。`, response.status);
  }
  if (response.status === 204) return undefined as T;
  return await response.json() as T;
}
export const api = {
  list(moduleId: string, query: ListQuery = {}) {
    const params = new URLSearchParams(); for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== '') params.set(key, String(value));
    return request<ListResult>(`${path(moduleId)}${params.size ? `?${params}` : ''}`);
  },
  get(moduleId: string, id: string) { return request<BusinessRecord>(path(moduleId, id)); },
  create(moduleId: string, input: SaveInput) { return request<BusinessRecord>(path(moduleId), 'POST', input); },
  update(moduleId: string, id: string, input: SaveInput) { return request<BusinessRecord>(path(moduleId, id), 'PATCH', input); },
  transition(moduleId: string, id: string, action: string, version?: number) { return request<BusinessRecord>(`${path(moduleId, id)}/actions/${encodeURIComponent(action)}`, 'POST', { version }); },
  remove(moduleId: string, id: string) { return request<void>(path(moduleId, id), 'DELETE'); },
  history(moduleId: string, id: string) { return request<AuditEntry[]>(`${path(moduleId, id)}/history`); },
  reset() { return request<void>('/api/demo/reset', 'POST'); },
  async exportData() { return (await request<{ text: string }>('/api/demo/export')).text; },
  importData(text: string) { return request<void>('/api/demo/import', 'POST', { text }); },
};
