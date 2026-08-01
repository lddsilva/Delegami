import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getProjectById } from '@/modules/projects/queries'
import { canMutate, getSession } from '@/lib/auth'
import { importShoppingListFromJson } from '@/modules/shopping-lists/actions'
import { AiJsonImportClient } from '@/components/projects/ai-json-import-client'

const INSTRUCTIONS = `Sei un assistente per Zanetti Soluzioni Edili.

Riceverai un file JSON esportato da Delegami con kind="shopping_list_ai_context".
Devi aiutare a creare o aggiornare una lista acquisti per una singola opera.

REGOLE:
- Restituisci SOLO JSON valido, senza testo prima o dopo.
- Usa kind="shopping_list".
- Usa items[] per ogni materiale/articolo da comprare.
- Se riconosci un fornitore nell'elenco ricevuto, usa supplierId. Altrimenti usa supplierName e lascia note chiare.
- Non inventare prezzi o URL: se li stimi, scrivilo in notes.
- Unita consigliate: pz, m², m³, ml, kg, t, l, h, set, corpo, sacco, scatola, confezione, rotolo, tubo, lastra, barattolo.
- Non duplicare articoli gia presenti nella lista corrente, a meno che sia necessario.

SCHEMA:
{
  "kind": "shopping_list",
  "notes": "string opzionale",
  "items": [
    {
      "description": "string",
      "qtyPlanned": 1,
      "unit": "pz",
      "supplierId": "id opzionale se presente nel contesto",
      "supplierName": "nome opzionale",
      "unitPriceEstimated": 0,
      "sourceUrl": "url opzionale",
      "notes": "string opzionale"
    }
  ]
}`

const EXAMPLE = `{
  "kind": "shopping_list",
  "notes": "Materiali principali per avvio cantiere",
  "items": [
    {
      "description": "Colla C2 per piastrelle",
      "qtyPlanned": 5,
      "unit": "sacco",
      "supplierName": "Bauhaus Lugano",
      "unitPriceEstimated": 28.5,
      "notes": "Verificare disponibilita prima del ritiro"
    }
  ]
}`

export default async function ImportShoppingListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [project, session] = await Promise.all([getProjectById(id), getSession()])
  if (!project) notFound()
  if (!session || !canMutate(session.role)) redirect(`/projects/${id}/shopping-list`)

  return (
    <div className="page-form">
      <div className="mb-6">
        <Link href={`/projects/${id}/shopping-list`} className="mb-3 flex items-center gap-1.5 text-body text-ink-muted transition-colors hover:text-ink">
          <ArrowLeft className="h-4 w-4" />
          Lista acquisti
        </Link>
        <h1 className="text-title font-semibold text-ink sm:text-display">Importa lista acquisti da IA</h1>
        <p className="mt-0.5 text-body text-ink-muted">{project.client.name} · {project.name}</p>
      </div>

      <AiJsonImportClient
        projectId={id}
        instructions={INSTRUCTIONS}
        exampleJson={EXAMPLE}
        redirectPath={`/projects/${id}/shopping-list`}
        importAction={importShoppingListFromJson}
        labels={{
          title: 'Importa lista acquisti',
          jsonLabel: 'JSON lista acquisti',
          submit: 'Importa lista',
        }}
      />
    </div>
  )
}
