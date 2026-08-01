'use client'

import { useState } from 'react'
import type { QuoteFormState } from '@/modules/quotes/actions'
import type { QuoteTemplateRow } from '@/modules/quote-templates/queries'
import { TemplatePicker } from './template-picker'
import { TemplatePreview } from './template-preview'
import { QuoteForm } from './quote-form'
import type { QuoteItem, PriceCatalogItem } from './quote-items-editor'

interface Props {
  action: (prevState: QuoteFormState, formData: FormData) => Promise<QuoteFormState>
  projects: { id: string; name: string; client: { name: string } }[]
  priceItems: PriceCatalogItem[]
  templates: QuoteTemplateRow[]
  defaultProjectId?: string
  defaultMargin?: number
  defaultTaxRate?: number
  defaultPaymentTerms?: string
  defaultClientNotes?: string
  defaultQuoteValidityDays?: number
}

export function NewQuoteClient({
  action, projects, priceItems, templates, defaultProjectId, defaultMargin, defaultTaxRate, defaultPaymentTerms, defaultClientNotes, defaultQuoteValidityDays,
}: Props) {
  const [step, setStep] = useState<'pick' | 'preview' | 'form'>(templates.length > 0 ? 'pick' : 'form')
  const [initialItems, setInitialItems] = useState<QuoteItem[]>([])
  const [templateName, setTemplateName] = useState<string | undefined>()
  const [previewItems, setPreviewItems] = useState<QuoteItem[]>([])

  if (step === 'pick') {
    return (
      <TemplatePicker
        templates={templates}
        onSelect={(items, name) => {
          setTemplateName(name)
          setPreviewItems(items)
          setStep('preview')
        }}
        onSkip={() => {
          setInitialItems([])
          setTemplateName(undefined)
          setStep('form')
        }}
      />
    )
  }

  if (step === 'preview' && templateName) {
    const header: QuoteItem = { itemType: 'HEADER', description: templateName.toUpperCase(), sortOrder: 0 }
    const itemsWithHeader = [header, ...previewItems].map((it, i) => ({ ...it, sortOrder: i }))
    return (
      <TemplatePreview
        templateName={templateName}
        items={itemsWithHeader}
        onBack={() => setStep('pick')}
        onConfirm={() => {
          setInitialItems(itemsWithHeader)
          setStep('form')
        }}
        confirmLabel="Apri editor"
      />
    )
  }

  return (
    <div>
      {templateName && (
        <div className="mb-4 flex items-center gap-3 px-4 py-2.5 rounded-surface bg-action-surface border border-action-border text-body text-action">
          <span>Template caricato: <strong>{templateName}</strong></span>
          <button
            type="button"
            className="ml-auto text-label text-action hover:text-action underline"
            onClick={() => setStep('pick')}
          >
            Cambia template
          </button>
        </div>
      )}
      <QuoteForm
        action={action}
        projects={projects}
        priceItems={priceItems}
        initialItems={initialItems}
        defaultProjectId={defaultProjectId}
        defaultMargin={defaultMargin}
        defaultTaxRate={defaultTaxRate}
        defaultPaymentTerms={defaultPaymentTerms}
        defaultClientNotes={defaultClientNotes}
        defaultQuoteValidityDays={defaultQuoteValidityDays}
        title="Dati preventivo"
        backHref="/quotes"
      />
    </div>
  )
}
