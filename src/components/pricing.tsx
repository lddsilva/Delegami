import { Check, MessageCircle } from 'lucide-react'
import { PRICING, WHATSAPP_GENERIC } from '@/lib/site'

const INCLUDED = [
  'Tutto quello che trovi nella lista qui sopra',
  'App per te e fino a 5 operai',
  'Attivazione una tantum: onboarding, configurazione e formazione',
  `Impegno minimo ${PRICING.minimumCommitmentMonths} mesi, poi disdetta con ${PRICING.noticeDays} giorni`,
  `I tuoi dati sono tuoi: esportabili in ${PRICING.exportDays} giorni, gratis, sempre`,
]

const ALTERNATIVES = [
  {
    label: 'Un impiegato amministrativo al 20%',
    price: `CHF ${PRICING.employeeCostLow.toLocaleString('de-CH')}–${PRICING.employeeCostHigh.toLocaleString('de-CH')}`,
    unit: 'al mese, con oneri sociali',
  },
  {
    label: 'Un fiduciario a ore',
    price: `CHF ${PRICING.fiduciaryRateLow}–${PRICING.fiduciaryRateHigh}`,
    unit: "all'ora, e non parla la lingua del cantiere",
  },
]

export function Pricing() {
  return (
    <section id="prezzo" className="bg-ink-50 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <h2 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          Quanto costa
        </h2>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <div className="rounded-2xl border border-ink-100 bg-white p-8 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-ink-500">
              A partire da
            </p>
            <p className="mt-3 flex items-baseline gap-2">
              <span className="text-5xl font-bold tracking-tight text-ink-900 sm:text-6xl">
                CHF {PRICING.from}
              </span>
              <span className="text-xl font-medium text-ink-500">/mese</span>
            </p>

            <ul className="mt-9 space-y-3.5">
              {INCLUDED.map((line) => (
                <li key={line} className="flex gap-3">
                  <Check
                    className="mt-0.5 h-5 w-5 shrink-0 text-brand-600"
                    aria-hidden
                  />
                  <span className="leading-relaxed text-ink-700">{line}</span>
                </li>
              ))}
            </ul>

            <div className="mt-9 rounded-xl bg-ink-50 p-5">
              <p className="text-sm leading-relaxed text-ink-700">
                Il prezzo esatto dipende dal volume del tuo lavoro — quanti
                preventivi, quanti cantieri aperti, quanti operai. Te lo diciamo
                in cinque minuti su WhatsApp, senza giri di parole e senza
                riunioni.
              </p>
              <a
                href={WHATSAPP_GENERIC}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-ink-900 underline decoration-brand-500 decoration-2 underline-offset-4"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                Chiedi il tuo prezzo
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-ink-100 bg-white p-8 sm:p-10">
            <h3 className="text-lg font-bold text-ink-900">
              Con cosa lo stai confrontando
            </h3>

            <div className="mt-7 space-y-7">
              {ALTERNATIVES.map((alt) => (
                <div
                  key={alt.label}
                  className="border-l-2 border-ink-100 pl-5"
                >
                  <p className="text-sm font-medium text-ink-500">
                    {alt.label}
                  </p>
                  <p className="mt-1.5 text-2xl font-bold text-ink-900">
                    {alt.price}
                  </p>
                  <p className="mt-1 text-sm text-ink-500">{alt.unit}</p>
                </div>
              ))}

              <div className="border-l-2 border-brand-500 pl-5">
                <p className="text-sm font-medium text-ink-500">Delegami</p>
                <p className="mt-1.5 text-2xl font-bold text-ink-900">
                  da CHF {PRICING.from}
                </p>
                <p className="mt-1 text-sm text-ink-500">
                  al mese, tutto incluso, software compreso
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
