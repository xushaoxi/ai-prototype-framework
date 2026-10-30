import type {LayoutWidget,ScheduleTask} from './types';
export function widgetRows(tasks:ScheduleTask[],widget:LayoutWidget):ScheduleTask[]{return tasks.filter(task=>widget.scope==='done'?task.progress===100:widget.scope==='pending'?task.progress<100:true).slice(0,widget.limit??10);}
