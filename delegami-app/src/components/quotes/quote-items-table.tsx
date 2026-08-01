'use client'

import { swissNumber } from '@/lib/utils'
import { useMemo, useState } from 'react'
import { ChevronRight, ExternalLink } from 'lucide-react'

function fmt(n: number | null | undefined) {
  if (n == null) return '—'
  return swissNumber(new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2 }).format(n))
}

type Item = {
  id: string
  itemType: string
  description: string
  unit?: string | null
  quantity?: number | null
  unitCost?: number | null
  totalCost?: number | null
  unitPrice?: number | null
  totalPrice?: number | null
  hiddenFromClient?: boolean | null
  sourceUrl?: string | null
  sourceNote?: string | null
}

type DisplayRow =
  | { kind: 'item'; item: Item; num?: number }
  | { kind: 'subtotal'; totalCost: number; totalPrice: number }

interface Props {
  displayRows: DisplayRow[]
  itemNumbers: Record<string, number>
}

function hostOf(url: string) {
  return url.replace(/^https?:\/\//, '').split('/')[0]
}

/** Small labelled figure used inside the expanded internal panel. */
function Metric({
  label,
  value,
  tone = 'default',
  strong = false,
}: {
  label: string
  value: string
  tone?: 'default' | 'price' | 'cost' | 'margin'
  strong?: boolean
}) {
  const valueTone =
    tone === 'price' ? 'text-action' : tone === 'cost' ? 'text-attention' : tone === 'margin' ? 'text-positive' : 'text-ink'
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wide text-ink-muted">{label}</span>
      <span className={`tabular-nums ${strong ? 'font-semibold' : 'font-medium'} ${valueTone}`}>{value}</span>
    </div>
  )
}

export function QuoteItemsTable({ displayRows, itemNumbers }: Props) {
  const itemIds = useMemo(
    () => displayRows.filter((r) => r.kind === 'item' && r.item.itemType === 'ITEM').map((r) => (r as { item: Item }).item.id),
    [displayRows],
  )
  const lineItemCount = itemIds.length
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const allOpen = lineItemCount > 0 && expanded.size === lineItemCount

  function toggle(id: string) {
    setExpanded((prev) => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }

  function toggleAll() {
    setExpanded(allOpen ? new Set() : new Set(itemIds))
  }

  return (
    <>
      {/* ── Toolbar: count + expand-all ─────────────────────────────── */}
      {lineItemCount > 0 && (
        <div className="flex items-center justify-between px-4 sm:px-6 py-2 border-b border-line bg-surface-raised/60">
          <span className="text-label text-ink-muted">{lineItemCount} {lineItemCount === 1 ? 'articolo' : 'articoli'}</span>
          <button
            type="button"
            onClick={toggleAll}
            className="text-label font-medium text-action hover:text-action"
          >
            {allOpen ? 'Comprimi tutti' : 'Espandi dettagli'}
          </button>
        </div>
      )}

      <div className="divide-y divide-line">
        {displayRows.map((row, idx) => {
          // ── Section subtotal ──────────────────────────────────────
          if (row.kind === 'subtotal') {
            return (
              <div key={`sub-${idx}`} className="flex items-center justify-between gap-4 px-4 sm:px-6 py-2 bg-surface-raised">
                <span className="text-[11px] uppercase tracking-wide text-ink-subtle font-medium">Subtotale sezione</span>
                <div className="flex items-center gap-5 tabular-nums">
                  <span className="hidden sm:inline text-label text-attention">costo {fmt(row.totalCost)}</span>
                  <span className="text-body font-semibold text-action">{fmt(row.totalPrice)}</span>
                </div>
              </div>
            )
          }

          const item = row.item

          // ── Scope title ───────────────────────────────────────────
          if (item.itemType === 'HEADER') {
            return (
              <div key={item.id} className="px-3 sm:px-4 py-2.5">
                <div className="flex items-center gap-2 bg-shell rounded-control px-4 py-2.5">
                  <ChevronRight className="w-4 h-4 text-action shrink-0" />
                  <span className="font-semibold text-ink-inverse text-body tracking-wide">{item.description}</span>
                </div>
              </div>
            )
          }

          // ── Work-phase section ────────────────────────────────────
          if (item.itemType === 'SECTION') {
            return (
              <div key={item.id} className="px-4 sm:px-6 py-2 bg-surface-raised/80">
                <span className="text-label font-semibold uppercase tracking-wider text-ink-muted">{item.description}</span>
              </div>
            )
          }

          // ── Internal note ─────────────────────────────────────────
          if (item.itemType === 'NOTE') {
            return (
              <div key={item.id} className="px-4 sm:px-6 py-2 bg-attention-surface flex items-start gap-2">
                <span className="text-body">📝</span>
                <span className="text-label text-attention italic">{item.description}</span>
              </div>
            )
          }

          // ── Billable item (progressive disclosure) ────────────────
          const isOpen = expanded.has(item.id)
          const marginValue = (item.totalPrice ?? 0) - (item.totalCost ?? 0)
          const marginPct =
            item.totalPrice && item.totalPrice > 0 ? ((marginValue / item.totalPrice) * 100).toFixed(0) : null
          const qtyLabel = item.quantity != null || item.unit ? `${fmt(item.quantity)} ${item.unit ?? ''}`.trim() : null

          return (
            <div key={item.id} className={item.hiddenFromClient ? 'bg-attention-surface/40' : ''}>
              <button
                type="button"
                onClick={() => toggle(item.id)}
                aria-expanded={isOpen}
                className="w-full flex items-start gap-3 px-4 sm:px-6 py-3 text-left hover:bg-surface-raised active:bg-surface-raised transition-colors"
              >
                <span className="text-label text-ink-subtle tabular-nums w-5 shrink-0 pt-0.5 text-right">{itemNumbers[item.id]}</span>

                {/* Description takes all remaining room */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className={`text-body leading-snug ${item.hiddenFromClient ? 'line-through text-ink-muted' : 'text-ink'}`}>
                      {item.description}
                    </span>
                    {item.hiddenFromClient && (
                      <span className="shrink-0 text-[10px] font-semibold text-attention bg-attention-surface border border-attention-border rounded-full px-1.5 leading-4 py-0.5">
                        nascosto
                      </span>
                    )}
                  </div>
                  {/* Compact meta line — quantity + source, muted */}
                  <div className="mt-0.5 flex items-center gap-2 flex-wrap text-label text-ink-muted">
                    {qtyLabel && <span className="tabular-nums">{qtyLabel}</span>}
                    {qtyLabel && (item.sourceNote || item.sourceUrl) && <span className="text-ink-subtle">·</span>}
                    {item.sourceNote && <span className="truncate max-w-[16rem]">{item.sourceNote}</span>}
                    {item.sourceUrl && (
                      <span
                        role="link"
                        tabIndex={-1}
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(item.sourceUrl!, '_blank', 'noopener,noreferrer')
                        }}
                        className="inline-flex items-center gap-0.5 text-action hover:text-action"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {hostOf(item.sourceUrl)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Single prominent number — the client-facing total */}
                <div className="shrink-0 text-right">
                  <div className="text-body font-semibold text-action tabular-nums whitespace-nowrap">{fmt(item.totalPrice)}</div>
                </div>

                <ChevronRight
                  className={`w-4 h-4 text-ink-subtle shrink-0 mt-0.5 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                />
              </button>

              {/* Expanded internal breakdown */}
              {isOpen && (
                <div className="px-4 sm:px-6 pb-3 pl-11 sm:pl-14">
                  <div className="rounded-control bg-surface-raised border border-line p-3 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
                    <Metric label="Quantità" value={fmt(item.quantity)} />
                    <Metric label="Unità" value={item.unit ?? '—'} />
                    <Metric label="Prezzo unit." value={fmt(item.unitPrice)} tone="price" />
                    <Metric label="Totale prezzo" value={fmt(item.totalPrice)} tone="price" strong />
                    <Metric label="Costo unit." value={fmt(item.unitCost)} tone="cost" />
                    <Metric label="Totale costo" value={fmt(item.totalCost)} tone="cost" />
                    <Metric
                      label="Margine"
                      value={marginPct != null ? `${fmt(marginValue)} · ${marginPct}%` : fmt(marginValue)}
                      tone="margin"
                    />
                  </div>
                  {(item.sourceNote || item.sourceUrl) && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap text-label">
                      {item.sourceNote && <span className="text-ink-muted">{item.sourceNote}</span>}
                      {item.sourceUrl && (
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-action hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {hostOf(item.sourceUrl)}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
