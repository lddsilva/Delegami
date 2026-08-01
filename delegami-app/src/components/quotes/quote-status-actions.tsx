'use client'

import { useState } from 'react'
import { Send, ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateQuoteStatus } from '@/modules/quotes/actions'
import type { QuoteStatus } from '@/generated/prisma/enums'

interface Props {
  id: string
  status: QuoteStatus
  /**
   * Whether the status transition is *the* next step on this screen.
   *
   * A quote in DRAFT is waiting to be sent; one in SENT is waiting for a yes or
   * a no. When that is what the screen is for, the button says so by weight —
   * otherwise the money action (create an invoice) outranks it and this stays
   * secondary. Only one button on the screen is ever primary.
   */
  primary?: boolean
}

export function QuoteStatusActions({ id, status, primary = false }: Props) {
  const [loading, setLoading] = useState<string | null>(null)

  async function transition(next: QuoteStatus) {
    setLoading(next)
    await updateQuoteStatus(id, next)
    setLoading(null)
  }

  if (status === 'DRAFT') {
    return (
      <Button
        variant={primary ? 'primary' : 'secondary'}
        size="sm"
        loading={loading === 'SENT'}
        onClick={() => transition('SENT' as QuoteStatus)}
      >
        <Send className="w-4 h-4" /> Segna come inviato
      </Button>
    )
  }

  if (status === 'SENT') {
    return (
      <>
        {/* Approvato leads; Rifiutato stays secondary. Both are one click, but
            only one of them is the outcome the business is waiting for. */}
        <Button
          variant={primary ? 'primary' : 'secondary'}
          size="sm"
          className={primary ? 'bg-positive hover:brightness-95' : 'border-positive text-positive hover:bg-positive-surface'}
          loading={loading === 'APPROVED'}
          onClick={() => transition('APPROVED' as QuoteStatus)}
        >
          <ThumbsUp className="w-4 h-4" /> Approvato
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="border-negative text-negative hover:bg-negative-surface"
          loading={loading === 'REJECTED'}
          onClick={() => transition('REJECTED' as QuoteStatus)}
        >
          <ThumbsDown className="w-4 h-4" /> Rifiutato
        </Button>
      </>
    )
  }

  if (status === 'REJECTED') {
    return (
      <Button
        variant="secondary"
        size="sm"
        loading={loading === 'DRAFT'}
        onClick={() => transition('DRAFT' as QuoteStatus)}
      >
        <RotateCcw className="w-4 h-4" /> Riapri come bozza
      </Button>
    )
  }

  return null
}
