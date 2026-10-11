import {readFile,writeFile,mkdir,copyFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const base=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out=path.resolve(process.argv[2]||path.join(base,'.prepared-ovh'));
// Always require a fresh directory: never erase a previous package or its data.
await mkdir(out);
const source=path.join(base,'site'),publicRoot=path.join(out,'public'),privateRoot=path.join(out,'compsy-private');
await mkdir(publicRoot);await mkdir(path.join(privateRoot,'documents'),{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const html=await readFile(path.join(source,'formations.html'),'utf8');
const catalog={formations:{},documents:{}};const protectedPaths=new Map(),protectedHashes=new Set();
for(const m of html.matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/g)){
 const links=[...m[1].matchAll(/href="([^"]+\.pdf)"/g)].map(a=>a[1]);if(!links.length)continue;
 const id=hash(links[0]).slice(0,16);
 const title=(m[1].match(/<h2>(.*?)<\/h2>/s)?.[1]||'Formation').replace(/&amp;/g,'&')+(m[1].includes('id="irts-eje"')?' — EJE':'');
 const course={title,documents:[]};catalog.formations[id]=course;
 for(const href of links){
  const rel=decodeURIComponent(href),file=path.resolve(source,rel);
  if(!file.startsWith(source+path.sep))throw Error('Invalid PDF path');
  const bytes=await readFile(file),sha=hash(bytes),docId=hash(href).slice(0,24);
  if(catalog.documents[docId])throw Error('Document appears in multiple courses');
  const storage=sha+'.pdf';await writeFile(path.join(privateRoot,'documents',storage),bytes);
  catalog.documents[docId]={formation:id,name:path.basename(rel),storage};course.documents.push(docId);
  protectedPaths.set(rel,{id:docId,hash:sha});protectedHashes.add(sha);
 }
}
const removed=[];
async function copyTree(from,to,rel=''){
 await mkdir(to,{recursive:true});
 for(const entry of await readdir(from,{withFileTypes:true})){
  const r=rel?rel+'/'+entry.name:entry.name,src=path.join(from,entry.name),dst=path.join(to,entry.name);
  if(entry.isSymbolicLink())throw Error('Symlinks are not packaged');
  if(entry.isDirectory()){await copyTree(src,dst,r);continue;}
  if(entry.name.toLowerCase().endsWith('.pdf')&&protectedHashes.has(hash(await readFile(src)))){removed.push(r);continue;}
  if(entry.name.endsWith('.html')){
   let content=await readFile(src,'utf8');
   // Update all local links to protected content, including other resource pages.
   content=content.replace(/<a\b[^>]*>/gi,tag=>{
    const match=tag.match(/href="([^"]+)"/);if(!match)return tag;
    const url=new URL(match[1],'https://local.invalid/'+r);
    if(url.origin!=='https://local.invalid')return tag;
    const pdf=protectedPaths.get(decodeURIComponent(url.pathname.slice(1)));
    return pdf?tag.replace(match[0],`href="/supports.php?document=${pdf.id}"`).replace(/\sdownload(?:="[^"]*")?(?=[\s>])/g,''):tag;
   });
   await writeFile(dst,content);
  }else await copyFile(src,dst);
 }
}
await copyTree(source,publicRoot);
await copyFile(path.join(base,'ovh-protection','supports.php'),path.join(publicRoot,'supports.php'));
await writeFile(path.join(privateRoot,'catalog.json'),JSON.stringify(catalog,null,2));
await writeFile(path.join(privateRoot,'.htaccess'),'Require all denied\n');
// Block old paths as defence in depth if an old PDF is left during deployment.
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/ /g,'\\x20');
let htaccess='';try{htaccess=await readFile(path.join(publicRoot,'.htaccess'),'utf8');}catch(e){if(e.code!=='ENOENT')throw e;}
htaccess+='\n# Compsy: deny old direct training downloads\nRewriteEngine On\n';
for(const rel of removed)htaccess+=`RewriteRule ^${escape(rel)}$ - [F,NC]\n`;
await writeFile(path.join(publicRoot,'.htaccess'),htaccess);
await writeFile(path.join(out,'manifest.json'),JSON.stringify({courses:Object.keys(catalog.formations).length,documents:Object.keys(catalog.documents).length,removedPublicFiles:removed},null,2));
console.log(JSON.stringify({output:out,courses:Object.keys(catalog.formations).length,documents:Object.keys(catalog.documents).length,removedPublicFiles:removed.length}));
