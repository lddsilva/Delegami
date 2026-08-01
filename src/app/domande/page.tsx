import Link from 'next/link'
import { CtaBand, PageHeader } from '@/components/page-parts'
import { SERVICES } from '@/lib/services'
import { JsonLd, breadcrumbJsonLd, faqJsonLd, pageMeta } from '@/lib/seo'
import { PRICING, SLA } from '@/lib/site'

export const metadata = pageMeta({
  title: 'Domande frequenti — tutto quello che ci chiedono prima di iniziare',
  description:
    'Sostituite il fiduciario? Devo imparare un software? E i miei dati? Le risposte alle domande che ci fanno tutti prima di affidarci l’amministrazione.',
  path: '/domande',
  keywords: [
    'domande servizio amministrativo edilizia',
    'esternalizzare amministrazione impresa edile',
    'fiduciario o servizio amministrativo',
  ],
})

const GENERAL = [
  {
    q: 'Sostituite il mio fiduciario?',
    a: 'No, e non vogliamo. Le dichiarazioni fiscali e la chiusura contabile restano sue: è lui la validazione finale dei tuoi numeri. Noi gli consegniamo ogni mese un dossier ordinato invece della scatola di documenti a dicembre — di solito il fiduciario è il primo contento.',
  },
  {
    q: 'Devo imparare a usare un software?',
    a: 'No. Tu mandi su WhatsApp, come fai già con chiunque. L’app c’è ed è tua, ma serve per guardare i numeri quando ti va, non è un compito in più.',
  },
  {
    q: 'Quanto tempo mi porta via all’inizio?',
    a: 'Circa due ore in tutto, concentrate nella prima settimana: una chiamata iniziale e una consegna di venti minuti. Il resto della configurazione la facciamo noi. Dopo, qualche minuto al giorno.',
  },
  {
    q: 'E i miei dati, se un giorno smetto?',
    a: `Sono tuoi. Te li esportiamo tutti — CSV, JSON e PDF — entro ${PRICING.exportDays} giorni lavorativi, gratis. È scritto nel contratto, non è una cortesia.`,
  },
  {
    q: 'Perché non fate telefonate?',
    a: 'Perché metà dei problemi amministrativi nasce da qualcosa detto a voce che nessuno ha scritto. Su WhatsApp ogni istruzione e ogni prezzo restano documentati, con data e ora. Puoi mandare vocali quando vuoi: quello che conta è che resti traccia.',
  },
  {
    q: 'Lavorate solo in Ticino?',
    a: 'Sì. Lavoriamo in italiano e conosciamo i fornitori, i prezzi e le abitudini di questo cantone. Fuori dal Ticino non saremmo altrettanto utili, quindi preferiamo dirlo.',
  },
  {
    q: 'Per chi non siete adatti?',
    a: 'Se hai già una segretaria o un ufficio interno, non ti serviamo. Se cerchi solo un software da usare da solo, nemmeno: noi vendiamo il lavoro fatto, il software è compreso. E se fatturi molto sopra il mezzo milione probabilmente ti serve una struttura tua.',
  },
  {
    q: 'Cosa succede se avete un’urgenza dalla vostra parte?',
    a: `Il lavoro è documentato nell'app, non nella testa di qualcuno: chi subentra vede lo stato di ogni pratica. Gli impegni restano quelli dichiarati — risposta entro ${SLA.replyHours} ore lavorative, esecuzione entro ${SLA.executionHours}.`,
  },
  {
    q: 'Avete accesso al mio conto bancario?',
    a: 'No, mai. Non paghiamo in tuo nome e non tocchiamo i tuoi soldi. Prepariamo i documenti, tu esegui i pagamenti. È una scelta di sicurezza e sta scritta nel contratto.',
  },
  {
    q: 'È un sistema per controllare i miei operai?',
    a: 'No, ed è una scelta precisa. È documentazione del lavoro svolto — ore, luogo del rapportino, foto — che protegge te in caso di contestazione. La sorveglianza continua del comportamento dei dipendenti è vietata dalla legge svizzera e non la facciamo.',
  },
]

export default function DomandePage() {
  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Domande', path: '/domande' },
  ]
  const all = [...GENERAL, ...SERVICES.flatMap((s) => s.faq)]

  return (
    <>
      <PageHeader
        eyebrow="Domande frequenti"
        title="Le domande che ci fanno tutti"
        lead="Raccolte così come arrivano, con le risposte che diamo davvero. Se la tua non è qui, scrivicela: è gratis e non ti mette in nessun impegno."
        trail={trail}
      />

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:px-8">
          <div className="overflow-hidden rounded-2xl border border-line">
            {GENERAL.map((item) => (
              <details
                key={item.q}
                className="group border-b border-line last:border-0"
              >
                <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 px-7 py-5">
                  <h2 className="text-[1.05rem] font-extrabold transition-colors group-open:text-mint-deep">
                    {item.q}
                  </h2>
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

          <div className="mt-14">
            <h2 className="text-[clamp(1.5rem,3vw,2rem)]">
              Domande su un servizio preciso
            </h2>
            <ul className="mt-6 flex flex-wrap gap-3">
              {SERVICES.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/servizi/${s.slug}#domande`}
                    className="inline-flex rounded-full border border-line bg-white px-5 py-2.5 text-[0.9rem] font-medium transition-colors hover:border-mint hover:text-mint-deep"
                  >
                    {s.nav}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <CtaBand
        title="Hai una domanda che non è qui?"
        body="Scrivila su WhatsApp. Rispondiamo con franchezza, anche quando la risposta è che non siamo la soluzione giusta per te."
      />

      <JsonLd data={faqJsonLd(all)} />
      <JsonLd data={breadcrumbJsonLd(trail)} />
    </>
  )
}
