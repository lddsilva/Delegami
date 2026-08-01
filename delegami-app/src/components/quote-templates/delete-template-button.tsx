'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteTemplate } from '@/modules/quote-templates/actions'

interface Props {
  id: string
  name: string
}

export function DeleteTemplateButton({ id, name }: Props) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setLoading(true)
    setError(null)
    const result = await deleteTemplate(id)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-label text-ink-muted hidden md:inline">Elimina &quot;{name}&quot;?</span>
        <Button variant="danger" size="sm" loading={loading} onClick={handleDelete}>Sì</Button>
        <Button variant="secondary" size="sm" onClick={() => setConfirming(false)}>No</Button>
        {error && <span className="text-label text-negative">{error}</span>}
      </div>
    )
  }

  return (
    <Button variant="ghost" size="sm" onClick={() => setConfirming(true)} title="Elimina template">
      <Trash2 className="h-3.5 w-3.5 text-negative" />
    </Button>
  )
}
