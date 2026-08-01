'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, Copy, FileJson, Loader2 } from 'lucide-react'
import type { ScheduleImportMode } from '@/modules/schedules/actions'
import type { ShoppingListImportMode } from '@/modules/shopping-lists/actions'

type ImportMode = ScheduleImportMode | ShoppingListImportMode

interface Props {
  projectId: string
  instructions: string
  exampleJson: string
  redirectPath: string
  importAction: (projectId: string, jsonText: string, mode: ImportMode) => Promise<{ id?: string; error?: string }>
  labels: {
    title: string
    jsonLabel: string
    submit: string
  }
}

function previewSummary(parsed: unknown) {
  if (!parsed || typeof parsed !== 'object') return []
  const obj = parsed as Record<string, unknown>
  const items = Array.isArray(obj.items) ? obj.items : []
  const phases = Array.isArray(obj.phases) ? obj.phases : []
  const tasks = phases.reduce((sum, phase) => {
    const list = Array.isArray((phase as { tasks?: unknown }).tasks) ? (phase as { tasks: unknown[] }).tasks : []
    return sum + list.length
  }, 0)

  const out: { label: string; value: string }[] = []
  if (typeof obj.kind === 'string') out.push({ label: 'Tipo', value: obj.kind })
  if (items.length) out.push({ label: 'Articoli', value: String(items.length) })
  if (phases.length) out.push({ label: 'Fasi', value: String(phases.length) })
  if (tasks) out.push({ label: 'Attività', value: String(tasks) })
  if (typeof obj.notes === 'string' && obj.notes.trim()) out.push({ label: 'Note', value: obj.notes.slice(0, 80) })
  return out
}

export function AiJsonImportClient({ projectId, instructions, exampleJson, redirectPath, importAction, labels }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<ImportMode>('replace')
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

  const preview = useMemo(() => previewSummary(parsed), [parsed])

  async function copyInstructions() {
    try {
      await navigator.clipboard.writeText(instructions)
      setInstructionCopied(true)
      setTimeout(() => setInstructionCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  async function handleFile(file: File) {
    setJsonText(await file.text())
  }

  async function submit() {
    if (!jsonText.trim()) {
      setError('Incolla o carica il JSON')
      return
    }
    setLoading(true)
    setError(null)
    const result = await importAction(projectId, jsonText, mode)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    router.push(redirectPath)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <details className="rounded-control border border-line bg-surface" open>
        <summary className="flex cursor-pointer items-center justify-between gap-2 px-4 py-3 text-body font-medium text-ink">
          <span>Istruzioni per il tuo project del chat IA</span>
          <button
            type="button"
            onClick={(event) => { event.preventDefault(); copyInstructions() }}
            className="inline-flex items-center gap-1 rounded-control border border-line px-2 py-1 text-label text-ink-muted hover:bg-surface-raised"
          >
            {instructionCopied ? <CheckCircle2 className="h-3.5 w-3.5 text-positive" /> : <Copy className="h-3.5 w-3.5" />}
            {instructionCopied ? 'Copiato' : 'Copia'}
          </button>
        </summary>
        <pre className="whitespace-pre-wrap px-4 pb-4 font-mono text-label leading-relaxed text-ink">{instructions}</pre>
      </details>

      <details className="rounded-control border border-line bg-surface">
        <summary className="cursor-pointer px-4 py-3 text-body font-medium text-ink">Esempio JSON</summary>
        <pre className="overflow-x-auto whitespace-pre px-4 pb-4 font-mono text-label leading-relaxed text-ink">{exampleJson}</pre>
      </details>

      <div className="space-y-4 rounded-control border border-line bg-surface p-4">
        <div>
          <p className="mb-1.5 text-body font-medium text-ink">Modalità import</p>
          <div className="inline-flex rounded-control border border-line bg-surface p-0.5 text-body">
            <button
              type="button"
              onClick={() => setMode('replace')}
              className={`rounded-control px-3 py-1.5 ${mode === 'replace' ? 'bg-action text-ink-inverse' : 'text-ink hover:bg-surface-raised'}`}
            >
              Sostituisci corrente
            </button>
            <button
              type="button"
              onClick={() => setMode('append')}
              className={`rounded-control px-3 py-1.5 ${mode === 'append' ? 'bg-action text-ink-inverse' : 'text-ink hover:bg-surface-raised'}`}
            >
              Aggiungi a corrente
            </button>
          </div>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label className="text-body font-medium text-ink">{labels.jsonLabel}</label>
            <div className="flex items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-control border border-line bg-surface px-3 py-1.5 text-body text-ink hover:bg-surface-raised">
                <FileJson className="h-4 w-4" />
                Carica .json
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) void handleFile(file)
                    event.target.value = ''
                  }}
                />
              </label>
              <button type="button" onClick={() => setJsonText('')} disabled={!jsonText} className="text-label text-ink-muted hover:text-negative disabled:opacity-40">
                Pulisci
              </button>
            </div>
          </div>
          <textarea
            value={jsonText}
            onChange={(event) => setJsonText(event.target.value)}
            placeholder="Incolla qui il JSON generato dal chat IA..."
            rows={12}
            className="w-full rounded-control border border-line px-3 py-2 font-mono text-label leading-relaxed"
          />
          {jsonText && !parsed && (
            <p className="mt-1 flex items-center gap-1 text-label text-attention">
              <AlertCircle className="h-3.5 w-3.5" /> JSON non valido - controlla parentesi e virgole
            </p>
          )}
        </div>

        {preview.length > 0 && (
          <div className="rounded-control border border-action-border bg-action-surface px-3 py-2 text-body">
            <p className="mb-1 font-medium text-action">Anteprima</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-label text-action">
              {preview.map((item) => (
                <span key={item.label}><span className="text-action">{item.label}:</span> {item.value}</span>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="flex items-center gap-1.5 text-body text-negative">
            <AlertCircle className="h-4 w-4" /> {error}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            disabled={loading || !jsonText.trim()}
            onClick={submit}
            className="inline-flex items-center gap-2 rounded-control bg-action px-4 py-2 text-body font-medium text-ink-inverse hover:bg-action-hover disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {labels.submit}
          </button>
        </div>
      </div>
    </div>
  )
}
