import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getSession, canMutate } from '@/lib/auth'
import { getProjects } from '@/modules/projects/queries'
import { importInvoiceFromJson } from '@/modules/invoices/actions'
import { JsonImportClient } from '@/components/imports/json-import-client'

const INVOICE_IMPORT_INSTRUCTIONS = `Sei un assistente che prepara fatture per un'impresa edile in Ticino.
Lavori in italiano. Valuta in CHF. IVA 8.1%.

Quando l'utente descrive cosa fatturare, struttura la risposta come JSON valido conforme allo schema sotto.
Non aggiungere testo prima o dopo il JSON.

REGOLE:
- Le voci hanno "description", "qty", "unit" (facoltativo), "unitPrice".
- "unitPrice" è il prezzo finale IVA esclusa che apparirà in fattura (è già il prezzo cliente — niente margine).
- "issueDate" e "dueDate" in formato "YYYY-MM-DD". Se omessi, l'app userà oggi + scadenza di default.
- "notes" facoltative (es. "Lavori secondo preventivo PRE-2026-013 v8").

SCHEMA:
{
  "kind": "invoice",
  "issueDate": "2026-05-26",     // facoltativo
  "dueDate": "2026-06-26",       // facoltativo
  "taxRate": 8.1,                // facoltativo
  "notes": "string",             // facoltativo
  "items": [
    {
      "description": "Lavori di ristrutturazione bagno — saldo",
      "qty": 1,
      "unit": "corpo",
      "unitPrice": 8500
    }
  ]
}

Quando hai finito, restituisci solo il JSON. L'utente lo incollerà nella pagina /invoices/import dell'app.`

const INVOICE_EXAMPLE_JSON = `{
  "kind": "invoice",
  "issueDate": "2026-05-26",
  "dueDate": "2026-06-10",
  "taxRate": 8.1,
  "notes": "Lavori secondo preventivo PRE-2026-013 v8.",
  "items": [
    {
      "description": "Demolizione e smaltimento",
      "qty": 1,
      "unit": "corpo",
      "unitPrice": 1800
    },
    {
      "description": "Posa pavimento in gres",
      "qty": 6,
      "unit": "m²",
      "unitPrice": 120
    }
  ]
}`

export default async function ImportInvoicePage() {
  const session = await getSession()
  if (!session || !canMutate(session.role)) redirect('/invoices')

  const projects = await getProjects()

  return (
    <div className="page-form">
      <div className="mb-6">
        <Link href="/invoices" className="mb-3 flex items-center gap-1.5 text-body text-ink-muted transition-colors hover:text-ink">
          <ArrowLeft className="h-4 w-4" />
          Fatture
        </Link>
        <h1 className="text-title font-semibold text-ink sm:text-display">Importa fattura da chat IA</h1>
        <p className="mt-0.5 text-body text-ink-muted">
          Genera la fattura con ChatGPT/Claude usando le istruzioni qui sotto, poi incolla il JSON.
        </p>
      </div>

      <JsonImportClient
        kind="invoice"
        projects={projects.map((p) => ({
          id: p.id,
          name: p.name,
          clientName: p.client.name,
        }))}
        instructions={INVOICE_IMPORT_INSTRUCTIONS}
        exampleJson={INVOICE_EXAMPLE_JSON}
        importAction={importInvoiceFromJson}
        redirectBase="/invoices"
      />
    </div>
  )
}
