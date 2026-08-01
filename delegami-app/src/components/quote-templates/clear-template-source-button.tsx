'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { clearTemplateSourceQuote } from '@/modules/quote-templates/actions'
import { useConfirm } from '@/components/ui/use-confirm'

export function ClearTemplateSourceButton({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { confirm, dialog } = useConfirm()

  async function handleClick() {
    const ok = await confirm({
      title: 'Rimuovere il riferimento?',
      description: 'Il template resta, ma perde il collegamento al preventivo eliminato.',
      confirmLabel: 'Rimuovi',
    })
    if (!ok) return
    setLoading(true)
    setError(null)
    const result = await clearTemplateSourceQuote(id)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    router.refresh()
  }

  return (
    <>
      {dialog}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        loading={loading}
        aria-label="Rimuovi riferimento al preventivo eliminato"
        title="Rimuovi riferimento al preventivo eliminato"
      >
        <X className="h-4 w-4 text-ink-muted" />
      </Button>
      {error && <p className="mt-1 text-label text-negative">{error}</p>}
    </>
  )
}
