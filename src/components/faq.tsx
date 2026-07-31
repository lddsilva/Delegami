import { Plus } from 'lucide-react'
import { PRICING, SLA } from '@/lib/site'

const FAQS = [
  {
    q: 'Sostituite il mio fiduciario?',
    a: 'No, e non vogliamo. Le dichiarazioni fiscali e la chiusura contabile restano sue. Noi gli consegniamo ogni mese un dossier ordinato invece della solita scatola di documenti a dicembre: di solito il fiduciario è il primo contento.',
  },
  {
    q: 'Devo imparare a usare un software?',
    a: 'No. Tu mandi su WhatsApp, come fai già con chiunque. L’app c’è ed è tua, ma serve per guardare i numeri quando ti va — non è un compito in più.',
  },
  {
    q: 'E i miei dati, se un giorno smetto?',
    a: `Sono tuoi. Te li esportiamo tutti — CSV, JSON e PDF — entro ${PRICING.exportDays} giorni lavorativi, gratis. È scritto nel contratto, non è una cortesia.`,
  },
  {
    q: 'Ho degli operai. Funziona anche per loro?',
    a: 'Sì. Registrano ore, luogo e foto dal telefono, tu approvi con un tocco. Alla fine del periodo esce un bollettino firmabile, valido anche da consegnare all’agenzia interinale o al committente.',
  },
  {
    q: 'È un sistema per controllare i miei operai?',
    a: 'No, ed è una scelta precisa. È uno strumento di documentazione del lavoro svolto — ore, luogo del rapportino, foto — che protegge te in caso di contestazione. La sorveglianza continua del comportamento dei dipendenti è vietata dalla legge svizzera e non la facciamo.',
  },
  {
    q: 'Quanto tempo mi porta via all’inizio?',
    a: 'Un paio d’ore per l’avvio: ci passi i tuoi dati, i fornitori, i cantieri aperti. Dopo, qualche minuto al giorno per mandare foto e vocali.',
  },
  {
    q: 'E se ho un’urgenza?',
    a: `Rispondiamo entro ${SLA.replyHours} ore lavorative ed eseguiamo entro ${SLA.executionHours}. Se ti serve un preventivo in giornata si può fare, con un supplemento che concordiamo prima — mai una sorpresa in fattura.`,
  },
  {
    q: 'Per chi non siete adatti?',
    a: 'Se hai già una segretaria o un ufficio interno, non ti serviamo. Se cerchi solo un software da usare da solo, nemmeno: noi vendiamo il lavoro fatto, il software è compreso.',
  },
]

export function Faq() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  }

  return (
    <section id="domande" className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
          <h2 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            Domande che ci fanno sempre
          </h2>

          <div className="divide-y divide-ink-100 border-y border-ink-100">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-left">
                  <span className="text-lg font-bold text-ink-900">
                    {faq.q}
                  </span>
                  <Plus
                    className="mt-1 h-5 w-5 shrink-0 text-ink-300 transition-transform group-open:rotate-45"
                    aria-hidden
                  />
                </summary>
                <p className="mt-4 pr-11 leading-relaxed text-ink-500">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  )
}
