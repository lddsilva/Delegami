'use client'

import { useRef, useState, useTransition } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { uploadCompanyDocument } from '@/modules/documents/actions'

const documentTypes = [
  { value: 'LEGAL', label: 'Normativa / legge' },
  { value: 'PERMIT', label: 'Permesso / licenza' },
  { value: 'CONTRACT', label: 'Contratto' },
  { value: 'TECHNICAL', label: 'Documento tecnico' },
  { value: 'ADMINISTRATIVE', label: 'Enti / assicurazioni' },
]

export function CompanyDocumentUpload() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [documentType, setDocumentType] = useState('LEGAL')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function upload(files: FileList | null) {
    if (!files?.length) return
    setError(null)
    startTransition(async () => {
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('documentType', documentType)
        const result = await uploadCompanyDocument(fd)
        if (result?.error) {
          setError(result.error)
          if (inputRef.current) inputRef.current.value = ''
          return
        }
      }
      if (inputRef.current) inputRef.current.value = ''
    })
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <select
        value={documentType}
        onChange={(event) => setDocumentType(event.target.value)}
        className="text-body border border-line rounded-control px-2.5 min-h-11 bg-surface outline-none focus:border-action"
      >
        {documentTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
      </select>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        className="inline-flex items-center justify-center gap-2 px-3 min-h-11 rounded-control border border-line bg-surface text-body font-medium text-ink hover:bg-surface-raised disabled:opacity-50"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        Carica documento
      </button>
      <input ref={inputRef} type="file" multiple className="hidden" onChange={(event) => upload(event.target.files)} />
      {error && <span className="text-label text-negative">{error}</span>}
    </div>
  )
}
