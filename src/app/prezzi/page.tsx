import { CtaBand, PageHeader } from '@/components/page-parts'
import { Pricing } from '@/components/pricing'
import { JsonLd, breadcrumbJsonLd, faqJsonLd, pageMeta } from '@/lib/seo'
import { PRICING, SLA } from '@/lib/site'

const chf = (n: number) => n.toLocaleString('de-CH')

export const metadata = pageMeta({
  title: 'Prezzi — quanto costa avere l’amministrazione fatta',
  description: `Da CHF ${PRICING.from} al mese, tutto compreso, software incluso. Nessun costo nascosto, impegno minimo ${PRICING.minimumCommitmentMonths} mesi, dati sempre esportabili.`,
  path: '/prezzi',
  keywords: [
    'quanto costa un servizio amministrativo',
    'prezzo gestionale impresa edile',
    'costo segretaria esterna Ticino',
  ],
})

const GUARANTEES = [
  {
    title: 'Nessun costo a sorpresa',
    body: 'Tutto quello che esce dal canone si concorda prima, per iscritto. Se una richiesta è fuori dal piano te lo diciamo con il prezzo, e decidi tu.',
  },
  {
    title: 'I tuoi dati restano tuoi',
    body: `Se un giorno smetti, ti esportiamo tutto — CSV, JSON e PDF — entro ${PRICING.exportDays} giorni lavorativi, gratis. È scritto nel contratto, non è una cortesia.`,
  },
  {
    title: 'Niente vincoli lunghi',
    body: `Impegno minimo ${PRICING.minimumCommitmentMonths} mesi, il tempo di far funzionare il metodo. Poi disdetta con ${PRICING.noticeDays} giorni, senza penali.`,
  },
  {
    title: 'Un solo interlocutore',
    body: 'Parli sempre con la stessa persona, che conosce i tuoi cantieri e i tuoi fornitori. Nessun call center, nessun ticket.',
  },
]

const FAQ = [
  {
    q: 'Perché non pubblicate un listino dettagliato?',
    a: `Perché il prezzo giusto dipende dal volume reale: quanti preventivi al mese, quanti cantieri aperti, quanti operai. Il canone parte da CHF ${PRICING.from} e te lo diciamo in cinque minuti su WhatsApp, prima di qualsiasi impegno.`,
  },
  {
    q: 'C’è un costo di attivazione?',
    a: 'Sì, una tantum. Copre l’avvio: caricamento dei tuoi clienti e fornitori, configurazione, costruzione del tuo prezzario e formazione tua e degli operai. È il lavoro più intenso di tutto il rapporto e si fa una volta sola.',
  },
  {
    q: 'E se ho mesi di arretrato da sistemare?',
    a: 'Si recupera, ma è lavoro a parte: lo preventiviamo prima di cominciare così sai in anticipo quanto costa mettersi in pari. Non entra a sorpresa nel canone.',
  },
  {
    q: 'Conviene rispetto a un impiegato?',
    a: `Un amministrativo al 20% costa CHF ${chf(PRICING.employeeCostLow)}–${chf(PRICING.employeeCostHigh)} al mese con gli oneri, e va formato, sostituito quando è in vacanza e gestito. Qui il canone parte da CHF ${PRICING.from} e comprende anche il software.`,
  },
  {
    q: 'Cosa succede se non sono soddisfatto?',
    a: `Dopo i primi ${PRICING.minimumCommitmentMonths} mesi puoi disdire con ${PRICING.noticeDays} giorni di preavviso e porti via tutti i dati. Non lavoriamo con vincoli: se il servizio non vale il canone, è giusto che tu vada.`,
  },
]

export default function PrezziPage() {
  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Prezzi', path: '/prezzi' },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Prezzi"
        title="Un canone, e sai già cosa comprende"
        lead="Non fatturiamo a ore e non fatturiamo a preventivo: sarebbe un incentivo sbagliato in entrambi i casi. Paghi un canone mensile legato al volume del tuo lavoro, e dentro c'è tutto — software compreso."
        trail={trail}
      />

      <Pricing />

      <section className="bg-off">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:px-8">
          <h2 className="text-[clamp(1.6rem,3vw,2.2rem)]">
            Quattro cose che mettiamo per iscritto
          </h2>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2">
            {GUARANTEES.map((g) => (
              <li
                key={g.title}
                className="rounded-2xl border border-line bg-white p-7"
              >
                <h3 className="text-[1.15rem]">{g.title}</h3>
                <p className="mt-3 text-[0.95rem] text-slate-ink">{g.body}</p>
              </li>
            ))}
          </ul>

          <p className="mt-10 max-w-[62ch] text-[0.95rem] text-slate-ink">
            Lavoriamo {SLA.days.toLowerCase()} dalle {SLA.hours}. Rispondiamo
            entro {SLA.replyHours} ore lavorative ed eseguiamo entro{' '}
            {SLA.executionHours}. Le urgenze si gestiscono, con un supplemento
            concordato prima.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:px-8">
          <h2 className="text-[clamp(1.6rem,3vw,2.2rem)]">Domande sul prezzo</h2>
          <div className="mt-8 overflow-hidden rounded-2xl border border-line">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group border-b border-line last:border-0"
              >
                <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 px-7 py-5">
                  <h3 className="text-[1.05rem] transition-colors group-open:text-mint-deep">
                    {item.q}
                  </h3>
                  <span
                    aria-hidden
                    className="mt-1 shrink-0 text-lg text-slate transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-[68ch] px-7 pb-6 text-slate-ink">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        title="Chiedi il tuo prezzo"
        body="Due domande sul volume del tuo lavoro e ti diciamo la cifra. Senza riunioni, senza preventivi di venti pagine."
      />

      <JsonLd data={faqJsonLd(FAQ)} />
      <JsonLd data={breadcrumbJsonLd(trail)} />
    </>
  )
}
