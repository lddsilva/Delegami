'use client'

import { swissNumber } from '@/lib/utils'
import { useState } from 'react'
import { ChevronRight, FileText } from 'lucide-react'
import type { QuoteTemplateRow } from '@/modules/quote-templates/queries'

interface InvoiceItem {
  itemType?: string
  description: string
  unit?: string
  quantity: number
  unitPrice: number
  unitCost?: number
  total?: number
}

interface Props {
  templates: QuoteTemplateRow[]
  onSelect: (items: InvoiceItem[], templateName: string) => void
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

const CATEGORY_ORDER = ['Bagno', 'Cucina', 'Pavimenti', 'Pittura', 'Impianti', 'Muratura', 'Strutture', 'Infissi', 'Isolamento', 'Idraulica', 'Fornitura', 'Noleggio', 'Consulenza', 'Manodopera', 'Smaltimento', 'SAL', 'Acconto']
const QUALITY_ORDER = ['LOW', 'MEDIUM', 'HIGH', 'STANDARD']

const qualityLabel: Record<string, string> = {
  STANDARD: 'Standard',
  LOW: 'Basso',
  MEDIUM: 'Medio',
  HIGH: 'Alto',
}

const qualityTone: Record<string, { button: string; selected: string; label: string }> = {
  STANDARD: {
    button: 'border-line bg-surface hover:border-line-strong hover:bg-surface-raised',
    selected: 'border-line-strong bg-surface-raised',
    label: 'text-ink',
  },
  LOW: {
    button: 'border-attention-border bg-attention-surface/40 hover:border-attention hover:bg-attention-surface',
    selected: 'border-attention bg-attention-surface',
    label: 'text-attention',
  },
  MEDIUM: {
    button: 'border-action-border bg-action-surface/40 hover:border-action hover:bg-action-surface',
    selected: 'border-action bg-action-surface',
    label: 'text-action',
  },
  HIGH: {
    button: 'border-positive-border bg-positive-surface/40 hover:border-positive hover:bg-positive-surface',
    selected: 'border-positive bg-positive-surface',
    label: 'text-positive',
  },
}

function baseTemplateName(name: string) {
  return name.replace(/\s+[-—]\s+(Basso|Medio|Alto|Standard)$/i, '').trim()
}

function templateTotal(items: InvoiceItem[]) {
  return items.reduce((sum, item) => {
    if (item.itemType && item.itemType !== 'ITEM') return sum
    return sum + (item.quantity ?? 1) * (item.unitPrice ?? item.unitCost ?? 0)
  }, 0)
}

function formatCurrency(value: number) {
  return swissNumber(new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 }).format(value))
}

function sortTemplates(a: QuoteTemplateRow, b: QuoteTemplateRow) {
  const qa = QUALITY_ORDER.indexOf(a.qualityLevel)
  const qb = QUALITY_ORDER.indexOf(b.qualityLevel)
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

export function InvoiceTemplatePicker({ templates, onSelect, onSkip }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const groups = buildFamilies(templates)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-title font-semibold text-ink">Inizia da un template fattura</h2>
        <p className="text-body text-ink-muted mt-1">
          Seleziona il lavoro e, quando disponibile, il livello di finitura. Puoi modificare importi e voci liberamente.
        </p>
      </div>

      {groups.map(({ category, families }) => (
        <div key={category}>
          <h3 className="text-label font-semibold text-ink-muted uppercase tracking-wider mb-2">{category}</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {families.map((family) => {
              const reference = family.templates.find((t) => t.qualityLevel === 'MEDIUM') ?? family.templates[0]
              const referenceItems = reference.items as InvoiceItem[]
              const itemCount = referenceItems.filter((i) => !i.itemType || i.itemType === 'ITEM').length
              return (
                <div key={family.key} className="rounded-surface border border-line bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-display">{family.emoji}</span>
                        <span className="text-body font-semibold text-ink">{family.title}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-label text-ink-muted">
                        {family.subcategory && <span>{family.subcategory}</span>}
                        <span>{itemCount} voci</span>
                      </div>
                      {family.description && (
                        <p className="text-label text-ink-muted leading-snug mt-2 line-clamp-2">{family.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                    {family.templates.map((template) => {
                      const items = template.items as InvoiceItem[]
                      const total = templateTotal(items)
                      const tone = qualityTone[template.qualityLevel] ?? qualityTone.STANDARD
                      const isHovered = hoveredId === template.id
                      return (
                        <button
                          key={template.id}
                          type="button"
                          onMouseEnter={() => setHoveredId(template.id)}
                          onMouseLeave={() => setHoveredId(null)}
                          onClick={() => onSelect(items, template.name)}
                          className={`text-left rounded-control border px-3 py-2 transition-all ${isHovered ? tone.selected : tone.button}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-label font-semibold ${tone.label}`}>
                              {qualityLabel[template.qualityLevel] ?? template.qualityLevel}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-ink-subtle" />
                          </div>
                          <div className="text-[11px] text-ink-muted mt-1">{formatCurrency(total)}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <div className="pt-2 border-t border-line">
        <button type="button" onClick={onSkip} className="flex items-center gap-2 text-body text-ink-muted hover:text-ink transition-colors">
          <FileText className="w-4 h-4" /> Crea fattura vuota
        </button>
      </div>
    </div>
  )
}
