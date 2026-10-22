import { test, expect } from '@playwright/test';
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import type { AddressInfo } from 'node:net';
let server:Server;
let base:string;
test.beforeAll(async()=>{
  const root=resolve('dist');
  const mime:Record<string,string>={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'};
  server=createServer(async(req,res)=>{
    const pathname=new URL(req.url??'/','http://localhost').pathname;
    if(!pathname.startsWith('/prototype/')){res.writeHead(404);res.end();return;}
    const target=resolve(root,decodeURIComponent(pathname.slice('/prototype/'.length))||'index.html');
    if(!target.startsWith(root+'/')){res.writeHead(403);res.end();return;}
    try {const data=await readFile(target);res.writeHead(200,{'Content-Type':mime[extname(target)]??'application/octet-stream','Cache-Control':'no-store'});res.end(data);}catch{res.writeHead(404);res.end();}
  });
  await new Promise<void>(done=>server.listen(0,'127.0.0.1',done));
  base=`http://127.0.0.1:${(server.address() as AddressInfo).port}/prototype/`;
});
test.afterAll(async()=>{await new Promise<void>((done,reject)=>server.close(error=>error?reject(error):done()));});
test('HOSTING-001 静态子目录中Mock仍能拦截、创建和刷新',async({page})=>{
  await page.goto(base+'#/vendors');
  await expect(page.getByTestId('summary-total')).toHaveText('12');
  await page.getByRole('button',{name:'新增供应商',exact:true}).click();
  const dialog=page.getByRole('dialog');
  await dialog.getByLabel('供应商名称',{exact:true}).fill('静态部署测试供应商');
  await dialog.getByLabel('对接人',{exact:true}).fill('部署验证');
  await dialog.getByRole('button',{name:'保存',exact:true}).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('row').filter({hasText:'静态部署测试供应商'})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('row').filter({hasText:'静态部署测试供应商'})).toBeVisible();
});
