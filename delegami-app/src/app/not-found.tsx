import Link from 'next/link'
import { FileQuestion } from 'lucide-react'

/**
 * 33 pages call notFound() and there was no not-found.tsx, so all of them fell
 * through to Next's unstyled default with no way back into the app.
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-16 text-center">
      <FileQuestion className="h-8 w-8 text-ink-subtle" />
      <h1 className="text-title font-semibold text-ink">Pagina non trovata</h1>
      <p className="text-body text-ink-muted">
        Il documento che cercavi non esiste più, oppure l&apos;indirizzo non è corretto.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex min-h-11 items-center rounded-control bg-action px-4 text-body font-medium text-ink-inverse transition-colors duration-state hover:bg-action-hover"
      >
        Torna alla dashboard
      </Link>
    </div>
  )
}
