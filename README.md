# Delegami — sito

Landing page di Delegami: collaborazione amministrativa per piccole imprese
edili in Ticino.

Stack: Next.js 16 (App Router) · TypeScript · Tailwind CSS 4. Nessun database,
nessuna API route — è una pagina statica.

## Sviluppo

```bash
npm install
npm run dev
```

## Sistema visivo

L'idea: il prodotto sono documenti, quindi la pagina è costruita come un
documento — carta, filetti da 1px, indice nel margine, cifre tabulari. Niente
card con ombre.

| Token | Valore | Uso |
|---|---|---|
| `paper` | `#FAF8F4` | fondo |
| `paper-deep` | `#EFEAE1` | blocchi secondari, testata del listino |
| `ink` | `#22201D` | testo, sezioni piene |
| `ink-soft` / `ink-faint` | `#6E675E` / `#9A9287` | testo secondario, etichette |
| `wine` | `#6B2637` | unico accento: sigillo, numerazione, CTA |
| `rule` | `#DCD5C9` | filetti, al posto dei bordi delle card |

Tipografia (self-hosted in `public/fonts`, licenza SIL OFL):

- **Newsreader** — titoli, domande, cifre grandi. Il corsivo è portante, non
  decorativo.
- **Archivo** — testo corrente e interfaccia.

La pagina è volutamente **solo chiara**: la carta è l'identità, invertirla
direbbe un'altra cosa. `color-scheme: light` è dichiarato in `globals.css`.

## Marchio

Una riga di margine più un sigillo: insieme formano una D. È dimensionato
sull'altezza delle maiuscole di Newsreader, così legge come la prima lettera
della parola e non come un'icona affiancata.

File in `brand/` (rigenerabili):

```bash
npm i --no-save playwright-core
node scripts/generate-logo.mjs
```

| File | Uso |
|---|---|
| `delegami-logo-orizzontale.svg` | vettoriale, font incorporato — uso principale |
| `delegami-logo-orizzontale.png` | 1640×480, fondo carta |
| `delegami-logo-scuro.png` | 1640×480, fondo scuro |
| `delegami-avatar.png` | 1024×1024 — profilo WhatsApp / Instagram |
| `delegami-marca.png` | 1024×1024, sfondo trasparente |

## Variabili d'ambiente

Da impostare su Vercel. Il sito funziona anche senza, con valori segnaposto.

| Variabile | Esempio | Note |
|---|---|---|
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `41791234567` | Solo cifre, con prefisso, senza `+`. **Da aggiornare appena la SIM è attiva.** |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `ciao@delegami.ch` | |

## Dove si cambiano i contenuti

- **Numeri e costanti commerciali** (prezzo di partenza, SLA, caso studio):
  `src/lib/site.ts`. Unico punto di verità — mai scrivere un numero dentro un
  componente.
- **Testi delle sezioni**: `src/components/*.tsx`, un file per sezione, nello
  stesso ordine in cui compaiono in `src/app/page.tsx`.

## Prima di andare online

1. Impostare `NEXT_PUBLIC_WHATSAPP_NUMBER` con il numero reale.
2. Collegare il dominio `delegami.ch` al progetto Vercel.
3. Rileggere la sezione prezzo: oggi mostra "a partire da CHF 490/mese".
   Va confermata dopo il rilevamento delle ore effettive per cliente.
