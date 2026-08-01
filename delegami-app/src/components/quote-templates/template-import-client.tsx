'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, Copy, FileJson, Loader2 } from 'lucide-react'

interface Props {
  importAction: (jsonText: string) => Promise<{ templateId?: string; error?: string }>
  instructions: string
  exampleJson: string
}

function previewSummary(parsed: unknown): { label: string; value: string }[] {
  if (!parsed || typeof parsed !== 'object') return []
  const obj = parsed as Record<string, unknown>
  const items = Array.isArray(obj.items) ? obj.items : []
  const out: { label: string; value: string }[] = []
  if (typeof obj.name === 'string') out.push({ label: 'Nome', value: obj.name })
  if (typeof obj.category === 'string') out.push({ label: 'Categoria', value: obj.category })
  if (typeof obj.subcategory === 'string') out.push({ label: 'Sotto', value: obj.subcategory })
  out.push({ label: 'Voci', value: String(items.length) })
  return out
}

export function TemplateImportClient({ importAction, instructions, exampleJson }: Props) {
  const router = useRouter()
  const [jsonText, setJsonText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [instructionCopied, setInstructionCopied] = useState(false)

  const parsed = useMemo(() => {
    if (!jsonText.trim()) return null
    try { return JSON.parse(jsonText) } catch { return null }
  }, [jsonText])

  const preview = useMemo(() => previewSummary(parsed), [parsed])

  async function submit() {
    if (!jsonText.trim()) { setError('Incolla o carica il JSON'); return }
    setLoading(true)
    setError(null)
    const result = await importAction(jsonText)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    router.push('/settings/templates')
  }

  async function copyInstructions() {
    try {
      await navigator.clipboard.writeText(instructions)
      setInstructionCopied(true)
      setTimeout(() => setInstructionCopied(false), 1500)
    } catch { /* ignore */ }
  }

  async function handleFile(file: File) {
    const text = await file.text()
    setJsonText(text)
  }

  return (
    <div className="space-y-6">
      <details className="rounded-control border border-line bg-surface" open>
        <summary className="cursor-pointer px-4 py-3 text-body font-medium text-ink flex items-center justify-between gap-2">
          <span>Istruzioni per il tuo project del chat IA</span>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); copyInstructions() }}
            className="inline-flex items-center gap-1 rounded-control border border-line px-2 py-1 text-label text-ink-muted hover:bg-surface-raised"
          >
            {instructionCopied ? <CheckCircle2 className="h-3.5 w-3.5 text-positive" /> : <Copy className="h-3.5 w-3.5" />}
            {instructionCopied ? 'Copiato' : 'Copia'}
          </button>
        </summary>
        <pre className="px-4 pb-4 text-label text-ink whitespace-pre-wrap font-mono leading-relaxed">{instructions}</pre>
      </details>

      <details className="rounded-control border border-line bg-surface">
        <summary className="cursor-pointer px-4 py-3 text-body font-medium text-ink">Esempio JSON</summary>
        <pre className="px-4 pb-4 text-label text-ink whitespace-pre overflow-x-auto font-mono leading-relaxed">{exampleJson}</pre>
      </details>

      <div className="rounded-control border border-line bg-surface p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <label className="text-body font-medium text-ink">JSON template</label>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 rounded-control border border-line bg-surface px-3 py-1.5 text-body text-ink hover:bg-surface-raised cursor-pointer">
              <FileJson className="h-4 w-4" />
              Carica .json
              <input type="file" accept=".json,application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
            </label>
            <button type="button" onClick={() => setJsonText('')} disabled={!jsonText} className="text-label text-ink-muted hover:text-negative disabled:opacity-40">
              Pulisci
            </button>
          </div>
        </div>
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder="Incolla qui il JSON generato dal chat IA…"
          rows={12}
          className="w-full font-mono text-label rounded-control border border-line px-3 py-2 leading-relaxed"
        />
        {jsonText && !parsed && (
          <p className="text-label text-attention flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" /> JSON non valido — controlla parentesi e virgole
          </p>
        )}

        {preview.length > 0 && (
          <div className="rounded-control border border-action-border bg-action-surface px-3 py-2 text-body">
            <p className="font-medium text-action mb-1">Anteprima</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-label text-action">
              {preview.map((p) => (
                <span key={p.label}><span className="text-action">{p.label}:</span> {p.value}</span>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-body text-negative flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4" /> {error}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            disabled={loading || !jsonText.trim()}
            onClick={submit}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-control bg-action text-ink-inverse text-body font-medium hover:bg-action-hover disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Importa template
          </button>
        </div>
      </div>
    </div>
  )
}
