import type { AuditEntry, BusinessRecord } from '../core/types';
import { modules } from '../modules/registry';

export interface DataSnapshot { schemaVersion: 1; records: Record<string, BusinessRecord[]>; history: AuditEntry[] }
const owners = ['张晓明', '王雅婷', '李文博', '陈思远', '赵雨欣', '刘海峰', '周子涵', '吴佳宁'];
const assets: [string, string, number][] = [
  ['MacBook Pro 研发工作站', '电子设备', 18999], ['ThinkPad 商务笔记本', '电子设备', 8699],
  ['人体工学办公椅', '办公家具', 1680], ['Adobe 创意软件年度许可', '软件许可', 6200],
  ['会议室 4K 智能屏', '电子设备', 12800], ['开放工位升降桌', '办公家具', 2499],
  ['JetBrains 团队开发许可', '软件许可', 3600], ['园区门禁控制器', '其他', 4800],
  ['Dell 27 英寸显示器', '电子设备', 2599], ['档案室钢制文件柜', '办公家具', 980],
  ['企业知识库年度订阅', '软件许可', 15000], ['应急电源 UPS', '其他', 7200],
];
const vendors: [string, string, number][] = [
  ['上海联诚信息科技有限公司', '设备供应', 168000], ['北京启明云技术有限公司', '技术服务', 240000],
  ['杭州青禾办公家具有限公司', '设备供应', 86000], ['深圳博远系统集成有限公司', '技术服务', 320000],
  ['苏州安信物业服务有限公司', '行政服务', 180000], ['南京知行软件有限公司', '技术服务', 95000],
  ['广州文海文化传播有限公司', '其他', 42000], ['成都锐科数码有限公司', '设备供应', 112000],
  ['武汉佳洁环境服务有限公司', '行政服务', 72000], ['西安众合网络有限公司', '技术服务', 56000],
  ['宁波和美商贸有限公司', '其他', 28000], ['天津诚达后勤服务有限公司', '行政服务', 64000],
];
export function createSeed(): DataSnapshot {
  const records: Record<string, BusinessRecord[]> = Object.fromEntries(modules.map(m => [m.id, []]));
  records.assets = Array.from({ length: 36 }, (_, i) => {
    const [name, category, amount] = assets[i % assets.length];
    const date = `2026-${String(4 + Math.floor(i / 6)).padStart(2, '0')}-${String(3 + i % 20).padStart(2, '0')}`;
    return { id: `asset-${i + 1}`, code: `AST-2026-${String(i + 1).padStart(3, '0')}`, name: `${name}${i >= 12 ? ` · ${['研发中心', '运营中心'][Math.floor(i / 12) - 1]}` : ''}`, category, amount: amount + Math.floor(i / 12) * 200, owner: owners[i % owners.length], date, status: i < 8 ? 'draft' : i < 32 ? 'active' : 'archived', notes: `${['总部办公区', '创新研发中心', '华东运营中心'][Math.floor(i / 12)]}登记，${i < 8 ? '待验收并投入使用。' : i < 32 ? '定期维护，当前使用正常。' : '已完成移交及归档。'}`, updatedAt: `${date}T08:30:00.000Z`, version: 1 };
  });
  records.vendors = vendors.map(([name, category, amount], i) => {
    const date = `2026-${String(5 + Math.floor(i / 3)).padStart(2, '0')}-${String(5 + i).padStart(2, '0')}`;
    return { id: `vendor-${i + 1}`, code: `VEN-2026-${String(i + 1).padStart(3, '0')}`, name, category, amount, owner: owners[i % owners.length], date, status: i < 3 ? 'pending' : i < 10 ? 'active' : 'disabled', notes: `年度${category}合作方，${i < 3 ? '资料已收齐，等待综合评估。' : i < 10 ? '服务交付稳定，按季度复盘。' : '合同已结束，保留历史资料。'}`, updatedAt: `${date}T09:00:00.000Z`, version: 1 };
  });
  return { schemaVersion: 1, records, history: [] };
}
