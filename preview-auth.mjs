import http from 'node:http';
import {readFile, realpath, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {timingSafeEqual, randomBytes} from 'node:crypto';

const escape = s => s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeNext = s => s && s.startsWith('/') && !s.startsWith('//') && !/[\\\r\n]/.test(s) ? s : '/formations.html';
function loginPage(next,error='') {
  return `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Accès aux supports de formation</title><link rel="stylesheet" href="/styles.css"><body><main class="container" style="max-width:540px;padding:3rem 0"><div class="panel"><h1 style="font-size:2.2rem">Accès aux supports</h1><p>Les présentations sont accessibles à tous. Saisissez les identifiants transmis pour télécharger ce document.</p>${error?`<p role="alert" style="color:#a32923;margin:1rem 0">${escape(error)}</p>`:''}<form class="contact-form" style="margin-top:1.5rem" action="/connexion" method="post"><input type="hidden" name="next" value="${escape(next)}"><label>Identifiant<input name="username" autocomplete="username" required></label><label>Mot de passe<input name="password" type="password" autocomplete="current-password" required></label><button class="btn primary" type="submit">Accéder au document</button></form><a class="text-link" href="/formations.html">Retour aux formations</a></div></main></body></html>`;
}

// Local experiment only. Nothing here changes the OVH deployment.
export function createPreviewServer({root, username, password}) {
  if (!username || !password) throw new Error('Set PREVIEW_USER and PREVIEW_PASSWORD first.');
  const expected = Buffer.from(`${username}:${password}`);
  const sessions = new Map();
  return http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    try {
      const url = new URL(req.url, 'http://localhost');
      if(url.pathname === '/connexion') {
        if(req.method === 'GET') { res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}); return res.end(loginPage(safeNext(url.searchParams.get('next')))); }
        if(req.method !== 'POST') {res.writeHead(405);return res.end();}
        if(req.headers.origin && req.headers.origin !== 'http://' + req.headers.host) {res.writeHead(403);return res.end();}
        let body='';
        for await (const chunk of req) {body+=chunk; if(body.length>4096){res.writeHead(413);return res.end();}}
        const form=new URLSearchParams(body), next=safeNext(form.get('next'));
        const provided=Buffer.from(`${form.get('username')}:${form.get('password')}`);
        if(provided.length !== expected.length || !timingSafeEqual(provided,expected)) {res.writeHead(401,{'Content-Type':'text/html; charset=utf-8'});return res.end(loginPage(next,'Identifiant ou mot de passe incorrect.'));}
        for(const [key,expires] of sessions) if(expires<Date.now()) sessions.delete(key);
        const token=randomBytes(32).toString('hex');sessions.set(token,Date.now()+3600000);
        res.setHeader('Set-Cookie',`preview_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600`);
        res.writeHead(303,{'Location':next});return res.end();
      }
      if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
      const decoded = decodeURIComponent(url.pathname);
      if (decoded.includes('\\') || decoded.includes('\0')) { res.writeHead(400); return res.end(); }
      const base = await realpath(root);
      const candidate = path.resolve(base, '.' + decoded, decoded.endsWith('/') ? 'index.html' : '');
      const file = await realpath(candidate);
      const relative = path.relative(base, file);
      if (relative.startsWith('..') || path.isAbsolute(relative) || relative.split(path.sep).some(p=>p.startsWith('.'))) {
        res.writeHead(404); return res.end();
      }
      const protectedFile = path.extname(file).toLowerCase() === '.pdf';
      if (protectedFile) {
        const token=(req.headers.cookie || '').split(';').map(s=>s.trim()).find(s=>s.startsWith('preview_session='))?.slice(16);
        if (!token || (sessions.get(token)||0)<Date.now()) {
          res.writeHead(303, {'Location':'/connexion?next='+encodeURIComponent(url.pathname)});
          return res.end();
        }
        res.setHeader('Content-Disposition',`attachment; filename*=UTF-8''${encodeURIComponent(path.basename(file))}`);
      }
      if (!(await stat(file)).isFile()) { res.writeHead(404); return res.end(); }
      const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.pdf':'application/pdf','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon'};
      let bytes = await readFile(file);
      // Navigate to the login page instead of downloading the HTML response.
      if(path.extname(file).toLowerCase()==='.html') bytes=Buffer.from(bytes.toString('utf8').replace(/\sdownload(?:="[^"]*")?(?=[\s>])/g,''));
      res.writeHead(200, {'Content-Type':types[path.extname(file).toLowerCase()] || 'application/octet-stream','Content-Length':bytes.length});
      res.end(req.method === 'HEAD' ? undefined : bytes);
    } catch { res.writeHead(404); res.end('Introuvable'); }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'site');
  const server = createPreviewServer({root, username:process.env.PREVIEW_USER, password:process.env.PREVIEW_PASSWORD});
  server.listen(Number(process.env.PREVIEW_PORT || 8766), '127.0.0.1', ()=>console.log('Essai local : http://127.0.0.1:' + server.address().port + '/formations.html'));
}
