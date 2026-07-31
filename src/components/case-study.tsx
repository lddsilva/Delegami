import { CASE_STUDY } from '@/lib/site'

const ROWS = [
  {
    area: 'Preventivi',
    before: 'Scritti la sera sul telefono, spesso in ritardo',
    after: 'Redatti da noi, PDF professionale, consegnati in giornata',
  },
  {
    area: 'Scontrini',
    before: 'Una busta nel furgone, mesi di arretrato',
    after: 'Raccolti ogni settimana e registrati per cantiere',
  },
  {
    area: 'Fatturato',
    before: 'Nessun numero affidabile',
    after: `${CASE_STUDY.revenue} in ${CASE_STUDY.months} mesi, visibile in tempo reale`,
  },
  {
    area: 'Ore degli operai',
    before: 'Foglio di carta e memoria',
    after: 'Registrate dal telefono, bollettino firmabile',
  },
  {
    area: 'Fiduciario',
    before: 'Una scatola di documenti a dicembre',
    after: 'Un report ordinato ogni mese',
  },
]

export function CaseStudy() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <h2 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          Un caso reale
        </h2>
        <p className="mt-4 text-lg text-ink-500">{CASE_STUDY.label}</p>

        <div className="mt-12 overflow-hidden rounded-2xl border border-ink-100">
          <div className="hidden grid-cols-[160px_1fr_1fr] gap-px bg-ink-100 sm:grid">
            <div className="bg-ink-50 px-6 py-4" />
            <div className="bg-ink-50 px-6 py-4 text-sm font-bold uppercase tracking-wider text-ink-500">
              Prima
            </div>
            <div className="bg-ink-50 px-6 py-4 text-sm font-bold uppercase tracking-wider text-brand-600">
              Dopo
            </div>
          </div>

          <div className="grid gap-px bg-ink-100">
            {ROWS.map((row) => (
              <div
                key={row.area}
                className="grid gap-px bg-ink-100 sm:grid-cols-[160px_1fr_1fr]"
              >
                <div className="bg-white px-6 py-4 font-bold text-ink-900">
                  {row.area}
                </div>
                <div className="bg-white px-6 py-4 text-ink-500">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-ink-300 sm:hidden">
                    Prima
                  </span>
                  {row.before}
                </div>
                <div className="bg-white px-6 py-4 font-medium text-ink-900">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-brand-600 sm:hidden">
                    Dopo
                  </span>
                  {row.after}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 text-sm text-ink-500">
          Cliente reale, numeri reali. Il nome resta riservato — trattiamo i
          dati dei nostri clienti come vorremmo fossero trattati i nostri.
        </p>
      </div>
    </section>
  )
}
