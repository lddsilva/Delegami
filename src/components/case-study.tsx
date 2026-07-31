import { Section } from '@/components/section'
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
    <Section
      index="VII"
      label="Un caso reale"
      title={
        <>
          Una ditta individuale. <em>Un titolare solo in cantiere.</em>
        </>
      }
      lead={CASE_STUDY.label}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-left">
          <thead>
            <tr className="border-y border-rule">
              <th scope="col" className="eyebrow py-3 pr-6 text-ink-faint">
                Area
              </th>
              <th scope="col" className="eyebrow py-3 pr-6 text-ink-faint">
                Prima
              </th>
              <th scope="col" className="eyebrow py-3 text-wine">
                Dopo
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.area} className="border-b border-rule align-top">
                <th
                  scope="row"
                  className="w-[9rem] py-5 pr-6 text-left font-display text-[1.05rem] font-normal"
                >
                  {row.area}
                </th>
                <td className="w-[38%] py-5 pr-6 text-[0.95rem] text-ink-faint">
                  {row.before}
                </td>
                <td className="py-5 text-[0.95rem]">{row.after}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 max-w-[62ch] text-[0.85rem] italic text-ink-faint">
        Cliente reale, numeri reali, nome riservato — trattiamo i dati dei
        nostri clienti come vorremmo fossero trattati i nostri.
      </p>
    </Section>
  )
}
