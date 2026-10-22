import type { DetailExtension } from '../core/ui/RecordDetail';
import { AssetDetailExtra } from './assets/extension';
// 特殊展示逻辑由各业务模块显式提供，标准 T01 不感知具体业务。
export const detailExtensions:Record<string,DetailExtension>={assets:AssetDetailExtra};
