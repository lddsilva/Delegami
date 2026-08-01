import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getSession, canMutate } from '@/lib/auth'
import { getProjects } from '@/modules/projects/queries'
import { importReportFromJson } from '@/modules/custom-reports/actions'
import { ReportImportClient } from '@/components/custom-reports/report-import-client'

const REPORT_IMPORT_INSTRUCTIONS = `Sei un assistente che prepara relatori tecnici/analitici per Zanetti Soluzioni Edili.

Il contenuto dei blocchi (titoli, paragrafi, righe di tabella, ecc.) può essere in qualsiasi lingua — italiano per relatori cliente, portoghese per uso interno, ecc. Stessa cosa per la valuta: CHF, EUR, BRL o nessuna, a seconda del contesto. Le chiavi dello schema JSON restano in inglese come specificato.

Quando l'utente descrive un relatorio (analisi tecnica, breakdown finanziario, riepilogo di obra, documento per cliente, nota interna, ecc.), struttura la risposta come JSON valido conforme allo schema sotto.

Non aggiungere testo prima o dopo il JSON. Rispondi SOLO col JSON.

SCHEMA TOP-LEVEL:
{
  "kind": "report",
  "title": "string (obbligatorio)",
  "description": "string (facoltativo) — breve sommario mostrato in cima al PDF e nella lista /relatori",
  "type": "eletrico" | "hidraulico" | "strutturale" | "termico" | "altro" (facoltativo, default: altro),
  "quoteId": "string (facoltativo) — id del preventivo collegato, se applicabile",
  "blocks": [ /* array di blocchi, ordinati */ ]
}

TIPI DI BLOCCO DISPONIBILI:

1. heading — titolo di sezione
   { "type": "heading", "level": 1 | 2 | 3, "text": "..." }
   level 1 = grande con bordo blu, 2 = medio, 3 = piccolo. Default 1.

2. paragraph — testo libero (supporta a capo con \\n)
   { "type": "paragraph", "text": "..." }

3. list — elenco puntato o numerato
   { "type": "list", "ordered": true | false, "items": ["...", "..."] }

4. table — tabella con header e righe
   {
     "type": "table",
     "title": "..." (facoltativo),
     "columns": ["Col 1", "Col 2", "Col 3"],
     "rows": [ ["a", "b", "c"], ["d", "e", "f"] ],
     "align": ["left", "right", "center"] (facoltativo, una entry per colonna)
   }
   Le celle accettano stringhe o numeri.

5. callout — riquadro colorato per evidenziare un'informazione
   { "type": "callout", "variant": "info" | "warning" | "success" | "danger", "title": "..." (facoltativo), "text": "..." }

6. diagram — testo monospace (ascii art, alberi, schemi)
   { "type": "diagram", "text": "Root\\n ├─ Figlio A\\n └─ Figlio B" }

7. keyValue — griglia di etichetta/valore per KPI o riepiloghi
   { "type": "keyValue", "items": [ { "label": "Potenza picco", "value": "9.7 kW" } ] }

8. divider — riga orizzontale
   { "type": "divider" }

LINEE GUIDA:
- Inizia di solito con un heading di livello 1 col titolo principale, e un paragraph di sintesi.
- Usa keyValue per i dati numerici riassuntivi (KPI, totali).
- Usa table per dati strutturati comparativi.
- Usa callout per evidenziare AVVERTENZE, conclusioni o disclaimer.
- Usa diagram per schemi semplici ASCII.
- Non inserire HTML né markdown nei testi: solo testo piano. Per andare a capo nei paragrafi usa \\n.
- Mantieni i blocchi atomici: ogni heading separa una sezione logica.

L'utente incollerà il JSON in /relatori/import dell'app. La selezione dell'opera (projectId) avviene nell'app, non nel JSON.`

const REPORT_EXAMPLE_JSON = `{
  "kind": "report",
  "title": "Analisi impianto elettrico — Bagno nuovo",
  "description": "Calcolo carichi, lista materiali e checklist di posa per il bagno aggiunto al piano terra.",
  "type": "eletrico",
  "blocks": [
    { "type": "heading", "level": 1, "text": "Quadro generale" },
    { "type": "paragraph", "text": "Il nuovo bagno richiede 3 circuiti dedicati: luce, prese normali e prese alta potenza per asciugacapelli/lavatrice." },
    {
      "type": "keyValue",
      "items": [
        { "label": "Potenza picco", "value": "4.6 kW" },
        { "label": "Cavo principale", "value": "3x2.5 mm²" },
        { "label": "Differenziale", "value": "30 mA — tipo A" }
      ]
    },
    { "type": "heading", "level": 2, "text": "Lista materiali" },
    {
      "type": "table",
      "columns": ["Descrizione", "Qty", "Prezzo unit."],
      "align": ["left", "right", "right"],
      "rows": [
        ["Interruttore differenziale 30mA tipo A", "1", "CHF 95"],
        ["MCB 1P 10A — luce", "1", "CHF 18"],
        ["MCB 1P 16A — prese", "2", "CHF 18"],
        ["Cavo NYY-J 3x2.5 mm² (al m)", "20", "CHF 2.40"]
      ]
    },
    { "type": "heading", "level": 2, "text": "Avvertenze" },
    {
      "type": "callout",
      "variant": "warning",
      "title": "Verifica obbligatoria",
      "text": "Posa e collaudo a cura di elettricista iscritto ESTI. Documentare la SiNa prima della messa in tensione."
    },
    { "type": "divider" },
    { "type": "heading", "level": 3, "text": "Schema quadro" },
    {
      "type": "diagram",
      "text": "Quadro 4 moduli\\n ├─ Differenziale 30mA\\n ├─ MCB Luce 10A\\n ├─ MCB Prese 16A\\n └─ MCB Prese 16A (asciugacapelli/lavatrice)"
    }
  ]
}`

export default async function ImportReportPage() {
  const session = await getSession()
  if (!session || !canMutate(session.role)) redirect('/relatori')

  const projects = await getProjects()

  return (
    <div className="page-form">
      <div className="mb-6">
        <Link href="/relatori" className="mb-3 flex items-center gap-1.5 text-body text-ink-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" />
          Relatori
        </Link>
        <h1 className="text-title font-semibold text-ink sm:text-display">Importa relatorio da chat IA</h1>
        <p className="mt-0.5 text-body text-ink-muted">
          Genera il relatorio con ChatGPT/Claude usando le istruzioni qui sotto, poi incolla il JSON.
        </p>
      </div>

      <ReportImportClient
        projects={projects.map((p) => ({ id: p.id, name: p.name, clientName: p.client.name }))}
        instructions={REPORT_IMPORT_INSTRUCTIONS}
        exampleJson={REPORT_EXAMPLE_JSON}
        importAction={importReportFromJson}
      />
    </div>
  )
}
