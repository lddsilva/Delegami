'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileJson, Loader2, AlertCircle, CheckCircle2, Copy } from 'lucide-react'

interface ProjectOption {
  id: string
  name: string
  clientName: string
}

interface Props {
  projects: ProjectOption[]
  instructions: string
  exampleJson: string
  importAction: (projectId: string | null, jsonText: string) => Promise<{ id?: string; error?: string }>
}

function buildPreview(parsed: unknown): { label: string; value: string }[] {
  if (!parsed || typeof parsed !== 'object') return []
  const obj = parsed as Record<string, unknown>
  const out: { label: string; value: string }[] = []

  if (typeof obj.title === 'string') out.push({ label: 'Titolo', value: obj.title })
  if (typeof obj.type === 'string') out.push({ label: 'Tipo', value: obj.type })

  const blocks = Array.isArray(obj.blocks) ? obj.blocks : []
  out.push({ label: 'Blocchi totali', value: String(blocks.length) })

  const counts = blocks.reduce((acc: Record<string, number>, block: unknown) => {
    const t = (block as { type?: string })?.type
    if (typeof t === 'string') acc[t] = (acc[t] ?? 0) + 1
    return acc
  }, {})

  Object.entries(counts).forEach(([type, count]) => {
    out.push({ label: type, value: String(count) })
  })

  return out
}

export function ReportImportClient({ projects, instructions, exampleJson, importAction }: Props) {
  const router = useRouter()
  const [projectId, setProjectId] = useState('')
  const [jsonText, setJsonText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [instructionCopied, setInstructionCopied] = useState(false)

  const parsed = useMemo(() => {
    if (!jsonText.trim()) return null
    try {
      return JSON.parse(jsonText)
    } catch {
      return null
    }
  }, [jsonText])

  const preview = useMemo(() => buildPreview(parsed), [parsed])

  async function submit() {
    if (!jsonText.trim()) { setError('Incolla o carica il JSON'); return }
    setLoading(true)
    setError(null)
    const result = await importAction(projectId || null, jsonText)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    if (result.id) router.push(`/relatorio/${result.id}`)
  }

  async function copyInstructions() {
    try {
      await navigator.clipboard.writeText(instructions)
      setInstructionCopied(true)
      setTimeout(() => setInstructionCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  async function handleFile(file: File) {
    const text = await file.text()
    setJsonText(text)
  }

  return (
    <div className="space-y-6">
      <details className="rounded-control border border-line bg-surface" open>
        <summary className="cursor-pointer px-4 py-3 text-body font-medium text-ink flex items-center justify-between">
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

      <div className="rounded-control border border-line bg-surface p-4 space-y-4">
        <div>
          <label className="block text-body font-medium text-ink mb-1.5">Opera collegata</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full rounded-control border border-line px-3 py-2 text-body"
          >
            <option value="">— Senza progetto (aziendale) —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name} · {p.clientName}</option>
            ))}
          </select>
          <p className="mt-1 text-label text-ink-muted">Lascia vuoto per un relatorio interno aziendale senza opera.</p>
        </div>

        <div>
          <label className="block text-body font-medium text-ink mb-1.5">
            JSON relatorio <span className="text-negative">*</span>
          </label>
          <div className="flex items-center gap-2 mb-2">
            <label className="inline-flex items-center gap-2 rounded-control border border-line bg-surface px-3 py-1.5 text-body text-ink hover:bg-surface-raised cursor-pointer">
              <FileJson className="h-4 w-4" />
              Carica file .json
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
              />
            </label>
            <button
              type="button"
              onClick={() => setJsonText('')}
              disabled={!jsonText}
              className="text-label text-ink-muted hover:text-negative disabled:opacity-40"
            >
              Pulisci
            </button>
          </div>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder="Incolla qui il JSON generato dal chat IA…"
            rows={14}
            className="w-full font-mono text-label rounded-control border border-line px-3 py-2 leading-relaxed"
          />
          {jsonText && !parsed && (
            <p className="mt-1 text-label text-attention flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" /> JSON non valido — controlla parentesi e virgole
            </p>
          )}
        </div>

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
            Importa relatorio
          </button>
        </div>
      </div>
    </div>
  )
}
