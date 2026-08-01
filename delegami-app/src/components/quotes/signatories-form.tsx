'use client'

import { useState, useTransition } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { updateQuoteSignatories } from '@/modules/quotes/actions'
import { Button } from '@/components/ui/button'

interface Props {
  quoteId: string
  signatories: string | null
  canEdit: boolean
}

export function SignatoriesForm({ quoteId, signatories, canEdit }: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(signatories ?? '')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSave() {
    startTransition(async () => {
      const result = await updateQuoteSignatories(quoteId, value)
      if (result.message) {
        setError(result.message)
      } else {
        setEditing(false)
        setError(null)
      }
    })
  }

  function handleCancel() {
    setValue(signatories ?? '')
    setEditing(false)
    setError(null)
  }

  if (!editing) {
    return (
      <div className="flex items-start gap-2">
        <div className="flex-1 text-body text-ink-muted whitespace-pre-wrap min-h-[1.25rem]">
          {signatories || <span className="text-ink-muted italic">Non specificati</span>}
        </div>
        {canEdit && (
          <button onClick={() => setEditing(true)} className="text-ink-muted hover:text-action transition-colors shrink-0 mt-0.5">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <textarea
        className="w-full text-body border border-line-strong rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-action resize-none"
        rows={3}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Dr. Franco Martini&#10;Muriel Martini"
        autoFocus
      />
      <p className="text-label text-ink-muted">Un nome per riga — appaiono come righe di firma nel PDF cliente</p>
      {error && <p className="text-label text-negative">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} loading={pending}>
          <Check className="w-3.5 h-3.5" /> Salva
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCancel} disabled={pending}>
          <X className="w-3.5 h-3.5" /> Annulla
        </Button>
      </div>
    </div>
  )
}
