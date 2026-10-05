'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const project = path.resolve(__dirname, '..');
const root = path.join(project, '_site');
const base = (process.env.SITE_PATH || '').replace(/\/$/, '');
const errors = [];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(f =>
    f.isDirectory()
      ? walk(path.join(dir, f.name))
      : [path.join(dir, f.name)]
  );
}

const files = walk(root);
const html = files.filter(f => f.endsWith('.html'));
const remote = new Set();

for (const file of html) {
  const content = fs.readFileSync(file, 'utf8');

  if (!content.includes('<html lang="it">')) {
    errors.push('Lingua: ' + file);
  }

  if (/\{loadposition|\[\[(?:gallery|pdf):/.test(content)) {
    errors.push('Modulo non convertito: ' + file);
  }

  if (
    /<script(?![^>]*\bsrc=)[^>]*>/i.test(content) ||
    /\son[a-z]+\s*=/i.test(content)
  ) {
    errors.push('Script inline: ' + file);
  }

  if (/hacked by|trenggalek|base64_decode|eval\s*\(/i.test(content)) {
    errors.push('Contenuto sospetto: ' + file);
  }

  if (/Apri l’immagine originale|<figcaption/i.test(content)) {
    errors.push('Didascalia galleria: ' + file);
  }

  for (const match of content.matchAll(/\b(?:href|src)="([^"<>]+)"/g)) {
    let value = match[1].replace(/&amp;/g, '&');

    if (value.startsWith('http')) {
      remote.add(value);
      continue;
    }

    if (!value.startsWith('/') || value.startsWith('//')) {
      continue;
    }

    if (base && !value.startsWith(base + '/')) {
      errors.push('Prefisso: ' + value);
      continue;
    }

    value = decodeURIComponent(
      value.slice(base.length).split(/[?#]/)[0]
    );

    let target = path.join(root, value);

    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
      target = path.join(target, 'index.html');
    }

    if (!fs.existsSync(target)) {
      errors.push(path.relative(root, file) + ' → ' + value);
    }
  }
}

for (const file of files) {
  if (/\.(?:php|sql|jpa|tar|exe|sh)$/i.test(file)) {
    errors.push('File non statico: ' + file);
  }
}

const articles = JSON.parse(
  fs.readFileSync(path.join(project, 'content/articles.json'), 'utf8')
);

const index = JSON.parse(
  fs.readFileSync(path.join(root, 'search.json'), 'utf8')
);

if (index.length !== articles.length) {
  errors.push('Indice incompleto');
}

for (const a of articles) {
  if (!fs.existsSync(path.join(root, a.url, 'index.html'))) {
    errors.push('Articolo assente: ' + a.id);
  }
}

/*
 * Il recovery report è opzionale.
 * Se esiste, vengono verificati gli hash SHA-256 dei file originali.
 * Se non esiste, il controllo viene semplicemente saltato.
 */
let originalFilesChecked = 0;

const reportPath = path.join(project, 'docs/recovery-report.json');

if (fs.existsSync(reportPath)) {
  const report = JSON.parse(
    fs.readFileSync(reportPath, 'utf8')
  );

  if (
    report.media_sha256 &&
    typeof report.media_sha256 === 'object'
  ) {
    for (const [file, hash] of Object.entries(report.media_sha256)) {
      const target = path.join(root, file);

      if (
        !fs.existsSync(target) ||
        crypto
          .createHash('sha256')
          .update(fs.readFileSync(target))
          .digest('hex') !== hash
      ) {
        errors.push('File originale alterato: ' + file);
      }

      originalFilesChecked++;
    }
  } else {
    errors.push(
      'Recovery report non valido: media_sha256 mancante'
    );
  }
}

const favicon = JSON.parse(
  fs.readFileSync(
    path.join(project, 'docs/favicon-verification.json'),
    'utf8'
  )
);

if (
  crypto
    .createHash('sha256')
    .update(fs.readFileSync(path.join(root, 'favicon.ico')))
    .digest('hex') !== favicon.sha256
) {
  errors.push('Favicon diversa dall’originale');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(
  `Verificati ${html.length} HTML, ` +
  `${articles.length} articoli, ` +
  `${originalFilesChecked} file originali, ` +
  `favicon e riferimenti interni; ` +
  `${files.length} file totali.`
);