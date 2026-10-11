import http from 'node:http';
import {readFile, realpath, stat, mkdir, writeFile, rename} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes, scryptSync, timingSafeEqual, createHash} from 'node:crypto';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const digest=(s,salt)=>scryptSync(s,salt,32).toString('hex');
const record=s=>{const salt=randomBytes(16).toString('hex');return {salt,hash:digest(s,salt)};};
const matches=(s,r)=>!!r && timingSafeEqual(Buffer.from(digest(s,r.salt),'hex'),Buffer.from(r.hash,'hex'));
const page=(title,body)=>`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><link rel="stylesheet" href="/styles.css"><body><main style="max-width:780px;margin:auto;padding:28px 18px"><div class="panel"><img src="/logo-coquelicot.png" width="48" alt=""><h1>${esc(title)}</h1>${body}<p style="margin-top:24px"><a href="/formations.html">Retour aux formations</a></p></div></main></body></html>`;
const hidden=(name,value)=>`<input type="hidden" name="${name}" value="${esc(value)}">`;
const field=(label,name)=>`<label>${label}<input name="${name}" type="password" autocomplete="off" minlength="${name==='code'?4:8}" ${name==='code'?'inputmode="numeric" pattern="[0-9]{4,128}"':''} maxlength="128" required></label>`;
const button=t=>`<button class="btn primary" type="submit">${t}</button>`;

export async function createPreviewServer({root,adminPassword,dataFile,catalog}) {
  if(!adminPassword || !dataFile) throw new Error('Admin password and external data file required');
  root=await realpath(root);
  if(!path.relative(root,path.resolve(dataFile)).startsWith('..')) throw new Error('Codes must be outside public root');
  if(!catalog) {
    const html=await readFile(path.join(root,'formations.html'),'utf8');
    catalog=[...html.matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/g)].map((m,i)=>({id:createHash('sha256').update(m[1].match(/href="([^"]+\.pdf)"/)?.[1]||String(i)).digest('hex').slice(0,16),title:(m[1].match(/<h2>(.*?)<\/h2>/s)?.[1]||'Formation').replace(/&amp;/g,'&')+(i===0?' — EJE':''),files:[...m[1].matchAll(/href="([^"]+\.pdf)"/g)].map(a=>decodeURIComponent('/'+a[1]))}));
  }
  let codes={};
  try {codes=JSON.parse(await readFile(dataFile,'utf8'));} catch(e){if(e.code!=='ENOENT')throw e;}
  const admin=record(adminPassword), sessions=new Map(), failures=new Map();
  let saving=Promise.resolve();
  const group=p=>catalog.find(c=>c.files.some(f=>f.toLowerCase()===p.toLowerCase()));
  return http.createServer(async(req,res)=>{
    const send=(status,body)=>{res.writeHead(status,{'Content-Type':'text/html; charset=utf-8'});res.end(body);};
    const redirect=url=>{res.writeHead(303,{Location:url});res.end();};
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex, nofollow');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');
    try {
      const url=new URL(req.url,'http://localhost');
      const decoded=decodeURIComponent(url.pathname);
      if(/[\\\0]/.test(decoded)) return send(400,'Adresse invalide');
      for(const [t,s] of sessions)if(s.expires<Date.now())sessions.delete(t);
      const token=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('preview_session='))?.slice(16);
      let session=sessions.get(token);
      const newSession=()=>{const t=randomBytes(32).toString('hex');session={expires:Date.now()+3600000,csrf:randomBytes(24).toString('hex'),grants:{}};sessions.set(t,session);res.setHeader('Set-Cookie',`preview_session=${t}; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600`);};
      let form;
      if(req.method==='POST') {
        if(req.headers.origin && req.headers.origin!=='http://'+req.headers.host)return send(403,'Requête refusée');
        let body='';for await(const chunk of req){body+=chunk;if(body.length>4096)return send(413,'Requête trop longue');}form=new URLSearchParams(body);
      } else if(!['GET','HEAD'].includes(req.method))return send(405,'Méthode refusée');
      const authCheck=(value,stored,key)=>{
        const now=Date.now(), f=failures.get(key);
        if(f && f.until>now && f.count>=10)return false;
        if(matches(value,stored)){failures.delete(key);return true;}
        failures.set(key,{count:f&&f.until>now?f.count+1:1,until:now+300000});return false;
      };
      if(decoded==='/admin') {
        if(!session?.admin) {
          let error='';
          if(form){if(authCheck(form.get('password')||'',admin,'admin')){newSession();session.admin=true;return redirect('/admin');}error='<p role="alert">Mot de passe incorrect ou trop de tentatives. Réessayez dans quelques minutes.</p>';}
          return send(form?401:200,page('Administration des formations',`${error}<form class="contact-form" method="post">${field('Mot de passe administrateur','password')}${button('Se connecter')}</form>`));
        }
        if(form) {
          if(form.get('csrf')!==session.csrf)return send(403,'Requête refusée');
          if(form.get('action')==='logout'){sessions.delete(token);return redirect('/admin');}
          const id=form.get('id'), code=form.get('code')||'';
          if(!catalog.some(c=>c.id===id)||!/^[0-9]{4,128}$/.test(code))return send(400,'Choisissez un code de 4 à 128 chiffres.');
          const replacement=record(code);
          const save=saving.then(async()=>{const next={...codes,[id]:replacement};await mkdir(path.dirname(dataFile),{recursive:true});await writeFile(dataFile+'.tmp',JSON.stringify(next),{mode:0o600});await rename(dataFile+'.tmp',dataFile);codes=next;});
          saving=save.catch(()=>{});await save;return redirect('/admin?saved=1');
        }
        return send(200,page('Codes des formations',`<p>Choisissez un code par formation et transmettez-le aux participants. Un nouveau code remplace immédiatement l’ancien. Les codes enregistrés ne sont pas affichés.</p>${url.searchParams.has('saved')?'<p role="status">Code enregistré.</p>':''}${catalog.map(c=>`<section style="padding:20px 0;border-bottom:1px solid #ddd"><h2>${esc(c.title)}</h2><p>${c.files.length} document(s) · ${codes[c.id]?'Code défini':'Aucun code : téléchargement fermé'}</p><form class="contact-form" method="post">${hidden('csrf',session.csrf)}${hidden('id',c.id)}${field('Nouveau code (4 chiffres minimum)','code')}${button('Enregistrer le code')}</form></section>`).join('')}<form method="post" style="margin-top:24px">${hidden('csrf',session.csrf)}${hidden('action','logout')}${button('Se déconnecter')}</form>`));
      }
      if(decoded==='/connexion') {
        let next=form?.get('next')||url.searchParams.get('next')||'';
        if(!next.startsWith('/')||next.startsWith('//')||/[\\\r\n]/.test(next))return send(400,'Document invalide');
        const course=group(decodeURIComponent(new URL(next,'http://localhost').pathname));
        if(!course)return send(404,'Formation introuvable');
        let error='';
        if(form){if(authCheck(form.get('code')||'',codes[course.id],course.id)){if(!session)newSession();session.grants[course.id]=codes[course.id].hash;return redirect(next);}error='<p role="alert">Code incorrect ou trop de tentatives. Vérifiez le code transmis par votre formateur.</p>';}
        return send(form?401:200,page('Accès aux supports',`<h2>${esc(course.title)}</h2><p>La présentation reste accessible à tous. Saisissez le code transmis pour télécharger le document.</p>${error}${codes[course.id]?`<form class="contact-form" action="/connexion" method="post">${hidden('next',next)}${field('Code de la formation','code')}${button('Télécharger le document')}</form>`:'<p>Le code de cette formation n’a pas encore été défini. Contactez votre formateur.</p>'}`));
      }
      if(form)return send(405,'Méthode refusée');
      const file=await realpath(path.resolve(root,'.'+decoded,decoded.endsWith('/')?'index.html':''));
      const rel=path.relative(root,file);
      if(rel.startsWith('..')||path.isAbsolute(rel)||rel.split(path.sep).some(s=>s.startsWith('.')))return send(404,'Introuvable');
      if(!(await stat(file)).isFile())return send(404,'Introuvable');
      const course=group('/'+rel.split(path.sep).join('/'));
      if(course) {
        if(!codes[course.id]||session?.grants[course.id]!==codes[course.id].hash)return redirect('/connexion?next='+encodeURIComponent(url.pathname));
        res.setHeader('Content-Disposition',`attachment; filename*=UTF-8''${encodeURIComponent(path.basename(file))}`);
      }
      const ext=path.extname(file).toLowerCase(), types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.pdf':'application/pdf','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon'};
      let bytes=await readFile(file);
      if(ext==='.html')bytes=Buffer.from(bytes.toString('utf8').replace(/\sdownload(?:="[^"]*")?(?=[\s>])/g,''));
      res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream','Content-Length':bytes.length});res.end(req.method==='HEAD'?undefined:bytes);
    }catch(e){send(e.code==='ENOENT'?404:500,e.code==='ENOENT'?'Introuvable':'Impossible de terminer cette action. Réessayez.');}
  });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const base=path.dirname(fileURLToPath(import.meta.url));
  const server=await createPreviewServer({root:path.join(base,'site'),adminPassword:process.env.PREVIEW_ADMIN_PASSWORD,dataFile:process.env.PREVIEW_DATA_FILE||path.join(base,'.preview-private','codes.json')});
  server.listen(Number(process.env.PREVIEW_PORT||8766),'127.0.0.1',()=>console.log('Test local : http://127.0.0.1:8766/admin'));
}

