const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../_site');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.pdf':'application/pdf','.xml':'application/xml','.txt':'text/plain'};
http.createServer((req,res)=>{try{
 let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 let file=path.resolve(root,'.'+pathname);
 if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory()){
  if(!pathname.endsWith('/')){res.writeHead(302,{Location:pathname+'/'+new URL(req.url,'http://localhost').search});return res.end();}
  file=path.join(file,'index.html');
 }
 if(!fs.existsSync(file)){res.statusCode=404;file=path.join(root,'404.html');}
 res.setHeader('Content-Type',types[path.extname(file).toLowerCase()]||'application/octet-stream');fs.createReadStream(file).pipe(res);
}catch{res.writeHead(400);res.end('Richiesta non valida');}}).listen(8080,'127.0.0.1',()=>console.log('Anteprima: http://127.0.0.1:8080 — Ctrl+C per chiudere.'));
