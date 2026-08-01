'use client'

import { useTransition } from 'react'
import { Copy } from 'lucide-react'
import { cloneInvoice } from '@/modules/invoices/actions'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/ui/use-confirm'

export function CloneInvoiceButton({ id }: { id: string }) {
  const { confirm, dialog } = useConfirm()
  const [isPending, startTransition] = useTransition()

  async function handleClone() {
    const ok = await confirm({
      title: 'Creare una nuova versione?',
      description: 'La fattura attuale resta invariata; la nuova versione parte come bozza.',
      confirmLabel: 'Crea versione',
    })
    if (!ok) return
    startTransition(async () => {
      await cloneInvoice(id)
    })
  }

  return (
    <>
      {dialog}
      <Button variant="secondary" size="sm" onClick={handleClone} loading={isPending}>
      <Copy className="w-4 h-4" /> Nuova versione
      </Button>
    </>
  )
}
