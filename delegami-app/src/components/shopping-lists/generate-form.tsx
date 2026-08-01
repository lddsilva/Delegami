'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FilePlus2, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createEmptyShoppingList, generateShoppingListFromQuote } from '@/modules/shopping-lists/actions'
import { formatCurrency } from '@/lib/utils'

interface Props {
  projectId: string
  approvedQuotes: Array<{ id: string; quoteNumber: string; version: number; total: number }>
  buttonLabel?: string
  allowBlank?: boolean
}

export function GenerateShoppingListForm({ projectId, approvedQuotes, buttonLabel = 'Genera lista', allowBlank = false }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [quoteId, setQuoteId] = useState(approvedQuotes[0]?.id ?? '')
  const [error, setError] = useState<string | null>(null)

  function submit() {
    if (!quoteId) {
      setError('Seleziona un preventivo')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await generateShoppingListFromQuote(projectId, quoteId)
      if (result?.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  function createBlank() {
    setError(null)
    startTransition(async () => {
      const result = await createEmptyShoppingList(projectId)
      if (result?.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  if (approvedQuotes.length === 0) {
    return (
      <div className="inline-flex flex-col items-center gap-2">
        {allowBlank && (
          <Button type="button" variant="secondary" size="sm" onClick={createBlank} disabled={isPending}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FilePlus2 className="w-4 h-4" />}
            Crea vuota
          </Button>
        )}
        <p className="text-label text-ink-muted italic">
          Nessun preventivo approvato disponibile per generare la lista.
        </p>
        {error && <p className="text-label text-negative">{error}</p>}
      </div>
    )
  }

  return (
    <div className="inline-flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
      <select
        value={quoteId}
        onChange={(e) => setQuoteId(e.target.value)}
        disabled={isPending}
        className="rounded-control border border-line px-2 py-1.5 text-body bg-surface"
      >
        {approvedQuotes.map((q) => (
          <option key={q.id} value={q.id}>
            {q.quoteNumber} v{q.version} — {formatCurrency(q.total)}
          </option>
        ))}
      </select>
      <Button onClick={submit} disabled={isPending} size="sm">
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {buttonLabel}
      </Button>
      {allowBlank && (
        <Button type="button" variant="secondary" onClick={createBlank} disabled={isPending} size="sm">
          <FilePlus2 className="w-4 h-4" />
          Crea vuota
        </Button>
      )}
      {error && <p className="text-label text-negative">{error}</p>}
    </div>
  )
}
