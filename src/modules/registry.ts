import type { ModuleDefinition } from '../core/types';
import { assetModule } from './assets/definition';
import { vendorModule } from './vendors/definition';
export const modules: ModuleDefinition[] = [assetModule, vendorModule];
export function getModule(id: string): ModuleDefinition | undefined { return modules.find(module => module.id === id); }
