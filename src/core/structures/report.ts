import type {ReportConfig,ScheduleTask} from './types';
/** Same finite AND semantics for preview and adapters. Empty text matches nothing. */
export function previewReport(tasks:ScheduleTask[],config:ReportConfig):ScheduleTask[]{return tasks.filter(task=>task.progress>=config.minimum&&(config.conditions??[]).every(c=>c.field==='progress'?task.progress>=c.value:c.value.trim()!==''&&(c.operator==='eq'?task[c.field]===c.value:task[c.field].includes(c.value))));}
