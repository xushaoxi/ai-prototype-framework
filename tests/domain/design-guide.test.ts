import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseChapters, parseRules, safeExternalUrl } from '../../src/app/design-guide/content';

describe('DG-004 文档单一来源及安全链接',()=>{
  it('源大纲完整保留16章议题和映射',()=>{
    const chapters=parseChapters(readFileSync('docs/design/outline.md','utf8'));
    expect(chapters).toHaveLength(16);
    expect(chapters[7]).toMatchObject({id:'08',title:'数字指标与可视化'});
    expect(chapters[7].body).toContain('指标范围、时间、单位');
    expect(chapters[15].body).toContain('GOV.UK');
  });
  it('从正文读取规则和状态，不将两个规则或维护章节混合',()=>{
    const rules=parseRules('## PAGE-001：页面任务\n决策状态：已确认\n实现状态：已实现\n\n页面正文\n## LIST-001：数字卡片\n决策状态：待讨论\n实现状态：未实现\n\n卡片正文\n## 后续按需补充\n后续议题');
    expect(rules).toHaveLength(2);
    expect(rules[0]).toMatchObject({id:'PAGE-001',title:'页面任务',decision:'已确认',implementation:'已实现'});
    expect(rules[0].body).toContain('页面正文');
    expect(rules[0].body).not.toContain('卡片正文');
    expect(rules[1]).toMatchObject({decision:'待讨论',implementation:'未实现'});
    expect(rules[1].body).not.toContain('后续议题');
  });
  it('拒绝脚本与非外部链接',()=>{
    expect(safeExternalUrl('javascript:alert(1)')).toBeUndefined();
    expect(safeExternalUrl('data:text/html,test')).toBeUndefined();
    expect(safeExternalUrl('//evil.test')).toBeUndefined();
    expect(safeExternalUrl('https://ant.design/docs/spec/values/')).toBe('https://ant.design/docs/spec/values/');
  });
});
