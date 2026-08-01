'use client'

import { useState, useTransition } from 'react'
import { CheckCircle, Send, Loader2 } from 'lucide-react'
import { markInvoicePaid, markInvoiceSent } from '@/modules/invoices/actions'

interface Props {
  id: string
  status: string
}

export function MarkInvoiceInlineButton({ id, status }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSent() {
    startTransition(async () => { await markInvoiceSent(id) })
  }

  function handlePaid() {
    setConfirming(false)
    startTransition(async () => { await markInvoicePaid(id) })
  }

  if (isPending) return <Loader2 className="w-4 h-4 animate-spin text-ink-muted" />

  if (status === 'DRAFT') {
    return (
      <button
        onClick={handleSent}
        className="tap-target inline-flex items-center justify-center gap-1 px-3 rounded-control text-label font-medium text-action hover:bg-action-surface border border-action transition-colors duration-state"
        aria-label="Segna la fattura come inviata"
      >
        <Send className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Invia</span>
      </button>
    )
  }

  if (status === 'SENT') {
    if (confirming) {
      return (
        <div className="flex items-center gap-1">
          <button onClick={handlePaid} className="tap-target inline-flex items-center justify-center px-3 rounded-control text-label font-medium text-positive hover:bg-positive-surface border border-positive">Sì</button>
          <button onClick={() => setConfirming(false)} className="tap-target inline-flex items-center justify-center px-3 rounded-control text-label text-ink-muted hover:bg-surface-raised">No</button>
        </div>
      )
    }
    return (
      <button
        onClick={() => setConfirming(true)}
        className="tap-target inline-flex items-center justify-center gap-1 px-3 rounded-control text-label font-medium text-positive hover:bg-positive-surface border border-positive transition-colors duration-state"
        aria-label="Segna la fattura come pagata"
      >
        <CheckCircle className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Paga</span>
      </button>
    )
  }

  return null
}
