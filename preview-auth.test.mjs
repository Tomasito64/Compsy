import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createPreviewServer} from './preview-auth.mjs';

test('Training descriptions remain public; direct PDF URLs require authentication', async()=>{
  const root=await mkdtemp(path.join(tmpdir(),'compsy-auth-'));
  await writeFile(path.join(root,'accueil.html'),'PUBLIC');
  await writeFile(path.join(root,'formations.html'),'PRIVATE');
  await writeFile(path.join(root,'cours.pdf'),'%PDF-test');
  const server=createPreviewServer({root,username:'student',password:'test-only-password'});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await fetch(base+'/accueil.html')).status,200);
    assert.equal((await fetch(base+'/formations.html')).status,200);
    const publicPage=await fetch(base+'/formations.html');
    assert.equal(publicPage.status,200);
    for(const suffix of ['/cours.pdf','/cours%2Epdf?download=1']) {
      const denied=await fetch(base+suffix,{redirect:'manual'});
      assert.equal(denied.status,303);
      const login=await fetch(base+denied.headers.get('location'));
      assert.match(await login.text(),/Mot de passe/);
    }
    const wrong=await fetch(base+'/connexion',{method:'POST',body:new URLSearchParams({username:'student',password:'wrong',next:'/cours.pdf'})});
    assert.equal(wrong.status,401);
    const login=await fetch(base+'/connexion',{method:'POST',redirect:'manual',body:new URLSearchParams({username:'student',password:'test-only-password',next:'/cours.pdf'})});
    assert.equal(login.status,303);
    assert.equal(login.headers.get('location'),'/cours.pdf');
    const cookie=login.headers.get('set-cookie').split(';')[0];
    const allowed=await fetch(base+'/cours.pdf',{headers:{Cookie:cookie}});
    assert.equal(allowed.status,200);
    assert.equal(await allowed.text(),'%PDF-test');
    assert.match(allowed.headers.get('content-disposition'),/attachment/);
    assert.equal((await fetch(base+'/cours.pdf',{method:'HEAD',redirect:'manual'})).status,303);
    assert.equal((await fetch(base+'/%2e%2e%5csecret.pdf')).status,400);
    assert.equal((await fetch(base+'/missing.pdf')).status,404);
  } finally { await new Promise(r=>server.close(r)); await rm(root,{recursive:true,force:true}); }
});
