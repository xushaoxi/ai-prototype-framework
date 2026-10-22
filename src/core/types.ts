export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'date';
export interface FieldDefinition {
  key: string; label: string; type: FieldType; required?: boolean;
  options?: { label: string; value: string }[];
  searchable?: boolean; inTable?: boolean; inForm?: boolean; inDetail?: boolean;
  width?: number; min?: number; max?: number; maxLength?: number;
}
export interface BusinessRecord {
  id: string; code: string; name: string; status: string; owner: string;
  category: string; amount: number; date: string; notes: string;
  updatedAt: string; version: number;
}
export interface ActionDefinition { key: string; label: string; from: string[]; to: string; tone?: 'primary' | 'danger' }
export interface ModuleDefinition {
  id: string; name: string; singularName: string; description: string;
  icon: 'ledger' | 'team'; codePrefix: string; fields: FieldDefinition[];
  statuses: { value: string; label: string; color: string }[];
  actions: ActionDefinition[]; defaultValues: Partial<BusinessRecord>;
  validate?: (values: Partial<BusinessRecord>, current?: BusinessRecord) => Record<string, string>;
}
export interface ListQuery {
  keyword?: string; status?: string; category?: string; page?: number; pageSize?: number;
  sortBy?: 'updatedAt' | 'amount' | 'date'; sortOrder?: 'asc' | 'desc';
}
export interface ListResult { items: BusinessRecord[]; total: number; counts: Record<string, number>; amountTotal: number }
export type SaveInput = Partial<BusinessRecord>;
export interface AuditEntry { id: string; recordId: string; moduleId: string; action: string; at: string; summary: string }
export interface ApiError { code: string; message: string; fields?: Record<string, string> }
export class BusinessError extends Error implements ApiError {
  code: string; fields?: Record<string, string>; status: number;
  constructor(code: string, message: string, status = 400, fields?: Record<string, string>) {
    super(message); this.name = 'BusinessError'; this.code = code; this.status = status; this.fields = fields;
  }
}
export type DemoScenario = 'normal' | 'slow' | 'error';
export type DemoRole = 'editor' | 'viewer';
