'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { markInvoicePaid, markInvoiceSent } from '@/modules/invoices/actions'

/**
 * `primary` marks this as the screen's single ranked action. A draft invoice is
 * waiting to go out and a sent one is waiting to be settled — on both, this is
 * what the page is for, so it carries the weight and everything else recedes.
 */
export function MarkPaidButton({ id, status, primary = false }: { id: string; status: string; primary?: boolean }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(action: () => Promise<{ error?: string }>) {
    setLoading(true)
    setError(null)
    const result = await action()
    setLoading(false)
    if (result?.error) setError(result.error)
    else router.refresh()
  }

  if (status === 'DRAFT') {
    return (
      <div className="flex flex-col items-start gap-1">
        <Button variant={primary ? 'primary' : 'secondary'} size="sm" loading={loading} onClick={() => run(() => markInvoiceSent(id))}>
          <Send className={`w-4 h-4 ${primary ? '' : 'text-action'}`} /> Segna inviata
        </Button>
        {error && <p className="text-label text-negative">{error}</p>}
      </div>
    )
  }

  if (status === 'SENT') {
    if (confirming) {
      return (
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-2">
            <span className="text-body text-ink-muted">Segnare come pagata?</span>
            <Button
              variant="secondary"
              size="sm"
              className="border-positive text-positive"
              loading={loading}
              onClick={() => run(() => markInvoicePaid(id))}
            >
              Si, pagata
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setConfirming(false)}>Annulla</Button>
          </div>
          {error && <p className="text-label text-negative">{error}</p>}
        </div>
      )
    }
    return (
      <Button variant={primary ? 'primary' : 'secondary'} size="sm" onClick={() => setConfirming(true)}>
        <CheckCircle className={`w-4 h-4 ${primary ? '' : 'text-positive'}`} /> Segna pagata
      </Button>
    )
  }

  return null
}
