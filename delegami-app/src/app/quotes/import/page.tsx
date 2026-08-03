import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getSession, canMutate } from '@/lib/auth'
import { getProjects } from '@/modules/projects/queries'
import { importQuoteFromJson } from '@/modules/quotes/actions'
import { JsonImportClient } from '@/components/imports/json-import-client'

const QUOTE_IMPORT_INSTRUCTIONS = `Sei un assistente che prepara preventivi per un'impresa edile in Ticino.
Lavori in italiano. Valuta in CHF. IVA 8.1%. Margine di default 25% (sovrascrivibile).

Quando l'utente descrive un cantiere, struttura la risposta come JSON valido conforme allo schema sotto.
Non aggiungere testo prima o dopo il JSON. Non inventare prezzi assurdi: cerca riferimenti reali (Hornbach.ch è la base).

REGOLE:
- "type" di ogni voce deve essere uno tra: "HEADER" (titolo grande del blocco), "SECTION" (titolo di fase), "ITEM" (riga fatturabile), "NOTE" (nota interna, mai mostrata al cliente), "SUBTOTAL".
- "unit" valide: "m²", "m³", "ml", "h", "pz", "kg", "t", "l", "set", "corpo".
- Le voci ITEM richiedono "qty" e "unitCost" (costo nostro). Il margine viene applicato automaticamente.
- Le voci NOTE non hanno qty/prezzo. Vengono salvate con hiddenFromClient = true automaticamente.
- "sourceUrl" e "sourceNote" sono opzionali ma molto utili per tracciare i prezzi.
- "directPrice: true" se vuoi che "unitPrice" sia usato come prezzo finale al cliente (saltando il margine).
- "hiddenFromClient: true" per nascondere la riga dal PDF cliente (oltre alle NOTE).
- "clientNotes", "paymentTerms" e "validityDays": OMETTI se vuoi i default aziendali (Direttore lavori / Incaricato / Responsabile sicurezza, condizioni di pagamento standard, validità 30 giorni). Includili SOLO se servono valori specifici per questo preventivo.

SCHEMA:
{
  "kind": "quote",
  "marginPercent": 25,           // facoltativo, default 25
  "taxRate": 8.1,                // facoltativo, default 8.1
  "validityDays": 30,            // facoltativo
  "clientNotes": "string",       // testo da mostrare al cliente
  "internalNotes": "string",     // testo interno
  "paymentTerms": "string",      // condizioni di pagamento (facoltativo)
  "items": [
    {
      "type": "HEADER",
      "description": "RISTRUTTURAZIONE BAGNO"
    },
    {
      "type": "SECTION",
      "description": "Sanitari"
    },
    {
      "type": "ITEM",
      "description": "WC sospeso bianco",
      "qty": 1,
      "unit": "pz",
      "unitCost": 280,
      "marginPercent": 25,
      "sourceUrl": "https://www.hornbach.ch/...",
      "sourceNote": "Hornbach articolo 1234567"
    },
    {
      "type": "NOTE",
      "description": "Verificare con il cliente la marca preferita."
    }
  ]
}

Quando hai finito, restituisci solo il JSON. L'utente lo incollerà nella pagina /quotes/import dell'app.`

const QUOTE_EXAMPLE_JSON = `{
  "kind": "quote",
  "marginPercent": 25,
  "taxRate": 8.1,
  "validityDays": 30,
  "clientNotes": "Lavori subordinati a sopralluogo. Validità 30 giorni.",
  "items": [
    { "type": "HEADER", "description": "RISTRUTTURAZIONE BAGNO 6 mq" },
    { "type": "SECTION", "description": "Demolizione" },
    {
      "type": "ITEM",
      "description": "Demolizione pavimento + rivestimenti",
      "qty": 6,
      "unit": "m²",
      "unitCost": 35
    },
    { "type": "SECTION", "description": "Sanitari" },
    {
      "type": "ITEM",
      "description": "WC sospeso bianco",
      "qty": 1,
      "unit": "pz",
      "unitCost": 280,
      "sourceUrl": "https://www.hornbach.ch/p/wc-sospeso-laufen-pro-bianco/10120956"
    },
    {
      "type": "NOTE",
      "description": "Marca da confermare con il cliente prima dell'ordine."
    }
  ]
}`

export default async function ImportQuotePage() {
  const session = await getSession()
  if (!session || !canMutate(session.role)) redirect('/quotes')

  const projects = await getProjects()

  return (
    <div className="page-form">
      <div className="mb-6">
        <Link href="/quotes" className="mb-3 flex items-center gap-1.5 text-body text-ink-muted transition-colors hover:text-ink">
          <ArrowLeft className="h-4 w-4" />
          Preventivi
        </Link>
        <h1 className="text-title font-semibold text-ink sm:text-display">Importa preventivo da chat IA</h1>
        <p className="mt-0.5 text-body text-ink-muted">
          Genera il preventivo con ChatGPT/Claude usando le istruzioni qui sotto, poi incolla il JSON.
        </p>
      </div>

      <JsonImportClient
        kind="quote"
        projects={projects.map((p) => ({
          id: p.id,
          name: p.name,
          clientName: p.client.name,
        }))}
        instructions={QUOTE_IMPORT_INSTRUCTIONS}
        exampleJson={QUOTE_EXAMPLE_JSON}
        importAction={importQuoteFromJson}
        redirectBase="/quotes"
      />
    </div>
  )
}
