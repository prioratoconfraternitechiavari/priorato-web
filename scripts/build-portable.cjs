// Uses the same template and renderer as Eleventy, with no external dependencies.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'_site');
const Template=require('../src/pages.11ty.cjs'),template=new Template();
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
for(const entry of template.data().entries){const file=path.join(out,entry.output);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,template.render({entry}));}
for(const name of ['assets','images'])fs.cpSync(path.join(root,'src',name),path.join(out,name),{recursive:true});
fs.copyFileSync(path.join(root,'src/favicon.ico'),path.join(out,'favicon.ico'));
console.log('Sito generato in _site.');
