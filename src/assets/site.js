'use strict';
document.documentElement.classList.add('js');
const base=document.body.dataset.base||'';
const nav=document.getElementById('navigation');
const toggle=document.querySelector('.menu-toggle');
if(toggle)toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));nav.classList.toggle('is-open',open);});
document.addEventListener('click',event=>{for(const group of document.querySelectorAll('.nav-group[open]'))if(!group.contains(event.target))group.open=false;});
document.addEventListener('keydown',event=>{if(event.key==='Escape')for(const group of document.querySelectorAll('.nav-group[open]'))group.open=false;});
for(const button of document.querySelectorAll('[data-play]')){
 const container=button.closest('.video');
 const external=container.querySelector('.video-external');
 // Local files cannot provide the HTTP Referer required by YouTube (error 153).
 if(location.protocol==='file:'){
  const link=external.cloneNode(true);
  link.className='video-play';link.textContent='▶ Guarda su YouTube';
  button.replaceWith(link);external.remove();
  container.querySelector('.video-notice').textContent='Il video si apre in una nuova scheda.';
  continue;
 }
 button.addEventListener('click',()=>{
  const frame=document.createElement('span'),iframe=document.createElement('iframe');
  frame.className='video-frame';
  iframe.title='Video da YouTube';iframe.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';iframe.allowFullscreen=true;
  iframe.referrerPolicy='strict-origin-when-cross-origin';
  iframe.src='https://www.youtube-nocookie.com/embed/'+button.dataset.play+'?autoplay=1&playsinline=1&origin='+encodeURIComponent(location.origin);
  frame.append(iframe);
  const fallback=external.cloneNode(true);
  fallback.textContent='Apri il video su YouTube ↗';
  container.classList.add('is-playing');container.replaceChildren(frame,fallback);
 },{once:true});
}
const dialog=document.getElementById('lightbox');
let gallery=[],current=0;
function showImage(index){current=(index+gallery.length)%gallery.length;const item=gallery[current];const im=document.getElementById('full-image');im.src=item.href;im.alt=item.querySelector('img').alt;}
if(dialog&&typeof dialog.showModal==='function'){
 for(const item of document.querySelectorAll('[data-gallery]'))item.addEventListener('click',event=>{if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();gallery=Array.from(document.querySelectorAll('[data-gallery]')).filter(a=>a.dataset.gallery===item.dataset.gallery);showImage(gallery.indexOf(item));dialog.showModal();});
 dialog.querySelector('[data-prev]').addEventListener('click',()=>showImage(current-1));dialog.querySelector('[data-next]').addEventListener('click',()=>showImage(current+1));dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();showImage(current-1);}if(event.key==='ArrowRight'){event.preventDefault();showImage(current+1);}});
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
}
const form=document.getElementById('search-form');
if(form){
 let indexPromise;const query=document.getElementById('query'),status=document.getElementById('search-status'),results=document.getElementById('search-results');
 const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('it');
 async function search(){
  const term=query.value.trim();results.replaceChildren();
  if(!term){status.textContent='Inserisci una parola per iniziare la ricerca.';return;}
  status.textContent='Ricerca in corso…';
  try{
   const offline=document.getElementById('offline-search-index');
   if(!indexPromise)indexPromise=offline?Promise.resolve(JSON.parse(offline.dataset.index)):fetch(base+'/search.json').then(r=>{if(!r.ok)throw Error();return r.json();});
   const index=await indexPromise;if(query.value.trim()!==term)return;
   const words=normalize(term).split(/\s+/).filter(Boolean);
   const matches=index.filter(item=>words.every(word=>normalize(item.title+' '+item.text).includes(word))).sort((a,b)=>Number(normalize(b.title).includes(normalize(term)))-Number(normalize(a.title).includes(normalize(term))));
   status.textContent=matches.length===1?'1 risultato':matches.length+' risultati';
   for(const item of matches){const a=document.createElement('a');a.href=item.url;a.className='search-result';const h=document.createElement('h2');h.textContent=item.title;const p=document.createElement('p');p.textContent=item.description||item.text.slice(0,200);a.append(h,p);results.append(a);}
  }catch{status.textContent='Impossibile caricare la ricerca. Riprova oppure usa il menu del sito.';indexPromise=null;}
 }
 form.addEventListener('submit',event=>{event.preventDefault();if(location.protocol!=='file:')history.replaceState(null,'',location.pathname+'?q='+encodeURIComponent(query.value));search();});
 query.value=new URLSearchParams(location.search).get('q')||'';if(query.value)search();
}
// Recover query-string Joomla links when GitHub serves index.php/ or the 404 page.
(async()=>{
 const params=new URLSearchParams(location.search);
 const pathname=decodeURIComponent(location.pathname);
 if(!pathname.includes('/index.php')&&!params.has('Itemid')&&!['com_content','com_menu'].includes(params.get('option')))return;
 try{
  const response=await fetch(base+'/legacy.json');if(!response.ok)return;const map=await response.json();
  const id=(params.get('id')||'').split(':')[0];
  const key=pathname.slice(base.length).replace(/\/$/,'')+'/';
  const target=(params.get('option')==='com_menu'?map.items[id]:map.articles[id])||map.items[params.get('Itemid')]||map.paths[key]||(key==='/index.php/'?'/':null);
  if(target&&base+target!==location.pathname)location.replace(base+target+location.hash);
 }catch{/* The visible navigation remains available. */}
})();
