import { Section } from '@/components/section'
import { WhatsappGlyph } from '@/components/glyphs'
import { PRICING, WHATSAPP_GENERIC } from '@/lib/site'

const chf = (n: number) => n.toLocaleString('de-CH')

const INCLUDED = [
  'Tutto quello che trovi nella lista qui sopra',
  'App per te e fino a 5 operai',
  'Attivazione, configurazione e formazione',
  `Impegno minimo ${PRICING.minimumCommitmentMonths} mesi, poi disdetta con ${PRICING.noticeDays} giorni`,
  `Dati esportabili in ${PRICING.exportDays} giorni, gratis, sempre`,
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
      eyebrow="Quanto costa"
      title={
        <>
          Un canone,{' '}
          <span className="text-mint-deep">e sai già cosa comprende.</span>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-line">
          <div className="bg-navy px-8 py-9">
            <p className="eyebrow text-mint">A partire da</p>
            <p className="tabular mt-3 text-[clamp(2.6rem,5vw,3.6rem)] font-extrabold leading-none text-white">
              CHF {PRICING.from}
              <span className="ml-1.5 text-base font-medium text-white/60">
                /mese
              </span>
            </p>
          </div>

          <ul className="space-y-4 bg-white px-8 py-8">
            {INCLUDED.map((line) => (
              <li key={line} className="flex gap-3.5">
                <span
                  aria-hidden
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint-soft text-mint-deep"
                >
                  <svg viewBox="0 0 20 20" className="h-3 w-3">
                    <path
                      d="M4 10.5 8 14.5 16 5.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="text-[0.97rem]">{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-line bg-off p-8">
          <h3 className="text-[1.25rem]">Con cosa lo stai confrontando</h3>

          <dl className="mt-7 space-y-6">
            {ALTERNATIVES.map((alt) => (
              <div key={alt.label}>
                <dt className="text-[0.88rem] text-slate-ink">{alt.label}</dt>
                <dd
                  className={`tabular mt-1 text-2xl font-extrabold ${
                    alt.highlight ? 'text-mint-deep' : ''
                  }`}
                >
                  {alt.price}
                </dd>
                <dd className="mt-0.5 text-[0.85rem] text-slate">{alt.unit}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-8 text-[0.95rem] text-slate-ink">
            Il prezzo esatto dipende dal volume del tuo lavoro. Te lo diciamo in
            cinque minuti, senza riunioni.
          </p>

          <a
            href={WHATSAPP_GENERIC}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 font-bold text-navy underline decoration-mint decoration-2 underline-offset-[6px]"
          >
            <WhatsappGlyph />
            Chiedi il tuo prezzo
          </a>
        </div>
      </div>
    </Section>
  )
}
