// A double-click preview: relative links and an embedded search index. Not deployed.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),site=path.join(root,'_site'),out=path.join(root,'preview');
if(process.env.SITE_PATH)throw Error('Generare l’anteprima con SITE_PATH vuoto.');
fs.rmSync(out,{force:true,recursive:true});fs.mkdirSync(out,{recursive:true});
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(f=>f.isDirectory()?walk(path.join(dir,f.name)):[path.join(dir,f.name)]);}
for(const src of walk(site).filter(f=>f.endsWith('.html'))){
 const target=path.join(out,path.relative(site,src)),folder=path.dirname(target);
 const relative=u=>{
  const match=u.match(/^([^?#]*)(.*)$/),pathname=decodeURIComponent(match[1]);
  let dest=pathname==='/favicon.ico'||pathname.match(/^\/(?:assets|images|documents)\//)?path.join(root,'src',pathname):path.join(out,pathname);
  if(pathname.endsWith('/'))dest=path.join(dest,'index.html');
  return path.relative(folder,dest).split(path.sep).join('/')+match[2];
 };
 let html=fs.readFileSync(src,'utf8').replace(/<script[^>]*src="https:\/\/codicepro\.shinystat\.com[^"]*"[^>]*><\/script>/g,'').replace(/<noscript data-counter>[\s\S]*?<\/noscript>/g,'').replace(/<meta name="counter-enabled" content="true">/g,'').replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/,'');
 html=html.replace(/\b(href|src)="(\/[^"<>]*)"/g,(_,attr,u)=>`${attr}="${relative(u)}"`);
 html=html.replace(/(http-equiv="refresh" content="0;url=)(\/[^"<>]*)/g,(_,before,u)=>before+relative(u));
 if(src.endsWith(path.join('cerca','index.html'))){
  const index=JSON.parse(fs.readFileSync(path.join(site,'search.json'),'utf8')).map(a=>({...a,url:relative(a.url)}));
  const data=JSON.stringify(index).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  html=html.replace('</body>',`<div id="offline-search-index" data-index="${data}" hidden></div></body>`);
 }
 fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(target,html);
}
fs.writeFileSync(path.join(root,'ANTEPRIMA.html'),'<!doctype html><html lang="it"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=preview/index.html"><title>Anteprima Priorato</title><p><a href="preview/index.html">Apri l’anteprima di Priorato</a></p></html>');
console.log('Anteprima pronta: aprire ANTEPRIMA.html con un doppio clic.');
