'use client'

import { useMemo, useState } from 'react'
import { TemplateForm } from '@/components/quote-templates/template-form'
import type { TemplateFormState } from '@/modules/quote-templates/actions'
import type { QuoteTemplateRow } from '@/modules/quote-templates/queries'
import type { PriceCatalogItem, QuoteItem } from '@/components/quotes/quote-items-editor'

type SectionGroup = {
  id: string
  name: string
  items: QuoteItem[]
}

interface Props {
  action: (prevState: TemplateFormState, formData: FormData) => Promise<TemplateFormState>
  baseTemplate: QuoteTemplateRow
  quoteNumber: string
  quoteVersion: number
  projectName: string
  priceItems: PriceCatalogItem[]
  sourceQuoteId: string
  backHref: string
}

function cleanName(value: string) {
  return value.replace(/^§\s*/, '').trim() || 'Sezione'
}

function buildGroups(items: QuoteItem[]) {
  const groups: SectionGroup[] = []
  let current: SectionGroup | null = null

  for (const item of items) {
    if (item.itemType === 'HEADER' || item.itemType === 'SUBTOTAL') continue

    if (item.itemType === 'SECTION') {
      current = {
        id: `section-${groups.length}`,
        name: cleanName(item.description),
        items: [{ ...item, sortOrder: 0 }],
      }
      groups.push(current)
      continue
    }

    if (!current) {
      current = { id: 'section-0', name: 'Voci principali', items: [] }
      groups.push(current)
    }
    current.items.push({ ...item, sortOrder: current.items.length })
  }

  return groups.length > 0 ? groups : [{ id: 'section-0', name: 'Preventivo completo', items }]
}

function inferTemplateCategory(groups: SectionGroup[], fallback: string) {
  const text = groups.map((group) => `${group.name} ${group.items.map((i) => i.description).join(' ')}`).join(' ').toLowerCase()
  if (text.includes('cucina')) return 'Cucina'
  if (text.includes('bagno') || text.includes('doccia') || text.includes('wc')) return 'Bagno'
  if (text.includes('paviment') || text.includes('piastrell') || text.includes('gres')) return 'Pavimenti'
  if (text.includes('elettric')) return 'Impianti'
  if (text.includes('idraulic')) return 'Idraulica'
  if (text.includes('pittura') || text.includes('tinteggi')) return 'Pittura'
  if (text.includes('muratura') || text.includes('intonac')) return 'Muratura'
  return fallback
}

export function QuoteSectionTemplateBuilder({
  action,
  baseTemplate,
  quoteNumber,
  quoteVersion,
  projectName,
  priceItems,
  sourceQuoteId,
  backHref,
}: Props) {
  const groups = useMemo(() => buildGroups(baseTemplate.items), [baseTemplate.items])
  const [selectedIds, setSelectedIds] = useState(() => new Set(groups.map((group) => group.id)))

  const selectedGroups = groups.filter((group) => selectedIds.has(group.id))
  const selectedNames = selectedGroups.map((group) => group.name)
  const name = selectedNames.length > 0
    ? `${projectName} - ${selectedNames.join(' / ')}`
    : `${projectName} - Template`
  const headerItem: QuoteItem = { itemType: 'HEADER', description: name.toUpperCase(), sortOrder: 0 }
  const selectedItems: QuoteItem[] = [
    headerItem,
    ...selectedGroups.flatMap((group) => group.items),
  ].map((item, index) => ({ ...item, sortOrder: index }))
  const template: QuoteTemplateRow = {
    ...baseTemplate,
    name,
    category: inferTemplateCategory(selectedGroups, baseTemplate.category),
    subcategory: null,
    items: selectedItems,
  }
  const formKey = selectedIds.size === 0
    ? 'empty'
    : Array.from(selectedIds).sort().join('|')

  return (
    <div className="grid gap-6 2xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="h-fit rounded-control border border-line bg-surface p-4 2xl:sticky 2xl:top-4">
        <h2 className="text-body font-semibold text-ink">Sezioni da includere</h2>
        <p className="mt-1 text-label text-ink-muted">
          Il template verrà creato solo con le sezioni selezionate.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 2xl:grid-cols-1">
          {groups.map((group) => {
            const itemCount = group.items.filter((item) => item.itemType === 'ITEM').length
            return (
              <label key={group.id} className="flex items-start gap-3 rounded-control border border-line px-3 py-2 text-body hover:bg-surface-raised">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-line-strong"
                  checked={selectedIds.has(group.id)}
                  onChange={(event) => {
                    const next = new Set(selectedIds)
                    if (event.target.checked) next.add(group.id)
                    else next.delete(group.id)
                    setSelectedIds(next)
                  }}
                />
                <span className="min-w-0">
                  <span className="block font-medium text-ink">{group.name}</span>
                  <span className="block text-label text-ink-muted">{itemCount} voci</span>
                </span>
              </label>
            )
          })}
        </div>
        <div className="mt-4 rounded-control bg-surface-raised border border-line px-3 py-2 text-label text-ink-muted">
          Origine: {quoteNumber} v{quoteVersion}
        </div>
      </aside>

      <div className="min-w-0 overflow-x-auto">
        <TemplateForm
          key={formKey}
          action={action}
          template={template}
          initialItems={selectedItems}
          sourceQuoteId={sourceQuoteId}
          priceItems={priceItems}
          helperText="Scegli le sezioni utili, poi controlla nome, categoria e voci. Le note interne e i riferimenti prodotto restano nel template ma sono chiusi di default."
          title="Crea template dal preventivo"
          backHref={backHref}
        />
      </div>
    </div>
  )
}
