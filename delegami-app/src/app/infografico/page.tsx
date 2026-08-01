import Image from 'next/image'
import { redirect } from 'next/navigation'
import { Download, ExternalLink } from 'lucide-react'
import { getSession } from '@/lib/auth'

const INFOGRAPHIC_SRC = '/zanetti-office-infografico.png'

export default async function InfograficoPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="page-wide space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-title font-semibold text-ink sm:text-display">Infografico Delegami</h1>
          <p className="mt-0.5 text-body text-ink-muted">Mappa visuale del funzionamento dell&apos;app.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={INFOGRAPHIC_SRC}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-control border border-line-strong bg-surface px-3 py-1.5 text-label font-medium text-ink transition-colors hover:bg-surface-raised"
          >
            <ExternalLink className="h-4 w-4" />
            Apri grande
          </a>
          <a
            href={INFOGRAPHIC_SRC}
            download
            className="inline-flex items-center justify-center gap-2 rounded-control border border-line-strong bg-surface px-3 py-1.5 text-label font-medium text-ink transition-colors hover:bg-surface-raised"
          >
            <Download className="h-4 w-4" />
            Scarica
          </a>
        </div>
      </div>

      <section className="rounded-control border border-line bg-surface p-2 shadow-sm sm:p-3">
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <Image
              src={INFOGRAPHIC_SRC}
              alt={'Infografico Delegami: gestione completa dell\'opera'}
              width={1672}
              height={941}
              priority
              sizes="(max-width: 1024px) 760px, calc(100vw - 22rem)"
              className="h-auto w-full rounded-control"
            />
          </div>
        </div>
      </section>

      <p className="text-label text-ink-muted sm:hidden">Scorri lateralmente per leggere tutta l&apos;immagine.</p>
    </div>
  )
}
