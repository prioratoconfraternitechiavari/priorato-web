'use strict';
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'../..');
const read=name=>JSON.parse(fs.readFileSync(path.join(ROOT,name),'utf8'));
const config=read('content/site.json'),A=read('content/articles.json'),N=read('content/navigation.json'),L=read('content/legacy.json');
const base=(process.env.SITE_PATH||'').replace(/\/$/,'');
if(base&&!/^\/[a-zA-Z0-9_/-]+$/.test(base))throw Error('SITE_PATH non valido');
const origin=(process.env.SITE_URL||'https://'+config.domain).replace(/\/$/,'');
if(!/^https?:\/\/[a-zA-Z0-9.:-]+$/.test(origin))throw Error('SITE_URL non valido');
const indexable=process.env.SITE_INDEXABLE==='true';
const counter=process.env.SITE_COUNTER==='true'&&config.counter.enabled&&new URL(origin).hostname===config.domain&&!base;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=s=>base+s;
const body=a=>fs.readFileSync(path.join(ROOT,'content/articles',a.file),'utf8');
const plain=s=>s.replace(/\[\[.*?\]\]/g,' ').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim();
const link=(href,title,current='',cls='')=>`<a href="${esc(url(href))}"${href===current?' aria-current="page"':''}${cls?` class="${cls}"`:''}>${esc(title)}</a>`;
function menu(current){
 return `<nav id="navigation" aria-label="Navigazione principale">${N.filter(n=>n.menutype==='mainmenu'&&n.parent_id===1).map(n=>{
  const children=N.filter(c=>c.parent_id===n.id);
  if(!children.length)return link(n.url,n.title,current);
  return `<details class="nav-group"><summary>${esc(n.title)}</summary><div class="dropdown">${link(n.url,'Esplora '+n.title,current)}${children.map(c=>link(c.url,c.title,current)).join('')}</div></details>`;
 }).join('')}${link('/cerca/','Cerca',current,'search-link')}</nav>`;
}
function breadcrumbs(current){
 if(current==='/')return '';
 const ancestors=N.filter(n=>n.url!=='/'&&current.startsWith(n.url)&&n.url!==current).sort((a,b)=>a.level-b.level);
 const seen=new Set();
 return `<nav class="breadcrumbs" aria-label="Percorso">${link('/','Home',current)}${ancestors.filter(n=>{if(seen.has(n.url))return false;seen.add(n.url);return true;}).map(n=>`<span aria-hidden="true">/</span>${link(n.url,n.title,current)}`).join('')}</nav>`;
}
function sidebar(current){
 const matching=N.filter(n=>current.startsWith(n.url)&&n.url!=='/'&&n.menutype==='mainmenu').sort((a,b)=>b.level-a.level);
 let parent=matching.find(n=>N.some(c=>c.parent_id===n.id));
 if(!parent&&matching[0])parent=N.find(n=>n.id===matching[0].parent_id);
 if(!parent)return '';
 const children=N.filter(n=>n.parent_id===parent.id);
 if(!children.length)return '';
 return `<aside class="sidebar"><p class="eyebrow">In questa sezione</p><h2>${link(parent.url,parent.title,current)}</h2><nav aria-label="Pagine della sezione">${children.map(n=>link(n.url,n.title,current)).join('')}</nav></aside>`;
}
function gallery(name){
 const images=read('content/galleries/'+name+'.json');
 return `<section class="gallery-block" aria-label="Galleria fotografica"><p class="muted">Seleziona una fotografia per ingrandirla.</p><div class="gallery">${images.map(im=>`<figure><a href="${esc(im.src)}" data-gallery="${esc(name)}"><img src="${esc(im.thumbnail)}" alt="${esc(im.caption)}" width="${im.width}" height="${im.height}" loading="lazy" decoding="async"></a></figure>`).join('')}</div></section>`;
}
function pdf(src,title='Documento PDF'){
 return `<section class="pdf-document"><p><a class="button" href="${esc(src)}" target="_blank" rel="noopener">Apri il documento PDF ↗</a></p><iframe src="${esc(src)}" title="${esc(title)}" loading="lazy"></iframe><p class="muted">Se il documento non appare, usa il collegamento qui sopra.</p></section>`;
}
function video(id){return `<span class="video" data-video-id="${id}"><span class="video-label">Filmato</span><button type="button" data-play="${id}"><span class="play-icon" aria-hidden="true">▶</span> Riproduci il video</button><span class="video-notice">Premendo Riproduci si carica il video da YouTube.</span><a class="video-external" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener">Apri su YouTube ↗</a></span>`;}
function articleBody(a){
 let html=body(a).replace(/<(p|div)(?:\s[^>]*)?>\s*(\[\[(?:gallery|pdf):[^\]]+\]\])\s*<\/\1>/g,'$2').replace(/\[\[gallery:([^\]]+)\]\]/g,(_,name)=>gallery(name)).replace(/<span data-video="([A-Za-z0-9_-]{11})"><\/span>/g,(_,id)=>video(id));
 if(a.id===61)html+=`<p class="muted">Locandina conservata sul sito esterno originale. <a href="https://imagecdn.spazioweb.it/72/f5/72f50717-e275-4feb-b03a-7acb0c809d73.jpg" target="_blank" rel="noopener">Apri la locandina ↗</a></p>`;
 return html.replace(/\b(href|src)="\/(?!\/)([^"<>]*)"/g,(_,attr,p)=>`${attr}="${base}/${p}"`);
}
function listing(parent,current){
 const seen=new Set();return `<div class="document-list">${N.filter(n=>n.parent_id===parent&&!seen.has(n.url)&&seen.add(n.url)).map(n=>`<a href="${url(n.url)}"><h2>${esc(n.title)}</h2><span aria-hidden="true">→</span></a>`).join('')}</div>`;
}
function privacy(){return `<article class="prose"><p>Questo sito raccoglie la storia, le attività e i documenti del Priorato delle Confraternite della Diocesi di Chiavari.</p><h2>Navigazione e ricerca</h2><p>Le pagine e i documenti sono ospitati su GitHub Pages. La ricerca viene eseguita nel tuo browser. Non sono presenti account o moduli di registrazione per i visitatori e non viene utilizzato Google Analytics.</p><h2>Contatore delle visite</h2><p>Il sito utilizza il servizio esterno ShinyStat con l’account storico PrioratoChiavar. Quando il contatore è attivo, il browser contatta ShinyStat per la rilevazione statistica e la visualizzazione del contatore. Impostazioni, dati raccolti e strumenti di esclusione sono descritti nelle informative del fornitore.</p><p><a href="https://www.shinystat.com/it/informativa_privacy_generale.html" target="_blank" rel="noopener">Informativa ShinyStat ↗</a> · <a href="https://www.shinystat.com/optout/optout.html" target="_blank" rel="noopener">Esclusione dalle rilevazioni ShinyStat ↗</a></p><h2>Video</h2><p>I video di YouTube si caricano solo quando premi «Riproduci». Da quel momento il browser si collega al servizio YouTube. Puoi anche aprire il filmato direttamente su YouTube.</p><h2>Immagini e collegamenti esterni</h2><p>La locandina del Raduno regionale 2023 proviene dal sito esterno che la ospitava originariamente. Aprendo collegamenti a siti esterni si applicano le condizioni e le informative dei rispettivi gestori.</p><h2>Contatti</h2><p>Per informazioni sui contenuti e sul sito: <a href="mailto:segretario@prioratoconfraternitechiavari.it">segretario@prioratoconfraternitechiavari.it</a>.</p></article>`;}
function layout({title,current,description='',content,aside='',home=false,redirect=''}){
 const showCounter=counter&&!redirect&&current!=='/404.html'&&current!=='/index.php/';
 const csp=`default-src 'self'; script-src 'self'${counter?" 'unsafe-inline' https://*.shinystat.com":''}; style-src 'self'${counter?" 'unsafe-inline'":''}; img-src 'self' data: https://imagecdn.spazioweb.it${counter?' https://*.shinystat.com':''}; frame-src 'self' https://www.youtube-nocookie.com; connect-src 'self'${counter?' https://*.shinystat.com':''}; object-src 'none'; base-uri 'self'; form-action 'self'`;
 const countHTML=showCounter?`<div class="counter" aria-label="Contatore ShinyStat"><p>Statistiche delle visite</p><script src="https://${config.counter.host}/cgi-bin/getcod.cgi?USER=${encodeURIComponent(config.counter.user)}&amp;PAG=${encodeURIComponent(title)}"></script><noscript data-counter><a href="https://www.shinystat.com/it/"><img src="https://www.shinystat.com/cgi-bin/shinystat.cgi?USER=${encodeURIComponent(config.counter.user)}&amp;PAG=${encodeURIComponent(title)}" alt="Contatore ShinyStat"></a></noscript></div>`:'';
 return `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | ${esc(config.name)}</title><meta name="description" content="${esc(description||'Storia, confraternite, raduni e appuntamenti della Diocesi di Chiavari.')}"><meta name="robots" content="${indexable&&!redirect&&current!=='/404.html'?'index,follow':'noindex,follow'}"><meta http-equiv="Content-Security-Policy" content="${esc(csp)}"><meta name="referrer" content="strict-origin-when-cross-origin"><link rel="canonical" href="${esc(origin+url(redirect||current))}">${redirect?`<meta http-equiv="refresh" content="0;url=${esc(url(redirect))}">`:''}<link rel="icon" type="image/x-icon" sizes="16x16" href="${url('/favicon.ico')}"><link rel="stylesheet" href="${url('/assets/site.css')}"><script src="${url('/assets/site.js')}" defer></script></head><body data-base="${esc(base)}"><a class="skip-link" href="#contenuto">Vai al contenuto</a>
 <header class="site-header"><div class="masthead"><a class="brand" href="${url('/')}"><img class="brand-emblem" src="${url('/images/iconadoppia.png')}" alt="" width="141" height="100"><span class="brand-copy"><span class="brand-kicker">Diocesi di Chiavari</span><span class="brand-name">Priorato delle Confraternite</span><span class="brand-caption">Fede, tradizione e comunità</span></span></a></div><div class="panorama"><img src="${url('/images/cristobianco.png')}" alt="Crocifisso processionale delle confraternite" width="1060" height="210" fetchpriority="high"></div><div class="nav-wrap"><button class="menu-toggle" type="button" aria-controls="navigation" aria-expanded="false">Menu <span aria-hidden="true">☰</span></button>${menu(current)}</div></header>
 <main id="contenuto" class="container${home?' home':''}">${breadcrumbs(current)}<div class="page-grid${aside?' has-sidebar':''}">${aside}<div class="page-content"><header class="page-heading"><p class="eyebrow">${home?'Un cammino condiviso':current.startsWith('/archivio/')?'L’archivio':'Priorato diocesano'}</p><h1>${esc(title)}</h1></header>${content}</div></div></main>
 <footer class="site-footer"><div><strong>Priorato delle Confraternite</strong><p>Diocesi di Chiavari · Regione Liguria</p><a href="mailto:segretario@prioratoconfraternitechiavari.it">Contatta la segreteria</a></div><nav aria-label="Collegamenti nel piè di pagina">${link('/archivio/','Archivio dei contenuti',current)}${link('/cerca/','Cerca nel sito',current)}${link('/cookies-ulteriori-informazioni/','Privacy e servizi esterni',current)}<a href="#contenuto">Torna in alto ↑</a></nav></footer>
 <dialog id="lightbox" aria-label="Visualizzatore immagini"><div class="lightbox-tools"><button type="button" data-prev aria-label="Fotografia precedente">←</button><button type="button" data-next aria-label="Fotografia successiva">→</button><button type="button" data-close>Chiudi ×</button></div><img id="full-image" alt=""></dialog>${countHTML}</body></html>`;
}
function entries(){
 const list=A.map(a=>({kind:'article',a,output:a.url==='/'?'index.html':a.url.slice(1)+'index.html'}));
 const occupied=new Set(list.map(e=>e.output));
 for(const n of N){const output=n.url.slice(1)+'index.html';if(!occupied.has(output)){list.push({kind:n.pdf?'pdf':'section',n,output});occupied.add(output);}}
 list.push({kind:'archive',output:'archivio/index.html'},{kind:'search',output:'cerca/index.html'},{kind:'404',output:'404.html'});
 for(const e of list)occupied.add(e.output);
 for(const [from,to] of Object.entries({...L.paths,'/index.php/':'/'})){const output=from.slice(1)+'index.html';if(!occupied.has(output)){list.push({kind:'redirect',from,to,output});occupied.add(output);}}
 for(const file of ['search.json','legacy.json','sitemap.xml','robots.txt','.nojekyll'])list.push({kind:file,output:file});
 return list;
}
function render(entry){
 if(entry.kind==='article'){
  const a=entry.a,home=a.id===2;
  let content=a.id===22?privacy():`<article class="prose${home?' home-intro':''}">${articleBody(a)}</article>`;
  if(home)content+=`<section class="home-section"><div class="section-heading"><p class="eyebrow">Vita delle confraternite</p><h2>Il nostro territorio, la nostra storia</h2></div><div class="feature-grid">${[{id:5,tag:'Le comunità',text:'Le confraternite della Diocesi, raccolte per vicariato.'},{id:6,tag:'Gli incontri',text:'Il calendario degli appuntamenti e delle celebrazioni.'},{id:4,tag:'Le radici',text:'La storia del Priorato e del suo cammino condiviso.'}].map(c=>{const item=A.find(a=>a.id===c.id);return `<a class="feature-card" href="${url(item.url)}"><span class="eyebrow">${c.tag}</span><h3>${esc(item.title)}</h3><p>${c.text}</p><span aria-hidden="true">→</span></a>`;}).join('')}</div></section>`;
  return layout({title:home?'Benvenuti':a.id===22?'Privacy e servizi esterni':a.title,current:a.url,description:a.description,content,home,aside:home?'':sidebar(a.url)});
 }
 if(entry.kind==='section')return layout({title:entry.n.title,current:entry.n.url,content:listing(entry.n.id,entry.n.url),aside:sidebar(entry.n.url)});
 if(entry.kind==='pdf')return layout({title:entry.n.title,current:entry.n.url,content:pdf(url(encodeURI(entry.n.pdf)),entry.n.title),aside:sidebar(entry.n.url)});
 if(entry.kind==='archive')return layout({title:'Archivio dei contenuti',current:'/archivio/',content:`<p class="intro">Le pagine, i documenti e gli appuntamenti conservati nel sito.</p><div class="document-list">${A.filter(a=>![2,22].includes(a.id)).sort((a,b)=>b.modified.localeCompare(a.modified)||a.title.localeCompare(b.title,'it')).map(a=>`<a href="${url(a.url)}"><h2>${esc(a.title)}</h2><span aria-hidden="true">→</span></a>`).join('')}</div>`});
 if(entry.kind==='search')return layout({title:'Cerca nel sito',current:'/cerca/',content:`<form id="search-form" role="search"><label for="query">Cerca una confraternita, un luogo o una parola nei testi</label><div class="search-box"><input id="query" name="q" type="search" autocomplete="off" placeholder="Ad esempio: Rapallo, statuto, raduno…"><button class="button" type="submit">Cerca</button></div></form><p id="search-status" role="status"></p><div id="search-results" class="document-list"></div><noscript><p>La ricerca richiede JavaScript. Puoi consultare ${link('/archivio/','l’archivio dei contenuti')}.</p></noscript>`});
 if(entry.kind==='404')return layout({title:'Pagina non trovata',current:'/404.html',content:`<div class="prose"><p>Il collegamento potrebbe appartenere alla precedente versione del sito.</p><p>${link('/cerca/','Cerca nel sito','/404.html','button')} oppure ${link('/','torna alla pagina iniziale')}.</p></div>`});
 if(entry.kind==='redirect')return layout({title:'Pagina trasferita',current:entry.from,redirect:entry.from==='/index.php/'?'':entry.to,content:`<p>La pagina è disponibile al nuovo indirizzo: ${link(entry.to,'continua')}.</p>`});
 if(entry.kind==='search.json')return JSON.stringify(A.map(a=>({title:a.id===22?'Privacy e servizi esterni':a.title,url:url(a.url),text:plain(a.id===22?privacy():body(a)),description:a.id===22?'Informazioni su navigazione, contatore e servizi esterni.':a.description})),null,2);
 if(entry.kind==='legacy.json')return JSON.stringify(L);
 if(entry.kind==='robots.txt')return indexable?`User-agent: *\nAllow: /\nSitemap: ${origin+url('/sitemap.xml')}\n`:'User-agent: *\nDisallow: /\n';
 if(entry.kind==='sitemap.xml')return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...new Set([...A.map(a=>a.url),...N.map(n=>n.url),'/archivio/','/cerca/'])].map(u=>`<url><loc>${esc(origin+url(u))}</loc></url>`).join('')}</urlset>`;
 return '';
}
module.exports={entries,render};
