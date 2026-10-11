import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,mkdir,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createPreviewServer} from './preview-auth.mjs';
test('Course isolation, administration, rotation and persistence',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'compsy-codes-')),root=path.join(dir,'site');await mkdir(root);
 for(const f of ['a.pdf','b.pdf','a2.pdf','public.pdf','formations.html'])await writeFile(path.join(root,f),f);
 const options={root,adminPassword:'admin-test-only',dataFile:path.join(dir,'codes.json'),catalog:[{id:'a',title:'A',files:['/a.pdf','/a2.pdf']},{id:'b',title:'B',files:['/b.pdf']}]};
 let server,base;
 async function start(){server=await createPreviewServer(options);await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}`;}
 const get=(url,cookie)=>fetch(base+url,{redirect:'manual',headers:cookie?{cookie}:{}});
 const post=(url,body,cookie)=>fetch(base+url,{method:'POST',redirect:'manual',headers:cookie?{cookie}:{},body:new URLSearchParams(body)});
 const cookie=r=>r.headers.get('set-cookie').split(';')[0];
 await start();
 try {
 assert.equal((await get('/formations.html')).status,200);assert.equal((await get('/public.pdf')).status,200);
 assert.equal((await get('/a.pdf')).status,303);
 assert.equal((await post('/admin',{password:'wrong'})).status,401);
 const admin=cookie(await post('/admin',{password:'admin-test-only'}));
 const html=await (await get('/admin',admin)).text(),csrf=html.match(/name="csrf" value="([^"]+)"/)[1];
 assert.equal((await post('/admin',{id:'a',code:'0012'},admin)).status,403);
 for(const code of ['123','abcd'])assert.equal((await post('/admin',{csrf,id:'a',code},admin)).status,400);
 for(const id of ['a','b'])assert.equal((await post('/admin',{csrf,id,code:id==='a'?'0012':'5678'},admin)).status,303);
 assert.ok(!(await readFile(options.dataFile,'utf8')).includes('0012'));
 const student=cookie(await post('/connexion',{next:'/a.pdf',code:'0012'}));
 assert.equal((await get('/a.pdf',student)).status,200);assert.equal((await get('/a2.pdf',student)).status,200);
 assert.equal((await get('/b.pdf',student)).status,303);
 assert.equal((await post('/connexion',{next:'/b.pdf',code:'0012'})).status,401);
 assert.equal((await post('/admin',{csrf,id:'a',code:'9876'},admin)).status,303);
 assert.equal((await get('/a.pdf',student)).status,303);
 assert.equal((await post('/connexion',{next:'/a.pdf',code:'0012'})).status,401);
 await new Promise(r=>server.close(r));await start();
 assert.equal((await post('/connexion',{next:'/a.pdf',code:'9876'})).status,303);
 assert.equal((await get('/%2e%2e%5csecret.pdf')).status,400);
 }finally{await new Promise(r=>server.close(r));}
});
