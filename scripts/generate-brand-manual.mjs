/**
 * Builds brand/manuale-marca.html — the brand manual, self-contained.
 *   node scripts/generate-brand-manual.mjs
 *
 * The document is set in the brand it documents: same palette, same face, same
 * shapes. A brand manual that looks like a generic template teaches nothing.
 */
import fs from 'fs'

const OUT = new URL('../brand/manuale-marca.html', import.meta.url).pathname
const FONT = new URL('../public/fonts/PlusJakartaSans.woff2', import.meta.url).pathname
const FONT_SRC = `url(data:font/woff2;base64,${fs.readFileSync(FONT).toString('base64')}) format('woff2-variations')`

const NAVY = '#143A56', NAVY_DEEP = '#0E2A3F', MINT = '#2ACAAB', MINT_DEEP = '#1FA98D'
const OFF = '#F5F7F8', SLATE = '#647786', SLATE_INK = '#566B7C', LINE = '#E2E9EE'

const mark = (shell, seal, tick, s, simple = false) =>
  `<svg viewBox="0 0 64 64" width="${s}" height="${s}" style="display:block"><path d="M14 10H34a22 22 0 0 1 0 44H14Z" fill="${shell}"/><path d="M24 20h10a12 12 0 0 1 0 24H24Z" fill="${seal}"/>${simple ? '' : `<path d="M28.5 32.5 32 36l7.5-8.5" fill="none" stroke="${tick}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`}</svg>`

const lockup = (inkColor, sealColor, tickColor, size = 46) => `
  <span style="display:flex;align-items:center;gap:${size * 0.24}px">
    ${mark(inkColor, sealColor, tickColor, size)}
    <span style="font-weight:800;font-size:${size * 0.52}px;letter-spacing:.02em;color:${inkColor}">DELEGAMI</span>
  </span>`

const swatch = (name, hex, note, ink = '#fff') => `
  <div class="sw">
    <div class="chip" style="background:${hex};color:${ink}">${hex}</div>
    <p class="sw-n">${name}</p>
    <p class="sw-d">${note}</p>
  </div>`

const html = `<style>
@font-face{font-family:PJ;src:${FONT_SRC};font-weight:300 800;font-display:swap}
:root{color-scheme:light}
*{box-sizing:border-box}
body{margin:0;background:#fff;color:${NAVY};font-family:PJ,ui-sans-serif,system-ui,sans-serif;
     font-size:16px;line-height:1.6;-webkit-font-smoothing:antialiased}
.wrap{max-width:1000px;margin:0 auto;padding:0 24px}
h1,h2,h3{font-weight:800;letter-spacing:-.028em;line-height:1.08;text-wrap:balance;margin:0}
h2{font-size:clamp(1.7rem,3.4vw,2.4rem);margin-top:0}
h3{font-size:1.15rem;margin:0 0 8px}
p{margin:0 0 14px;max-width:66ch}
.muted{color:${SLATE_INK}}
.eyebrow{font-size:.7rem;font-weight:800;letter-spacing:.17em;text-transform:uppercase;color:${MINT_DEEP};margin:0 0 14px}
section{padding:64px 0;border-top:1px solid ${LINE}}
section:first-of-type{border-top:0}
.hero{background:${NAVY};color:#fff;padding:76px 0 84px;position:relative;overflow:hidden}
.hero .glow{position:absolute;top:-240px;right:-160px;width:640px;height:640px;border-radius:50%;
            background:${MINT};opacity:.15;filter:blur(80px)}
.hero-in{position:relative;z-index:2}
.grid{display:grid;gap:20px}
.g2{grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
.g3{grid-template-columns:repeat(auto-fit,minmax(190px,1fr))}
.g4{grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}
.card{border:1px solid ${LINE};border-radius:16px;padding:26px;background:#fff}
.card.off{background:${OFF}}
.sw .chip{height:104px;border-radius:12px;display:flex;align-items:flex-end;padding:12px;
          font-weight:700;font-size:.82rem;font-variant-numeric:tabular-nums}
.sw-n{font-weight:800;margin:12px 0 2px;font-size:.95rem}
.sw-d{color:${SLATE_INK};font-size:.84rem;margin:0;line-height:1.45}
.stage{border:1px solid ${LINE};border-radius:16px;padding:34px;display:flex;align-items:center;
       justify-content:center;min-height:150px}
.stage.dark{background:${NAVY};border-color:${NAVY}}
.stage.mint{background:${MINT};border-color:${MINT}}
.stage.off{background:${OFF}}
table{border-collapse:collapse;width:100%;font-size:.92rem}
th,td{text-align:left;padding:12px 14px;border-bottom:1px solid ${LINE};vertical-align:top}
th{font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:${SLATE};font-weight:800}
td.num{font-variant-numeric:tabular-nums;white-space:nowrap;font-weight:700}
.rule{display:inline-block;width:44px;height:4px;border-radius:99px;background:${MINT};margin-bottom:18px}
.do,.dont{border-radius:14px;padding:20px 22px;font-size:.94rem}
.do{background:#E3F7F1;border:1px solid #A4E6D7}
.dont{background:${OFF};border:1px solid ${LINE};color:${SLATE_INK}}
.tag{display:inline-block;font-size:.68rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;
     padding:5px 11px;border-radius:99px;margin-bottom:12px}
.tag.ok{background:${MINT};color:${NAVY}}
.tag.no{background:${LINE};color:${SLATE}}
.spec{font-weight:800;letter-spacing:-.03em;line-height:1.05;margin:0}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.86em;background:${OFF};
     padding:2px 6px;border-radius:5px}
.footer{background:${NAVY_DEEP};color:rgba(255,255,255,.62);padding:44px 0;font-size:.9rem}
@media(max-width:640px){.stage{padding:22px}section{padding:44px 0}}
</style>

<div class="hero">
  <div class="glow"></div>
  <div class="wrap hero-in">
    ${lockup('#F5F7F8', MINT, NAVY, 54)}
    <h1 style="font-size:clamp(2.2rem,5.4vw,3.6rem);margin-top:44px;max-width:18ch">
      Manuale di marca
    </h1>
    <p style="color:rgba(255,255,255,.72);font-size:1.1rem;margin-top:18px;max-width:52ch">
      Come Delegami si presenta: il marchio, i colori, il carattere e il modo di
      parlare. Chi applica il marchio dovrebbe poter decidere leggendo solo questo.
    </p>
  </div>
</div>

<div class="wrap">

<section>
  <span class="rule"></span>
  <p class="eyebrow">Posizionamento</p>
  <h2>Vendiamo il lavoro fatto, non un software</h2>
  <p class="muted">Il software è compreso, ma non è il prodotto: è l'attrezzo. Il prodotto
  è che l'amministrazione sparisce dalla testa dell'imprenditore. Ogni scelta visiva
  serve questa idea — un marchio che sembra un gestionale venderebbe la cosa sbagliata.</p>
  <div class="grid g2" style="margin-top:28px">
    <div class="card off">
      <h3>La promessa</h3>
      <p class="muted" style="margin:0">Tu costruisci. Delegami il resto.</p>
    </div>
    <div class="card off">
      <h3>A chi parliamo</h3>
      <p class="muted" style="margin:0">Imprese edili di 1–10 persone in Ticino, dove il
      titolare è in cantiere tutti i giorni. Si lavora in italiano.</p>
    </div>
  </div>
</section>

<section>
  <span class="rule"></span>
  <p class="eyebrow">Marchio</p>
  <h2>Una D con un segno di spunta dentro</h2>
  <p class="muted">La lettera dice chi. Il segno di spunta dice cosa è successo alle tue
  scartoffie. Sono due informazioni in una forma sola, ed è il motivo per cui il marchio
  non è una lettera qualunque.</p>

  <div class="grid g3" style="margin-top:30px">
    <div><div class="stage">${mark(NAVY, MINT, NAVY, 108)}</div><p class="sw-d" style="margin-top:10px">Positivo · su chiaro</p></div>
    <div><div class="stage dark">${mark(OFF, MINT, NAVY, 108)}</div><p class="sw-d" style="margin-top:10px">Negativo · su navy</p></div>
    <div><div class="stage mint">${mark(NAVY, '#FFFFFF', NAVY, 108)}</div><p class="sw-d" style="margin-top:10px">Su menta</p></div>
  </div>

  <div class="grid g2" style="margin-top:30px">
    <div><div class="stage off">${lockup(NAVY, MINT, NAVY, 54)}</div><p class="sw-d" style="margin-top:10px">Lockup orizzontale — uso principale</p></div>
    <div><div class="stage dark">${lockup('#F5F7F8', MINT, NAVY, 54)}</div><p class="sw-d" style="margin-top:10px">Lockup su fondo scuro</p></div>
  </div>

  <div class="grid g2" style="margin-top:34px">
    <div class="do">
      <span class="tag ok">Regola</span>
      <h3>Sotto i 32 px, togli il segno di spunta</h3>
      <p style="margin:0">A dimensioni piccole il segno si impasta e diventa una macchia.
      Esiste una versione semplificata senza spunta: è quella della favicon e delle icone.</p>
      <div style="display:flex;gap:22px;align-items:flex-end;margin-top:18px">
        ${mark(NAVY, MINT, NAVY, 44)}${mark(NAVY, MINT, NAVY, 24, true)}${mark(NAVY, MINT, NAVY, 16, true)}
      </div>
    </div>
    <div class="dont">
      <span class="tag no">Da non fare</span>
      <h3>Cosa rompe il marchio</h3>
      <p style="margin:0">Non ruotarlo. Non allungarlo. Non cambiargli i colori. Non
      metterlo su una fotografia senza un fondo pieno sotto. Non affiancarlo a un altro
      marchio senza almeno l'altezza della D come spazio libero.</p>
    </div>
  </div>
</section>

<section>
  <span class="rule"></span>
  <p class="eyebrow">Colore</p>
  <h2>Navy per il testo, menta per riempire</h2>
  <p class="muted">Questa non è una preferenza estetica: è una regola di leggibilità.
  Il menta su bianco ha un contrasto di 2,1:1 — sotto qualsiasi soglia accessibile.
  <strong>Il menta non può mai portare testo su fondo chiaro.</strong> Sul menta si scrive
  in navy; il menta come colore di testo è ammesso solo sul navy.</p>

  <div class="grid g4" style="margin-top:30px">
    ${swatch('Navy', NAVY, 'Testo, superfici piene, marchio')}
    ${swatch('Navy profondo', NAVY_DEEP, 'Hover, footer')}
    ${swatch('Menta', MINT, 'Riempimenti, accenti, pulsanti', NAVY)}
    ${swatch('Menta scuro', MINT_DEEP, 'Menta come testo su chiaro')}
    ${swatch('Off-white', OFF, 'Fondo delle sezioni', NAVY)}
    ${swatch('Grigio', SLATE, 'Icone, divisori — mai testo corrente')}
    ${swatch('Grigio testo', SLATE_INK, 'Testo secondario, 5,0:1')}
    ${swatch('Filetto', LINE, 'Bordi, tabelle', NAVY)}
  </div>

  <table style="margin-top:34px">
    <thead><tr><th>Combinazione</th><th>Contrasto</th><th>Uso</th></tr></thead>
    <tbody>
      <tr><td>Navy su bianco</td><td class="num">12,6:1</td><td>Testo principale</td></tr>
      <tr><td>Grigio testo su off-white</td><td class="num">5,0:1</td><td>Testo secondario</td></tr>
      <tr><td>Menta su navy</td><td class="num">5,7:1</td><td>Accento sui fondi scuri</td></tr>
      <tr><td>Navy su menta</td><td class="num">5,7:1</td><td>Testo dentro i pulsanti menta</td></tr>
      <tr><td style="color:${SLATE}">Menta su bianco</td><td class="num" style="color:#B32D1F">2,1:1</td><td style="color:#B32D1F">Vietato per il testo</td></tr>
    </tbody>
  </table>
</section>

<section>
  <span class="rule"></span>
  <p class="eyebrow">Carattere</p>
  <h2>Plus Jakarta Sans, e nient'altro</h2>
  <p class="muted">Una famiglia sola. La gerarchia la fa il peso, non un secondo carattere:
  è più difficile da sbagliare e invecchia meglio. Licenza SIL Open Font, quindi si può
  incorporare ovunque — sito, app, documenti, PDF.</p>

  <div class="grid g2" style="margin-top:30px">
    <div class="card">
      <p class="sw-d">Titoli · 800 · tracking −0,03em</p>
      <p class="spec" style="font-size:2.6rem;margin-top:10px">Tu costruisci.</p>
    </div>
    <div class="card">
      <p class="sw-d">Occhiello · 700 · maiuscolo · tracking 0,17em</p>
      <p style="font-weight:800;letter-spacing:.17em;text-transform:uppercase;font-size:.78rem;margin-top:14px;color:${MINT_DEEP}">Collaborazione amministrativa</p>
      <p class="sw-d" style="margin-top:22px">Testo corrente · 400/500 · interlinea 1,6</p>
      <p style="margin:6px 0 0">Preventivi, fatture, spese e ore degli operai.</p>
    </div>
  </div>
  <p class="muted" style="margin-top:22px">Le cifre in colonna — importi, ore, date —
  vanno sempre in <code>font-variant-numeric: tabular-nums</code>, altrimenti le colonne
  ballano e un documento contabile perde credibilità.</p>
</section>

<section>
  <span class="rule"></span>
  <p class="eyebrow">Tono di voce</p>
  <h2>Concreto, diretto, mai commerciale</h2>
  <p class="muted">Parliamo a chi ha passato dieci ore in cantiere. Frasi corte, esempi
  reali, cifre vere. Nessun superlativo e nessuna promessa che non possiamo mettere per
  iscritto.</p>

  <div class="grid g2" style="margin-top:28px">
    <div class="do">
      <span class="tag ok">Così</span>
      <p style="margin:0 0 10px">«Ogni venerdì gli scontrini te li chiediamo noi.»</p>
      <p style="margin:0 0 10px">«Risposta entro 4 ore lavorative.»</p>
      <p style="margin:0">«Non facciamo dichiarazioni fiscali. È il lavoro del tuo fiduciario.»</p>
    </div>
    <div class="dont">
      <span class="tag no">Non così</span>
      <p style="margin:0 0 10px">«Soluzioni innovative a 360° per il tuo business.»</p>
      <p style="margin:0 0 10px">«Il nostro team di esperti è sempre al tuo fianco.»</p>
      <p style="margin:0">«Risparmia tempo e denaro con la digitalizzazione!»</p>
    </div>
  </div>

  <div class="card off" style="margin-top:26px">
    <h3>Due regole che non si negoziano</h3>
    <p class="muted" style="margin:0 0 10px"><strong>Non dichiariamo di essere in tanti.</strong>
    Siamo una struttura piccola e lo diciamo: per un artigiano è un pregio, e in un
    cantone piccolo una bugia si verifica con una telefonata.</p>
    <p class="muted" style="margin:0"><strong>Numeri solo se veri.</strong> Il caso di
    riferimento si cita in forma anonima con le cifre reali. Mai testimonianze inventate.</p>
  </div>
</section>

<section>
  <span class="rule"></span>
  <p class="eyebrow">Applicazioni</p>
  <h2>Come si vede la marca fuori dal sito</h2>
  <div class="grid g2" style="margin-top:26px">
    <div class="card">
      <h3>Instagram</h3>
      <p class="muted" style="margin:0">Cinque impaginati, non venti disegni diversi.
      Il colore porta il tema: navy per le verità scomode, chiaro per domande e obiezioni,
      menta per gli inviti. Mai due post navy di fila nel feed.</p>
    </div>
    <div class="card">
      <h3>App e documenti</h3>
      <p class="muted" style="margin:0">Stessa palette e stesso carattere: chi apre
      l'app dopo aver visto il sito deve riconoscere lo stesso posto. I PDF usano una
      variante opaca dei colori, perché la stampa non gestisce le trasparenze.</p>
    </div>
  </div>
</section>

<section>
  <span class="rule"></span>
  <p class="eyebrow">File</p>
  <h2>Dove sta tutto</h2>
  <table style="margin-top:22px">
    <thead><tr><th>File</th><th>Uso</th></tr></thead>
    <tbody>
      <tr><td><code>brand/delegami-logo.svg</code></td><td>Vettoriale con carattere incorporato — uso principale</td></tr>
      <tr><td><code>brand/delegami-logo.png</code></td><td>1960×520, fondo chiaro</td></tr>
      <tr><td><code>brand/delegami-logo-scuro.png</code></td><td>1960×520, fondo navy</td></tr>
      <tr><td><code>brand/delegami-logo-mono.png</code></td><td>Monocromatico, per stampa a un colore</td></tr>
      <tr><td><code>brand/delegami-avatar.png</code></td><td>960×960 — profilo WhatsApp e Instagram</td></tr>
      <tr><td><code>brand/delegami-icona-piccola.png</code></td><td>Versione senza spunta, per usi sotto i 32 px</td></tr>
      <tr><td><code>brand/social/</code></td><td>20 post 1080×1080 + <code>POSTS.md</code> con le didascalie</td></tr>
      <tr><td><code>public/fonts/</code></td><td>Plus Jakarta Sans (SIL OFL)</td></tr>
      <tr><td><code>src/app/globals.css</code></td><td>I colori come token, sul sito</td></tr>
    </tbody>
  </table>
  <p class="muted" style="margin-top:20px">Per rigenerare marchio e post:
  <code>node scripts/generate-brand.mjs</code> e <code>node scripts/generate-social.mjs</code>.</p>
</section>

</div>

<div class="footer">
  <div class="wrap">
    ${lockup('#F5F7F8', MINT, NAVY_DEEP, 38)}
    <p style="margin-top:20px;max-width:56ch">Delegami · Collaborazione amministrativa per
    piccole imprese edili · Cantone Ticino</p>
  </div>
</div>`

fs.writeFileSync(OUT, html)
console.log('manuale-marca.html', Math.round(fs.statSync(OUT).size / 1024) + 'KB')
