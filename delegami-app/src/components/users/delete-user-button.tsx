'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteUser } from '@/modules/users/actions'
import { useConfirm } from '@/components/ui/use-confirm'

interface Props {
  id: string
  name: string
}

export function DeleteUserButton({ id, name }: Props) {
  const [pending, startTransition] = useTransition()
  const { confirm, dialog } = useConfirm()

  async function handleDelete() {
    const ok = await confirm({
      title: 'Eliminare l’utente?',
      description: `"${name}" verrà eliminato. L'azione non può essere annullata.`,
      confirmLabel: 'Elimina',
      destructive: true,
    })
    if (!ok) return
    startTransition(() => { deleteUser(id) })
  }

  return (
    <>
      {dialog}
      <Button
        variant="ghost"
        size="sm"
        loading={pending}
        onClick={handleDelete}
        aria-label={`Elimina l'utente ${name}`}
        className="text-negative hover:bg-negative-surface hover:text-negative"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </>
  )
}
