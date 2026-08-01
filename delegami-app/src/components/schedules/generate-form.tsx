'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarPlus, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ensureSchedule, generateScheduleFromQuote } from '@/modules/schedules/actions'
import { formatCurrency, formatDateInput } from '@/lib/utils'

interface Props {
  projectId: string
  approvedQuotes: Array<{ id: string; quoteNumber: string; version: number; total: number }>
  projectStartDate?: Date | string | null
  buttonLabel?: string
  allowBlank?: boolean
}

export function GenerateScheduleForm({
  projectId,
  approvedQuotes,
  projectStartDate,
  buttonLabel = 'Genera cronograma',
  allowBlank = false,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [quoteId, setQuoteId] = useState(approvedQuotes[0]?.id ?? '')
  const [startDate, setStartDate] = useState(formatDateInput(projectStartDate) || formatDateInput(new Date()))
  const [error, setError] = useState<string | null>(null)

  const hasQuotes = approvedQuotes.length > 0
  const selectedTotal = useMemo(
    () => approvedQuotes.find((quote) => quote.id === quoteId)?.total,
    [approvedQuotes, quoteId],
  )

  function generate() {
    if (!quoteId) {
      setError('Seleziona un preventivo')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await generateScheduleFromQuote(projectId, quoteId, startDate)
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
      const result = await ensureSchedule(projectId)
      if (result?.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-2">
      {hasQuotes && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
          <select
            value={quoteId}
            onChange={(event) => setQuoteId(event.target.value)}
            disabled={isPending}
            className="rounded-control border border-line bg-surface px-2 py-1.5 text-body"
          >
            {approvedQuotes.map((quote) => (
              <option key={quote.id} value={quote.id}>
                {quote.quoteNumber} v{quote.version} - {formatCurrency(quote.total)}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            disabled={isPending}
            className="rounded-control border border-line bg-surface px-2 py-1.5 text-body"
          />
          <Button type="button" size="sm" onClick={generate} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {buttonLabel}
          </Button>
        </div>
      )}

      {hasQuotes && selectedTotal != null && (
        <p className="text-label text-ink-muted">Preventivo selezionato: {formatCurrency(selectedTotal)}</p>
      )}

      {allowBlank && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button type="button" variant="secondary" size="sm" onClick={createBlank} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
            Crea vuoto
          </Button>
          {!hasQuotes && (
            <p className="text-label text-ink-muted">
              Nessun preventivo approvato disponibile. Puoi creare il cronograma vuoto e aggiungere fasi manualmente.
            </p>
          )}
        </div>
      )}

      {error && <p className="text-label text-negative">{error}</p>}
    </div>
  )
}
