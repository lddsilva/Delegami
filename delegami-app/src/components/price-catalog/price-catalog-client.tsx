'use client'

import { useState, useMemo } from 'react'
import { Search, Pencil, X, ExternalLink, SlidersHorizontal } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FilterChip } from '@/components/ui/filter-chip'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { DeletePriceItemButton } from './delete-price-item-button'

type PriceItem = {
  id: string
  code: string | null
  category: string
  description: string
  unit: string
  unitCost: number
  qualityLevel: string
  productTier: string | null
  notes: string | null
  links: string | null
  isActive: boolean
  priceSources?: Array<{
    id: string
    sourceType: string
    supplierName: string | null
    url: string | null
    observedPrice: number | null
    currency: string
    confidence: string
    observedAt: Date | string | null
  }>
}

const PAGE_SIZE = 40

const TIER_LABELS: Record<string, string> = {
  ESSENTIAL: 'Essenziale',
  STANDARD: 'Standard',
  PREMIUM: 'Premium',
  SERVICE: 'Servizio',
}

type SourceAuditStatus = 'PRODUCT_EXACT' | 'CATEGORY_ONLY' | 'ESTIMATE' | 'LEGACY' | 'MISSING' | 'MIXED'
type SourceAuditFilter = SourceAuditStatus | 'REVIEW'

const SOURCE_AUDIT_LABELS: Record<SourceAuditFilter, string> = {
  REVIEW: 'Da verificare',
  PRODUCT_EXACT: 'Prodotto',
  CATEGORY_ONLY: 'Categoria',
  ESTIMATE: 'Stima',
  LEGACY: 'Storico',
  MISSING: 'Senza fonte',
  MIXED: 'Mista',
}

const SOURCE_AUDIT_COLORS: Record<SourceAuditStatus, string> = {
  PRODUCT_EXACT: 'bg-positive-surface text-positive border-positive-border',
  CATEGORY_ONLY: 'bg-attention-surface text-attention border-attention-border',
  ESTIMATE: 'bg-attention-surface text-attention border-attention-border',
  LEGACY: 'bg-action text-action border-action',
  MISSING: 'bg-negative-surface text-negative border-negative-border',
  MIXED: 'bg-surface-raised text-ink border-line',
}

interface Props {
  items: PriceItem[]
  canEdit: boolean
  canDelete: boolean
}

function sourceAuditStatus(item: PriceItem): SourceAuditStatus {
  const sources = item.priceSources ?? []
  if (sources.length === 0) return 'MISSING'

  if (sources.some((s) => s.sourceType === 'PRODUCT_URL')) return 'PRODUCT_EXACT'
  if (sources.some((s) => s.sourceType === 'LEGACY_PRICE')) return 'LEGACY'
  if (sources.every((s) => s.sourceType === 'ESTIMATE')) return 'ESTIMATE'
  if (sources.some((s) => s.sourceType === 'CATEGORY_URL')) return 'CATEGORY_ONLY'

  return 'MIXED'
}

function matchesSourceAuditFilter(item: PriceItem, filter: SourceAuditFilter | null) {
  if (!filter) return true
  const status = sourceAuditStatus(item)
  if (filter === 'REVIEW') return status !== 'PRODUCT_EXACT'
  return status === filter
}

function parseCategory(cat: string): { parent: string; sub: string } {
  const sep = cat.indexOf(' – ')
  if (sep === -1) return { parent: cat, sub: cat }
  return { parent: cat.slice(0, sep), sub: cat.slice(sep + 3) }
}

function effectiveTier(item: PriceItem) {
  if (item.productTier) return item.productTier
  if (item.qualityLevel === 'LOW') return 'ESSENTIAL'
  if (item.qualityLevel === 'MEDIUM') return 'STANDARD'
  if (item.qualityLevel === 'HIGH') return 'PREMIUM'
  return 'SERVICE'
}

// Order for parent categories
const PARENT_ORDER = ['Bagno', 'Cucina', 'Pavimenti', 'Strutture', 'Finiture', 'Impianti', 'Manodopera', 'Logistica', 'Utensili', 'Varie']

export function PriceCatalogClient({ items, canEdit, canDelete }: Props) {
  const [search, setSearch] = useState('')
  const [selectedParent, setSelectedParent] = useState<string | null>(null)
  const [selectedSub, setSelectedSub] = useState<string | null>(null)
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const [selectedSourceAudit, setSelectedSourceAudit] = useState<SourceAuditFilter | null>(null)
  const [showInactive, setShowInactive] = useState(false)

  // All parent categories with counts
  const parents = useMemo(() => {
    const map = new Map<string, number>()
    items.forEach((item) => {
      if (!showInactive && !item.isActive) return
      const { parent } = parseCategory(item.category)
      map.set(parent, (map.get(parent) ?? 0) + 1)
    })
    return Array.from(map.entries())
      .sort(([a], [b]) => {
        const ai = PARENT_ORDER.indexOf(a)
        const bi = PARENT_ORDER.indexOf(b)
        if (ai !== -1 && bi !== -1) return ai - bi
        if (ai !== -1) return -1
        if (bi !== -1) return 1
        return a.localeCompare(b)
      })
  }, [items, showInactive])

  // Subcategories for selected parent
  const subs = useMemo(() => {
    if (!selectedParent) return []
    const map = new Map<string, number>()
    items.forEach((item) => {
      if (!showInactive && !item.isActive) return
      const { parent, sub } = parseCategory(item.category)
      if (parent === selectedParent) map.set(sub, (map.get(sub) ?? 0) + 1)
    })
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [items, selectedParent, showInactive])

  // Filtered items
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Any change of filter starts the list from the top again. Adjusted during
  // render rather than in an effect — React re-runs the component immediately
  // and never paints the stale count, and it keeps the eslint rule happy.
  const filterKey = [search, selectedParent, selectedSub, selectedTier, selectedSourceAudit, showInactive].join('|')
  const [lastFilterKey, setLastFilterKey] = useState(filterKey)
  if (lastFilterKey !== filterKey) {
    setLastFilterKey(filterKey)
    setVisibleCount(PAGE_SIZE)
  }

  // Drives the disclosure badge so a hidden filter is never silently applied.
  const extraFilterCount = (selectedTier ? 1 : 0) + (selectedSourceAudit ? 1 : 0) + (showInactive ? 1 : 0)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return items.filter((item) => {
      if (!showInactive && !item.isActive) return false
      const { parent, sub } = parseCategory(item.category)
      if (selectedParent && parent !== selectedParent) return false
      if (selectedSub && sub !== selectedSub) return false
      if (selectedTier && effectiveTier(item) !== selectedTier) return false
      if (!matchesSourceAuditFilter(item, selectedSourceAudit)) return false
      if (!q) return true
      return (
        item.description.toLowerCase().includes(q) ||
        (item.code?.toLowerCase().includes(q) ?? false) ||
        item.category.toLowerCase().includes(q) ||
        (item.notes?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [items, search, selectedParent, selectedSub, selectedTier, selectedSourceAudit, showInactive])

  const sourceAuditCounts = useMemo(() => {
    const counts = new Map<SourceAuditFilter, number>()
    items.forEach((item) => {
      if (!showInactive && !item.isActive) return
      const status = sourceAuditStatus(item)
      counts.set(status, (counts.get(status) ?? 0) + 1)
      if (status !== 'PRODUCT_EXACT') counts.set('REVIEW', (counts.get('REVIEW') ?? 0) + 1)
    })
    return counts
  }, [items, showInactive])

  function handleParentClick(parent: string) {
    if (selectedParent === parent) {
      setSelectedParent(null)
      setSelectedSub(null)
    } else {
      setSelectedParent(parent)
      setSelectedSub(null)
    }
  }

  // Group filtered items by sub-category for display
  // The catalog holds ~500 items in production and used to render every one of
  // them on every visit. Only a page at a time reaches the DOM; the count above
  // the list always reports the full match so the number never lies.
  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount])
  const remaining = filtered.length - visible.length

  const groupedBySub = useMemo(() => {
    const map = new Map<string, PriceItem[]>()
    visible.forEach((item) => {
      const { sub } = parseCategory(item.category)
      const key = selectedParent ? sub : item.category
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(item)
    })
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [visible, selectedParent])

  return (
    <div className="space-y-3">
      {/* Search + inactive toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); if (e.target.value) { setSelectedParent(null); setSelectedSub(null) } }}
            placeholder="Cerca voce, codice…"
            aria-label="Cerca nel prezzario"
            className="min-h-11 w-full rounded-control border border-line-strong bg-surface pl-9 pr-10 text-body text-ink placeholder:text-ink-muted transition-colors duration-state focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Cancella la ricerca"
              className="absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-control text-ink-muted hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Parent category row — the catalog's primary navigation, always visible.
          Wrapped, these 11 chips cost ~570px of vertical scroll at 375px before
          a single price is visible. A horizontal strip keeps them to one line
          on mobile and wraps normally once there is room. */}
      {!search && (
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
          <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
            <FilterChip
              active={selectedParent === null}
              count={items.filter((i) => showInactive || i.isActive).length}
              onClick={() => { setSelectedParent(null); setSelectedSub(null) }}
              className="shrink-0"
            >
              Tutto
            </FilterChip>
            {parents.map(([parent, count]) => (
              <FilterChip
                key={parent}
                active={selectedParent === parent}
                count={count}
                onClick={() => handleParentClick(parent)}
                className="shrink-0"
              >
                {parent}
              </FilterChip>
            ))}
          </div>
        </div>
      )}

      {/* Sub-category chips, only once a parent narrows the list. */}
      {selectedParent && !search && subs.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 pl-1">
          <span className="shrink-0 text-label text-ink-subtle" aria-hidden>↳</span>
          <FilterChip active={selectedSub === null} onClick={() => setSelectedSub(null)}>Tutti</FilterChip>
          {subs.map(([sub, count]) => (
            <FilterChip key={sub} active={selectedSub === sub} count={count} onClick={() => setSelectedSub(sub === selectedSub ? null : sub)}>
              {sub}
            </FilterChip>
          ))}
        </div>
      )}

      {/* Tier, source and inactive are refinements, not navigation. Stacked open
          they cost ~1250px of scroll before the first item on a 375px screen, so
          they live behind a disclosure that says how many are active. */}
      {!search && (
        <details className="rounded-surface border border-line bg-surface" open={extraFilterCount > 0}>
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 text-body text-ink-muted marker:hidden">
            <SlidersHorizontal className="h-4 w-4" />
            Filtri avanzati
            {extraFilterCount > 0 && (
              <span className="rounded-full bg-action px-2 py-0.5 text-label font-medium text-ink-inverse numeric">
                {extraFilterCount}
              </span>
            )}
          </summary>

          <div className="space-y-3 border-t border-line px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="shrink-0 text-label font-medium text-ink-muted">Fascia:</span>
              <FilterChip active={selectedTier === null} onClick={() => setSelectedTier(null)}>Tutti</FilterChip>
              {(['ESSENTIAL', 'STANDARD', 'PREMIUM', 'SERVICE'] as const).map((tier) => (
                <FilterChip key={tier} active={selectedTier === tier} onClick={() => setSelectedTier(selectedTier === tier ? null : tier)}>
                  {TIER_LABELS[tier]}
                </FilterChip>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="shrink-0 text-label font-medium text-ink-muted">Fonte:</span>
              <FilterChip active={selectedSourceAudit === null} onClick={() => setSelectedSourceAudit(null)}>Tutte</FilterChip>
              {(['REVIEW', 'PRODUCT_EXACT', 'CATEGORY_ONLY', 'ESTIMATE', 'LEGACY', 'MISSING'] as const).map((filter) => (
                <FilterChip
                  key={filter}
                  active={selectedSourceAudit === filter}
                  count={sourceAuditCounts.get(filter) ?? 0}
                  onClick={() => setSelectedSourceAudit(selectedSourceAudit === filter ? null : filter)}
                >
                  {SOURCE_AUDIT_LABELS[filter]}
                </FilterChip>
              ))}
            </div>

            <label className="flex min-h-11 cursor-pointer select-none items-center gap-2 text-body text-ink-muted">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="h-5 w-5 rounded border-line-strong"
              />
              Mostra voci inattive
            </label>
          </div>
        </details>
      )}

      {/* Result count */}
      <p className="text-label text-ink-muted">
        {filtered.length} {filtered.length === 1 ? 'voce' : 'voci'}
        {selectedParent && <> · <span className="font-medium text-ink-muted">{selectedParent}</span></>}
        {selectedSub && <> › <span className="font-medium text-action">{selectedSub}</span></>}
        {search && <> · &ldquo;{search}&rdquo;</>}
      </p>

      {/* Items grouped by sub-category */}
      {groupedBySub.length === 0 ? (
        <p className="text-center text-body text-ink-muted py-12">Nessuna voce trovata</p>
      ) : (
        <div className="space-y-3">
          {groupedBySub.map(([subLabel, subItems]) => (
            <Card key={subLabel}>
              <div className="px-5 py-2.5 border-b border-line bg-surface-raised rounded-t-xl flex items-center justify-between">
                <h2 className="text-label font-semibold text-ink-muted uppercase tracking-wider">{subLabel}</h2>
                <span className="text-label text-ink-muted">{subItems.length}</span>
              </div>
              <ul className="divide-y divide-line">
                {subItems.map((item) => (
                  <li
                    key={item.id}
                    className={`px-4 py-3 transition-colors duration-state hover:bg-surface-raised sm:px-5 ${!item.isActive ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className={`text-body font-medium ${!item.isActive ? 'text-ink-muted line-through' : 'text-ink'}`}>
                          {item.description}
                        </p>
                        <p className="mt-0.5 text-label text-ink-muted">
                          {item.code && <span className="font-mono">{item.code}</span>}
                          {item.code && ' · '}
                          {item.unit}
                          {' · '}
                          {TIER_LABELS[effectiveTier(item)] ?? effectiveTier(item)}
                        </p>
                        {item.notes && <p className="mt-0.5 line-clamp-1 text-label text-ink-muted">{item.notes}</p>}
                      </div>

                      {/* The price column used to be 28px wide, so "CHF 38.00"
                          wrapped between the symbol and the number. */}
                      <span className="shrink-0 whitespace-nowrap text-body font-semibold text-ink numeric">
                        {formatCurrency(item.unitCost)}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-label font-medium ${SOURCE_AUDIT_COLORS[sourceAuditStatus(item)]}`}>
                        {SOURCE_AUDIT_LABELS[sourceAuditStatus(item)]}
                      </span>
                      {!item.isActive && <Badge variant="neutral">Inattivo</Badge>}
                      {item.links?.split('\n').filter((u) => u.trim()).map((url, i) => {
                        const trimmed = url.trim()
                        const label = trimmed.replace(/^https?:\/\//, '').split('/')[0]
                        return (
                          <a
                            key={i}
                            href={trimmed}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-8 items-center gap-1 text-label text-action hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {label}
                          </a>
                        )
                      })}

                      <span className="ml-auto flex items-center gap-1">
                        {canEdit && (
                          <ButtonLink
                            href={`/price-catalog/${item.id}/edit`}
                            aria-label={`Modifica ${item.description}`}
                            variant="ghost"
                            size="sm"
                          >
                            <Pencil className="h-4 w-4" />
                          </ButtonLink>
                        )}
                        {canDelete && <DeletePriceItemButton id={item.id} />}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ))}

          {remaining > 0 && (
            <button
              type="button"
              onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              className="min-h-11 w-full rounded-control border border-line-strong bg-surface text-body font-medium text-ink transition-colors duration-state hover:bg-surface-raised"
            >
              Mostra altre {Math.min(remaining, PAGE_SIZE)} di {remaining}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
