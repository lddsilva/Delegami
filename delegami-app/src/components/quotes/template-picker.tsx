'use client'

import { swissNumber } from '@/lib/utils'
import { ChevronRight, FileText } from 'lucide-react'
import type { QuoteTemplateRow } from '@/modules/quote-templates/queries'
import type { QuoteItem } from './quote-items-editor'

interface Props {
  templates: QuoteTemplateRow[]
  onSelect: (items: QuoteItem[], templateName: string) => void
  onSkip: () => void
}

type TemplateFamily = {
  key: string
  category: string
  title: string
  subcategory: string | null
  emoji: string
  description: string | null
  templates: QuoteTemplateRow[]
}

const CATEGORY_ORDER = ['Bagno', 'Cucina', 'Pavimenti', 'Pittura', 'Impianti', 'Muratura', 'Strutture', 'Infissi', 'Completa']
const SCOPE_ORDER = ['LIGHT', 'STANDARD', 'COMPLETE', 'SERVICE']

const scopeLabel: Record<string, string> = {
  LIGHT: 'Leggero',
  STANDARD: 'Standard',
  COMPLETE: 'Completo',
  SERVICE: 'Servizio',
}

const scopeTone: Record<string, { button: string; label: string }> = {
  LIGHT: {
    button: 'border-attention-border bg-attention-surface/40 hover:border-attention hover:bg-attention-surface',
    label: 'text-attention',
  },
  STANDARD: {
    button: 'border-action-border bg-action-surface/40 hover:border-action hover:bg-action-surface',
    label: 'text-action',
  },
  COMPLETE: {
    button: 'border-positive-border bg-positive-surface/40 hover:border-positive hover:bg-positive-surface',
    label: 'text-positive',
  },
  SERVICE: {
    button: 'border-line bg-surface hover:border-line-strong hover:bg-surface-raised',
    label: 'text-ink',
  },
}

function scopeFor(template: QuoteTemplateRow) {
  if (template.scopeLevel) return template.scopeLevel
  if (template.qualityLevel === 'LOW') return 'LIGHT'
  if (template.qualityLevel === 'HIGH') return 'COMPLETE'
  if (template.qualityLevel === 'MEDIUM') return 'STANDARD'
  return 'SERVICE'
}

function baseTemplateName(name: string) {
  return name.replace(/\s+[-—]\s+(Leggero|Standard|Completo|Servizio|Basso|Medio|Alto)$/i, '').trim()
}

function templateTotal(items: QuoteItem[]) {
  return items.reduce((sum, item) => {
    if (item.itemType !== 'ITEM') return sum
    return sum + (item.quantity ?? 1) * (item.unitPrice ?? item.unitCost ?? 0)
  }, 0)
}

function formatCurrency(value: number) {
  return swissNumber(new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 }).format(value))
}

function itemStats(items: QuoteItem[]) {
  return {
    sections: items.filter((i) => i.itemType === 'SECTION').length,
    items: items.filter((i) => i.itemType === 'ITEM').length,
  }
}

function sortTemplates(a: QuoteTemplateRow, b: QuoteTemplateRow) {
  const qa = SCOPE_ORDER.indexOf(scopeFor(a))
  const qb = SCOPE_ORDER.indexOf(scopeFor(b))
  if (qa !== qb) return qa - qb
  return a.name.localeCompare(b.name, 'it')
}

function buildFamilies(templates: QuoteTemplateRow[]) {
  const map = new Map<string, TemplateFamily>()

  for (const template of templates) {
    const groupKey = template.templateGroupKey ?? `${template.category}-${template.subcategory ?? baseTemplateName(template.name)}`
    const key = `${template.category}:${groupKey}`
    const existing = map.get(key)
    if (existing) {
      existing.templates.push(template)
      if (!existing.description && template.description) existing.description = template.description
      continue
    }

    map.set(key, {
      key,
      category: template.category,
      title: baseTemplateName(template.name),
      subcategory: template.subcategory,
      emoji: template.emoji,
      description: template.description,
      templates: [template],
    })
  }

  const categories = Array.from(new Set(Array.from(map.values()).map((family) => family.category)))
    .sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a)
      const bi = CATEGORY_ORDER.indexOf(b)
      if (ai === -1 && bi === -1) return a.localeCompare(b, 'it')
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })

  return categories.map((category) => ({
    category,
    families: Array.from(map.values())
      .filter((family) => family.category === category)
      .map((family) => ({ ...family, templates: [...family.templates].sort(sortTemplates) }))
      .sort((a, b) => {
        const minA = Math.min(...a.templates.map((t) => t.sortOrder))
        const minB = Math.min(...b.templates.map((t) => t.sortOrder))
        if (minA !== minB) return minA - minB
        return a.title.localeCompare(b.title, 'it')
      }),
  }))
}

export function TemplatePicker({ templates, onSelect, onSkip }: Props) {
  const groups = buildFamilies(templates)
  const templateCount = templates.length
  const familyCount = groups.reduce((sum, group) => sum + group.families.length, 0)

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-title font-semibold text-ink">Inizia da un template</h2>
          <p className="text-body text-ink-muted mt-1">
            Lista ordinata per categoria. Scegli il lavoro e poi il livello da caricare nel preventivo.
          </p>
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="inline-flex w-fit items-center gap-2 rounded-control border border-line bg-surface px-3 py-2 text-body font-medium text-ink-muted transition-colors hover:border-line-strong hover:bg-surface-raised hover:text-ink"
        >
          <FileText className="h-4 w-4" />
          Preventivo vuoto
        </button>
      </div>

      <div className="rounded-control border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <span className="text-label font-medium uppercase text-ink-muted">
            {familyCount} famiglie
          </span>
          <span className="text-label text-ink-muted">{templateCount} varianti</span>
        </div>

        <div className="divide-y divide-line">
          {groups.map(({ category, families }) => (
            <section key={category}>
              <div className="bg-surface-raised px-4 py-2">
                <h3 className="text-label font-semibold uppercase text-ink-muted">{category}</h3>
              </div>

              <div className="divide-y divide-line">
                {families.map((family) => {
              const reference = family.templates.find((t) => scopeFor(t) === 'STANDARD') ?? family.templates[0]
                  const stats = itemStats(reference.items)
                  return (
                    <div
                      key={family.key}
                      className="grid gap-3 px-4 py-3 transition-colors hover:bg-action-surface/30 lg:grid-cols-[minmax(260px,1fr)_minmax(260px,0.85fr)_auto] lg:items-center"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="mt-0.5 text-title leading-none">{family.emoji}</span>
                        <div className="min-w-0">
                          <p className="truncate text-body font-semibold text-ink">{family.title}</p>
                          <p className="mt-0.5 text-label text-ink-muted">
                            {[
                              family.subcategory,
                              `${stats.sections} sezioni`,
                              `${stats.items} voci`,
                            ].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                      </div>

                      <p className="hidden text-label leading-snug text-ink-muted lg:line-clamp-2 lg:block">
                        {family.description ?? 'Template pronto da personalizzare nel preventivo.'}
                      </p>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:w-[360px]">
                        {family.templates.map((template) => {
                          const total = templateTotal(template.items)
                      const scope = scopeFor(template)
                      const tone = scopeTone[scope] ?? scopeTone.SERVICE
                          return (
                            <button
                              key={template.id}
                              type="button"
                              onClick={() => onSelect(template.items, template.name)}
                              className={`flex items-center justify-between gap-2 rounded-control border px-2.5 py-1.5 text-left transition-colors ${tone.button} focus:outline-none focus:ring-2 focus:ring-action`}
                              aria-label={`Usa ${template.name}`}
                            >
                              <span className="min-w-0">
                                <span className={`block truncate text-label font-semibold ${tone.label}`}>
                              {scopeLabel[scope] ?? scope}
                                </span>
                                <span className="block text-[11px] text-ink-muted">{formatCurrency(total)}</span>
                              </span>
                              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-subtle" />
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
