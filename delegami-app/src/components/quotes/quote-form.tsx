'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import type { QuoteFormState } from '@/modules/quotes/actions'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button, ButtonLink } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { QuoteItemsEditor, type QuoteItem, type PriceCatalogItem, type TemplateOption } from './quote-items-editor'
import { formatDateInput } from '@/lib/utils'

interface ProjectOption {
  id: string
  name: string
  client: { name: string }
}

interface QuoteFormProps {
  action: (prevState: QuoteFormState, formData: FormData) => Promise<QuoteFormState>
  quote?: {
    projectId: string
    status: string
    marginPercent: number
    taxRate: number
    validUntil?: Date | null
    internalNotes?: string | null
    clientNotes?: string | null
    paymentTerms?: string | null
    items: QuoteItem[]
  }
  projects: ProjectOption[]
  priceItems?: PriceCatalogItem[]
  templates?: TemplateOption[]
  initialItems?: QuoteItem[]
  defaultProjectId?: string
  defaultMargin?: number
  defaultTaxRate?: number
  defaultPaymentTerms?: string
  defaultClientNotes?: string
  defaultQuoteValidityDays?: number
  title: string
  backHref: string
}

const statusOptions = [
  { value: 'DRAFT', label: 'Bozza' },
  { value: 'SENT', label: 'Inviato' },
  { value: 'APPROVED', label: 'Approvato' },
  { value: 'REJECTED', label: 'Rifiutato' },
]

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return <Button type="submit" loading={pending}>{label}</Button>
}

function defaultValidUntil(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return formatDateInput(date)
}

export function QuoteForm({
  action,
  quote,
  projects,
  priceItems = [],
  templates = [],
  initialItems,
  defaultProjectId,
  defaultMargin = 0,
  defaultTaxRate = 8.1,
  defaultPaymentTerms,
  defaultClientNotes,
  defaultQuoteValidityDays = 30,
  title,
  backHref,
}: QuoteFormProps) {
  const [state, formAction] = useActionState(action, null)
  const [marginPercent, setMarginPercent] = useState(quote?.marginPercent ?? defaultMargin)
  const [taxRate, setTaxRate] = useState(quote?.taxRate ?? defaultTaxRate)

  const e = state?.errors ?? {}

  const projectOptions = projects.map((p) => ({
    value: p.id,
    label: `${p.client.name} — ${p.name}`,
  }))

  return (
    <form action={formAction}>
      <div className="space-y-6">
        {/* Header card */}
        <Card>
          <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Select
                  name="projectId"
                  label="Opera / Progetto"
                  required
                  options={projectOptions}
                  defaultValue={quote?.projectId ?? defaultProjectId ?? ''}
                  placeholder="Seleziona un progetto"
                  error={e.projectId?.[0]}
                />
                <p className="text-label text-ink-muted mt-1">
                  Progetto non in lista?{' '}
                  <Link href="/projects/new" target="_blank" className="text-action hover:underline">
                    Crea nuovo progetto ↗
                  </Link>
                </p>
              </div>
              <Select name="status" label="Stato" options={statusOptions} defaultValue={quote?.status ?? 'DRAFT'} />
              <Input
                name="marginPercent"
                label="Margine (%)"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={marginPercent}
                onChange={(e) => setMarginPercent(parseFloat(e.target.value) || 0)}
                hint="Applicato automaticamente al costo per calcolare il prezzo"
              />
              <Input
                name="taxRate"
                label="IVA (%)"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={taxRate}
                onChange={(e) => {
                  const raw = e.target.value
                  const val = parseFloat(raw.replace(',', '.'))
                  setTaxRate(isNaN(val) ? 0 : Math.max(0, Math.min(100, val)))
                }}
                hint={taxRate === 0 ? '⚠ IVA 0% — verifica se corretto' : 'IVA svizzera standard: 8.1%'}
              />
              <Input
                name="validUntil"
                label="Valido fino al"
                type="date"
                defaultValue={formatDateInput(quote?.validUntil) || defaultValidUntil(defaultQuoteValidityDays)}
              />
            </div>
            <div>
              <Textarea
                name="paymentTerms"
                label="Condizioni di pagamento"
                defaultValue={quote?.paymentTerms ?? defaultPaymentTerms ?? ''}
                placeholder="Lasciare vuoto per usare le condizioni del progetto o dell'azienda"
                rows={2}
                hint={defaultPaymentTerms && !quote?.paymentTerms ? `Default (progetto/azienda): ${defaultPaymentTerms.slice(0, 80)}${defaultPaymentTerms.length > 80 ? '…' : ''}` : undefined}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Textarea
                name="clientNotes"
                label="Note per il cliente"
                defaultValue={quote?.clientNotes ?? defaultClientNotes ?? ''}
                placeholder="Condizioni, esclusioni, scadenze..."
                rows={3}
              />
              <Textarea
                name="internalNotes"
                label="Note interne"
                defaultValue={quote?.internalNotes ?? ''}
                placeholder="Note visibili solo internamente..."
                rows={3}
              />
            </div>
            {state?.message && <p className="text-body text-negative">{state.message}</p>}
          </CardContent>
        </Card>

        {/* Items card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Articoli</CardTitle>
              <div className="flex items-center gap-2 text-label text-ink-muted">
                <span className="inline-block w-3 h-3 bg-attention-surface rounded border border-attention-border" />
                <span>Costo interno</span>
                <span className="inline-block w-3 h-3 bg-action-surface rounded border border-action-border ml-2" />
                <span>Prezzo cliente</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <QuoteItemsEditor
              initialItems={initialItems ?? quote?.items ?? []}
              marginPercent={marginPercent}
              taxRate={taxRate}
              priceItems={priceItems}
              templates={templates}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <ButtonLink href={backHref} variant="secondary">Annulla</ButtonLink>
            <SubmitButton label={quote ? 'Salva modifiche' : 'Crea preventivo'} />
          </CardFooter>
        </Card>
      </div>
    </form>
  )
}
