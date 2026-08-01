'use client'

import { useState } from 'react'
import { CheckCircle2, FileJson, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportShoppingListAiContext } from '@/modules/shopping-lists/actions'

export function ExportShoppingAiButton({ projectId, label }: { projectId: string; label: string }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    const result = await exportShoppingListAiContext(projectId)
    setLoading(false)
    if (result.error || !result.data) {
      setError(result.error ?? 'Errore')
      return
    }
    const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${label.replace(/\s+/g, '-')}-lista-acquisti-ia.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setDone(true)
    setTimeout(() => setDone(false), 1800)
  }

  return (
    <>
      <Button type="button" variant="secondary" size="sm" onClick={handleClick} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : done ? <CheckCircle2 className="h-4 w-4 text-positive" /> : <FileJson className="h-4 w-4" />}
        {done ? 'Esportato' : 'Esporta per IA'}
      </Button>
      {error && <span className="text-label text-negative">{error}</span>}
    </>
  )
}
