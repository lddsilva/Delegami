'use client'

import { Fragment, useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Plus, Trash2 } from 'lucide-react'
import { UNITS } from '@/components/quotes/quote-items-editor'
import type { InvoiceFormState } from '@/modules/invoices/actions'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button, ButtonLink } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateInput, swissNumber } from '@/lib/utils'

interface ProjectOption { id: string; name: string; client: { name: string } }
interface QuoteOption {
  id: string
  quoteNumber: string
  version?: number
  projectId?: string
  projectName?: string
  clientName?: string
}

interface InvoiceItem { quoteItemId?: string | null; description: string; unit?: string; quantity: number; unitPrice: number }

const statusOptions = [
  { value: 'DRAFT', label: 'Bozza' },
  { value: 'SENT', label: 'Inviata' },
  { value: 'CANCELLED', label: 'Annullata' },
]

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return <Button type="submit" loading={pending}>{label}</Button>
}

interface Props {
  action: (prevState: InvoiceFormState, formData: FormData) => Promise<InvoiceFormState>
  invoice?: {
    projectId: string
    quoteId?: string | null
    status: string
    issueDate: Date
    dueDate?: Date | null
    taxRate: number
    notes?: string | null
    items: InvoiceItem[]
  }
  projects: ProjectOption[]
  quotes?: QuoteOption[]
  quoteItemsMap?: Record<string, InvoiceItem[]>
  initialItems?: InvoiceItem[]
  defaultProjectId?: string
  defaultQuoteId?: string
  defaultTaxRate?: number
  defaultInvoiceDueDays?: number
  title: string
  backHref: string
}

function fmt(n: number) {
  return swissNumber(new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n))
}

function autoResize(el: HTMLTextAreaElement | null) {
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

function addDays(dateValue: string, days: number) {
  const date = dateValue ? new Date(`${dateValue}T00:00:00`) : new Date()
  if (Number.isNaN(date.getTime())) return ''
  date.setDate(date.getDate() + days)
  return formatDateInput(date)
}

function quoteLabel(quote: QuoteOption) {
  const parts = [`${quote.quoteNumber}${quote.version ? ` v${quote.version}` : ''}`]
  if (quote.clientName) parts.push(quote.clientName)
  if (quote.projectName) parts.push(quote.projectName)
  return parts.join(' - ')
}

export function InvoiceForm({
  action,
  invoice,
  projects,
  quotes = [],
  quoteItemsMap = {},
  initialItems,
  defaultProjectId,
  defaultQuoteId,
  defaultTaxRate = 8.1,
  defaultInvoiceDueDays = 5,
  title,
  backHref,
}: Props) {
  const [state, formAction] = useActionState(action, null)
  const initialQuoteId = invoice?.quoteId ?? defaultQuoteId ?? ''
  const initialProjectId = invoice?.projectId
    ?? defaultProjectId
    ?? quotes.find((q) => q.id === initialQuoteId)?.projectId
    ?? ''
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId)
  const [selectedQuoteId, setSelectedQuoteId] = useState(initialQuoteId)
  const defaultIssueDate = formatDateInput(invoice?.issueDate) || formatDateInput(new Date())
  const [issueDate, setIssueDate] = useState(defaultIssueDate)
  const [dueDate, setDueDate] = useState(formatDateInput(invoice?.dueDate) || addDays(defaultIssueDate, defaultInvoiceDueDays))
  const [dueDateTouched, setDueDateTouched] = useState(Boolean(invoice?.dueDate))
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)
  const [items, setItems] = useState<InvoiceItem[]>(
    invoice?.items
      ?? initialItems
      ?? (initialQuoteId && quoteItemsMap[initialQuoteId]?.length
        ? quoteItemsMap[initialQuoteId]
        : [{ description: '', quantity: 1, unitPrice: 0 }]),
  )
  const [taxRate, setTaxRate] = useState(invoice?.taxRate ?? defaultTaxRate)

  const e = state?.errors ?? {}

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount
  const filteredQuotes = selectedProjectId
    ? quotes.filter((quote) => quote.projectId === selectedProjectId || quote.id === selectedQuoteId)
    : []

  function addItem() {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }])
  }

  function removeItem(idx: number) {
    const next = items.filter((_, i) => i !== idx)
    setItems(next.length > 0 ? next : [{ description: '', quantity: 1, unitPrice: 0 }])
  }

  function setField<K extends keyof InvoiceItem>(idx: number, key: K, value: InvoiceItem[K]) {
    const next = [...items]
    next[idx] = { ...next[idx], [key]: value }
    setItems(next)
  }

  return (
    <form action={formAction}>
      <div className="space-y-4">
        <Card>
          <CardHeader className="px-4 py-2.5"><CardTitle>{title}</CardTitle></CardHeader>
          <CardContent className="px-4 py-3 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <Select
                  name="projectId"
                  label="Opera / Progetto"
                  required
                  options={projects.map((p) => ({ value: p.id, label: `${p.client.name} - ${p.name}` }))}
                  value={selectedProjectId}
                  onChange={(event) => {
                    const nextProjectId = event.target.value
                    setSelectedProjectId(nextProjectId)
                    const quoteStillValid = quotes.some((quote) => quote.id === selectedQuoteId && quote.projectId === nextProjectId)
                    if (!quoteStillValid) {
                      setSelectedQuoteId('')
                      if (!invoice) setItems([{ description: '', quantity: 1, unitPrice: 0 }])
                    }
                  }}
                  placeholder="Seleziona un progetto"
                  error={e.projectId?.[0]}
                />
              </div>
              {quotes.length > 0 && (
                <div>
                  <label className="block text-body font-medium text-ink mb-1">Preventivo collegato</label>
                  <select
                    name="quoteId"
                    className="w-full min-h-11 border border-line-strong rounded-control px-3 py-2 text-body outline-none focus:border-action"
                    value={selectedQuoteId}
                    onChange={(event) => {
                      const quoteId = event.target.value
                      setSelectedQuoteId(quoteId)
                      const quote = quotes.find((q) => q.id === quoteId)
                      if (quote?.projectId) setSelectedProjectId(quote.projectId)
                      if (quoteId && quoteItemsMap[quoteId]?.length) setItems(quoteItemsMap[quoteId])
                    }}
                  >
                    <option value="">{selectedProjectId ? 'Nessuno' : 'Seleziona prima una opera'}</option>
                    {filteredQuotes.map((quote) => (
                      <option key={quote.id} value={quote.id}>{quoteLabel(quote)}</option>
                    ))}
                  </select>
                  {Object.keys(quoteItemsMap).length > 0 && (
                    <p className="text-label text-ink-muted mt-1">Gli articoli vengono importati dal preventivo selezionato.</p>
                  )}
                </div>
              )}
              <Select name="status" label="Stato" options={statusOptions} defaultValue={invoice?.status === 'PAID' ? 'SENT' : invoice?.status ?? 'DRAFT'} />
              <Input
                name="issueDate"
                label="Data emissione"
                type="date"
                required
                value={issueDate}
                onChange={(event) => {
                  setIssueDate(event.target.value)
                  if (!dueDateTouched) setDueDate(addDays(event.target.value, defaultInvoiceDueDays))
                }}
              />
              <Input
                name="dueDate"
                label="Data scadenza"
                type="date"
                value={dueDate}
                onChange={(event) => {
                  setDueDateTouched(true)
                  setDueDate(event.target.value)
                }}
              />
              <Input
                name="taxRate"
                label="IVA (%)"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={taxRate}
                onChange={(event) => {
                  const raw = event.target.value
                  const val = parseFloat(raw.replace(',', '.'))
                  setTaxRate(isNaN(val) ? 0 : Math.max(0, Math.min(100, val)))
                }}
              />
            </div>
            <Textarea name="notes" label="Note" defaultValue={invoice?.notes ?? ''} placeholder="Note per il cliente..." rows={2} />
            {!invoice && (
              <div className="rounded-control border border-line bg-surface-raised px-3 py-2.5">
                <label className="inline-flex items-center gap-2 text-body font-medium text-ink">
                  <input
                    type="checkbox"
                    name="saveAsTemplate"
                    checked={saveAsTemplate}
                    onChange={(event) => setSaveAsTemplate(event.target.checked)}
                    className="rounded border-line-strong"
                  />
                  Salva come template fattura
                </label>
                {saveAsTemplate && (
                  <Input
                    name="templateName"
                    label="Nome template"
                    className="mt-2 bg-surface"
                    placeholder="es. Acconto 30% standard"
                  />
                )}
              </div>
            )}
            {state?.message && <p className="text-body text-negative">{state.message}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-4 py-2.5"><CardTitle>Articoli</CardTitle></CardHeader>
          <CardContent className="px-4 py-3">
            {/* The grid is a 760px layout inside a sideways-scrolling box: on a
                phone you edited a price you could not see next to the
                description it belonged to. It stays for md+, where columns are
                what make twenty lines readable, and below that each line
                becomes a card — same pattern the quote editor already uses. */}
            <div className="md:overflow-x-auto">
              <div className="space-y-1 md:min-w-[760px]">
                <div
                  className="hidden md:grid gap-1 text-label font-medium text-ink-muted uppercase tracking-wide px-1"
                  style={{ gridTemplateColumns: 'minmax(280px, 1fr) 86px 90px 112px 104px 40px' }}
                >
                  <span>Descrizione</span>
                  <span>U.M.</span>
                  <span className="text-right">Qta</span>
                  <span className="text-right">Prezzo u.</span>
                  <span className="text-right">Totale</span>
                  <span />
                </div>
                {items.map((item, idx) => {
                  const lineTotal = item.quantity * item.unitPrice
                  return (
                    <Fragment key={idx}>
                    <div
                      className="hidden gap-1 items-start border border-line rounded-control px-1.5 py-1 bg-surface md:grid"
                      style={{ gridTemplateColumns: 'minmax(280px, 1fr) 86px 90px 112px 104px 40px' }}
                    >
                      <textarea
                        rows={1}
                        className="text-body outline-none placeholder:text-ink-subtle resize-none overflow-hidden py-0.5 leading-snug"
                        placeholder="Descrizione..."
                        value={item.description}
                        ref={(el) => autoResize(el)}
                        onChange={(event) => {
                          autoResize(event.currentTarget)
                          setField(idx, 'description', event.target.value)
                        }}
                      />
                      <select
                        className="text-body outline-none text-center border border-line rounded bg-transparent focus:border-action w-full py-0.5"
                        value={item.unit ?? ''}
                        onChange={(event) => setField(idx, 'unit', event.target.value || undefined)}
                      >
                        <option value="">-</option>
                        {UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                        {item.unit && !UNITS.includes(item.unit) && <option value={item.unit}>{item.unit}</option>}
                      </select>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="text-body outline-none text-right py-0.5"
                        value={item.quantity}
                        onChange={(event) => setField(idx, 'quantity', parseFloat(event.target.value) || 0)}
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="text-body outline-none text-right bg-action-surface rounded px-1 py-0.5 text-action"
                        placeholder="0.00"
                        value={item.unitPrice || ''}
                        onChange={(event) => setField(idx, 'unitPrice', parseFloat(event.target.value) || 0)}
                      />
                      <span className="text-body font-medium text-right text-action tabular-nums py-0.5">{fmt(lineTotal)}</span>
                      <button type="button" onClick={() => removeItem(idx)} aria-label="Elimina la riga" className="tap-target inline-flex items-center justify-center rounded-control text-ink-subtle hover:text-negative">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Phone: one card per line, nothing off-screen. */}
                    <div className="space-y-2 rounded-control border border-line bg-surface p-2.5 md:hidden">
                      <textarea
                        rows={2}
                        aria-label={`Descrizione della riga ${idx + 1}`}
                        className="min-h-11 w-full resize-none rounded-control border border-line px-2 py-2 text-body leading-snug outline-none placeholder:text-ink-subtle focus:border-action"
                        placeholder="Descrizione..."
                        value={item.description}
                        onChange={(event) => setField(idx, 'description', event.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <label className="text-label text-ink-muted">
                          Unità
                          <select
                            className="mt-1 min-h-11 w-full rounded-control border border-line bg-surface px-2 text-body text-ink outline-none focus:border-action"
                            value={item.unit ?? ''}
                            onChange={(event) => setField(idx, 'unit', event.target.value || undefined)}
                          >
                            <option value="">-</option>
                            {UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                            {item.unit && !UNITS.includes(item.unit) && <option value={item.unit}>{item.unit}</option>}
                          </select>
                        </label>
                        <label className="text-label text-ink-muted">
                          Quantità
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="mt-1 min-h-11 w-full rounded-control border border-line px-2 text-right text-body text-ink outline-none focus:border-action"
                            value={item.quantity}
                            onChange={(event) => setField(idx, 'quantity', parseFloat(event.target.value) || 0)}
                          />
                        </label>
                      </div>
                      <label className="block text-label text-action">
                        Prezzo unitario
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="mt-1 min-h-11 w-full rounded-control border border-action-border bg-action-surface px-2 text-right text-body text-action outline-none focus:border-action"
                          placeholder="0.00"
                          value={item.unitPrice || ''}
                          onChange={(event) => setField(idx, 'unitPrice', parseFloat(event.target.value) || 0)}
                        />
                      </label>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-1">
                        <span className="text-label text-ink-muted">
                          Totale <span className="text-body font-semibold text-action numeric">{fmt(lineTotal)}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          aria-label={`Elimina la riga ${idx + 1}`}
                          className="tap-target inline-flex items-center justify-center rounded-control text-ink-subtle hover:text-negative"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </Fragment>
                  )
                })}
                <Button type="button" variant="ghost" size="sm" onClick={addItem}>
                  <Plus className="w-3.5 h-3.5" /> Aggiungi articolo
                </Button>
              </div>
            </div>
            <div className="mt-3 ml-auto w-full md:w-72 space-y-1 border-t pt-2.5">
              <div className="flex justify-between text-body"><span className="text-ink-muted">Subtotale</span><span className="tabular-nums">CHF {fmt(subtotal)}</span></div>
              <div className="flex justify-between text-body"><span className="text-ink-muted">IVA ({taxRate}%)</span><span className="tabular-nums">CHF {fmt(taxAmount)}</span></div>
              <div className="flex justify-between font-bold text-body border-t pt-1.5"><span>Totale</span><span className="tabular-nums text-action">CHF {fmt(total)}</span></div>
            </div>
            <input type="hidden" name="itemsJson" value={JSON.stringify(items)} />
          </CardContent>
          <CardFooter className="flex justify-between px-4 py-3">
            <ButtonLink href={backHref} variant="secondary">Annulla</ButtonLink>
            <SubmitButton label={invoice ? 'Salva modifiche' : 'Crea fattura'} />
          </CardFooter>
        </Card>
      </div>
    </form>
  )
}
