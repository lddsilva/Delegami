import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getProjectById } from '@/modules/projects/queries'
import { canMutate, getSession } from '@/lib/auth'
import { importScheduleFromJson } from '@/modules/schedules/actions'
import { AiJsonImportClient } from '@/components/projects/ai-json-import-client'

const INSTRUCTIONS = `Sei un assistente per Delegami.

Riceverai un file JSON esportato da Delegami con kind="schedule_ai_context".
Devi aiutare a creare o aggiornare il cronograma lavori di una singola opera.

REGOLE:
- Restituisci SOLO JSON valido, senza testo prima o dopo.
- Usa kind="project_schedule".
- Usa phases[] per le sezioni/fasi principali.
- Dentro ogni fase usa tasks[] per le attivita o item operativi.
- Ogni fase deve avere name. startDate/endDate sono consigliati in formato YYYY-MM-DD.
- Ogni task deve avere name e puo avere startDate/endDate.
- Se non sei sicuro di una data, lascia il campo vuoto o spiega in notes.
- Non usare dipendenze, risorse o campi non previsti nello schema.

SCHEMA:
{
  "kind": "project_schedule",
  "notes": "string opzionale",
  "phases": [
    {
      "name": "Demolizioni",
      "startDate": "2026-06-03",
      "endDate": "2026-06-07",
      "color": "#2563eb",
      "notes": "string opzionale",
      "tasks": [
        {
          "name": "Protezione parti comuni",
          "startDate": "2026-06-03",
          "endDate": "2026-06-03",
          "notes": "string opzionale"
        }
      ]
    }
  ]
}`

const EXAMPLE = `{
  "kind": "project_schedule",
  "notes": "Cronograma iniziale generato dal preventivo",
  "phases": [
    {
      "name": "Preparazione e protezioni",
      "startDate": "2026-06-03",
      "endDate": "2026-06-05",
      "color": "#2563eb",
      "tasks": [
        {
          "name": "Protezione ascensore e parti comuni",
          "startDate": "2026-06-03",
          "endDate": "2026-06-03",
          "notes": "Da completare prima delle demolizioni"
        }
      ]
    }
  ]
}`

export default async function ImportSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [project, session] = await Promise.all([getProjectById(id), getSession()])
  if (!project) notFound()
  if (!session || !canMutate(session.role)) redirect(`/projects/${id}/schedule`)

  return (
    <div className="page-form">
      <div className="mb-6">
        <Link href={`/projects/${id}/schedule`} className="mb-3 flex items-center gap-1.5 text-body text-ink-muted transition-colors hover:text-ink">
          <ArrowLeft className="h-4 w-4" />
          Cronograma
        </Link>
        <h1 className="text-title font-semibold text-ink sm:text-display">Importa cronograma da IA</h1>
        <p className="mt-0.5 text-body text-ink-muted">{project.client.name} · {project.name}</p>
      </div>

      <AiJsonImportClient
        projectId={id}
        instructions={INSTRUCTIONS}
        exampleJson={EXAMPLE}
        redirectPath={`/projects/${id}/schedule`}
        importAction={importScheduleFromJson}
        labels={{
          title: 'Importa cronograma',
          jsonLabel: 'JSON cronograma',
          submit: 'Importa cronograma',
        }}
      />
    </div>
  )
}
