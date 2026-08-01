'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteSchedule } from '@/modules/schedules/actions'
import { useToast } from '@/components/ui/use-toast'

export function DeleteScheduleButton({ scheduleId }: { scheduleId: string }) {
  const { toastError, toaster } = useToast()
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteSchedule(scheduleId)
      if (result?.error) {
        toastError(result.error)
        setConfirming(false)
        return
      }
      router.refresh()
    })
  }

  if (confirming) {
    return (
      <>
        {toaster}
        <div className="flex items-center gap-1.5">
        <Button type="button" variant="danger" size="sm" onClick={handleDelete} disabled={isPending}>
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Conferma
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => setConfirming(false)} disabled={isPending}>
          Annulla
        </Button>
        </div>
      </>
    )
  }

  return (
    <>
      {toaster}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setConfirming(true)}
        aria-label="Elimina cronograma"
        title="Elimina cronograma"
      >
        <Trash2 className="h-4 w-4 text-negative" />
      </Button>
    </>
  )
}
