'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Shared body for every route-level error.tsx.
 *
 * Without an error boundary a failed query fell through to Next's default screen,
 * which in production is a bare "Application error: a client-side exception has
 * occurred" with no way back. This at least names the area that failed and offers
 * a retry.
 */
export function ErrorState({
  title = 'Qualcosa è andato storto',
  description = 'Non è stato possibile caricare questa pagina. Riprova tra un momento.',
  reset,
}: {
  title?: string
  description?: string
  reset?: () => void
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-16 text-center">
      <AlertTriangle className="h-8 w-8 text-attention" />
      <h1 className="text-title font-semibold text-ink">{title}</h1>
      <p className="text-body text-ink-muted">{description}</p>
      {reset && (
        <Button onClick={reset} className="mt-2">
          Riprova
        </Button>
      )}
    </div>
  )
}
