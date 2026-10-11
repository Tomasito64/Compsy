import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import net from 'node:net';
const run=promisify(execFile),base=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const php=process.env.PHP_BINARY||'php';
test('PHP production package: isolated codes, private PDFs, CSRF, persistence',async()=>{
 const tmp=await mkdtemp(path.join(os.tmpdir(),'compsy-php-')),bundle=path.join(tmp,'bundle');
 await run(process.execPath,[path.join(base,'ovh-protection/prepare.mjs'),bundle]);
 await run(php,['-l',path.join(bundle,'public/supports.php')]);
 await run(php,[path.join(base,'ovh-protection/init.php'),path.join(bundle,'compsy-private')],{env:{...process.env,COMPSY_ADMIN_PASSWORD:'local-test-admin-2026'}});
 const catalog=JSON.parse(await readFile(path.join(bundle,'compsy-private/catalog.json'),'utf8'));
 const groups=Object.entries(catalog.formations),id=groups[0][0],second=groups[1][0];
 const doc=groups[0][1].documents[0],doc2=groups[0][1].documents[1],other=groups[1][1].documents[0];
 let child,url;
 async function start(local=true){
  const probe=net.createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
  url=`http://127.0.0.1:${port}`;
  child=spawn(php,['-S',`127.0.0.1:${port}`,'-t',path.join(bundle,'public')],{env:{...process.env,COMPSY_LOCAL_TEST:local?'1':'0'},stdio:['ignore','ignore','pipe']});
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('PHP failed to start')),10000);child.stderr.on('data',b=>{if(b.toString().includes('started')){clearTimeout(timer);resolve();}});child.on('error',reject);child.stderr.on('data',b=>{if(/Fatal|Warning|Exception/.test(b.toString()))console.log(b.toString());});});
 }
 async function stop(){const done=new Promise(r=>child.once('exit',r));child.kill();await done;}
 function client(){let cookie='';return async(p,body)=>{const r=await fetch(url+p,{method:body?'POST':'GET',redirect:'manual',headers:cookie?{cookie}:{},body:body?new URLSearchParams(body):undefined});if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];return r;};}
 const csrf=async r=>(await r.text()).match(/name="csrf" value="([^"]+)"/)[1];
 await start();
 try{
 const admin=client(),student=client(),outsider=client();
 assert.equal((await outsider('/formations.html')).status,200);
 for(const p of ['/bien-etre-des-managers.pdf','/irts-eje-approche-fonction-manageriale-1.pdf','/../compsy-private/config.json','/compsy-private/state.json']){const r=await outsider(p);assert.notEqual(r.headers.get('content-type'),'application/pdf');assert.ok(!(await r.text()).includes('admin_hash'));}
 assert.equal((await outsider('/supports.php?document=../../config.json')).status,404);
 const token=await csrf(await admin('/supports.php?action=admin'));
 assert.equal((await admin('/supports.php?action=admin',{csrf:token,password:'local-test-admin-2026'})).status,303);
 assert.equal((await admin('/supports.php?action=admin',{formation:id,code:'0427'})).status,403);
 assert.equal((await admin('/supports.php?action=admin',{csrf:token,formation:id,code:'123'})).status,400);
 for(const gid of [id,second])assert.equal((await admin('/supports.php?action=admin',{csrf:token,formation:gid,code:gid===id?'0427':'8765'})).status,303);
 const getDoc=d=>'/supports.php?document='+d;
 const st=await csrf(await student(getDoc(doc)));
 assert.equal((await student(getDoc(doc),{csrf:st,code:'8765'})).status,401);
 assert.equal((await student(getDoc(doc),{csrf:st,code:'0427'})).status,303);
 for(const d of [doc,doc2]){const r=await student(getDoc(d));assert.equal(r.headers.get('content-type'),'application/pdf');const bytes=Buffer.from(await r.arrayBuffer());assert.deepEqual(bytes,await readFile(path.join(bundle,'compsy-private/documents',catalog.documents[d].storage)));}
 assert.match((await student(getDoc(other))).headers.get('content-type'),/text\/html/);
 assert.equal((await admin('/supports.php?action=admin',{csrf:token,formation:id,code:'5678'})).status,303);
 assert.match((await student(getDoc(doc))).headers.get('content-type'),/text\/html/);
 assert.equal((await student(getDoc(doc),{csrf:st,code:'0427'})).status,401);
 const state=await readFile(path.join(bundle,'compsy-private/state.json'),'utf8');assert.ok(!state.includes('5678'));
 const blocked=client(),bt=await csrf(await blocked(getDoc(other)));
 for(let n=0;n<10;n++)assert.equal((await blocked(getDoc(other),{csrf:bt,code:'0000'})).status,401);
 assert.equal((await blocked(getDoc(other),{csrf:bt,code:'8765'})).status,401);
 await stop();await start();const fresh=client(),ft=await csrf(await fresh(getDoc(doc)));
 assert.equal((await fresh(getDoc(doc),{csrf:ft,code:'5678'})).status,303);
 await stop();await start(false);assert.equal((await client()('/supports.php?action=admin')).status,403);
 }finally{await stop();}
});
