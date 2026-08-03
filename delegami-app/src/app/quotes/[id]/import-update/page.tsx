import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getSession, canMutate } from '@/lib/auth'
import { getQuoteById } from '@/modules/quotes/queries'
import { QuoteUpdateImportClient } from '@/components/quotes/quote-update-import-client'

const UPDATE_INSTRUCTIONS = `Sei un assistente che aggiorna preventivi per un'impresa edile in Ticino.

L'utente ti darà:
1. Il JSON del preventivo corrente (esportato dall'app).
2. Le modifiche richieste (es. "togli la riga dei sanitari", "aggiungi 2 m² di gres", "cambia il margine al 28%").

Restituisci SOLO il JSON completo aggiornato, nello stesso schema. Non solo la parte cambiata. L'app sostituirà tutto.

REGOLE:
- "type": "HEADER" | "SECTION" | "ITEM" | "NOTE" | "SUBTOTAL".
- "unit" valide: "m²", "m³", "ml", "h", "pz", "kg", "t", "l", "set", "corpo".
- ITEM richiede "qty" e "unitCost" (costo nostro). Il margine viene applicato automaticamente.
- NOTE non hanno qty/prezzo; vengono sempre nascoste al cliente.
- "directPrice: true" se "unitPrice" è il prezzo finale cliente (salta margine).
- "hiddenFromClient: true" per nascondere la riga dal PDF cliente.
- "clientNotes", "paymentTerms", "validityDays": OMETTI per usare i default aziendali. Includili solo se servono valori specifici per questo preventivo.

Mantieni la struttura coerente (HEADER e SECTION dove servono) e non inventare prezzi: chiedi all'utente se non sei sicuro.`

const UPDATE_EXAMPLE = `{
  "kind": "quote",
  "marginPercent": 28,
  "taxRate": 8.1,
  "items": [
    { "type": "HEADER", "description": "RISTRUTTURAZIONE BAGNO 6 mq" },
    { "type": "SECTION", "description": "Demolizione" },
    { "type": "ITEM", "description": "Demolizione pavimento + rivestimenti", "qty": 6, "unit": "m²", "unitCost": 35 },
    { "type": "SECTION", "description": "Pavimenti" },
    { "type": "ITEM", "description": "Posa gres porcellanato", "qty": 8, "unit": "m²", "unitCost": 95 }
  ]
}`

export default async function QuoteImportUpdatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [quote, session] = await Promise.all([getQuoteById(id), getSession()])
  if (!quote) notFound()
  if (!session || !canMutate(session.role)) redirect(`/quotes/${id}`)

  const itemCount = quote.items.length
  const quoteLabel = `PRE-${quote.quoteNumber} v${quote.version}`

  return (
    <div className="page-form">
      <div className="mb-6">
        <Link href={`/quotes/${id}`} className="mb-3 flex items-center gap-1.5 text-body text-ink-muted transition-colors hover:text-ink">
          <ArrowLeft className="h-4 w-4" />
          {quoteLabel}
        </Link>
        <h1 className="text-title font-semibold text-ink sm:text-display">Aggiorna preventivo da chat IA</h1>
        <p className="mt-0.5 text-body text-ink-muted">
          Incolla il JSON aggiornato e scegli se sostituire la versione corrente o crearne una nuova.
        </p>
      </div>

      <QuoteUpdateImportClient
        quoteId={id}
        quoteLabel={quoteLabel}
        status={quote.status}
        itemCount={itemCount}
        instructions={UPDATE_INSTRUCTIONS}
        exampleJson={UPDATE_EXAMPLE}
      />
    </div>
  )
}
