import { Section } from '@/components/section'
import { WhatsappGlyph } from '@/components/glyphs'
import { PRICING, WHATSAPP_GENERIC } from '@/lib/site'

const chf = (n: number) => n.toLocaleString('de-CH')

const LINES = [
  { desc: 'Canone mensile — servizio completo', amount: `da CHF ${PRICING.from}` },
  { desc: 'App titolare + fino a 5 operai', amount: 'incluso' },
  { desc: 'Attivazione, configurazione e formazione', amount: 'una tantum' },
  { desc: 'Esportazione di tutti i tuoi dati all’uscita', amount: 'CHF 0' },
]

const CONDITIONS = [
  `Impegno minimo ${PRICING.minimumCommitmentMonths} mesi, poi disdetta con ${PRICING.noticeDays} giorni`,
  `Dati esportabili in ${PRICING.exportDays} giorni lavorativi, gratis, sempre`,
  'Nessun costo nascosto: gli extra si concordano prima, mai in fattura a sorpresa',
]

const ALTERNATIVES = [
  {
    label: 'Impiegato amministrativo al 20%',
    price: `CHF ${chf(PRICING.employeeCostLow)}–${chf(PRICING.employeeCostHigh)}`,
    unit: 'al mese, con oneri sociali',
  },
  {
    label: 'Fiduciario a ore',
    price: `CHF ${PRICING.fiduciaryRateLow}–${PRICING.fiduciaryRateHigh}`,
    unit: 'all’ora, e non parla la lingua del cantiere',
  },
  {
    label: 'Delegami',
    price: `da CHF ${PRICING.from}`,
    unit: 'al mese, tutto incluso, software compreso',
    highlight: true,
  },
]

export function Pricing() {
  return (
    <Section
      id="prezzo"
      index="VI"
      label="Quanto costa"
      title={
        <>
          Un canone, <em>e sai già cosa comprende.</em>
        </>
      }
    >
      <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-12">
        {/* The price list is set as a document, because documents are the product. */}
        <div className="border border-rule bg-paper">
          <div className="flex items-baseline justify-between gap-4 border-b border-rule bg-paper-deep px-6 py-4">
            <span className="eyebrow text-ink-soft">Listino</span>
            <span className="font-display text-lg leading-none">Delegami</span>
          </div>

          <table className="w-full text-left">
            <caption className="sr-only">
              Riepilogo di cosa comprende il canone mensile
            </caption>
            <tbody>
              {LINES.map((line) => (
                <tr key={line.desc} className="border-b border-rule">
                  <th
                    scope="row"
                    className="px-6 py-4 pr-3 text-left font-normal text-ink-soft"
                  >
                    {line.desc}
                  </th>
                  <td className="tabular whitespace-nowrap px-6 py-4 text-right font-medium">
                    {line.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule px-6 py-7">
            <span className="eyebrow text-ink-faint">A partire da</span>
            <p className="tabular font-display text-[clamp(2.4rem,5vw,3.4rem)] leading-none">
              CHF {PRICING.from}
              <span className="ml-1 font-sans text-base font-normal text-ink-soft">
                /mese
              </span>
            </p>
          </div>

          <ul className="space-y-2.5 px-6 py-6 text-[0.9rem] text-ink-soft">
            {CONDITIONS.map((c) => (
              <li key={c} className="flex gap-3">
                <span aria-hidden className="text-wine">
                  —
                </span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-[1.35rem]">
            Con cosa lo stai confrontando
          </h3>

          <dl className="mt-6 border-t border-rule">
            {ALTERNATIVES.map((alt) => (
              <div key={alt.label} className="border-b border-rule py-5">
                <dt className="text-[0.9rem] text-ink-soft">{alt.label}</dt>
                <dd
                  className={`tabular mt-1.5 font-display text-2xl ${
                    alt.highlight ? 'text-wine' : ''
                  }`}
                >
                  {alt.price}
                </dd>
                <dd className="mt-1 text-[0.85rem] text-ink-faint">
                  {alt.unit}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-7 max-w-[38ch] text-[0.95rem] text-ink-soft">
            Il prezzo esatto dipende dal volume del tuo lavoro — quanti
            preventivi, quanti cantieri aperti, quanti operai. Te lo diciamo in
            cinque minuti, senza riunioni.
          </p>

          <a
            href={WHATSAPP_GENERIC}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 font-medium text-wine underline decoration-1 underline-offset-[6px] transition-colors hover:text-ink"
          >
            <WhatsappGlyph />
            Chiedi il tuo prezzo
          </a>
        </div>
      </div>
    </Section>
  )
}
