'use client'

import { useActionState, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckSquare, ListChecks, Percent, Receipt, Square } from 'lucide-react'
import type { InvoiceFormState } from '@/modules/invoices/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, formatCurrency } from '@/lib/utils'

export interface QuoteInvoiceSelectionItem {
  id: string
  description: string
  unit?: string | null
  quantity: number
  unitPrice: number
  invoicedQuantity: number
}

function autoResize(el: HTMLTextAreaElement | null) {
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

function fmtQty(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

interface Props {
  quote: {
    id: string
    quoteNumber: string
    version: number
    taxRate: number
    subtotalClient: number
    total: number
    projectName: string
    projectHref: string
    clientName: string
    billingMode: 'ITEMS' | 'PERCENTAGE' | 'MANUAL' | null
    billedPercent: number
  }
  items: QuoteInvoiceSelectionItem[]
  itemAction: (prevState: InvoiceFormState, formData: FormData) => Promise<InvoiceFormState>
  percentageAction: (prevState: InvoiceFormState, formData: FormData) => Promise<InvoiceFormState>
}

export function QuoteInvoiceSelection({ quote, items, itemAction, percentageAction }: Props) {
  const [itemState, itemFormAction, itemPending] = useActionState(itemAction, null)
  const [percentState, percentFormAction, percentPending] = useActionState(percentageAction, null)
  const [mode, setMode] = useState<'ITEMS' | 'PERCENTAGE'>(quote.billingMode === 'PERCENTAGE' ? 'PERCENTAGE' : 'ITEMS')

  const selectableIds = useMemo(
    () => items.filter((item) => item.quantity - item.invoicedQuantity > 0.0001).map((item) => item.id),
    [items],
  )
  const [selected, setSelected] = useState<Set<string>>(() => new Set(selectableIds))
  const [quantities, setQuantities] = useState<Record<string, number>>(() => Object.fromEntries(
    items.map((item) => [item.id, Math.max(0, item.quantity - item.invoicedQuantity)]),
  ))
  const [descriptions, setDescriptions] = useState<Record<string, string>>(() => Object.fromEntries(
    items.map((item) => [item.id, item.description]),
  ))

  const selectedItems = items
    .filter((item) => selected.has(item.id))
    .map((item) => {
      const remaining = Math.max(0, item.quantity - item.invoicedQuantity)
      return {
        quoteItemId: item.id,
        description: descriptions[item.id]?.trim() || item.description,
        quantity: Math.min(Math.max(0, quantities[item.id] ?? remaining), remaining),
      }
    })
    .filter((item) => item.quantity > 0)

  const subtotal = selectedItems.reduce((sum, selectedItem) => {
    const item = items.find((candidate) => candidate.id === selectedItem.quoteItemId)
    return sum + selectedItem.quantity * (item?.unitPrice ?? 0)
  }, 0)
  const taxAmount = subtotal * (quote.taxRate / 100)
  const total = subtotal + taxAmount

  const remainingPercent = Math.max(0, 100 - quote.billedPercent)
  const [percentValue, setPercentValue] = useState(remainingPercent >= 30 ? 30 : Number(remainingPercent.toFixed(2)))
  const percentageSubtotal = quote.subtotalClient * (Math.max(0, percentValue) / 100)
  const percentageTax = percentageSubtotal * (quote.taxRate / 100)
  const percentageTotal = percentageSubtotal + percentageTax

  const canUseItems = quote.billingMode !== 'PERCENTAGE'
  const canUsePercentage = quote.billingMode !== 'ITEMS' && quote.billingMode !== 'MANUAL'

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(selectableIds))
  }

  function clearAll() {
    setSelected(new Set())
  }

  function setDescription(id: string, value: string) {
    setDescriptions((prev) => ({ ...prev, [id]: value }))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link href={`/quotes/${quote.id}`} className="inline-flex items-center gap-1 text-body text-ink-muted hover:text-action mb-2">
            <ArrowLeft className="w-4 h-4" /> Torna al preventivo
          </Link>
          <h1 className="text-display font-semibold text-ink">Genera fattura da {quote.quoteNumber} v{quote.version}</h1>
          <p className="text-body text-ink-muted mt-1">{quote.projectName} - {quote.clientName}</p>
        </div>
        <Link href={quote.projectHref}>
          <Button type="button" variant="secondary" size="sm">Apri opera</Button>
        </Link>
      </div>

      <div className="rounded-surface border border-line bg-surface p-2 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!canUseItems}
          onClick={() => setMode('ITEMS')}
          className={cn(
            'inline-flex items-center gap-2 rounded-control px-3 py-2 text-body font-medium',
            mode === 'ITEMS' ? 'bg-action text-ink-inverse' : 'text-ink-muted hover:bg-surface-raised',
            !canUseItems && 'opacity-50 cursor-not-allowed',
          )}
        >
          <ListChecks className="w-4 h-4" /> Per articoli
        </button>
        <button
          type="button"
          disabled={!canUsePercentage}
          onClick={() => setMode('PERCENTAGE')}
          className={cn(
            'inline-flex items-center gap-2 rounded-control px-3 py-2 text-body font-medium',
            mode === 'PERCENTAGE' ? 'bg-action text-ink-inverse' : 'text-ink-muted hover:bg-surface-raised',
            !canUsePercentage && 'opacity-50 cursor-not-allowed',
          )}
        >
          <Percent className="w-4 h-4" /> Acconto / SAL %
        </button>
        {quote.billingMode && (
          <span className="ml-auto self-center text-label text-ink-muted">
            Metodo gia avviato: {quote.billingMode === 'PERCENTAGE' ? 'Acconto/SAL %' : 'Articoli'}
          </span>
        )}
      </div>

      {mode === 'PERCENTAGE' && (
        <form action={percentFormAction} className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">
          <Card>
            <CardHeader><CardTitle>Acconto / SAL percentuale</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-body font-medium text-ink mb-1">Tipo</label>
                  <select name="billingLabel" className="w-full rounded-control border border-line-strong px-3 py-2 text-body outline-none focus:border-action">
                    <option value="Acconto">Acconto</option>
                    <option value="SAL">SAL</option>
                    <option value="Saldo">Saldo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-body font-medium text-ink mb-1">Percentuale</label>
                  <input
                    name="percent"
                    type="number"
                    min="0.01"
                    max={remainingPercent}
                    step="0.01"
                    value={percentValue}
                    onChange={(event) => setPercentValue(Number(event.target.value))}
                    className="w-full rounded-control border border-line-strong px-3 py-2 text-body text-right outline-none focus:border-action"
                  />
                  {percentState?.errors?.percent && <p className="text-label text-negative mt-1">{percentState.errors.percent[0]}</p>}
                </div>
                <div className="rounded-control bg-surface-raised border border-line px-3 py-2 text-body">
                  <p className="text-label text-ink-muted">Gia fatturato</p>
                  <p className="font-semibold">{fmtQty(quote.billedPercent)}% / residuo {fmtQty(remainingPercent)}%</p>
                </div>
              </div>
              <textarea
                name="notes"
                rows={3}
                className="w-full rounded-control border border-line px-3 py-2 text-body outline-none focus:border-action"
                placeholder="Note fattura (opzionale)"
              />
              {percentState?.message && <p className="text-body text-negative">{percentState.message}</p>}
            </CardContent>
          </Card>
          <Card className="lg:sticky lg:top-4">
            <CardHeader><CardTitle>Riepilogo fattura</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-body">
              <div className="flex justify-between"><span className="text-ink-muted">Base preventivo</span><span>{formatCurrency(quote.total)}</span></div>
              <div className="flex justify-between"><span className="text-ink-muted">Percentuale</span><span>{fmtQty(percentValue)}%</span></div>
              <div className="flex justify-between"><span className="text-ink-muted">Subtotale</span><span>{formatCurrency(percentageSubtotal)}</span></div>
              <div className="flex justify-between"><span className="text-ink-muted">IVA ({quote.taxRate}%)</span><span>{formatCurrency(percentageTax)}</span></div>
              <div className="flex justify-between border-t pt-3 text-body font-bold">
                <span>Totale</span>
                <span className="text-action tabular-nums">{formatCurrency(percentageTotal)}</span>
              </div>
              <Button type="submit" disabled={percentPending || percentValue <= 0 || percentValue > remainingPercent + 0.0001} className="w-full">
                <Receipt className="w-4 h-4" /> Genera fattura
              </Button>
            </CardContent>
          </Card>
        </form>
      )}

      {mode === 'ITEMS' && (
        <form action={itemFormAction} className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">
          <input type="hidden" name="itemsJson" value={JSON.stringify(selectedItems)} />
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle>Articoli del preventivo</CardTitle>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={selectAll}>Tutti</Button>
                <Button type="button" variant="ghost" size="sm" onClick={clearAll}>Nessuno</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((item) => {
                const remaining = Math.max(0, item.quantity - item.invoicedQuantity)
                const isDone = remaining <= 0.0001
                const isSelected = selected.has(item.id)
                const invoiceDescription = descriptions[item.id] ?? item.description
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'grid grid-cols-[24px_1fr] sm:grid-cols-[24px_1fr_90px_112px] gap-2 rounded-control border px-2 py-1.5 transition-colors',
                      isDone ? 'bg-surface-raised border-line opacity-70' : isSelected ? 'bg-action-surface/60 border-action-border' : 'bg-surface border-line',
                    )}
                  >
                    <button
                      type="button"
                      disabled={isDone}
                      onClick={() => toggle(item.id)}
                      className={cn('mt-0.5 text-ink-subtle', isSelected && !isDone && 'text-action', isDone && 'cursor-not-allowed')}
                      aria-label={isSelected ? 'Deseleziona articolo' : 'Seleziona articolo'}
                    >
                      {isSelected && !isDone ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </button>
                    <div className="min-w-0">
                      <p className="text-label font-medium uppercase tracking-wide text-ink-muted">Origine preventivo</p>
                      <p className="text-body font-medium text-ink leading-snug">{item.description}</p>
                      <p className="text-label text-ink-muted mt-1">
                        Preventivo: {fmtQty(item.quantity)} {item.unit ?? 'pz'} - Gia fatturato: {fmtQty(item.invoicedQuantity)} - Residuo: {fmtQty(remaining)}
                      </p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-label font-medium text-ink-muted">Descrizione in fattura</p>
                          {!isDone && isSelected && (
                            <button
                              type="button"
                              onClick={() => setDescription(item.id, item.description)}
                              className="text-[11px] text-ink-muted hover:text-action"
                            >
                              Originale
                            </button>
                          )}
                        </div>
                        <textarea
                          rows={1}
                          disabled={isDone || !isSelected}
                          value={invoiceDescription}
                          ref={(el) => autoResize(el)}
                          onChange={(event) => {
                            autoResize(event.currentTarget)
                            setDescription(item.id, event.target.value)
                          }}
                          className="w-full rounded-control border border-line px-2 py-1 text-body leading-snug outline-none resize-none overflow-hidden focus:border-action disabled:bg-surface-raised disabled:text-ink-muted"
                        />
                      </div>
                      {isDone && <p className="text-label font-medium text-positive mt-1">Gia incluso in fattura</p>}
                    </div>
                    <div className="sm:text-right">
                      <p className="text-label text-ink-muted mb-1">Qta fattura</p>
                      <input
                        type="number"
                        min="0"
                        max={remaining}
                        step="0.01"
                        disabled={isDone || !isSelected}
                        value={quantities[item.id] ?? remaining}
                        onChange={(event) => setQuantities((prev) => ({ ...prev, [item.id]: Number(event.target.value) }))}
                        className="w-full rounded-control border border-line px-2 py-1.5 text-body text-right outline-none focus:border-action disabled:bg-surface-raised disabled:text-ink-muted"
                      />
                    </div>
                    <div className="sm:text-right">
                      <p className="text-label text-ink-muted mb-1">Importo</p>
                      <p className="text-body font-semibold tabular-nums text-action">
                        {formatCurrency((isSelected ? Math.min(quantities[item.id] ?? remaining, remaining) : 0) * item.unitPrice)}
                      </p>
                      <p className="text-label text-ink-muted">{formatCurrency(item.unitPrice)} / {item.unit ?? 'pz'}</p>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className="lg:sticky lg:top-4">
            <CardHeader><CardTitle>Riepilogo fattura</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-body">
              <div className="flex justify-between">
                <span className="text-ink-muted">Articoli selezionati</span>
                <span className="font-medium">{selectedItems.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Subtotale</span>
                <span className="font-medium tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">IVA ({quote.taxRate}%)</span>
                <span className="tabular-nums">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between border-t pt-3 text-body font-bold">
                <span>Totale</span>
                <span className="text-action tabular-nums">{formatCurrency(total)}</span>
              </div>
              <textarea
                name="notes"
                rows={3}
                className="w-full rounded-control border border-line px-3 py-2 text-body outline-none focus:border-action"
                placeholder="Note fattura (opzionale)"
              />
              {itemState?.message && <p className="text-body text-negative">{itemState.message}</p>}
              <Button type="submit" disabled={itemPending || selectedItems.length === 0} className="w-full">
                <Receipt className="w-4 h-4" /> Genera fattura
              </Button>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  )
}
