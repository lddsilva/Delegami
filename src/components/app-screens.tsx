import Image from 'next/image'
import { Section } from '@/components/section'
import preventivi from '../../public/screens/preventivi.webp'
import fatture from '../../public/screens/fatture.webp'
import rapportini from '../../public/screens/rapportini.webp'
import prezzario from '../../public/screens/prezzario.webp'
import spese from '../../public/screens/spese.webp'

const SCREENS = [
  {
    src: preventivi,
    title: 'Preventivi',
    body: 'Ogni preventivo con la sua versione, il suo stato e il margine calcolato. Il PDF per il cliente esce pulito, quello interno tiene i costi.',
    alt: "Elenco dei preventivi nell'app Delegami, raggruppati per cliente con stato e importo",
  },
  {
    src: fatture,
    title: 'Fatture e acconti',
    body: 'Collegate al preventivo, con acconti e fatturazione parziale. Vedi subito cosa è incassato e cosa è ancora aperto.',
    alt: "Elenco delle fatture nell'app Delegami con stato di pagamento e importi",
  },
  {
    src: rapportini,
    title: 'Rapportini degli operai',
    body: 'Ore, luogo e foto registrati dal telefono. Tu approvi con un tocco e alla fine esce un bollettino firmabile.',
    alt: "Pagina dei rapportini nell'app Delegami con le ore registrate dagli operai",
  },
  {
    src: spese,
    title: 'Spese e scontrini',
    body: 'Fotografi lo scontrino, noi lo registriamo e lo colleghiamo al cantiere. Ogni costo finisce nell’opera giusta.',
    alt: "Elenco delle spese nell'app Delegami collegate alle opere",
  },
  {
    src: prezzario,
    title: 'Prezzario',
    body: 'Il tuo listino di riferimento, con prezzi verificati sui fornitori. È quello che rende i preventivi veloci e coerenti.',
    alt: "Prezzario dell'app Delegami con le voci per categoria e i prezzi unitari",
  },
]

export function AppScreens() {
  return (
    <Section
      id="app"
      tone="off"
      eyebrow="L'app è compresa"
      title={
        <>
          Il tuo ufficio, <span className="text-mint-deep">in tasca</span>
        </>
      }
      lead="Non devi imparare a usarla: il lavoro lo facciamo noi. L'app è dove guardi i numeri quando ti va — e dove i tuoi operai registrano le ore."
    >
      <div className="space-y-16 lg:space-y-24">
        {SCREENS.map((screen, i) => (
          <div
            key={screen.title}
            className="grid items-center gap-8 lg:grid-cols-[1fr_1.35fr] lg:gap-14"
          >
            <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
              <span className="tabular eyebrow text-mint-deep">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-3 text-[clamp(1.5rem,2.6vw,2rem)]">
                {screen.title}
              </h3>
              <p className="mt-4 max-w-[46ch] text-slate-ink">{screen.body}</p>
            </div>

            <div
              className={`overflow-hidden rounded-2xl border border-line bg-white shadow-[0_20px_50px_-24px_rgba(20,58,86,0.35)] ${
                i % 2 === 1 ? 'lg:order-1' : ''
              }`}
            >
              <Image
                src={screen.src}
                alt={screen.alt}
                sizes="(min-width: 1024px) 40rem, 100vw"
                className="h-auto w-full"
              />
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}
