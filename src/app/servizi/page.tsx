import Link from 'next/link'
import { CtaBand, PageHeader } from '@/components/page-parts'
import { SERVICES } from '@/lib/services'
import { JsonLd, breadcrumbJsonLd, pageMeta } from '@/lib/seo'

export const metadata = pageMeta({
  title: 'Servizi — cosa facciamo per la tua impresa edile',
  description:
    'Preventivi, fatture e incassi, spese e scontrini, ore degli operai, report per il fiduciario. Una lista chiusa di servizi amministrativi per piccole imprese edili in Ticino.',
  path: '/servizi',
  keywords: [
    'servizi amministrativi impresa edile',
    'back office edilizia Ticino',
    'gestione amministrativa piccola impresa',
  ],
})

export default function ServiziPage() {
  return (
    <>
      <PageHeader
        eyebrow="Servizi"
        title="Cinque cose che ti tolgono le serate. Le facciamo noi."
        lead="Non vendiamo un software da imparare: vendiamo il lavoro fatto. Qui sotto c'è tutto quello che comprende il canone, con i limiti scritti accanto — perché sapere cosa non è incluso vale quanto sapere cosa lo è."
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Servizi', path: '/servizi' },
        ]}
      />

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:px-8">
          <ul className="grid gap-6 md:grid-cols-2">
            {SERVICES.map((service, i) => (
              <li key={service.slug}>
                <Link
                  href={`/servizi/${service.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-line bg-white p-8 transition-colors hover:border-mint"
                >
                  <span className="tabular eyebrow text-mint-deep">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h2 className="mt-3 text-[1.35rem] transition-colors group-hover:text-mint-deep">
                    {service.nav}
                  </h2>
                  <p className="mt-3 flex-1 text-[0.95rem] text-slate-ink">
                    {service.lead}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 text-[0.9rem] font-bold text-navy">
                    Vedi come funziona
                    <span aria-hidden className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand />

      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Servizi', path: '/servizi' },
        ])}
      />
    </>
  )
}
