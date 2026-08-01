'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteShoppingList } from '@/modules/shopping-lists/actions'
import { useToast } from '@/components/ui/use-toast'

export function DeleteShoppingListButton({ listId }: { listId: string }) {
  const { toastError, toaster } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteShoppingList(listId)
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
        <Button variant="danger" size="sm" onClick={handleDelete} disabled={isPending}>
          {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Conferma
        </Button>
          <Button variant="secondary" size="sm" onClick={() => setConfirming(false)} disabled={isPending}>Annulla</Button>
        </div>
      </>
    )
  }

  return (
    <>
      {toaster}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setConfirming(true)}
        aria-label="Elimina lista"
        title="Elimina lista"
      >
        <Trash2 className="h-4 w-4 text-negative" />
      </Button>
    </>
  )
}
