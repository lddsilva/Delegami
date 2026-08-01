'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileJson, Loader2, AlertCircle, CheckCircle2, Copy } from 'lucide-react'
import { importQuoteUpdateFromJson, type ImportQuoteMode } from '@/modules/quotes/actions'
import { useConfirm } from '@/components/ui/use-confirm'

interface Props {
  quoteId: string
  quoteLabel: string  // e.g. "PRE-2026-013 v8"
  status: string      // QuoteStatus
  itemCount: number
  instructions: string
  exampleJson: string
}

function previewSummary(parsed: unknown): { label: string; value: string }[] {
  if (!parsed || typeof parsed !== 'object') return []
  const obj = parsed as Record<string, unknown>
  const items = Array.isArray(obj.items) ? obj.items : []
  const out: { label: string; value: string }[] = []
  out.push({ label: 'Voci totali', value: String(items.length) })
  if (typeof obj.marginPercent === 'number') out.push({ label: 'Margine', value: `${obj.marginPercent}%` })
  if (typeof obj.taxRate === 'number') out.push({ label: 'IVA', value: `${obj.taxRate}%` })
  return out
}

export function QuoteUpdateImportClient({ quoteId, quoteLabel, status, itemCount, instructions, exampleJson }: Props) {
  const { confirm, dialog } = useConfirm()
  const router = useRouter()
  const inPlaceAllowed = status === 'DRAFT'
  const [mode, setMode] = useState<ImportQuoteMode>(inPlaceAllowed ? 'replace-in-place' : 'new-version')
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
    if (mode === 'replace-in-place') {
      const newCount = Array.isArray(parsed?.items) ? parsed.items.length : 0
      const ok = await confirm({
        title: 'Sostituire le voci del preventivo?',
        description: `Le ${itemCount} voci attuali di ${quoteLabel} verranno sostituite dalle ${newCount} del JSON.`,
        confirmLabel: 'Sostituisci',
        destructive: true,
      })
      if (!ok) return
    }
    setLoading(true)
    setError(null)
    const result = await importQuoteUpdateFromJson(quoteId, jsonText, mode)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    router.push(`/quotes/${result.quoteId}`)
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
      {dialog}
      {/* Mode selector */}
      <div className="rounded-control border border-line bg-surface p-4 space-y-2">
        <p className="text-body font-medium text-ink">Modalità di aggiornamento</p>
        <label className={`flex items-start gap-3 rounded-control border p-3 cursor-pointer transition-colors ${
          !inPlaceAllowed ? 'opacity-50 cursor-not-allowed bg-surface-raised' :
          mode === 'replace-in-place' ? 'border-action bg-action-surface' : 'border-line hover:bg-surface-raised'
        }`}>
          <input
            type="radio"
            name="mode"
            value="replace-in-place"
            disabled={!inPlaceAllowed}
            checked={mode === 'replace-in-place'}
            onChange={() => setMode('replace-in-place')}
            className="mt-0.5"
          />
          <div>
            <p className="text-body font-medium text-ink">Aggiorna versione corrente</p>
            <p className="text-label text-ink-muted mt-0.5">
              Sostituisce le voci di {quoteLabel}. {!inPlaceAllowed && (
                <span className="text-negative font-medium">Disponibile solo per preventivi in stato Bozza (attuale: {status}).</span>
              )}
            </p>
          </div>
        </label>
        <label className={`flex items-start gap-3 rounded-control border p-3 cursor-pointer transition-colors ${
          mode === 'new-version' ? 'border-action bg-action-surface' : 'border-line hover:bg-surface-raised'
        }`}>
          <input
            type="radio"
            name="mode"
            value="new-version"
            checked={mode === 'new-version'}
            onChange={() => setMode('new-version')}
            className="mt-0.5"
          />
          <div>
            <p className="text-body font-medium text-ink">Crea nuova versione</p>
            <p className="text-label text-ink-muted mt-0.5">
              Mantiene {quoteLabel} come storico e crea una nuova versione bozza con i dati del JSON.
            </p>
          </div>
        </label>
      </div>

      {/* Instructions */}
      <details className="rounded-control border border-line bg-surface">
        <summary className="cursor-pointer px-4 py-3 text-body font-medium text-ink flex items-center justify-between">
          <span>Istruzioni per il chat IA</span>
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

      {/* JSON input */}
      <div className="rounded-control border border-line bg-surface p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <label className="text-body font-medium text-ink">JSON preventivo aggiornato</label>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 rounded-control border border-line bg-surface px-3 py-1.5 text-body text-ink hover:bg-surface-raised cursor-pointer">
              <FileJson className="h-4 w-4" />
              Carica .json
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
        </div>
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder="Incolla qui il JSON aggiornato dal chat IA…"
          rows={14}
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
            {mode === 'replace-in-place' ? 'Aggiorna versione corrente' : 'Crea nuova versione'}
          </button>
        </div>
      </div>
    </div>
  )
}
