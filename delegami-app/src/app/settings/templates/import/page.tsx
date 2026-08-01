import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getSession, canMutate } from '@/lib/auth'
import { importTemplateFromJson } from '@/modules/quote-templates/actions'
import { TemplateImportClient } from '@/components/quote-templates/template-import-client'

const TEMPLATE_IMPORT_INSTRUCTIONS = `Sei un assistente che crea template di preventivo per Zanetti Soluzioni Edili (Magliaso, TI).

Un "template" è un preventivo riusabile senza cliente né progetto: una struttura di voci con prezzi indicativi che velocizza la creazione di nuovi preventivi.

Quando l'utente descrive una tipologia di lavoro tipica, struttura la risposta come JSON valido conforme allo schema sotto.
Non aggiungere testo prima o dopo il JSON.

REGOLE:
- "name" descrittivo (es. "Ristrutturazione bagno 6 mq standard").
- "category" obbligatoria — una delle: "Bagno", "Cucina", "Pavimenti", "Pittura", "Impianti", "Muratura", "Strutture", "Infissi", "Isolamento", "Idraulica", "Finiture", "Manodopera", "Smaltimento", "Logistica", "Completa".
- "subcategory" opzionale, libera (es. "Sanitari + pavimento").
- "emoji" opzionale (default 📋). Esempi: 🛁 bagno, 🍳 cucina, 🚿 doccia, 🪟 finestre.
- "templateType" = "QUOTE" (default) per preventivi; "INVOICE" solo per template di fatture.
- "type" di ogni voce: "HEADER" | "SECTION" | "ITEM" | "NOTE" | "SUBTOTAL".
- "unit" valide: "m²", "m³", "ml", "h", "pz", "kg", "t", "l", "set", "corpo".
- ITEM richiede "qty" e "unitCost" (costo nostro). Il margine viene applicato al momento dell'uso del template.
- NOTE non hanno qty/prezzo. Sono note interne.
- "sourceUrl" e "sourceNote" opzionali — utili per ricordare dove si trova quel prezzo.

SCHEMA:
{
  "kind": "template",
  "name": "string",
  "category": "Bagno",
  "subcategory": "string (opzionale)",
  "emoji": "🛁",
  "templateType": "QUOTE",
  "description": "string (note interne, opzionale)",
  "items": [
    { "type": "HEADER", "description": "RISTRUTTURAZIONE BAGNO" },
    { "type": "SECTION", "description": "Demolizione" },
    { "type": "ITEM", "description": "Demolizione pavimento", "qty": 6, "unit": "m²", "unitCost": 35 }
  ]
}

Restituisci solo il JSON. L'utente lo incollerà nella pagina /settings/templates/import.`

const TEMPLATE_EXAMPLE = `{
  "kind": "template",
  "name": "Ristrutturazione bagno 6 mq standard",
  "category": "Bagno",
  "subcategory": "Completa",
  "emoji": "🛁",
  "templateType": "QUOTE",
  "items": [
    { "type": "HEADER", "description": "RISTRUTTURAZIONE BAGNO 6 mq" },
    { "type": "SECTION", "description": "Demolizione" },
    { "type": "ITEM", "description": "Demolizione pavimento + rivestimenti", "qty": 6, "unit": "m²", "unitCost": 35 },
    { "type": "SECTION", "description": "Sanitari" },
    { "type": "ITEM", "description": "WC sospeso bianco", "qty": 1, "unit": "pz", "unitCost": 280 },
    { "type": "ITEM", "description": "Lavabo sospeso", "qty": 1, "unit": "pz", "unitCost": 220 }
  ]
}`

export default async function ImportTemplatePage() {
  const session = await getSession()
  if (!session || !canMutate(session.role)) redirect('/settings/templates')

  return (
    <div className="page-form">
      <div className="mb-6">
        <Link href="/settings/templates" className="mb-3 flex items-center gap-1.5 text-body text-ink-muted transition-colors hover:text-ink">
          <ArrowLeft className="h-4 w-4" />
          Template
        </Link>
        <h1 className="text-title font-semibold text-ink sm:text-display">Importa template da chat IA</h1>
        <p className="mt-0.5 text-body text-ink-muted">
          Genera il template con ChatGPT/Claude usando le istruzioni qui sotto, poi incolla il JSON.
        </p>
      </div>

      <TemplateImportClient
        importAction={importTemplateFromJson}
        instructions={TEMPLATE_IMPORT_INSTRUCTIONS}
        exampleJson={TEMPLATE_EXAMPLE}
      />
    </div>
  )
}
