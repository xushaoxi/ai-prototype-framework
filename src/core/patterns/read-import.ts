import {parseCsv} from './import';
export async function readImportFile(file:File):Promise<string[][]>{
 if(file.size>2*1024*1024)throw new Error('文件不能超过2MB');
 if(/\.xls$/i.test(file.name))throw new Error('旧版.xls请先另存为.xlsx或UTF-8 CSV');
 if(/\.xlsx$/i.test(file.name)){
  const {readSheet}=await import('read-excel-file/browser');
  const values=await readSheet(file);
  if(!values.length||values.length>501)throw new Error('首个工作表须有标题，且最多500行数据');
  return values.map(row=>row.map(value=>value===null?'':value instanceof Date?value.toISOString().slice(0,10):String(value)));
 }
 if(!/\.csv$/i.test(file.name))throw new Error('请选择.csv或.xlsx文件');
 const text=await file.text();if(text.includes('\uFFFD'))throw new Error('CSV须使用UTF-8编码，请重新导出');
 return parseCsv(text);
}
