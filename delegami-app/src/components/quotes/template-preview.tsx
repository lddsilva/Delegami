'use client'

import { ArrowLeft, Check, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { QuoteItem } from './quote-items-editor'

interface Props {
  templateName: string
  items: QuoteItem[]
  onBack: () => void
  onConfirm: () => void
  confirmLabel?: string
  compact?: boolean
}

export function TemplatePreview({
  templateName,
  items,
  onBack,
  onConfirm,
  confirmLabel = 'Usa template',
  compact = false,
}: Props) {
  const subtotal = items.reduce((sum, item) => {
    if (item.itemType !== 'ITEM') return sum
    return sum + ((item.quantity ?? 1) * (item.unitPrice ?? 0))
  }, 0)
  const itemCount = items.filter((item) => item.itemType === 'ITEM').length
  const sectionCount = items.filter((item) => item.itemType === 'SECTION' || item.itemType === 'HEADER').length

  return (
    <Card className={compact ? 'border-action-border bg-action-surface/30' : ''}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-action" />
            Anteprima template
          </CardTitle>
          <p className="text-body text-ink-muted mt-1">{templateName}</p>
        </div>
        <div className="text-right text-body">
          <p className="font-semibold text-action tabular-nums">{formatCurrency(subtotal)}</p>
          <p className="text-label text-ink-muted">{itemCount} voci · {sectionCount} sezioni</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className={compact ? 'max-h-72 overflow-y-auto rounded-control border border-action-border bg-surface' : 'max-h-[55vh] overflow-y-auto rounded-control border border-line'}>
          {items.map((item, idx) => {
            if (item.itemType === 'HEADER') {
              return (
                <div key={idx} className="bg-shell text-ink-inverse px-3 py-2 text-body font-bold tracking-wide">
                  {item.description}
                </div>
              )
            }
            if (item.itemType === 'SECTION') {
              return (
                <div key={idx} className="bg-surface-raised border-t border-line px-3 py-1.5 text-label font-semibold uppercase tracking-wide text-ink-muted">
                  § {item.description}
                </div>
              )
            }
            if (item.itemType === 'NOTE') {
              return (
                <div key={idx} className="border-t border-line px-3 py-1.5 text-label italic text-attention bg-attention-surface">
                  {item.description}
                </div>
              )
            }

            const total = (item.quantity ?? 1) * (item.unitPrice ?? 0)
            return (
              <div key={idx} className="grid grid-cols-[1fr_72px_96px] gap-3 border-t border-line px-3 py-2 text-body">
                <div className="min-w-0">
                  <p className="font-medium text-ink leading-snug">{item.description}</p>
                  <p className="text-label text-ink-muted mt-0.5">
                    {item.quantity ?? 1} {item.unit ?? 'pz'} × {formatCurrency(item.unitPrice ?? 0)}
                  </p>
                </div>
                <span className="text-right text-ink-muted">{item.unit ?? '-'}</span>
                <span className="text-right font-semibold tabular-nums text-action">{formatCurrency(total)}</span>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="secondary" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" /> Indietro
          </Button>
          <Button type="button" onClick={onConfirm}>
            <Check className="w-4 h-4" /> {confirmLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
