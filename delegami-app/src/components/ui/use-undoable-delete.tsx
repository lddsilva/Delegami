'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Undo2 } from 'lucide-react'

/** How long the user has to change their mind. */
const UNDO_WINDOW_MS = 7000

/**
 * Undo for destructive actions, by deferring them rather than reversing them.
 *
 * The app had no undo of any kind: every delete was final, mediated only by a
 * native confirm() dialog, over real production records.
 *
 * The obvious fix is soft-delete, and it is the wrong one here. `deletedAt`
 * would have to be honoured at ~80 query sites plus every nested `include`
 * (project.expenses, quote.invoices, client.projects…). Missing one does not
 * fail loudly — it silently resurrects deleted data, potentially into a PDF
 * already sent to a client. That is worse than having no undo.
 *
 * So: nothing is deleted until the window closes. Cancelling is total, because
 * nothing happened. If the tab is closed mid-window the delete simply never
 * runs, which fails toward keeping the record — the safe direction.
 *
 *   const { scheduleDelete, isPending, undoToast } = useUndoableDelete()
 *   ...
 *   scheduleDelete({ label: 'Spesa eliminata', commit: () => deleteExpense(id) })
 *   ...
 *   return <>{undoToast}<Button disabled={isPending} …/></>
 */
export function useUndoableDelete() {
  const router = useRouter()
  const [pending, setPending] = useState<{ label: string; commit: () => Promise<unknown> } | null>(null)
  const [remaining, setRemaining] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tick = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimers = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    if (tick.current) clearInterval(tick.current)
    timer.current = null
    tick.current = null
  }, [])

  const scheduleDelete = useCallback(
    ({ label, commit }: { label: string; commit: () => Promise<unknown> }) => {
      clearTimers()
      setPending({ label, commit })
      setRemaining(Math.ceil(UNDO_WINDOW_MS / 1000))

      tick.current = setInterval(() => setRemaining((n) => Math.max(0, n - 1)), 1000)
      timer.current = setTimeout(async () => {
        clearTimers()
        await commit()
        setPending(null)
        router.refresh()
      }, UNDO_WINDOW_MS)
    },
    [clearTimers, router],
  )

  const undo = useCallback(() => {
    clearTimers()
    setPending(null)
  }, [clearTimers])

  useEffect(() => clearTimers, [clearTimers])

  const undoToast = pending ? (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div
        role="status"
        className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-surface border border-line bg-ink px-4 py-3 text-ink-inverse shadow-overlay"
      >
        <Trash2 className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
        <p className="flex-1 text-body">
          {pending.label}
          <span className="ml-2 opacity-60 numeric">{remaining}s</span>
        </p>
        <button
          type="button"
          onClick={undo}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-control px-3 text-body font-medium hover:bg-surface/10"
        >
          <Undo2 className="h-4 w-4" />
          Annulla
        </button>
      </div>
    </div>
  ) : null

  return { scheduleDelete, undo, isPending: pending !== null, undoToast }
}
