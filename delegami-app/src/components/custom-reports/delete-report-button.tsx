'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { deleteCustomReport } from '@/modules/custom-reports/actions'
import { useConfirm } from '@/components/ui/use-confirm'

interface Props {
  reportId: string
  reportTitle: string
}

export function DeleteReportButton({ reportId, reportTitle }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const { confirm, dialog } = useConfirm()

  async function handleDelete() {
    const confirmed = await confirm({
      title: 'Eliminare il relatorio?',
      description: `"${reportTitle}" verrà eliminato definitivamente.`,
      confirmLabel: 'Elimina',
      destructive: true,
    })
    if (!confirmed) return
    setError(null)
    startTransition(async () => {
      const result = await deleteCustomReport(reportId)
      if (result?.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="relative">
      {dialog}
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="inline-flex items-center gap-1 text-label text-ink-muted hover:text-negative transition-colors disabled:opacity-50"
        aria-label="Elimina relatorio"
      >
        {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
      </button>
      {error && (
        <span className="absolute right-0 top-6 z-10 w-56 rounded-control border border-negative-border bg-surface px-2 py-1 text-label text-negative shadow-sm">
          {error}
        </span>
      )}
    </div>
  )
}
