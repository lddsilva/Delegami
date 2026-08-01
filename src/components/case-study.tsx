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
      tone="off"
      eyebrow="Un caso reale"
      title={
        <>
          Una ditta individuale.{' '}
          <span className="text-mint-deep">Un titolare solo in cantiere.</span>
        </>
      }
      lead={CASE_STUDY.label}
    >
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[38rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="eyebrow px-6 py-4 text-slate">
                Area
              </th>
              <th scope="col" className="eyebrow px-6 py-4 text-slate">
                Prima
              </th>
              <th scope="col" className="eyebrow px-6 py-4 text-mint-deep">
                Dopo
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr
                key={row.area}
                className="border-b border-line align-top last:border-0"
              >
                <th
                  scope="row"
                  className="w-[10rem] px-6 py-5 text-left font-extrabold"
                >
                  {row.area}
                </th>
                <td className="w-[38%] px-6 py-5 text-[0.93rem] text-slate">
                  {row.before}
                </td>
                <td className="px-6 py-5 text-[0.93rem] font-medium">
                  {row.after}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-5 max-w-[62ch] text-[0.85rem] text-slate">
        Cliente reale, numeri reali, nome riservato — trattiamo i dati dei
        nostri clienti come vorremmo fossero trattati i nostri.
      </p>
    </Section>
  )
}
