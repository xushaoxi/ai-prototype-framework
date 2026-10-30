import { delay, http, HttpResponse } from 'msw';
import { BusinessError } from '../core/types';
import type { ListQuery, SaveInput } from '../core/types';
import { store, patternStore, structureStore } from './store';
import type { PatternStore } from './store';
import type { BusinessStore } from './store';

async function jsonObject(request: Request): Promise<Record<string, unknown>> {
  let value: unknown;
  try { value = await request.json(); } catch { throw new BusinessError('INVALID_JSON', '请求内容不是有效 JSON', 400); }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new BusinessError('INVALID_JSON', '请求内容须为 JSON 对象', 400);
  return value as Record<string, unknown>;
}
async function respond(request: Request, task: () => Promise<Response> | Response, demo = false): Promise<Response> {
  try {
    if (!demo && request.headers.get('x-demo-scenario') === 'error') throw new BusinessError('DEMO_ERROR', '这是演示错误场景。切换为普通响应后点击重试。', 503);
    if (!demo && request.headers.get('x-demo-scenario') === 'slow') await delay(750);
    return await task();
  } catch (error) {
    if (error instanceof BusinessError) return HttpResponse.json({ code: error.code, message: error.message, ...(error.fields ? { fields: error.fields } : {}) }, { status: error.status });
    return HttpResponse.json({ code: 'INTERNAL_ERROR', message: '演示服务发生异常，请重试或重置演示数据。' }, { status: 500 });
  }
}
function queryFrom(url: string): ListQuery {
  const params = new URL(url).searchParams;
  return {
    keyword: params.get('keyword') ?? undefined, status: params.get('status') ?? undefined, category: params.get('category') ?? undefined,
    dateFrom: params.get('dateFrom') ?? undefined, dateTo: params.get('dateTo') ?? undefined,
    page: params.has('page') ? Number(params.get('page')) : undefined, pageSize: params.has('pageSize') ? Number(params.get('pageSize')) : undefined,
    sortBy: (params.get('sortBy') ?? undefined) as ListQuery['sortBy'], sortOrder: (params.get('sortOrder') ?? undefined) as ListQuery['sortOrder'],
  };
}
export function createHandlers(data: BusinessStore) {
  const base = '*/api/modules/:moduleId/records';
  return [
    http.get(base, ({ request, params }) => respond(request, () => HttpResponse.json(data.list(String(params.moduleId), queryFrom(request.url))))),
    http.post(base, ({ request, params }) => respond(request, async () => HttpResponse.json(data.create(String(params.moduleId), await jsonObject(request) as SaveInput), { status: 201 }))),
    http.get(`${base}/:id`, ({ request, params }) => respond(request, () => HttpResponse.json(data.get(String(params.moduleId), String(params.id))))),
    http.patch(`${base}/:id`, ({ request, params }) => respond(request, async () => HttpResponse.json(data.update(String(params.moduleId), String(params.id), await jsonObject(request) as SaveInput)))),
    http.delete(`${base}/:id`, ({ request, params }) => respond(request, () => { data.remove(String(params.moduleId), String(params.id)); return new HttpResponse(null, { status: 204 }); })),
    http.post(`${base}/:id/actions/:actionKey`, ({ request, params }) => respond(request, async () => {
      const body = await jsonObject(request);
      if (Object.keys(body).some(k => k !== 'version') || (body.version !== undefined && typeof body.version !== 'number')) throw new BusinessError('VALIDATION_ERROR', '版本参数不合法', 400);
      return HttpResponse.json(data.transition(String(params.moduleId), String(params.id), String(params.actionKey), body.version as number | undefined));
    })),
    http.get(`${base}/:id/history`, ({ request, params }) => respond(request, () => HttpResponse.json(data.history(String(params.moduleId), String(params.id))))),
    http.post('*/api/demo/reset', ({ request }) => respond(request, () => { data.reset(); return new HttpResponse(null, { status: 204 }); }, true)),
    http.get('*/api/demo/export', ({ request }) => respond(request, () => HttpResponse.json({ text: data.exportData() }), true)),
    http.post('*/api/demo/import', ({ request }) => respond(request, async () => {
      const body = await jsonObject(request);
      if (typeof body.text !== 'string' || Object.keys(body).some(k => k !== 'text')) throw new BusinessError('IMPORT_INVALID', '请提供 JSON 备份文本', 400);
      data.importData(body.text); return new HttpResponse(null, { status: 204 });
    }, true)),
  ];
}
export function createPatternHandlers(data: PatternStore) {
  return [
    http.get('*/api/patterns/snapshot', ({ request }) => respond(request, () => HttpResponse.json(data.get()))),
    http.post('*/api/patterns/actions', async ({ request }) => respond(request, async () => {
      const body = await jsonObject(request);
      if (Object.keys(body).some(key => !['version', 'action'].includes(key))) throw new BusinessError('VALIDATION_ERROR', '请求字段不正确', 400);
      return HttpResponse.json(data.act(body.version, body.action));
    }, ['reset', 'backup.restore'].includes(await request.clone().json().then((value: unknown) => {
      if (typeof value !== 'object' || value === null || !('action' in value) || typeof value.action !== 'object' || value.action === null || !('type' in value.action) || typeof value.action.type !== 'string') return '';
      return value.action.type;
    }).catch(() => '')))),
  ];
}
export function createStructureHandlers(data:ReturnType<typeof import('./store').createStructureStore>){return [
 http.get('*/api/structures/snapshot',({request})=>respond(request,()=>HttpResponse.json(data.get()))),
 http.post('*/api/structures/actions',({request})=>respond(request,async()=>{const body=await jsonObject(request);if(Object.keys(body).some(key=>!['version','action'].includes(key)))throw new BusinessError('VALIDATION_ERROR','请求字段不正确',400);return HttpResponse.json(data.act(body.version,body.action));})),
 http.post('*/api/structures/reset',({request})=>respond(request,()=>HttpResponse.json(data.reset()),true)),
];}
export const handlers = [...createHandlers(store), ...createPatternHandlers(patternStore), ...createStructureHandlers(structureStore)];
