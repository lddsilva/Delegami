import Link from 'next/link'
import type { ReactNode } from 'react'
import { WhatsappGlyph } from '@/components/glyphs'
import { SLA, WHATSAPP_FREE_QUOTE, WHATSAPP_GENERIC } from '@/lib/site'

export function Breadcrumbs({
  trail,
}: {
  trail: { name: string; path: string }[]
}) {
  return (
    <nav aria-label="Percorso" className="text-[0.82rem] text-slate">
      <ol className="flex flex-wrap items-center gap-2">
        {trail.map((crumb, i) => (
          <li key={crumb.path} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden>/</span>}
            {i === trail.length - 1 ? (
              <span aria-current="page" className="text-slate-ink">
                {crumb.name}
              </span>
            ) : (
              <Link href={crumb.path} className="hover:text-navy">
                {crumb.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function PageHeader({
  eyebrow,
  title,
  lead,
  trail,
  children,
}: {
  eyebrow?: string
  title: string
  lead?: string
  trail?: { name: string; path: string }[]
  children?: ReactNode
}) {
  return (
    <section className="border-b border-line bg-off">
      <div className="mx-auto max-w-6xl px-6 py-14 sm:py-18 lg:px-8">
        {trail ? <Breadcrumbs trail={trail} /> : null}
        {eyebrow ? (
          <p className={`eyebrow text-mint-deep ${trail ? 'mt-6' : ''}`}>
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-4 max-w-[22ch] text-[clamp(2.1rem,4.6vw,3.4rem)]">
          {title}
        </h1>
        {lead ? (
          <p className="mt-6 max-w-[62ch] text-[1.08rem] text-slate-ink">
            {lead}
          </p>
        ) : null}
        {children}
      </div>
    </section>
  )
}

/** Closing call to action. Repeated on every page on purpose: this is the only
 *  conversion event on the site, and nobody scrolls back up to find it. */
export function CtaBand({
  title = 'Provaci senza pagare niente',
  body = 'Mandaci un vocale su un lavoro che devi preventivare questa settimana. Ti restituiamo il preventivo in italiano, in PDF, pronto da consegnare.',
}: {
  title?: string
  body?: string
}) {
  return (
    <section className="bg-navy">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <h2 className="max-w-[18ch] text-[clamp(1.8rem,3.6vw,2.7rem)] text-white">
              {title}
            </h2>
            <p className="mt-5 max-w-[56ch] text-white/70">{body}</p>
            <p className="mt-4 text-[0.9rem] text-white/50">
              Risposta entro {SLA.replyHours} ore lavorative · {SLA.days},{' '}
              {SLA.hours} · nessun impegno
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <a
              href={WHATSAPP_FREE_QUOTE}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-mint px-7 py-4 font-bold text-navy transition-colors hover:bg-white"
            >
              <WhatsappGlyph className="h-[1.1rem] w-[1.1rem]" />
              Ricevi un preventivo gratis
            </a>
            <a
              href={WHATSAPP_GENERIC}
              target="_blank"
              rel="noopener noreferrer"
              className="text-center text-[0.9rem] text-white/60 underline decoration-white/30 underline-offset-4 hover:text-white"
            >
              Oppure fai una domanda, senza impegno
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

/** Long-form text: the legal pages and anything else that is mostly prose. */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="prose-delegami max-w-[68ch] space-y-5 text-slate-ink [&_a]:font-medium [&_a]:text-navy [&_a]:underline [&_a]:decoration-mint [&_a]:decoration-2 [&_a]:underline-offset-4 [&_h2]:mt-12 [&_h2]:text-[1.4rem] [&_h2]:text-navy [&_h3]:mt-8 [&_h3]:text-[1.1rem] [&_h3]:text-navy [&_li]:mb-2 [&_strong]:text-navy [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
      {children}
    </div>
  )
}
