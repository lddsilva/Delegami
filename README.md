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

## Variabili d'ambiente

Da impostare su Vercel (Project Settings → Environment Variables). Il sito
funziona anche senza, con dei valori segnaposto.

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
