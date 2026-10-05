# Priorato delle Confraternite della Diocesi di Chiavari

Sito statico Eleventy ricostruito dai contenuti del precedente Joomla. Il progetto non include l'applicazione Joomla, il database, account, password o codice dei vecchi template.

## Per iniziare

1. Estrai completamente il pacchetto ZIP.
2. Apri `ANTEPRIMA.html` con un doppio clic per vedere il sito. L'anteprima non incrementa ShinyStat; i video si aprono su YouTube.
3. Segui la guida separata **GUIDA-PRIORATO.md / Guida-Priorato.pdf** per creare organizzazione, repository e pubblicazione.

Organizzazione prevista: `prioratoconfraternitechiavari` (disponibilità del nome da verificare su GitHub). Repository: `priorato-web`. Dominio: `www.prioratoconfraternitechiavari.it`.

## Comandi facoltativi

Con Node.js 22 o successivo:

```
npm install
npm run build
npm start
```

Per generare senza scaricare dipendenze: `npm run build:portable`.
Per il server locale: `npm run preview:portable`, poi apri `http://localhost:8080`.
Per rigenerare l'anteprima a doppio clic: `npm run preview:files`.

## Dove modificare

| Contenuto | File/cartella |
|---|---|
| Testi degli articoli | `content/articles/` |
| Titoli, percorsi e date | `content/articles.json` |
| Menu | `content/navigation.json` |
| Ordine fotografie delle gallerie | `content/galleries/` |
| Immagini e PDF | `src/images/` |
| Nome sito e account del contatore | `content/site.json` |
| Layout, testi comuni e informativa servizi | `src/_includes/site.cjs` |
| Aspetto | `src/assets/site.css` |
| Pubblicazione | workflow `Pubblica Priorato` |

La favicon pubblicata `src/favicon.ico` è identica al file originale `images/favicon.ico` dell'archivio, verificato mediante SHA-256.

## Pubblicazione

Le modifiche inviate al branch `main` avviano il workflow. GitHub Pages deve usare **Source: GitHub Actions**. Non serve creare un CNAME nel repository.

Variabili GitHub Actions da impostare solo al lancio: `SITE_INDEXABLE=true` e `SITE_COUNTER=true`. Il contatore funziona soltanto nella build per il dominio definitivo; la sua disponibilità e lo storico dipendono dall'account ShinyStat originale.

L'anteprima, l'output generato e le dipendenze sono esclusi dal caricamento Git. Il ZIP va estratto; i file del progetto vanno copiati nella cartella clonata, non caricati come ZIP su GitHub.

## Recupero e verifiche

Leggi `docs/RECUPERO.md` per inventario, limiti e correzioni. Il controllo della build verifica i collegamenti interni, la favicon, le copie originali dei media e l'assenza di codice Joomla nell'output.

I materiali storici restano dei rispettivi titolari. La pubblicazione del repository non assegna automaticamente una licenza libera a fotografie e testi.
