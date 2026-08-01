'use client'

import { useState } from 'react'
import type { InvoiceFormState } from '@/modules/invoices/actions'
import type { QuoteTemplateRow } from '@/modules/quote-templates/queries'
import { InvoiceTemplatePicker } from './invoice-template-picker'
import { InvoiceForm } from './invoice-form'

interface InvoiceItem { quoteItemId?: string | null; description: string; unit?: string; quantity: number; unitPrice: number }

interface Props {
  action: (prevState: InvoiceFormState, formData: FormData) => Promise<InvoiceFormState>
  projects: { id: string; name: string; client: { name: string } }[]
  quotes?: { id: string; quoteNumber: string; version?: number; projectId?: string; projectName?: string; clientName?: string }[]
  quoteItemsMap?: Record<string, InvoiceItem[]>
  templates: QuoteTemplateRow[]
  defaultProjectId?: string
  defaultQuoteId?: string
  defaultTaxRate?: number
  defaultInvoiceDueDays?: number
}

export function NewInvoiceClient({
  action, projects, quotes, quoteItemsMap, templates, defaultProjectId, defaultQuoteId, defaultTaxRate = 8.1, defaultInvoiceDueDays = 5,
}: Props) {
  const [step, setStep] = useState<'pick' | 'form'>(templates.length > 0 && !defaultQuoteId ? 'pick' : 'form')
  const [templateItems, setTemplateItems] = useState<InvoiceItem[] | null>(null)
  const [templateName, setTemplateName] = useState<string | undefined>()

  if (step === 'pick') {
    return (
      <InvoiceTemplatePicker
        templates={templates}
        onSelect={(items, name) => {
          setTemplateItems(items)
          setTemplateName(name)
          setStep('form')
        }}
        onSkip={() => {
          setTemplateItems(null)
          setTemplateName(undefined)
          setStep('form')
        }}
      />
    )
  }

  return (
    <div>
      {templateName && (
        <div className="mb-4 flex items-center gap-3 px-4 py-2.5 rounded-surface bg-action-surface border border-action-border text-body text-action">
          <span>Template caricato: <strong>{templateName}</strong></span>
          <button type="button" className="ml-auto text-label text-action hover:text-action underline" onClick={() => setStep('pick')}>
            Cambia template
          </button>
        </div>
      )}
      <InvoiceForm
        action={action}
        projects={projects}
        quotes={quotes}
        quoteItemsMap={quoteItemsMap}
        initialItems={templateItems ?? undefined}
        defaultProjectId={defaultProjectId}
        defaultQuoteId={defaultQuoteId}
        defaultTaxRate={defaultTaxRate}
        defaultInvoiceDueDays={defaultInvoiceDueDays}
        title="Dati fattura"
        backHref="/invoices"
      />
    </div>
  )
}
