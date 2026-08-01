'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/ui/use-confirm'
import { useUndoableDelete } from '@/components/ui/use-undoable-delete'

/**
 * One delete control for the whole app.
 *
 * Thirteen components had grown their own version of this: some with a native
 * confirm(), some with an inline two-step "Sì, elimina / Annulla", none with any
 * way back once the action fired.
 *
 * Two postures, chosen by what is at stake:
 *
 * - `cascades` false (default) — a single record. One click, then a 7 second
 *   undo window. Asking "are you sure?" *and* offering undo is belt and braces;
 *   undo is the better half, because it costs nothing when the user was right
 *   and saves them when they were not.
 *
 * - `cascades` true — deleting this takes children with it (an opera and all its
 *   quotes, invoices and expenses; a client and all its opere). Here the user
 *   genuinely cannot picture the blast radius, so it keeps a confirmation that
 *   spells it out, *and* the undo window after it.
 */
export function DeleteButton({
  onDelete,
  entityLabel,
  deletedLabel,
  cascades = false,
  cascadeDescription,
  label = 'Elimina',
  showLabel = true,
  size = 'sm',
}: {
  /** The server action. Not called until the undo window closes. */
  onDelete: () => Promise<unknown>
  /** What is being deleted, for the accessible name: "Elimina la spesa Ponteggio". */
  entityLabel: string
  /** Past tense for the undo toast: "Spesa eliminata". */
  deletedLabel: string
  cascades?: boolean
  cascadeDescription?: string
  label?: string
  showLabel?: boolean
  size?: 'sm' | 'md'
}) {
  const { confirm, dialog } = useConfirm()
  const { scheduleDelete, isPending, undoToast } = useUndoableDelete()

  async function handleClick() {
    if (cascades) {
      const ok = await confirm({
        title: `Eliminare ${entityLabel}?`,
        description:
          cascadeDescription ?? 'Verranno eliminati anche tutti i dati collegati.',
        confirmLabel: 'Elimina',
        destructive: true,
      })
      if (!ok) return
    }
    scheduleDelete({ label: deletedLabel, commit: onDelete })
  }

  return (
    <>
      {dialog}
      {undoToast}
      <Button
        variant="ghost"
        size={size}
        onClick={handleClick}
        disabled={isPending}
        aria-label={`Elimina ${entityLabel}`}
        className="text-negative hover:bg-negative-surface hover:text-negative"
      >
        <Trash2 className="h-4 w-4" />
        {showLabel && label}
      </Button>
    </>
  )
}
