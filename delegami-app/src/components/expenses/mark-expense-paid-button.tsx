'use client'

import { useState, useTransition } from 'react'
import { CheckCircle, RotateCcw, Loader2 } from 'lucide-react'
import { markExpensePaid, markExpensePending } from '@/modules/expenses/actions'

interface Props {
  id: string
  currentStatus: string
}

export function MarkExpensePaidButton({ id, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = currentStatus === 'PAID'
        ? await markExpensePending(id)
        : await markExpensePaid(id)
      if (result?.error) setError(result.error)
    })
  }

  if (currentStatus === 'PAID') {
    return (
      <div className="flex items-center gap-1">
        {error && <span className="text-label text-negative">{error}</span>}
        <button
          onClick={handleClick}
          disabled={isPending}
          className="tap-target inline-flex items-center justify-center gap-1 px-3 rounded-control text-label font-medium text-ink-muted hover:text-attention hover:bg-attention-surface transition-colors duration-state disabled:opacity-50"
          aria-label="Segna la spesa come non pagata"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">Non pagata</span>
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      {error && <span className="text-label text-negative">{error}</span>}
      <button
        onClick={handleClick}
        disabled={isPending}
        className="tap-target inline-flex items-center justify-center gap-1 px-3 rounded-control text-label font-medium text-positive hover:bg-positive-surface border border-positive transition-colors duration-state disabled:opacity-50"
        aria-label="Segna la spesa come pagata"
      >
        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
        <span>Paga</span>
      </button>
    </div>
  )
}
