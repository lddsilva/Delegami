import { AppScreens } from '@/components/app-screens'
import { CtaBand, PageHeader } from '@/components/page-parts'
import { JsonLd, breadcrumbJsonLd, faqJsonLd, pageMeta } from '@/lib/seo'

export const metadata = pageMeta({
  title: 'L’app — compresa nel canone, non è un corso da seguire',
  description:
    'Preventivi, fatture, spese, rapportini e prezzario in un’unica app, per te e per i tuoi operai. Compresa nel canone: il lavoro lo facciamo noi, l’app è dove guardi i numeri.',
  path: '/app',
  keywords: [
    'gestionale imprese edili Ticino',
    'software preventivi edilizia',
    'app rapportini operai',
    'programma gestione cantieri piccola impresa',
  ],
})

const FAQ = [
  {
    q: 'Devo imparare a usare un software?',
    a: 'No. Tu mandi su WhatsApp, come fai già con chiunque. L’app c’è ed è tua, ma serve per guardare i numeri quando ti va — non è un compito in più.',
  },
  {
    q: 'L’app costa a parte?',
    a: 'No, è compresa nel canone, con accesso per te e fino a cinque operai. Non vendiamo licenze: vendiamo il lavoro fatto, e il software è l’attrezzo con cui lo facciamo.',
  },
  {
    q: 'Funziona dal telefono in cantiere?',
    a: 'Sì, è pensata prima per il telefono. Gli operai registrano le ore dal cantiere e tu approvi dal furgone.',
  },
  {
    q: 'I miei dati dove stanno?',
    a: 'Su server in Europa, in un’istanza dedicata alla tua impresa. Puoi esportare tutto quando vuoi, e se smetti te li consegniamo comunque.',
  },
]

export default function AppPage() {
  const trail = [
    { name: 'Home', path: '/' },
    { name: "L'app", path: '/app' },
  ]

  return (
    <>
      <PageHeader
        eyebrow="L'app è compresa"
        title="Il software non è il prodotto. È l’attrezzo."
        lead="Quasi tutti i gestionali per l'edilizia ti vendono un programma e ti lasciano il lavoro. Qui è il contrario: il lavoro lo facciamo noi, e l'app è dove tu guardi i numeri quando ti va — più il posto dove i tuoi operai registrano le ore."
        trail={trail}
      />

      <AppScreens />

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:px-8">
          <h2 className="text-[clamp(1.6rem,3vw,2.2rem)]">Domande sull’app</h2>
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

      <CtaBand />
      <JsonLd data={faqJsonLd(FAQ)} />
      <JsonLd data={breadcrumbJsonLd(trail)} />
    </>
  )
}
