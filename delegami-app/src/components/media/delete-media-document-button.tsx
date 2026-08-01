'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { deleteDocument } from '@/modules/documents/actions'
import { useConfirm } from '@/components/ui/use-confirm'

interface Props {
  documentId: string
  documentName: string
}

export function DeleteMediaDocumentButton({ documentId, documentName }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const { confirm, dialog } = useConfirm()

  async function handleDelete() {
    const confirmed = await confirm({
      title: 'Eliminare il documento?',
      description: `"${documentName}" verrà eliminato definitivamente.`,
      confirmLabel: 'Elimina',
      destructive: true,
    })
    if (!confirmed) return

    setError(null)
    startTransition(async () => {
      const result = await deleteDocument(documentId, '/media')
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
        className="flex items-center gap-1 text-label text-ink-muted hover:text-negative transition-colors shrink-0 disabled:opacity-50"
        aria-label="Elimina documento"
      >
        {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
      </button>
      {error && (
        <span className="absolute right-0 top-6 z-10 w-48 rounded-control border border-negative-border bg-surface px-2 py-1 text-label text-negative shadow-sm">
          {error}
        </span>
      )}
    </div>
  )
}
