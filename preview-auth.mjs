import http from 'node:http';
import {readFile, realpath, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {timingSafeEqual} from 'node:crypto';

// Local experiment only. Nothing here changes the OVH deployment.
export function createPreviewServer({root, username, password}) {
  if (!username || !password) throw new Error('Set PREVIEW_USER and PREVIEW_PASSWORD first.');
  const expected = Buffer.from('Basic ' + Buffer.from(`${username}:${password}`).toString('base64'));
  return http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
    try {
      const url = new URL(req.url, 'http://localhost');
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
        const provided = Buffer.from(req.headers.authorization || '');
        if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
          res.setHeader('WWW-Authenticate', 'Basic realm="Formations - essai local", charset="UTF-8"');
          res.writeHead(401, {'Content-Type':'text/plain; charset=utf-8'});
          return res.end('Accès réservé aux étudiants et stagiaires. Identifiants requis.');
        }
      }
      if (!(await stat(file)).isFile()) { res.writeHead(404); return res.end(); }
      const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.pdf':'application/pdf','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon'};
      const bytes = await readFile(file);
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
