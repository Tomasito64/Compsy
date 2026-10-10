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
    for(const suffix of ['/cours.pdf','/cours%2Epdf?download=1']) {
      const denied=await fetch(base+suffix);
      assert.equal(denied.status,401);
      assert.ok(denied.headers.get('www-authenticate'));
      assert.equal((await fetch(base+suffix,{headers:{Authorization:'Basic invalid'}})).status,401);
      const allowed=await fetch(base+suffix,{headers:{Authorization:'Basic '+Buffer.from('student:test-only-password').toString('base64')}});
      assert.equal(allowed.status,200);
      assert.equal(allowed.headers.get('cache-control'),'no-store');
    }
    assert.equal((await fetch(base+'/cours.pdf',{method:'HEAD'})).status,401);
    assert.equal((await fetch(base+'/%2e%2e%5csecret.pdf')).status,400);
    assert.equal((await fetch(base+'/missing.pdf')).status,404);
  } finally { await new Promise(r=>server.close(r)); await rm(root,{recursive:true,force:true}); }
});
