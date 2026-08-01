import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CtaBand, PageHeader } from '@/components/page-parts'
import { SERVICES, getService } from '@/lib/services'
import {
  JsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
  pageMeta,
  serviceJsonLd,
} from '@/lib/seo'
import preventivi from '../../../../public/screens/preventivi.webp'
import fatture from '../../../../public/screens/fatture.webp'
import spese from '../../../../public/screens/spese.webp'
import rapportini from '../../../../public/screens/rapportini.webp'
import prezzario from '../../../../public/screens/prezzario.webp'

const SCREENS = { preventivi, fatture, spese, rapportini, prezzario }

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const service = getService(slug)
  if (!service) return {}
  return pageMeta({
    title: service.metaTitle,
    description: service.metaDescription,
    path: `/servizi/${service.slug}`,
    keywords: service.keywords,
  })
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const service = getService(slug)
  if (!service) notFound()

  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Servizi', path: '/servizi' },
    { name: service.nav, path: `/servizi/${service.slug}` },
  ]
  const screen = service.screen ? SCREENS[service.screen] : null

  return (
    <>
      <PageHeader
        eyebrow={service.nav}
        title={service.title}
        lead={service.lead}
        trail={trail}
      />

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:px-8">
          <h2 className="text-[clamp(1.6rem,3vw,2.2rem)]">
            Se ti riconosci qui, è il momento
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {service.pains.map((pain) => (
              <li
                key={pain}
                className="rounded-2xl border border-line bg-off p-6 text-slate-ink"
              >
                {pain}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-off">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:px-8">
          <h2 className="text-[clamp(1.6rem,3vw,2.2rem)]">Come funziona</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {service.steps.map((step, i) => (
              <li
                key={step.title}
                className="rounded-2xl border border-line bg-white p-7"
              >
                <span className="tabular inline-flex h-10 w-10 items-center justify-center rounded-full bg-mint text-[0.85rem] font-extrabold text-navy">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-5 text-[1.2rem]">{step.title}</h3>
                <p className="mt-2.5 text-[0.95rem] text-slate-ink">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>

          {screen ? (
            <figure className="mt-12 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_20px_50px_-24px_rgba(20,58,86,0.35)]">
              <Image
                src={screen}
                alt={`${service.nav} nell'app Delegami`}
                sizes="(min-width: 1024px) 64rem, 100vw"
                className="h-auto w-full"
              />
            </figure>
          ) : null}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:py-20 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="text-[1.5rem]">Cosa è compreso</h2>
            <ul className="mt-6 space-y-3.5">
              {service.included.map((item) => (
                <li key={item} className="flex gap-3.5">
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
                  <span className="text-[0.97rem]">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-[1.5rem]">Cosa non facciamo</h2>
            <ul className="mt-6 space-y-3.5">
              {service.excluded.map((item) => (
                <li key={item} className="flex gap-3.5">
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-line text-slate-ink"
                  >
                    ×
                  </span>
                  <span className="text-[0.97rem] text-slate-ink">{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 max-w-[46ch] text-[0.9rem] text-slate">
              Lo scriviamo qui perché lo scriviamo anche nel contratto. È così
              che si evitano i malintesi al terzo mese.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-off">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:px-8">
          <h2 className="text-[clamp(1.6rem,3vw,2.2rem)]">
            Domande su {service.nav.toLowerCase()}
          </h2>
          <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-white">
            {service.faq.map((item) => (
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

          <nav aria-label="Altri servizi" className="mt-12">
            <h2 className="eyebrow text-slate">Gli altri servizi</h2>
            <ul className="mt-4 flex flex-wrap gap-3">
              {SERVICES.filter((s) => s.slug !== service.slug).map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/servizi/${s.slug}`}
                    className="inline-flex rounded-full border border-line bg-white px-5 py-2.5 text-[0.9rem] font-medium transition-colors hover:border-mint hover:text-mint-deep"
                  >
                    {s.nav}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      <CtaBand />

      <JsonLd
        data={serviceJsonLd({
          name: service.nav,
          description: service.metaDescription,
          path: `/servizi/${service.slug}`,
        })}
      />
      <JsonLd data={faqJsonLd(service.faq)} />
      <JsonLd data={breadcrumbJsonLd(trail)} />
    </>
  )
}
