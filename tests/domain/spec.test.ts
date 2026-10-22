import { describe, expect, it } from 'vitest';
import { modules } from '../../src/modules/registry';
import assets from '../../business-specs/assets.json';
import vendors from '../../business-specs/vendors.json';

describe('SPEC-001 模块定义与业务规范一致', () => {
  it('字段、状态和动作保持一致，避免AI只改页面遗漏规范', () => {
    for (const spec of [assets, vendors]) {
      const module = modules.find(item => item.id === spec.id);
      expect(module, spec.id).toBeDefined();
      expect(module?.fields.map(field => field.key)).toEqual(spec.fields.map(field => field.key));
      expect(module?.statuses.map(status => status.value)).toEqual(spec.statuses.map(status => status.value));
      expect(module?.actions.map(action => ({key:action.key,from:action.from,to:action.to}))).toEqual(spec.actions);
    }
  });
});
