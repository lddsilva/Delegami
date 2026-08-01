// Registry of technical reports. Add a new entry here whenever a new report page is created.
export type ReportType = 'eletrico' | 'hidraulico' | 'strutturale' | 'termico' | 'altro'

export interface ReportEntry {
  id: string
  title: string
  description: string
  type: ReportType
  href: string
  quoteId?: string
  projectId?: string
  createdAt: string // ISO date string
}

export const RELATORI_REGISTRY: ReportEntry[] = [
  {
    id: 'raccolta-scontrini-2026',
    title: 'Raccolta scontrini & deducibilità — Ditta Individuale 2026',
    description: 'Perché conviene fotografare TUTTI gli scontrini aziendali, come funzionano le deduzioni sull\'imposta sul reddito per la ditta individuale (senza IVA), soglia obbligatoria CHF 100\'000, esempio numerico e procedura operativa con l\'app.',
    type: 'altro',
    href: '/relatorio/raccolta-scontrini',
    createdAt: '2026-05-26',
  },
  {
    id: 'finanziario-013',
    title: 'Analisi Finanziaria — Margini e Cronoprogramma',
    description: 'Breakdown costi per sezione (manodopera vs materiali), scenari di margine 0–25%, opportunità di risparmio, piano dei pagamenti 30/40/30 e cronoprogramma stimato 10-12 settimane.',
    type: 'altro',
    href: '/relatorio/finanziario-013',
    quoteId: 'cmobzgzsh0003y0ukbly36k3q',
    createdAt: '2026-05-20',
  },
  {
    id: 'eletrico-pre-2026-013',
    title: 'Analisi Tecnica Impianto Elettrico',
    description: 'Calcolo potenza (9,7kW picco), layout quadro interno Hager VOLTA 48 moduli, dettaglio circuiti per stanza, quantità cavi con link prodotti Elettromercato Bronz, piano di esecuzione, posa 75h × CHF 100/h. Prese ABB Basic55.',
    type: 'eletrico',
    href: '/relatorio/eletrico',
    quoteId: 'cmobzgzsh0003y0ukbly36k3q',
    createdAt: '2026-05-19',
  },
  {
    id: 'licenza-edilizia-013',
    title: 'Procedure Edilizie — Domanda vs Notifica',
    description: 'Analisi per ogni intervento: parete di tamponamento con putrella = notifica, nuovo bagno = notifica, tutti gli altri lavori = nessun adempimento. Riferimenti LE 705.100 + RLE 705.110. Contatti UTC Massagno.',
    type: 'strutturale',
    href: '/relatorio/licenza-edilizia',
    projectId: 'cmobzgzlk0001y0ukb3hkjyih',
    createdAt: '2026-05-19',
  },
  {
    id: 'lista-acquisti-013',
    title: 'Lista Acquisti Completa — Materiali e Fornitori',
    description: 'Elenco dettagliato di TUTTI i materiali da acquistare: piastrelle, colla, stucco, impermeabilizzante, cartongesso, LEKA, pittura, porte, sanitari, materiale elettrico. Organizzato per viaggio/fornitore con prezzi CH vs IT e risparmio per ogni articolo.',
    type: 'altro',
    href: '/relatorio/lista-acquisti-013',
    quoteId: 'cmobzgzsh0003y0ukbly36k3q',
    createdAt: '2026-05-20',
  },
  {
    id: 'lepicosc-30k-013',
    title: 'Analisi LEPICOSC — Soglia CHF 30.000',
    description: 'Classificazione ogni voce in "edilizia" vs "artigianato". Totale edilizia = CHF 21.000 (sotto soglia CHF 30k) → iscrizione Albo non obbligatoria. Tema IVA CHF 100k spiegato.',
    type: 'altro',
    href: '/relatorio/lepicosc-30k',
    projectId: 'cmobzgzlk0001y0ukb3hkjyih',
    createdAt: '2026-05-19',
  },
]
