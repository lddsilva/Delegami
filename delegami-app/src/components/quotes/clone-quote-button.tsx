'use client'

import { useTransition } from 'react'
import { Copy } from 'lucide-react'
import { cloneQuote } from '@/modules/quotes/actions'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/ui/use-confirm'

export function CloneQuoteButton({ id, primary = false }: { id: string; primary?: boolean }) {
  const { confirm, dialog } = useConfirm()
  const [isPending, startTransition] = useTransition()

  async function handleClone() {
    const ok = await confirm({
      title: 'Creare una nuova versione?',
      description: 'Il preventivo attuale resta invariato; la nuova versione parte come bozza.',
      confirmLabel: 'Crea versione',
    })
    if (!ok) return
    startTransition(async () => {
      await cloneQuote(id)
    })
  }

  return (
    <>
      {dialog}
      <Button variant={primary ? 'primary' : 'secondary'} size="sm" onClick={handleClone} loading={isPending}>
      <Copy className="w-4 h-4" /> Nuova versione
      </Button>
    </>
  )
}
