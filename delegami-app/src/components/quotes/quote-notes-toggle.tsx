'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setQuoteShowClientNotes } from '@/modules/quotes/actions'

export function QuoteNotesToggle({
  quoteId,
  initialShow,
}: {
  quoteId: string
  initialShow: boolean
}) {
  const [show, setShow] = useState(initialShow)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function toggle() {
    const next = !show
    setShow(next) // optimistic
    startTransition(async () => {
      const res = await setQuoteShowClientNotes(quoteId, next)
      if (res.message) {
        setShow(!next) // revert on error
        return
      }
      router.refresh()
    })
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      title="Mostra/nascondi il blocco 'Note e condizioni' nel PDF"
      className={`no-print px-3 py-1.5 rounded text-body font-medium border transition-colors disabled:opacity-50 ${
        show
          ? 'bg-action-surface text-action border-action-border hover:bg-action-surface'
          : 'bg-surface text-ink-muted border-line hover:bg-surface-raised'
      }`}
    >
      {show ? '☑' : '☐'} Note e condizioni
    </button>
  )
}
