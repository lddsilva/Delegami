'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import {
  Plus, Trash2, ChevronUp, ChevronDown, Search, Calculator,
  X, BookOpen, Link2, BookmarkPlus, Eye, EyeOff, ExternalLink,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, swissNumber } from '@/lib/utils'
import { saveItemToCatalog } from '@/modules/price-catalog/actions'
import { PRICE_CATALOG_CATEGORIES, inferPriceCategoryFromText } from '@/lib/price-catalog-taxonomy'
import { TemplatePreview } from './template-preview'
import { useToast } from '@/components/ui/use-toast'

const ITEM_GRID_TEMPLATE = '24px minmax(320px,1fr) 64px 82px 52px 86px 86px 168px'

export type ItemType = 'ITEM' | 'SECTION' | 'NOTE' | 'SUBTOTAL' | 'HEADER'

export const UNITS = ['m²', 'm³', 'ml', 'h', 'pz', 'kg', 't', 'l', 'set', 'corpo']

export interface QuoteItem {
  id?: string
  priceItemId?: string
  itemType: ItemType
  section?: string
  sortOrder: number
  description: string
  unit?: string
  quantity?: number
  unitCost?: number
  unitPrice?: number
  marginPercent?: number
  directPrice?: boolean
  hiddenFromClient?: boolean
  sourceUrl?: string
  sourceNote?: string
  dimL?: number
  dimH?: number
}

export interface PriceCatalogItem {
  id: string
  code?: string | null
  category: string
  description: string
  unit: string
  unitCost: number
  qualityLevel: string   // Legacy: STANDARD | LOW | MEDIUM | HIGH
  productTier?: string | null
  notes?: string | null   // copied to sourceNote when inserting
  links?: string | null   // first URL copied to sourceUrl when inserting
}

export interface TemplateOption {
  id: string
  name: string
  emoji: string
  category: string
  qualityLevel: string
  scopeLevel?: string | null
  templateGroupKey: string | null
  items: QuoteItem[]
}

interface QuoteItemsEditorProps {
  initialItems?: QuoteItem[]
  marginPercent: number
  taxRate: number
  priceItems?: PriceCatalogItem[]
  templates?: TemplateOption[]
  onChange?: (items: QuoteItem[], totals: Totals) => void
  collapseReferencesByDefault?: boolean
}

interface Totals {
  subtotalCost: number
  subtotalClient: number
  marginAmount: number
  taxAmount: number
  total: number
  hiddenTotal?: number
}

function calcTotals(items: QuoteItem[], taxRate: number): Totals {
  const lineItems = items.filter((i) => i.itemType === 'ITEM')
  const subtotalCost = lineItems.reduce((s, i) => s + (i.quantity ?? 0) * (i.unitCost ?? 0), 0)
  const subtotalClient = lineItems
    .filter((i) => !i.hiddenFromClient)
    .reduce((s, i) => s + (i.quantity ?? 0) * (i.unitPrice ?? 0), 0)
  const hiddenTotal = lineItems
    .filter((i) => i.hiddenFromClient)
    .reduce((s, i) => s + (i.quantity ?? 0) * (i.unitPrice ?? 0), 0)
  const marginAmount = subtotalClient - subtotalCost
  const taxAmount = subtotalClient * (taxRate / 100)
  return { subtotalCost, subtotalClient, marginAmount, taxAmount, total: subtotalClient + taxAmount, hiddenTotal }
}

function applyMargin(cost: number, pct: number): number {
  if (pct <= 0 || pct >= 100) return cost
  return parseFloat((cost / (1 - pct / 100)).toFixed(2))
}

function fmt(n: number) {
  return swissNumber(new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n))
}

function emptyItem(idx: number): QuoteItem {
  return { itemType: 'ITEM', sortOrder: idx, description: '', quantity: 1, unitCost: 0, unitPrice: 0 }
}

// ─── Auto-resize textarea ref helper ─────────────────────────────────────────
function autoResize(el: HTMLTextAreaElement | null) {
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

// ─── Catalog search dropdown ──────────────────────────────────────────────────
function CatalogDropdown({
  query, items, onSelect, onClose,
}: {
  query: string
  items: PriceCatalogItem[]
  onSelect: (item: PriceCatalogItem) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const q = query.toLowerCase()
  const filtered = items.filter((i) =>
    i.description.toLowerCase().includes(q) ||
    (i.code?.toLowerCase().includes(q) ?? false) ||
    i.category.toLowerCase().includes(q),
  ).slice(0, 8)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  if (filtered.length === 0) return null
  return (
    <div ref={ref} className="absolute top-full left-0 right-0 z-50 bg-surface border border-line rounded-control shadow-xl mt-1 max-h-60 overflow-y-auto">
      {filtered.map((item) => (
        <button
          key={item.id}
          type="button"
          className="w-full text-left px-3 py-2.5 hover:bg-action-surface flex items-start gap-3 border-b border-line last:border-0 transition-colors"
          onMouseDown={(e) => { e.preventDefault(); onSelect(item) }}
        >
          <div className="flex-1 min-w-0">
            <div className="text-body font-medium text-ink">{item.description}</div>
            <div className="text-label text-ink-muted mt-0.5">{item.category}{item.code ? ` · ${item.code}` : ''} · {item.unit}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-label font-semibold text-attention">CHF {fmt(item.unitCost)}</div>
          </div>
        </button>
      ))}
    </div>
  )
}

// ─── Dimension calculator popover ─────────────────────────────────────────────
function DimCalculator({
  dimL, dimH, onChange, onClose,
}: {
  dimL?: number
  dimH?: number
  onChange: (l: number, h: number) => void
  onClose: () => void
}) {
  const [l, setL] = useState(dimL ?? 0)
  const [h, setH] = useState(dimH ?? 0)
  const result = parseFloat((l * h).toFixed(4))
  return (
    <div className="absolute top-full right-0 z-50 bg-surface border border-line rounded-control shadow-xl mt-1 p-4 w-56">
      <div className="flex items-center justify-between mb-3">
        <span className="text-label font-semibold text-ink">Calcolo L × H</span>
        <button type="button" onClick={onClose}><X className="w-3.5 h-3.5 text-ink-muted" /></button>
      </div>
      <div className="mb-3 grid grid-cols-1 items-center gap-2 sm:grid-cols-3">
        <input type="number" min="0" step="0.01" className="border border-line rounded-control px-2 py-1.5 text-body text-right w-full outline-none focus:border-action focus:ring-1 focus:ring-action" placeholder="L" value={l || ''} onChange={(e) => setL(parseFloat(e.target.value) || 0)} />
        <span className="text-center text-ink-muted font-medium">×</span>
        <input type="number" min="0" step="0.01" className="border border-line rounded-control px-2 py-1.5 text-body text-right w-full outline-none focus:border-action focus:ring-1 focus:ring-action" placeholder="H" value={h || ''} onChange={(e) => setH(parseFloat(e.target.value) || 0)} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-body font-semibold text-ink">= {fmt(result)}</span>
        <button type="button" className="text-body bg-action text-ink-inverse px-3 py-1.5 rounded-control hover:bg-action-hover font-medium" onClick={() => { onChange(l, h); onClose() }}>Applica</button>
      </div>
    </div>
  )
}

// ─── Catalog browser panel — 2-level Parent › Sub ────────────────────────────
function parseCat(cat: string) {
  const sep = cat.indexOf(' – ')
  if (sep === -1) return { parent: cat, sub: cat }
  return { parent: cat.slice(0, sep), sub: cat.slice(sep + 3) }
}
const PARENT_ORDER_CATALOG = ['Bagno', 'Cucina', 'Pavimenti', 'Strutture', 'Finiture', 'Impianti', 'Manodopera', 'Logistica', 'Utensili', 'Varie']

const PRODUCT_TIER_LABELS: Record<string, { label: string; color: string }> = {
  ESSENTIAL: { label: 'Essenziale', color: 'bg-attention-surface text-attention border-attention-border' },
  STANDARD:  { label: 'Standard',   color: 'bg-action-surface text-action border-action-border' },
  PREMIUM:   { label: 'Premium',    color: 'bg-positive-surface text-positive border-positive-border' },
  SERVICE:   { label: 'Servizio',   color: 'bg-surface-raised text-ink-muted border-line' },
}

function productTierFor(item: PriceCatalogItem) {
  if (item.productTier) return item.productTier
  if (item.qualityLevel === 'LOW') return 'ESSENTIAL'
  if (item.qualityLevel === 'MEDIUM') return 'STANDARD'
  if (item.qualityLevel === 'HIGH') return 'PREMIUM'
  return 'SERVICE'
}

function CatalogBrowser({
  items,
  onSelect,
  listClassName,
  initialSearch = '',
  autoFocus = false,
}: {
  items: PriceCatalogItem[]
  onSelect: (item: PriceCatalogItem) => void
  listClassName?: string
  initialSearch?: string
  autoFocus?: boolean
}) {
  const [search, setSearch] = useState(initialSearch.trim())
  const [activeParent, setActiveParent] = useState<string | null>(null)
  const [activeSub, setActiveSub] = useState<string | null>(null)
  const [activeTier, setActiveTier] = useState<string | null>(null)

  const parents = useMemo(() => {
    const map = new Map<string, number>()
    items.forEach((i) => { const { parent } = parseCat(i.category); map.set(parent, (map.get(parent) ?? 0) + 1) })
    return Array.from(map.entries())
      .sort(([a], [b]) => {
        const ai = PARENT_ORDER_CATALOG.indexOf(a); const bi = PARENT_ORDER_CATALOG.indexOf(b)
        if (ai !== -1 && bi !== -1) return ai - bi
        if (ai !== -1) return -1; if (bi !== -1) return 1
        return a.localeCompare(b)
      })
  }, [items])

  const subs = useMemo(() => {
    if (!activeParent) return []
    const map = new Map<string, number>()
    items.forEach((i) => { const { parent, sub } = parseCat(i.category); if (parent === activeParent) map.set(sub, (map.get(sub) ?? 0) + 1) })
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [items, activeParent])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return items.filter((i) => {
      const { parent, sub } = parseCat(i.category)
      if (activeParent && parent !== activeParent) return false
      if (activeSub && sub !== activeSub) return false
      if (activeTier && productTierFor(i) !== activeTier) return false
      if (!q) return true
      return i.description.toLowerCase().includes(q) || (i.code?.toLowerCase().includes(q) ?? false) || i.category.toLowerCase().includes(q)
    })
  }, [items, search, activeParent, activeSub, activeTier])

  const availableTiers = useMemo(() => {
    const set = new Set(filtered.map(productTierFor))
    return (['ESSENTIAL', 'STANDARD', 'PREMIUM', 'SERVICE'] as const).filter((tier) => set.has(tier))
  }, [filtered])

  return (
    <div className="border border-line rounded-surface bg-surface-raised p-3 space-y-2.5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted" />
        <input type="text" autoFocus={autoFocus} value={search} onChange={(e) => { setSearch(e.target.value); if (e.target.value) { setActiveParent(null); setActiveSub(null) } }} placeholder="Cerca per nome, codice..." className="w-full pl-8 pr-3 py-1.5 text-body border border-line rounded-control bg-surface outline-none focus:border-action focus:ring-1 focus:ring-action" />
      </div>
      {!search && (
        <>
          <div className="flex flex-wrap gap-1">
            <button type="button" onClick={() => { setActiveParent(null); setActiveSub(null) }} className={cn('px-2.5 py-0.5 rounded-full text-label font-medium border transition-colors', !activeParent ? 'bg-action text-ink-inverse border-action' : 'bg-surface text-ink-muted border-line hover:border-action')}>Tutto</button>
            {parents.map(([parent, count]) => (
              <button key={parent} type="button" onClick={() => { setActiveParent(activeParent === parent ? null : parent); setActiveSub(null) }} className={cn('px-2.5 py-0.5 rounded-full text-label font-medium border transition-colors', activeParent === parent ? 'bg-action text-ink-inverse border-action' : 'bg-surface text-ink-muted border-line hover:border-action')}>
                {parent} <span className="opacity-60">({count})</span>
              </button>
            ))}
          </div>
          {activeParent && subs.length > 1 && (
            <div className="flex flex-wrap gap-1 pl-1">
              <span className="text-label text-ink-subtle">↳</span>
              <button type="button" onClick={() => setActiveSub(null)} className={cn('px-2 py-0.5 rounded-full text-label border transition-colors', !activeSub ? 'bg-action-surface text-action border-action' : 'bg-surface text-ink-muted border-line hover:border-action')}>Tutti</button>
              {subs.map(([sub, count]) => (
                <button key={sub} type="button" onClick={() => setActiveSub(activeSub === sub ? null : sub)} className={cn('px-2 py-0.5 rounded-full text-label border transition-colors', activeSub === sub ? 'bg-action-surface text-action border-action' : 'bg-surface text-ink-muted border-line hover:border-action')}>
                  {sub} <span className="opacity-60">({count})</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
      {availableTiers.length > 1 && (
        <div className="flex flex-wrap gap-1 border-t border-line pt-2">
          <button type="button" onClick={() => setActiveTier(null)} className={cn('px-2 py-0.5 rounded-full text-label border transition-colors', !activeTier ? 'bg-ink text-ink-inverse border-ink' : 'bg-surface text-ink-muted border-line hover:border-line-strong')}>Tutte</button>
          {availableTiers.map((tier) => (
            <button key={tier} type="button" onClick={() => setActiveTier(activeTier === tier ? null : tier)} className={cn('px-2 py-0.5 rounded-full text-label border font-medium transition-colors', activeTier === tier ? PRODUCT_TIER_LABELS[tier].color + ' font-semibold' : 'bg-surface text-ink-muted border-line hover:border-line-strong')}>
              {PRODUCT_TIER_LABELS[tier].label}
            </button>
          ))}
        </div>
      )}
      <div className={cn('overflow-y-auto space-y-0.5 rounded-control', listClassName ?? 'max-h-64')}>
        {filtered.length === 0 ? (
          <p className="text-center text-body text-ink-muted py-4">Nessun articolo trovato</p>
        ) : filtered.map((item) => {
          const firstLink = item.links?.split('\n').find((u) => u.trim())?.trim()
          return (
            <div key={item.id} onClick={() => onSelect(item)} className="w-full text-left flex items-center gap-2.5 px-2.5 py-2 bg-surface rounded-control border border-line hover:border-action hover:bg-action-surface transition-colors group cursor-pointer">
              <div className="flex-1 min-w-0">
                <div className="text-body font-medium text-ink group-hover:text-action truncate">{item.description}</div>
                <div className="text-label text-ink-muted mt-0.5 truncate flex items-center gap-1.5">
                  <span className="truncate">{parseCat(item.category).sub}{item.code ? ` · ${item.code}` : ''} · {item.unit}</span>
                  {productTierFor(item) !== 'SERVICE' && (
                    <span className={cn('shrink-0 px-1.5 py-0 rounded text-[10px] font-medium border', PRODUCT_TIER_LABELS[productTierFor(item)]?.color ?? 'bg-surface-raised text-ink-muted border-line')}>
                      {PRODUCT_TIER_LABELS[productTierFor(item)]?.label ?? productTierFor(item)}
                    </span>
                  )}
                  {item.notes && <span className="shrink-0 text-attention" title={item.notes}>📝</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {firstLink && (
                  <a
                    href={firstLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title={firstLink}
                    className="p-1 text-action hover:text-action transition-colors rounded"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <div className="text-right">
                  <div className="text-label font-semibold text-attention">CHF {fmt(item.unitCost)}</div>
                  <div className="text-label text-action group-hover:text-action">+ Aggiungi</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-label text-ink-muted">{filtered.length} articoli{activeParent ? ` · ${activeParent}${activeSub ? ` › ${activeSub}` : ''}` : ''}</p>
    </div>
  )
}

// ─── Insert-between row ───────────────────────────────────────────────────────
function CatalogInsertPanel({
  items,
  targetLabel,
  targetDetail,
  feedback,
  listClassName,
  onSelect,
  onResetTarget,
  onClose,
}: {
  items: PriceCatalogItem[]
  targetLabel: string
  targetDetail: string
  feedback: string | null
  listClassName?: string
  onSelect: (item: PriceCatalogItem) => void
  onResetTarget: () => void
  onClose: () => void
}) {
  return (
    <div className="bg-surface border border-line rounded-surface shadow-sm overflow-hidden">
      <div className="p-3 border-b border-line space-y-2.5">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-action" />
          <div className="min-w-0">
            <p className="text-body font-semibold text-ink leading-tight">Prezzario</p>
            <p className="text-label text-ink-muted leading-tight">{items.length} articoli disponibili</p>
          </div>
          <button type="button" onClick={onClose} className="ml-auto p-1 rounded-control text-ink-subtle hover:text-ink-muted hover:bg-surface-raised transition-colors" aria-label="Chiudi catalogo">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-control border border-action-border bg-action-surface px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide font-semibold text-action">{targetLabel}</p>
          <p className="text-label text-action leading-snug mt-0.5">{targetDetail}</p>
          {targetLabel !== 'Inserisci in fondo' && (
            <button type="button" onClick={onResetTarget} className="text-label text-action hover:text-action underline mt-1">
              Passa a inserimento in fondo
            </button>
          )}
        </div>

        {feedback && (
          <div className="flex items-start gap-2 rounded-control border border-positive-border bg-positive-surface px-3 py-2 text-label text-positive">
            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}
      </div>

      <div className="p-3">
        <CatalogBrowser items={items} onSelect={onSelect} listClassName={listClassName ?? 'max-h-[calc(100vh-310px)] min-h-64'} />
      </div>
    </div>
  )
}

function CatalogLookupDialog({
  items,
  lineLabel,
  initialSearch,
  onSelect,
  onClose,
}: {
  items: PriceCatalogItem[]
  lineLabel: string
  initialSearch?: string
  onSelect: (item: PriceCatalogItem) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 px-4 py-10">
      <button type="button" className="absolute inset-0" aria-label="Chiudi prezzario" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[calc(100vh-5rem)] overflow-y-auto rounded-surface bg-surface shadow-2xl">
        <div className="flex items-start gap-2 border-b border-line px-4 py-3">
          <BookOpen className="w-4 h-4 text-action mt-0.5" />
          <div className="min-w-0">
            <p className="text-body font-semibold text-ink">Scegli articolo dal prezzario</p>
            <p className="text-label text-ink-muted truncate">{lineLabel}</p>
          </div>
          <button type="button" onClick={onClose} className="ml-auto p-1 rounded-control text-ink-subtle hover:text-ink-muted hover:bg-surface-raised transition-colors" aria-label="Chiudi">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-3">
          <CatalogBrowser items={items} onSelect={onSelect} initialSearch={initialSearch} autoFocus listClassName="max-h-[58vh]" />
        </div>
      </div>
    </div>
  )
}

function InsertRow({ onInsert, onCatalogInsert }: { onInsert: (type: ItemType) => void; onCatalogInsert?: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative group/ins h-4 flex items-center" onMouseLeave={() => setOpen(false)}>
      <div className="absolute inset-x-0 h-px bg-surface-raised group-hover/ins:bg-action-border transition-colors" />
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onClick={() => setOpen((v) => !v)}
        className="relative z-10 mx-auto flex min-h-11 items-center gap-1 rounded-full border border-action-border bg-surface px-3 text-label font-medium text-action opacity-0 shadow-sm transition-all duration-state group-hover/ins:opacity-100 hover:bg-action-surface"
      >
        <Plus className="w-3 h-3" /> Inserisci
      </button>
      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 z-50 bg-surface border border-line rounded-surface shadow-xl mt-1 flex gap-1 p-1.5">
          {onCatalogInsert && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onCatalogInsert(); setOpen(false) }}
              className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-control text-label font-medium transition-colors min-w-[68px] hover:bg-action-surface text-action"
            >
              <BookOpen className="w-4 h-4" />
              <span>Prezzario</span>
            </button>
          )}
          {([
            { type: 'ITEM', icon: '📋', label: 'Articolo' },
            { type: 'SECTION', icon: '§', label: 'Sezione' },
            { type: 'NOTE', icon: '📝', label: 'Nota' },
            { type: 'HEADER', icon: '▶', label: 'Titolo' },
          ] as { type: ItemType; icon: string; label: string }[]).map(({ type, icon, label }) => (
            <button
              key={type}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onInsert(type); setOpen(false) }}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-control text-label font-medium transition-colors min-w-[56px] ${type === 'HEADER' ? 'hover:bg-shell hover:text-ink-inverse text-action' : 'hover:bg-action-surface text-ink hover:text-action'}`}
            >
              <span className="text-body">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Template menu (grouped by family + quality buttons) ─────────────────────
const TEMPLATE_QUALITY: Record<string, { label: string; color: string; text: string }> = {
  LIGHT:    { label: 'Leggero',  color: 'border-attention-border bg-attention-surface  hover:bg-attention-surface',     text: 'text-attention' },
  STANDARD: { label: 'Standard', color: 'border-action-border  bg-action-surface   hover:bg-action-surface',      text: 'text-action' },
  COMPLETE: { label: 'Completo', color: 'border-positive-border bg-positive-surface hover:bg-positive-surface', text: 'text-positive' },
  SERVICE:  { label: 'Servizio', color: 'border-line  bg-surface-raised   hover:bg-surface-raised',      text: 'text-ink-muted' },
}

function scopeFor(template: TemplateOption) {
  if (template.scopeLevel) return template.scopeLevel
  if (template.qualityLevel === 'LOW') return 'LIGHT'
  if (template.qualityLevel === 'HIGH') return 'COMPLETE'
  if (template.qualityLevel === 'MEDIUM') return 'STANDARD'
  return 'SERVICE'
}

function buildTemplateGroups(templates: TemplateOption[]) {
  const map = new Map<string, { key: string; emoji: string; title: string; variants: TemplateOption[] }>()
  for (const t of templates) {
    const groupKey = t.templateGroupKey ?? `${t.category}-${t.name.replace(/\s+[-—]\s+(Leggero|Standard|Completo|Servizio|Basso|Medio|Alto)$/i, '').trim()}`
    const existing = map.get(groupKey)
    if (existing) { existing.variants.push(t); continue }
    map.set(groupKey, {
      key: groupKey,
      emoji: t.emoji,
      title: t.name.replace(/\s+[-—]\s+(Leggero|Standard|Completo|Servizio|Basso|Medio|Alto)$/i, '').trim(),
      variants: [t],
    })
  }
  return Array.from(map.values()).map((g) => ({
    ...g,
    variants: g.variants.sort((a, b) => {
      const order = ['LIGHT', 'STANDARD', 'COMPLETE', 'SERVICE']
      return order.indexOf(scopeFor(a)) - order.indexOf(scopeFor(b))
    }),
  }))
}

function TemplateMenuButton({
  templates, showTemplateMenu, setShowTemplateMenu, setPendingTemplate,
}: {
  templates: TemplateOption[]
  showTemplateMenu: boolean
  setShowTemplateMenu: (v: boolean | ((prev: boolean) => boolean)) => void
  setPendingTemplate: (t: TemplateOption | null) => void
}) {
  const groups = buildTemplateGroups(templates)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowTemplateMenu((v) => !v)}
        className="flex items-center gap-1.5 text-body px-3 py-1.5 rounded-control border border-action-border text-action bg-action-surface hover:bg-action-surface font-medium transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> 📋 Sezione da template
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showTemplateMenu && 'rotate-180')} />
      </button>
      {showTemplateMenu && (
        <div className="absolute top-full left-0 z-50 mt-1 bg-surface border border-line rounded-surface shadow-xl min-w-[300px] py-1.5 max-h-96 overflow-y-auto">
          <p className="text-label text-ink-muted px-3 py-1.5 font-medium uppercase tracking-wide">Scegli template da aggiungere</p>
          {groups.map((group) => (
            <div key={group.key} className="px-3 py-2 border-b border-line last:border-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-body">{group.emoji}</span>
                <span className="text-body font-medium text-ink">{group.title}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {group.variants.map((t) => {
                  const tone = TEMPLATE_QUALITY[scopeFor(t)] ?? TEMPLATE_QUALITY.SERVICE
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        setPendingTemplate(t)
                        setShowTemplateMenu(false)
                      }}
                      className={`text-label font-medium px-2.5 py-1 rounded-control border transition-colors ${tone.color} ${tone.text}`}
                    >
                      {tone.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main editor ──────────────────────────────────────────────────────────────
export function QuoteItemsEditor({
  initialItems = [],
  marginPercent,
  taxRate,
  priceItems = [],
  templates = [],
  onChange,
  collapseReferencesByDefault = false,
}: QuoteItemsEditorProps) {
  const { toastError, toastSuccess, toaster } = useToast()
  const [items, setItems] = useState<QuoteItem[]>(
    initialItems.length > 0 ? initialItems : [emptyItem(0)],
  )
  const itemsRef = useRef(items)
  useEffect(() => { itemsRef.current = items }, [items])
  const prevMarginRef = useRef(marginPercent)
  const rowRefs = useRef<Record<number, HTMLDivElement | null>>({})

  const [catalogOpen, setCatalogOpen] = useState<number | null>(null)
  const [catalogLookupIndex, setCatalogLookupIndex] = useState<number | null>(null)
  const [dimOpen, setDimOpen] = useState<number | null>(null)
  const [showCatalogBrowser, setShowCatalogBrowser] = useState(false)
  const [showTemplateMenu, setShowTemplateMenu] = useState(false)
  const [activeInsertIndex, setActiveInsertIndex] = useState<number | null>(null)
  const [lastInsertedIndex, setLastInsertedIndex] = useState<number | null>(null)
  const [catalogFeedback, setCatalogFeedback] = useState<string | null>(null)
  const [pendingTemplate, setPendingTemplate] = useState<TemplateOption | null>(null)
  const [catalogSaveIndex, setCatalogSaveIndex] = useState<number | null>(null)
  const [catalogSaveCategory, setCatalogSaveCategory] = useState<string>(PRICE_CATALOG_CATEGORIES[0])
  const [catalogSavePending, setCatalogSavePending] = useState(false)
  const [refOpen, setRefOpen] = useState<Set<number>>(() => {
    const s = new Set<number>()
    if (collapseReferencesByDefault) return s
    initialItems.forEach((it, i) => { if (it.sourceUrl || it.sourceNote) s.add(i) })
    return s
  })

  const update = useCallback((newItems: QuoteItem[]) => {
    setItems(newItems)
    onChange?.(newItems, calcTotals(newItems, taxRate))
  }, [onChange, taxRate])

  useEffect(() => {
    if (prevMarginRef.current === marginPercent) return
    prevMarginRef.current = marginPercent
    const updated = itemsRef.current.map((item) => {
      if (item.itemType !== 'ITEM' || item.directPrice || item.marginPercent != null) return item
      const cost = item.unitCost ?? 0
      return { ...item, unitPrice: cost > 0 ? applyMargin(cost, marginPercent) : item.unitPrice ?? 0 }
    })
    update(updated)
  }, [marginPercent, update])

  useEffect(() => {
    if (lastInsertedIndex == null) return
    const scrollId = window.setTimeout(() => {
      rowRefs.current[lastInsertedIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 80)
    const clearId = window.setTimeout(() => setLastInsertedIndex(null), 2400)
    return () => {
      window.clearTimeout(scrollId)
      window.clearTimeout(clearId)
    }
  }, [lastInsertedIndex, items.length])

  useEffect(() => {
    if (!catalogFeedback) return
    const id = window.setTimeout(() => setCatalogFeedback(null), 2600)
    return () => window.clearTimeout(id)
  }, [catalogFeedback])

  function recalcAllPrices() {
    const updated = items.map((item) => {
      if (item.itemType !== 'ITEM' || item.directPrice) return item
      const cost = item.unitCost ?? 0
      const pct = item.marginPercent ?? marginPercent
      return { ...item, unitPrice: cost > 0 ? applyMargin(cost, pct) : item.unitPrice }
    })
    update(updated)
  }

  function addItem(type: ItemType = 'ITEM', openCatalog = false) {
    const insertedIndex = items.length
    const next: QuoteItem = {
      itemType: type,
      sortOrder: insertedIndex,
      description: type === 'SECTION' ? 'Nuova sezione' : type === 'HEADER' ? 'Titolo opera' : '',
      quantity: type === 'ITEM' ? 1 : undefined,
      unitCost: type === 'ITEM' ? 0 : undefined,
      unitPrice: type === 'ITEM' ? 0 : undefined,
    }
    update([...items, next])
    setActiveInsertIndex(insertedIndex)
    setLastInsertedIndex(insertedIndex)
    if (openCatalog && type === 'ITEM') {
      setCatalogOpen(null)
      setCatalogLookupIndex(insertedIndex)
    }
  }

  function addFromTemplate(templateItems: QuoteItem[], templateName?: string) {
    const existing = items.filter((i) => !(i.itemType === 'ITEM' && i.description.trim() === ''))
    const templateAlreadyHasHeader = templateItems[0]?.itemType === 'HEADER'
    const headerSection: QuoteItem[] = templateName && !templateAlreadyHasHeader
      ? [{ itemType: 'HEADER', description: templateName.toUpperCase(), sortOrder: 0 }]
      : []
    const newItems = [...headerSection, ...templateItems]
    const insertionIndex = activeInsertIndex == null ? existing.length : Math.min(activeInsertIndex + 1, existing.length)
    const next = [
      ...existing.slice(0, insertionIndex),
      ...newItems,
      ...existing.slice(insertionIndex),
    ].map((it, i) => ({ ...it, sortOrder: i }))
    update(next)
    setLastInsertedIndex(insertionIndex)
    setActiveInsertIndex(insertionIndex + newItems.length - 1)
    setShowTemplateMenu(false)
    setPendingTemplate(null)
  }

  function insertCatalogItem(catalogItem: PriceCatalogItem) {
    const unitPrice = applyMargin(catalogItem.unitCost, marginPercent)
    const firstLink = catalogItem.links?.split('\n').find((u) => u.trim())?.trim()
    const newItem: QuoteItem = {
      itemType: 'ITEM',
      priceItemId: catalogItem.id,
      sortOrder: items.length,
      description: catalogItem.description,
      unit: catalogItem.unit,
      unitCost: catalogItem.unitCost,
      unitPrice,
      quantity: 1,
      sourceNote: catalogItem.notes ?? undefined,
      sourceUrl: firstLink ?? undefined,
    }
    const existing = items.filter((i) => !(i.itemType === 'ITEM' && i.description.trim() === ''))
    const insertionIndex = activeInsertIndex == null ? existing.length : Math.min(activeInsertIndex + 1, existing.length)
    const next = [
      ...existing.slice(0, insertionIndex),
      newItem,
      ...existing.slice(insertionIndex),
    ].map((it, i) => ({ ...it, sortOrder: i }))
    update(next)
    setLastInsertedIndex(insertionIndex)
    setActiveInsertIndex(insertionIndex)
    const target = activeInsertIndex == null ? 'in fondo' : 'sotto la riga selezionata'
    setCatalogFeedback(`Aggiunto "${catalogItem.description.slice(0, 54)}" ${target}.`)
  }

  function removeItem(idx: number) {
    setCatalogOpen(null)
    setDimOpen(null)
    setRefOpen((prev) => {
      const s = new Set<number>()
      prev.forEach((i) => { if (i !== idx) s.add(i > idx ? i - 1 : i) })
      return s
    })
    update(items.filter((_, i) => i !== idx).map((it, i) => ({ ...it, sortOrder: i })))
  }

  function setField<K extends keyof QuoteItem>(idx: number, key: K, value: QuoteItem[K]) {
    const next = [...items]
    const item = { ...next[idx], [key]: value }
    if (!item.directPrice) {
      if (key === 'unitCost') {
        const cost = value as number
        const pct = item.marginPercent ?? marginPercent
        item.unitPrice = cost > 0 ? applyMargin(cost, pct) : 0
      }
      if (key === 'marginPercent') {
        const pct = value as number
        const cost = item.unitCost ?? 0
        if (cost > 0) item.unitPrice = applyMargin(cost, pct)
      }
    }
    next[idx] = item
    update(next)
  }

  function toggleDirectPrice(idx: number) {
    const next = [...items]
    next[idx] = { ...next[idx], directPrice: !next[idx].directPrice }
    update(next)
  }

  function toggleHidden(idx: number) {
    const next = [...items]
    next[idx] = { ...next[idx], hiddenFromClient: !next[idx].hiddenFromClient }
    update(next)
  }

  function hideAllInSection(sectionIdx: number) {
    const section = items[sectionIdx]
    if (section.itemType !== 'SECTION') return
    const sectionDesc = section.description
    const next = items.map((item, i) => {
      if (i === sectionIdx) return { ...item, hiddenFromClient: true }
      if (item.section === sectionDesc && item.itemType !== 'SECTION') return { ...item, hiddenFromClient: true }
      return item
    })
    update(next)
  }

  function showAllInSection(sectionIdx: number) {
    const section = items[sectionIdx]
    if (section.itemType !== 'SECTION') return
    const sectionDesc = section.description
    const next = items.map((item, i) => {
      if (i === sectionIdx) return { ...item, hiddenFromClient: false }
      if (item.section === sectionDesc && item.itemType !== 'SECTION') return { ...item, hiddenFromClient: false }
      return item
    })
    update(next)
  }

  function applyDimensions(idx: number, l: number, h: number) {
    const next = [...items]
    next[idx] = { ...next[idx], dimL: l, dimH: h, quantity: parseFloat((l * h).toFixed(4)) }
    update(next)
  }

  function applyCatalogItem(idx: number, catalogItem: PriceCatalogItem) {
    const next = [...items]
    const item = next[idx]
    const pct = item.marginPercent ?? marginPercent
    const firstLink = catalogItem.links?.split('\n').find((u) => u.trim())?.trim()
    next[idx] = {
      ...item,
      description: catalogItem.description,
      priceItemId: catalogItem.id,
      unit: catalogItem.unit,
      unitCost: catalogItem.unitCost,
      unitPrice: applyMargin(catalogItem.unitCost, pct),
      directPrice: false,
      sourceNote: catalogItem.notes ?? item.sourceNote,
      sourceUrl: firstLink ?? item.sourceUrl,
    }
    update(next)
    setCatalogOpen(null)
    setCatalogLookupIndex(null)
    setActiveInsertIndex(idx)
    setLastInsertedIndex(idx)
  }

  function insertAt(afterIdx: number, type: ItemType, openCatalog = false) {
    const next = [...items]
    const insertedIndex = afterIdx + 1
    const newItem: QuoteItem = {
      itemType: type,
      sortOrder: insertedIndex,
      description: type === 'SECTION' ? 'Nuova sezione' : '',
      quantity: type === 'ITEM' ? 1 : undefined,
      unitCost: type === 'ITEM' ? 0 : undefined,
      unitPrice: type === 'ITEM' ? 0 : undefined,
    }
    next.splice(insertedIndex, 0, newItem)
    update(next.map((it, i) => ({ ...it, sortOrder: i })))
    setActiveInsertIndex(insertedIndex)
    setLastInsertedIndex(insertedIndex)
    if (openCatalog && type === 'ITEM') {
      setCatalogOpen(null)
      setCatalogLookupIndex(insertedIndex)
    }
  }

  function moveItem(idx: number, dir: -1 | 1) {
    const next = [...items]
    const swap = idx + dir
    if (swap < 0 || swap >= next.length) return
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    update(next.map((it, i) => ({ ...it, sortOrder: i })))
  }

  function toggleRef(idx: number) {
    setRefOpen((prev) => {
      const s = new Set(prev)
      if (s.has(idx)) s.delete(idx)
      else s.add(idx)
      return s
    })
  }

  function expandAllRefs() {
    const s = new Set<number>()
    items.forEach((item, i) => { if (item.sourceUrl || item.sourceNote) s.add(i) })
    setRefOpen(s)
  }

  function collapseAllRefs() {
    setRefOpen(new Set())
  }

  function surroundingSectionText(idx: number) {
    for (let i = idx; i >= 0; i -= 1) {
      const item = items[i]
      if (item.itemType === 'SECTION' || item.itemType === 'HEADER') return item.description
    }
    return ''
  }

  function openSaveToCatalog(idx: number) {
    const item = items[idx]
    setCatalogSaveIndex(idx)
    setCatalogSaveCategory(inferPriceCategoryFromText(surroundingSectionText(idx), item.description))
  }

  async function confirmSaveToCatalog() {
    if (catalogSaveIndex == null) return
    const item = items[catalogSaveIndex]
    setCatalogSavePending(true)
    const result = await saveItemToCatalog({
      description: item.description,
      unit: item.unit,
      unitCost: item.unitCost,
      category: catalogSaveCategory,
    })
    setCatalogSavePending(false)
    if (result.ok) {
      setCatalogSaveIndex(null)
      toastSuccess(`"${item.description.substring(0, 40)}" aggiunto al prezzario`)
    } else {
      toastError(result.message ?? 'Errore')
    }
  }

  const refIndexes = items
    .map((item, i) => (item.sourceUrl || item.sourceNote ? i : -1))
    .filter((i) => i >= 0)
  const hasAnyRef = refIndexes.length > 0
  const allRefsOpen = hasAnyRef && refIndexes.every((i) => refOpen.has(i))

  const totals = calcTotals(items, taxRate)
  const realMarginPct = totals.subtotalClient > 0
    ? ((totals.marginAmount / totals.subtotalClient) * 100).toFixed(1)
    : '0.0'

  const itemsForSubmit = items.filter((i) =>
    i.itemType !== 'ITEM' || (i.description ?? '').trim() !== '',
  )
  const hasCatalogPanel = showCatalogBrowser && priceItems.length > 0
  const activeTarget = activeInsertIndex == null ? null : items[activeInsertIndex]
  const activeTargetDescription = (activeTarget?.description ?? '').trim()
  const catalogTargetLabel = activeTarget ? 'Inserisci sotto' : 'Inserisci in fondo'
  const catalogTargetDetail = activeTarget
    ? `"${(activeTargetDescription || 'riga selezionata').slice(0, 72)}"`
    : 'Gli articoli scelti saranno aggiunti alla fine della lista.'
  const catalogLookupItem = catalogLookupIndex == null ? null : items[catalogLookupIndex]
  const catalogLookupLabel = catalogLookupIndex == null
    ? ''
    : `Riga ${catalogLookupIndex + 1}${catalogLookupItem?.description ? ` - ${catalogLookupItem.description.slice(0, 80)}` : ' - riga vuota'}`

  return (
    <div className="space-y-0">
      {toaster}
      {catalogLookupIndex != null && priceItems.length > 0 && (
        <CatalogLookupDialog
          items={priceItems}
          lineLabel={catalogLookupLabel}
          initialSearch={(catalogLookupItem?.description ?? '').trim()}
          onSelect={(pi) => applyCatalogItem(catalogLookupIndex, pi)}
          onClose={() => setCatalogLookupIndex(null)}
        />
      )}

      {catalogSaveIndex != null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/30" aria-label="Chiudi" onClick={() => setCatalogSaveIndex(null)} />
          <div className="relative w-full max-w-lg rounded-control bg-surface shadow-xl border border-line p-4 space-y-4">
            <div>
              <h3 className="text-body font-semibold text-ink">Salva nel prezzario</h3>
              <p className="text-body text-ink-muted mt-1">
                Scegli la categoria corretta prima di creare la nuova voce catalogo.
              </p>
            </div>
            <div className="rounded-control bg-surface-raised border border-line px-3 py-2 text-body text-ink">
              {items[catalogSaveIndex]?.description || 'Voce senza descrizione'}
            </div>
            <div>
              <label className="block text-body font-medium text-ink mb-1">Categoria prezzario</label>
              <select
                value={catalogSaveCategory}
                onChange={(event) => setCatalogSaveCategory(event.target.value)}
                className="w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-body outline-none focus:ring-2 focus:ring-action"
              >
                {PRICE_CATALOG_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setCatalogSaveIndex(null)}>Annulla</Button>
              <Button type="button" loading={catalogSavePending} onClick={confirmSaveToCatalog}>Salva</Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 items-start">
        <div className="min-w-0">
      {/* ── Column headers + global ref toggle (desktop only) ─────────────── */}
      <div className="flex items-center justify-end mb-1 px-1">
        <div className="flex items-center gap-1.5 shrink-0">
          {priceItems.length > 0 && (
            <button type="button" onClick={() => setShowCatalogBrowser((v) => !v)}
              className={cn('inline-flex min-h-11 items-center gap-1.5 rounded-control border px-2.5 text-label font-medium transition-colors duration-state',
                showCatalogBrowser ? 'bg-action text-ink-inverse border-action' : 'bg-surface border-line text-ink-muted hover:border-action hover:text-action'
              )}>
              <BookOpen className="w-3 h-3" />
              {showCatalogBrowser ? 'Chiudi catalogo' : 'Catalogo'}
            </button>
          )}
          {hasAnyRef && (
            <button type="button" onClick={allRefsOpen ? collapseAllRefs : expandAllRefs}
              className={cn('inline-flex min-h-11 items-center gap-1.5 rounded-control border px-2.5 text-label font-medium transition-colors duration-state',
                allRefsOpen ? 'bg-action border-action text-action hover:bg-action' : 'bg-surface border-line text-ink-muted hover:border-action hover:text-action'
              )}>
              <Link2 className="w-3 h-3" />
              {allRefsOpen ? 'Nascondi rif.' : 'Mostra rif.'}
            </button>
          )}
        </div>
      </div>

      {/* ── Rows ──────────────────────────────────────────────────────────── */}
      {hasCatalogPanel && (
        <div className="mb-3">
          <CatalogInsertPanel
            items={priceItems}
            targetLabel={catalogTargetLabel}
            targetDetail={catalogTargetDetail}
            feedback={catalogFeedback}
            listClassName="max-h-72"
            onSelect={insertCatalogItem}
            onResetTarget={() => setActiveInsertIndex(null)}
            onClose={() => setShowCatalogBrowser(false)}
          />
        </div>
      )}

      <div className="hidden lg:grid gap-x-2 text-label font-medium text-ink-muted uppercase tracking-wide px-1.5 mb-1" style={{ gridTemplateColumns: ITEM_GRID_TEMPLATE }}>
        <span />
        <span className="flex items-center gap-1.5">
          Descrizione
          {priceItems.length > 0 && <span className="text-action normal-case font-normal tracking-normal">(digita per cercare)</span>}
        </span>
        <span className="text-center">U.M.</span>
        <span className="text-right">Qta</span>
        <span className="text-center" title="Margine per articolo">%</span>
        <span className="text-right">Costo u.</span>
        <span className="text-right">Prezzo u.</span>
        <span className="text-right">Totale</span>
      </div>

      <div className="space-y-0">
        {items.flatMap((item, idx) => {
          const totalPrice = (item.quantity ?? 0) * (item.unitPrice ?? 0)
          const isDirect = item.directPrice === true
          const isRefOpen = refOpen.has(idx)
          const hasRef = !!(item.sourceUrl || item.sourceNote)

          // ── HEADER row (title / scope) ───────────────────────────────────
          if (item.itemType === 'HEADER') {
            return [
              <InsertRow key={`ins-${idx}`} onInsert={(type) => insertAt(idx - 1, type)} onCatalogInsert={priceItems.length > 0 ? () => insertAt(idx - 1, 'ITEM', true) : undefined} />,
              <div
                key={`r-${idx}`}
                ref={(el) => { rowRefs.current[idx] = el }}
                onClick={() => setActiveInsertIndex(idx)}
                onFocusCapture={() => setActiveInsertIndex(idx)}
                className={cn(
                  'flex items-center gap-2 bg-shell border border-shell rounded-control px-3 py-1.5 group/row transition-all',
                  activeInsertIndex === idx && hasCatalogPanel && 'ring-2 ring-action',
                  lastInsertedIndex === idx && 'ring-2 ring-action',
                )}
              >
                <span className="text-action text-body select-none shrink-0">▶</span>
                <textarea
                  rows={1}
                  className="flex-1 bg-transparent font-bold text-ink-inverse text-body outline-none placeholder:text-action resize-none overflow-hidden leading-snug py-0 tracking-wide"
                  placeholder="Titolo dell'opera (es. RISTRUTTURAZIONE BAGNO)..."
                  value={item.description}
                  ref={(el) => autoResize(el)}
                  onChange={(e) => { autoResize(e.currentTarget); setField(idx, 'description', e.target.value) }}
                />
                <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                  <button type="button" onClick={() => moveItem(idx, -1)} className="text-action hover:text-ink-inverse p-1 transition-colors"><ChevronUp className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => moveItem(idx, 1)} className="text-action hover:text-ink-inverse p-1 transition-colors"><ChevronDown className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => removeItem(idx)} className="text-action hover:text-negative p-1 transition-colors ml-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>,
            ]
          }

          // ── SECTION row ──────────────────────────────────────────────────
          if (item.itemType === 'SECTION') {
            const isHidden = item.hiddenFromClient === true
            return [
              <InsertRow key={`ins-${idx}`} onInsert={(type) => insertAt(idx - 1, type)} onCatalogInsert={priceItems.length > 0 ? () => insertAt(idx - 1, 'ITEM', true) : undefined} />,
              <div
                key={`r-${idx}`}
                ref={(el) => { rowRefs.current[idx] = el }}
                onClick={() => setActiveInsertIndex(idx)}
                onFocusCapture={() => setActiveInsertIndex(idx)}
                className={cn(
                  'flex items-center gap-2 border rounded-control px-2.5 py-1.5 group/row transition-all',
                  isHidden ? 'bg-attention-surface border-attention-border opacity-60' : 'bg-surface-raised border-line',
                  activeInsertIndex === idx && hasCatalogPanel && lastInsertedIndex !== idx && 'ring-1 ring-action border-action',
                  lastInsertedIndex === idx && 'ring-2 ring-action border-action',
                )}
              >
                <div className="flex flex-col gap-0 text-ink-subtle group-hover/row:text-ink-subtle transition-colors">
                  <button type="button" onClick={() => moveItem(idx, -1)} className="hover:text-ink-muted p-0.5"><ChevronUp className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => moveItem(idx, 1)} className="hover:text-ink-muted p-0.5"><ChevronDown className="w-3.5 h-3.5" /></button>
                </div>
                <span className="text-label font-bold text-ink-subtle uppercase tracking-widest shrink-0">§</span>
                <textarea
                  rows={1}
                  className="flex-1 bg-transparent font-semibold text-ink text-body outline-none placeholder:text-ink-subtle resize-none overflow-hidden leading-snug py-0.5"
                  placeholder="Nome sezione..."
                  value={item.description}
                  ref={(el) => autoResize(el)}
                  onChange={(e) => { autoResize(e.currentTarget); setField(idx, 'description', e.target.value) }}
                />
                {isHidden && <span className="text-label font-semibold text-attention bg-attention-surface border border-attention-border rounded-full px-2 py-0.5 shrink-0">nascosto</span>}
                <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => isHidden ? showAllInSection(idx) : hideAllInSection(idx)}
                    title={isHidden ? 'Mostra sezione e articoli al cliente' : 'Nascondi sezione e tutti gli articoli al cliente'}
                    className={cn('inline-flex min-h-11 items-center gap-1 rounded-control border px-2 text-label font-medium transition-colors duration-state', isHidden ? 'bg-attention-surface border-attention text-attention hover:bg-attention-border' : 'border-line text-ink-muted hover:border-attention hover:text-attention hover:bg-attention-surface')}
                  >
                    {isHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {isHidden ? 'Mostra tutti' : 'Nascondi tutti'}
                  </button>
                  <button type="button" onClick={() => removeItem(idx)} className="text-ink-subtle hover:text-negative p-1 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>,
            ]
          }

          // ── NOTE row ─────────────────────────────────────────────────────
          if (item.itemType === 'NOTE') {
            const isNoteHidden = item.hiddenFromClient === true
            return [
              <InsertRow key={`ins-${idx}`} onInsert={(type) => insertAt(idx - 1, type)} onCatalogInsert={priceItems.length > 0 ? () => insertAt(idx - 1, 'ITEM', true) : undefined} />,
              <div
                key={`r-${idx}`}
                ref={(el) => { rowRefs.current[idx] = el }}
                onClick={() => setActiveInsertIndex(idx)}
                onFocusCapture={() => setActiveInsertIndex(idx)}
                className={cn(
                  'flex items-start gap-2 border rounded-control px-2.5 py-1.5 group/row transition-all',
                  isNoteHidden ? 'bg-surface-raised border-line opacity-50' : 'bg-attention-surface border-attention-border',
                  activeInsertIndex === idx && hasCatalogPanel && lastInsertedIndex !== idx && 'ring-1 ring-action border-action',
                  lastInsertedIndex === idx && 'ring-2 ring-action border-action',
                )}
              >
                <span className="text-body shrink-0 mt-0.5">{isNoteHidden ? '🚫' : '📝'}</span>
                <textarea
                  rows={1}
                  className={cn('flex-1 bg-transparent text-body outline-none italic resize-none overflow-hidden leading-snug py-0.5', isNoteHidden ? 'text-ink-muted placeholder:text-ink-subtle' : 'text-attention placeholder:text-attention')}
                  placeholder="Annotazione interna (non visibile nel PDF cliente)..."
                  value={item.description}
                  ref={(el) => autoResize(el)}
                  onChange={(e) => { autoResize(e.currentTarget); setField(idx, 'description', e.target.value) }}
                />
                {isNoteHidden && <span className="text-label font-semibold text-ink-muted shrink-0 mt-0.5">nascosto</span>}
                <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity mt-0.5">
                  <button type="button" onClick={() => toggleHidden(idx)} title={isNoteHidden ? 'Mostra al cliente' : 'Nascondi al cliente'} className={cn('p-1 rounded-control transition-colors', isNoteHidden ? 'text-attention hover:text-attention' : 'text-ink-subtle hover:text-attention')}>
                    {isNoteHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button type="button" onClick={() => removeItem(idx)} className="text-attention hover:text-negative p-1 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>,
            ]
          }

          // ── ITEM row ─────────────────────────────────────────────────────
          const isHidden = item.hiddenFromClient === true
          return [
            <InsertRow key={`ins-${idx}`} onInsert={(type) => insertAt(idx - 1, type)} onCatalogInsert={priceItems.length > 0 ? () => insertAt(idx - 1, 'ITEM', true) : undefined} />,
            <div
              key={`r-${idx}`}
              ref={(el) => { rowRefs.current[idx] = el }}
              onClick={() => setActiveInsertIndex(idx)}
              onFocusCapture={() => setActiveInsertIndex(idx)}
              className={cn(
                'border rounded-control transition-all group/row',
                isHidden
                  ? 'border-attention-border bg-attention-surface/40 opacity-55'
                  : isDirect
                    ? 'border-action-border bg-action-surface/30'
                    : 'border-line bg-surface hover:border-line-strong',
                activeInsertIndex === idx && hasCatalogPanel && lastInsertedIndex !== idx && 'ring-1 ring-action border-action',
                lastInsertedIndex === idx && 'ring-2 ring-action border-action',
              )}
            >
              {/* ── Desktop layout (≥ lg) ──────────────────────────────── */}
              <div
                className="hidden lg:grid gap-x-2 px-1.5 py-1 items-start"
                style={{ gridTemplateColumns: ITEM_GRID_TEMPLATE }}
              >
                {/* Move arrows */}
                <div className="flex flex-col items-center gap-0 pt-0.5 text-ink-subtle group-hover/row:text-ink-subtle transition-colors">
                  <button type="button" onClick={() => moveItem(idx, -1)} className="hover:text-ink-muted p-0"><ChevronUp className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => moveItem(idx, 1)} className="hover:text-ink-muted p-0"><ChevronDown className="w-3.5 h-3.5" /></button>
                </div>

                {/* Description + catalog search */}
                <div className="relative">
                  <textarea
                    rows={1}
                    className="w-full pr-8 text-body text-ink outline-none placeholder:text-ink-subtle resize-none overflow-hidden leading-snug py-0.5 bg-transparent"
                    placeholder="Descrizione articolo..."
                    value={item.description}
                    ref={(el) => autoResize(el)}
                    onChange={(e) => {
                      autoResize(e.currentTarget)
                      setField(idx, 'description', e.target.value)
                      setCatalogOpen(e.target.value.length >= 2 && priceItems.length > 0 ? idx : null)
                    }}
                    onFocus={() => {
                      setActiveInsertIndex(idx)
                      if ((item.description ?? '').length >= 2 && priceItems.length > 0) setCatalogOpen(idx)
                    }}
                  />
                  {priceItems.length > 0 && (
                    <button
                      type="button"
                      title="Cerca nel prezzario"
                      onClick={(e) => {
                        e.stopPropagation()
                        setCatalogOpen(null)
                        setCatalogLookupIndex(idx)
                      }}
                      className="tap-target absolute right-0 top-0 inline-flex items-center justify-center rounded-control text-ink-subtle transition-colors duration-state hover:bg-action-surface hover:text-action"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {catalogOpen === idx && (
                    <CatalogDropdown query={item.description} items={priceItems} onSelect={(pi) => applyCatalogItem(idx, pi)} onClose={() => setCatalogOpen(null)} />
                  )}
                </div>

                {/* Unit */}
                <select
                  className="w-full text-body text-ink-muted outline-none text-center py-0.5 border border-line rounded-control bg-surface focus:border-action focus:ring-1 focus:ring-action"
                  value={item.unit ?? ''}
                  onChange={(e) => setField(idx, 'unit', e.target.value || undefined)}
                >
                  <option value="">—</option>
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  {item.unit && !UNITS.includes(item.unit) && <option value={item.unit}>{item.unit}</option>}
                </select>

                {/* Quantity + dim calculator */}
                <div className="relative flex items-center gap-1">
                  <input
                    type="number" min="0" step="0.01"
                    className="w-full text-body text-ink outline-none text-right py-0.5 border border-line rounded-control bg-surface focus:border-action focus:ring-1 focus:ring-action px-1.5"
                    placeholder="0"
                    value={item.quantity ?? ''}
                    onChange={(e) => setField(idx, 'quantity', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                  <button type="button" title="Calcola L × H" onClick={() => setDimOpen(dimOpen === idx ? null : idx)} className="text-ink-subtle hover:text-action shrink-0 transition-colors">
                    <Calculator className="w-3.5 h-3.5" />
                  </button>
                  {dimOpen === idx && <DimCalculator dimL={item.dimL} dimH={item.dimH} onChange={(l, h) => applyDimensions(idx, l, h)} onClose={() => setDimOpen(null)} />}
                </div>

                {/* Per-item margin % */}
                {isDirect ? (
                  <button type="button" onClick={() => toggleDirectPrice(idx)} title="Prezzo diretto attivo — clicca per disattivare" className="text-center text-label font-bold text-action hover:text-action py-1 transition-colors">dir.</button>
                ) : (
                  <input
                    type="number" min="0" max="100" step="0.1"
                    className="w-full text-label text-ink-muted outline-none text-center py-0.5 border border-line rounded-control focus:border-action focus:ring-1 focus:ring-action bg-surface"
                    title="Margine per questo articolo (vuoto = usa il margine del preventivo)"
                    placeholder={String(marginPercent || '—')}
                    value={item.marginPercent != null ? item.marginPercent : ''}
                    onChange={(e) => { const v = e.target.value; setField(idx, 'marginPercent', v === '' ? undefined : parseFloat(v)) }}
                  />
                )}

                {/* Unit cost */}
                {isDirect ? (
                  <span className="text-label text-ink-subtle text-right pr-1 py-1">—</span>
                ) : (
                  <input
                    type="number" min="0" step="0.01"
                    className="w-full text-body text-attention outline-none text-right py-0.5 border border-attention-border rounded-control bg-attention-surface focus:border-attention focus:ring-1 focus:ring-attention-border px-1.5"
                    placeholder="0.00"
                    value={item.unitCost ?? ''}
                    onChange={(e) => setField(idx, 'unitCost', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                )}

                {/* Unit price */}
                <input
                  type="number" min="0" step="0.01"
                  className={cn('w-full text-body outline-none text-right py-0.5 border rounded-control px-1.5 focus:ring-1', isDirect ? 'border-action-border bg-action-surface text-action font-medium focus:border-action focus:ring-action' : 'border-action-border bg-action-surface text-action focus:border-action focus:ring-action')}
                  placeholder="0.00"
                  title={isDirect ? 'Prezzo diretto' : `Prezzo (margine ${item.marginPercent ?? marginPercent}%)`}
                  value={item.unitPrice ?? ''}
                  onChange={(e) => setField(idx, 'unitPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                />

                {/* Total price + actions */}
                <div className="flex items-start gap-2 justify-end">
                  <div className="text-right py-0.5">
                    <span className={cn('text-body font-semibold tabular-nums', isHidden ? 'text-attention line-through' : 'text-action')}>{fmt(totalPrice)}</span>
                    {isHidden && <p className="text-label text-attention font-medium">nascosto</p>}
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
                    <button type="button" onClick={() => toggleHidden(idx)} title={isHidden ? 'Rendi visibile al cliente' : 'Nascondi al cliente (non fatturato)'} className={cn('p-1 rounded-control transition-colors', isHidden ? 'text-attention bg-attention-surface hover:bg-attention-border' : 'text-ink-subtle hover:text-attention hover:bg-attention-surface')}>
                      {isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button type="button" onClick={() => toggleRef(idx)} title={isRefOpen ? 'Chiudi riferimento interno' : 'Apri riferimento interno'} className={cn('p-1 rounded-control transition-colors', hasRef || isRefOpen ? 'text-action bg-action' : 'text-ink-subtle hover:text-action hover:bg-action')}>
                      <Link2 className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => toggleDirectPrice(idx)} title={isDirect ? 'Disattiva prezzo diretto' : 'Attiva prezzo diretto'} className={cn('p-1 rounded-control text-label font-bold transition-colors', isDirect ? 'text-action bg-action-surface' : 'text-ink-subtle hover:text-action hover:bg-action-surface')}>$</button>
                    <button type="button" title="Salva nel prezzario" onClick={() => openSaveToCatalog(idx)} className="p-1 rounded-control text-ink-subtle hover:text-positive hover:bg-positive-surface transition-colors">
                      <BookmarkPlus className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => removeItem(idx)} className="p-1 rounded-control text-ink-subtle hover:text-negative hover:bg-negative-surface transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Mobile / tablet layout (< lg) ─────────────────────── */}
              <div className="lg:hidden px-2.5 py-2 space-y-2">
                {/* Description */}
                <div className="relative">
                  <textarea
                    rows={1}
                    className="w-full pr-8 text-body text-ink outline-none placeholder:text-ink-subtle resize-none overflow-hidden leading-snug py-0 bg-transparent"
                    placeholder="Descrizione articolo..."
                    value={item.description}
                    ref={(el) => autoResize(el)}
                    onChange={(e) => {
                      autoResize(e.currentTarget)
                      setField(idx, 'description', e.target.value)
                      setCatalogOpen(e.target.value.length >= 2 && priceItems.length > 0 ? idx : null)
                    }}
                    onFocus={() => {
                      setActiveInsertIndex(idx)
                      if ((item.description ?? '').length >= 2 && priceItems.length > 0) setCatalogOpen(idx)
                    }}
                  />
                  {priceItems.length > 0 && (
                    <button
                      type="button"
                      title="Cerca nel prezzario"
                      onClick={(e) => {
                        e.stopPropagation()
                        setCatalogOpen(null)
                        setCatalogLookupIndex(idx)
                      }}
                      className="tap-target absolute right-0 top-0 inline-flex items-center justify-center rounded-control text-ink-subtle transition-colors duration-state hover:bg-action-surface hover:text-action"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {catalogOpen === idx && (
                    <CatalogDropdown query={item.description} items={priceItems} onSelect={(pi) => applyCatalogItem(idx, pi)} onClose={() => setCatalogOpen(null)} />
                  )}
                </div>

                {/* Unit + Qty */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-label text-ink-muted mb-1">Unità</p>
                    <select className="min-h-11 w-full rounded-control border border-line bg-surface px-2 text-body outline-none focus:border-action" value={item.unit ?? ''} onChange={(e) => setField(idx, 'unit', e.target.value || undefined)}>
                      <option value="">—</option>
                      {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                      {item.unit && !UNITS.includes(item.unit) && <option value={item.unit}>{item.unit}</option>}
                    </select>
                  </div>
                  <div>
                    <p className="text-label text-ink-muted mb-1">Quantità</p>
                    <input type="number" min="0" step="0.01" className="min-h-11 w-full rounded-control border border-line bg-surface px-2 text-right text-body outline-none focus:border-action" placeholder="0" value={item.quantity ?? ''} onChange={(e) => setField(idx, 'quantity', e.target.value ? parseFloat(e.target.value) : undefined)} />
                  </div>
                </div>

                {/* Cost + Price */}
                <div className="grid grid-cols-2 gap-2">
                  {!isDirect && (
                    <div>
                      <p className="text-label text-attention mb-1">Costo unitario</p>
                      <input type="number" min="0" step="0.01" className="min-h-11 w-full rounded-control border border-attention-border bg-attention-surface px-2 text-right text-body text-attention outline-none focus:border-attention" placeholder="0.00" value={item.unitCost ?? ''} onChange={(e) => setField(idx, 'unitCost', e.target.value ? parseFloat(e.target.value) : undefined)} />
                    </div>
                  )}
                  <div className={isDirect ? 'col-span-2' : ''}>
                    <p className={cn('text-label mb-1', isDirect ? 'text-action font-medium' : 'text-action')}>Prezzo unitario</p>
                    <input type="number" min="0" step="0.01" className={cn('min-h-11 w-full rounded-control border px-2 text-right text-body outline-none focus:ring-1', isDirect ? 'border-action-border bg-action-surface text-action font-medium focus:border-action focus:ring-action' : 'border-action-border bg-action-surface text-action focus:border-action focus:ring-action')} placeholder="0.00" value={item.unitPrice ?? ''} onChange={(e) => setField(idx, 'unitPrice', e.target.value ? parseFloat(e.target.value) : undefined)} />
                  </div>
                </div>

                {/* Total + action bar */}
                {/* Wraps. Seven 44px controls plus the total measured 495px in a
                    322px card once the buttons grew to a real touch size — the
                    row spilled off the right edge of the phone. Total first,
                    actions underneath, wrapping as many rows as they need. */}
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-line pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-label text-ink-muted">Totale</span>
                    <span className={cn('text-body font-semibold tabular-nums', isHidden ? 'text-attention line-through' : 'text-action')}>{fmt(totalPrice)}</span>
                    {isHidden && <span className="text-label text-attention font-medium">nascosto</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <button type="button" onClick={() => toggleHidden(idx)} className={cn('inline-flex min-h-11 items-center gap-1 rounded-control border px-2 text-label font-medium transition-colors duration-state', isHidden ? 'bg-attention-surface border-attention text-attention' : 'border-line text-ink-muted hover:border-attention-border hover:text-attention')}>
                      {isHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {isHidden ? 'Mostra' : 'Nascondi'}
                    </button>
                    <button type="button" onClick={() => toggleRef(idx)} className={cn('inline-flex min-h-11 items-center gap-1 rounded-control border px-2 text-label font-medium transition-colors duration-state', hasRef || isRefOpen ? 'bg-action border-action text-action' : 'border-line text-ink-muted hover:border-action hover:text-action')}>
                      <Link2 className="w-3 h-3" /> Rif.
                    </button>
                    <button type="button" onClick={() => toggleDirectPrice(idx)} className={cn('inline-flex min-h-11 items-center rounded-control border px-2 text-label font-medium transition-colors duration-state', isDirect ? 'bg-action-surface border-action-border text-action' : 'border-line text-ink-muted hover:border-action-border hover:text-action')}>
                      $ dir.
                    </button>
                    {/* The icon stays 16px so the row keeps its density; the hit
                        area is 44px, which is what the thumb needs. */}
                    <button type="button" onClick={() => openSaveToCatalog(idx)} aria-label="Salva questa voce nel prezzario" className="tap-target inline-flex items-center justify-center rounded-control text-ink-subtle hover:text-positive">
                      <BookmarkPlus className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => moveItem(idx, -1)} aria-label="Sposta la voce in su" className="tap-target inline-flex items-center justify-center rounded-control text-ink-muted hover:text-ink"><ChevronUp className="w-4 h-4" /></button>
                    <button type="button" onClick={() => moveItem(idx, 1)} aria-label="Sposta la voce in giù" className="tap-target inline-flex items-center justify-center rounded-control text-ink-muted hover:text-ink"><ChevronDown className="w-4 h-4" /></button>
                    <button type="button" onClick={() => removeItem(idx)} aria-label="Elimina la voce" className="tap-target inline-flex items-center justify-center rounded-control text-ink-subtle hover:text-negative"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>

              {/* ── Internal reference panel (both layouts) ─────────────── */}
              {isRefOpen && (
                <div className="border-t border-action bg-action px-3 py-3 space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Link2 className="w-3.5 h-3.5 text-action" />
                    <span className="text-label font-semibold text-action uppercase tracking-wide">Riferimento interno</span>
                    <span className="text-label text-action">(non visibile nel PDF cliente)</span>
                    <button type="button" onClick={() => toggleRef(idx)} className="ml-auto text-action hover:text-action transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div>
                    <label className="text-label text-action font-medium mb-1 block">Nota / riferimento articolo</label>
                    <textarea
                      rows={1}
                      className="w-full text-body bg-surface border border-action rounded-control px-3 py-2 outline-none focus:border-action focus:ring-1 focus:ring-action-border placeholder:text-ink-subtle resize-none overflow-hidden"
                      placeholder="es. Bauhaus art. 31158811 – CHF 4.96/ml · validità prezzo: 2026-06"
                      value={item.sourceNote ?? ''}
                      ref={(el) => autoResize(el)}
                      onChange={(e) => { autoResize(e.currentTarget); setField(idx, 'sourceNote', e.target.value || undefined) }}
                    />
                  </div>
                  <div>
                    <label className="text-label text-action font-medium mb-1 block">Link prodotto / fornecedor</label>
                    <div className="flex items-start gap-2">
                      <textarea
                        rows={2}
                        className="flex-1 text-body bg-surface border border-action rounded-control px-3 py-2 outline-none focus:border-action focus:ring-1 focus:ring-action-border text-action placeholder:text-ink-subtle resize-none"
                        placeholder={"https://...\nhttps://... (um URL por linha)"}
                        value={item.sourceUrl ?? ''}
                        ref={(el) => autoResize(el)}
                        onChange={(e) => { autoResize(e.currentTarget); setField(idx, 'sourceUrl', e.target.value || undefined) }}
                      />
                      {item.sourceUrl && item.sourceUrl.split('\n').filter(u => u.trim()).map((url, i) => (
                        <a key={i} href={url.trim()} target="_blank" rel="noopener noreferrer" className="text-label text-action border border-action bg-surface px-2.5 py-2 rounded-control hover:bg-action transition-colors shrink-0 whitespace-nowrap">
                          Apri {i + 1} ↗
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>,
          ]
        })}

        {/* Final insert divider */}
        <InsertRow onInsert={(type) => addItem(type)} onCatalogInsert={priceItems.length > 0 ? () => addItem('ITEM', true) : undefined} />
      </div>

      {/* ── Legend ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-label text-ink-muted px-1 pt-1">
        <span><span className="font-bold text-action">🔗</span> Riferimento interno = nota + link prodotto (non nel PDF)</span>
        <span><span className="font-bold text-action">$</span> Prezzo diretto = senza costo interno</span>
        <span><span className="font-bold text-ink-muted">%</span> = margine articolo (vuoto = usa margine preventivo)</span>
      </div>

      {/* ── Add row buttons ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => addItem('ITEM')}>
          <Plus className="w-3.5 h-3.5" /> Articolo
        </Button>
        {priceItems.length > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={() => addItem('ITEM', true)}>
            <BookOpen className="w-3.5 h-3.5" /> Articolo da prezzario
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={() => addItem('SECTION')}>
          <Plus className="w-3.5 h-3.5" /> <span className="text-ink-muted font-semibold">§</span> Sezione
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => addItem('NOTE')}>
          <Plus className="w-3.5 h-3.5" /> 📝 Nota interna
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => addItem('HEADER')}
          className="text-action hover:bg-action-surface hover:text-action border border-action-border">
          <Plus className="w-3.5 h-3.5" /> ▶ Titolo opera
        </Button>
        {templates.length > 0 && (
          <TemplateMenuButton
            templates={templates}
            showTemplateMenu={showTemplateMenu}
            setShowTemplateMenu={setShowTemplateMenu}
            setPendingTemplate={setPendingTemplate}
          />
        )}
        {marginPercent > 0 && (
          <button type="button" onClick={recalcAllPrices} className="text-label text-action hover:text-action px-3 py-1.5 rounded-control hover:bg-action-surface transition-colors font-medium border border-transparent hover:border-action-border">
            ↻ Ricalcola tutti i prezzi
          </button>
        )}
      </div>


      {/* ── Totals ──────────────────────────────────────────────────────────── */}
      {pendingTemplate && (
        <div className="pt-3">
          <TemplatePreview
            compact
            templateName={pendingTemplate.name}
            items={[
              { itemType: 'HEADER' as const, description: pendingTemplate.name.toUpperCase(), sortOrder: 0 },
              ...pendingTemplate.items,
            ].map((it, i) => ({ ...it, sortOrder: i }))}
            onBack={() => setPendingTemplate(null)}
            onConfirm={() => addFromTemplate(pendingTemplate.items, pendingTemplate.name)}
            confirmLabel={activeInsertIndex == null ? 'Inserisci in fondo' : 'Inserisci qui'}
          />
        </div>
      )}

      <div className="mt-6 border-t border-line pt-4 space-y-1.5 ml-auto w-full sm:max-w-xs">
        <div className="flex justify-between text-body">
          <span className="text-attention">Subtotale costi</span>
          <span className="text-attention tabular-nums font-medium">CHF {fmt(totals.subtotalCost)}</span>
        </div>
        <div className="flex justify-between text-body">
          <span className="text-action">Subtotale prezzi</span>
          <span className="text-action tabular-nums font-medium">CHF {fmt(totals.subtotalClient)}</span>
        </div>
        <div className="flex justify-between text-body text-ink-muted">
          <span>Margine ({realMarginPct}%)</span>
          <span className="tabular-nums">CHF {fmt(totals.marginAmount)}</span>
        </div>
        {taxRate > 0 && (
          <div className="flex justify-between text-body text-ink-muted">
            <span>IVA ({taxRate}%)</span>
            <span className="tabular-nums">CHF {fmt(totals.taxAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-body font-bold border-t border-line pt-2 mt-1">
          <span>Totale cliente</span>
          <span className="tabular-nums text-action">CHF {fmt(totals.total)}</span>
        </div>
        {(totals.hiddenTotal ?? 0) > 0 && (
          <div className="flex justify-between text-label text-attention bg-attention-surface border border-attention-border rounded-control px-2.5 py-1.5 mt-1">
            <span>Voci nascoste (non fatturate)</span>
            <span className="tabular-nums font-medium">CHF {fmt(totals.hiddenTotal ?? 0)}</span>
          </div>
        )}
      </div>

        </div>
      </div>

      <input type="hidden" name="itemsJson" value={JSON.stringify(itemsForSubmit)} />
    </div>
  )
}
