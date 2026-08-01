'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  Plus,
  RotateCcw,
  Store,
  Trash2,
  Truck,
} from 'lucide-react'
import {
  createShoppingListItem,
  deleteShoppingListItem,
  reorderShoppingListItem,
  restoreShoppingListSnapshot,
  updateShoppingListItem,
} from '@/modules/shopping-lists/actions'
import { formatCurrency } from '@/lib/utils'
import { MATERIAL_UNITS, isKnownMaterialUnit } from '@/lib/units'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/ui/use-confirm'
import { useToast } from '@/components/ui/use-toast'

type SupplierOption = { id: string; name: string; website?: string | null }

type Item = {
  id: string
  description: string
  unit: string | null
  qtyPlanned: number
  qtyPurchased: number | null
  unitPriceEstimated: number | null
  unitPricePaid: number | null
  supplierId: string | null
  supplier: SupplierOption | null
  status: string
  sourceUrl: string | null
  notes: string | null
  expenseId: string | null
  sortOrder: number
  sourceQuoteItemId: string | null
}

interface Props {
  projectId: string
  listId: string
  listNotes: string | null
  items: Item[]
  suppliers: SupplierOption[]
  canEdit: boolean
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Da comprare',
  ORDERED: 'Ordinato',
  PURCHASED: 'Acquistato',
  RECEIVED: 'Ricevuto',
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-surface-raised text-ink border-line',
  ORDERED: 'bg-attention-surface text-attention border-attention-border',
  PURCHASED: 'bg-action-surface text-action border-action-border',
  RECEIVED: 'bg-positive-surface text-positive border-positive-border',
}

const STATUS_VALUES = ['PENDING', 'ORDERED', 'PURCHASED', 'RECEIVED'] as const

const SUPPLIER_GROUP_UNASSIGNED = '__unassigned__'

function groupBySupplier(items: Item[]): { key: string; supplier: SupplierOption | null; items: Item[] }[] {
  const map = new Map<string, { supplier: SupplierOption | null; items: Item[] }>()
  for (const item of items) {
    const key = item.supplier?.id ?? SUPPLIER_GROUP_UNASSIGNED
    if (!map.has(key)) {
      map.set(key, { supplier: item.supplier, items: [] })
    }
    map.get(key)!.items.push(item)
  }
  // Unassigned at the bottom
  return Array.from(map.entries())
    .sort(([a], [b]) => {
      if (a === SUPPLIER_GROUP_UNASSIGNED) return 1
      if (b === SUPPLIER_GROUP_UNASSIGNED) return -1
      return 0
    })
    .map(([key, value]) => ({ key, ...value }))
}

function buildShoppingSnapshot(items: Item[], notes: string | null) {
  return JSON.stringify({
    notes: notes ?? null,
    items: items.map((item, index) => ({
      description: item.description,
      unit: item.unit,
      qtyPlanned: item.qtyPlanned,
      qtyPurchased: item.qtyPurchased,
      unitPriceEstimated: item.unitPriceEstimated,
      unitPricePaid: item.unitPricePaid,
      supplierId: item.supplierId,
      status: item.status,
      sourceUrl: item.sourceUrl,
      notes: item.notes,
      sortOrder: item.sortOrder ?? index,
      sourceQuoteItemId: item.sourceQuoteItemId,
      expenseId: item.expenseId,
    })),
  })
}

export function ShoppingListClient({ projectId, listId, listNotes, items, suppliers, canEdit }: Props) {
  const { toastError, toaster } = useToast()
  const { confirm, dialog } = useConfirm()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [adding, setAdding] = useState(false)
  const [newDescription, setNewDescription] = useState('')
  const [newUnit, setNewUnit] = useState('pz')
  const [newQty, setNewQty] = useState('1')
  const [newSupplier, setNewSupplier] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending'>('all')
  const [initialSnapshot] = useState(() => buildShoppingSnapshot(items, listNotes))
  const currentSnapshot = buildShoppingSnapshot(items, listNotes)
  const hasUnsavedSessionChanges = currentSnapshot !== initialSnapshot

  async function restoreInitial() {
    const ok = await confirm({
      title: 'Ripristinare la lista?',
      description: 'Tutte le modifiche fatte in questa sessione verranno annullate.',
      confirmLabel: 'Ripristina',
      destructive: true,
    })
    if (!ok) return
    startTransition(async () => {
      const result = await restoreShoppingListSnapshot(listId, initialSnapshot)
      if (result?.error) toastError(result.error)
      else router.refresh()
    })
  }

  const filtered = useMemo(() => {
    if (filter === 'pending') return items.filter((i) => i.status !== 'PURCHASED' && i.status !== 'RECEIVED')
    return items
  }, [items, filter])

  const groups = useMemo(() => groupBySupplier(filtered), [filtered])

  function refresh() { router.refresh() }

  async function patch(itemId: string, data: Parameters<typeof updateShoppingListItem>[1]) {
    startTransition(async () => {
      const result = await updateShoppingListItem(itemId, data)
      if (result?.error) toastError(result.error)
      else refresh()
    })
  }

  async function handleAdd() {
    if (!newDescription.trim()) return
    startTransition(async () => {
      const result = await createShoppingListItem(listId, {
        description: newDescription,
        unit: newUnit || undefined,
        qtyPlanned: parseFloat(newQty) || 1,
        supplierId: newSupplier || null,
      })
      if (result?.error) {
        toastError(result.error)
        return
      }
      setNewDescription('')
      setNewUnit('pz')
      setNewQty('1')
      setNewSupplier('')
      setAdding(false)
      refresh()
    })
  }

  async function handleDelete(itemId: string) {
    const ok = await confirm({
      title: 'Eliminare l’articolo?',
      description: 'La voce verrà rimossa dalla lista acquisti.',
      confirmLabel: 'Elimina',
      destructive: true,
    })
    if (!ok) return
    startTransition(async () => {
      const result = await deleteShoppingListItem(itemId)
      if (result?.error) toastError(result.error)
      else refresh()
    })
  }

  async function handleReorder(itemId: string, direction: 'up' | 'down') {
    startTransition(async () => {
      const result = await reorderShoppingListItem(itemId, direction)
      if (result?.error) toastError(result.error)
      else refresh()
    })
  }

  // Per-supplier totals
  function totals(list: Item[]) {
    const planned = list.reduce((s, i) => s + (i.unitPriceEstimated ?? 0) * i.qtyPlanned, 0)
    const paid = list.reduce((s, i) => s + (i.unitPricePaid ?? 0) * (i.qtyPurchased ?? i.qtyPlanned), 0)
    const purchased = list.filter((i) => i.status === 'PURCHASED' || i.status === 'RECEIVED').length
    return { planned, paid, purchased, total: list.length }
  }

  return (
    <div className="space-y-5">
      {toaster}
      {dialog}
      {canEdit && hasUnsavedSessionChanges && (
        <div className="flex flex-col gap-2 rounded-control border border-attention-border bg-attention-surface px-3 py-2 text-body text-attention sm:flex-row sm:items-center sm:justify-between">
          <span>Hai modificato la lista in questa sessione. Le modifiche sono già salvate.</span>
          <button
            type="button"
            onClick={restoreInitial}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-control border border-attention bg-surface px-2.5 py-1 text-label font-medium text-attention hover:bg-attention-surface disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Ripristina stato iniziale
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="inline-flex rounded-control border border-line bg-surface p-0.5 text-body">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-control ${filter === 'all' ? 'bg-action text-ink-inverse' : 'text-ink hover:bg-surface-raised'}`}
          >
            Tutti ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-control ${filter === 'pending' ? 'bg-action text-ink-inverse' : 'text-ink hover:bg-surface-raised'}`}
          >
            Da comprare
          </button>
        </div>
        <div className="flex-1" />
        {canEdit && !adding && (
          <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
            <Plus className="w-4 h-4" /> Aggiungi articolo
          </Button>
        )}
      </div>

      {/* Inline add row */}
      {adding && canEdit && (
        <div className="rounded-control border border-action-border bg-action-surface/40 p-3 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <input
              autoFocus
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Descrizione articolo"
              className="sm:col-span-5 rounded-control border border-line px-2 py-1.5 text-body"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={newQty}
              onChange={(e) => setNewQty(e.target.value)}
              placeholder="Qty"
              className="sm:col-span-2 rounded-control border border-line px-2 py-1.5 text-body"
            />
            <UnitSelect
              value={newUnit}
              onChange={setNewUnit}
              className="sm:col-span-2"
            />
            <select
              value={newSupplier}
              onChange={(e) => setNewSupplier(e.target.value)}
              className="sm:col-span-3 rounded-control border border-line px-2 py-1.5 text-body"
            >
              <option value="">Fornitore (opzionale)</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-control text-body text-ink-muted hover:bg-surface-raised">
              Annulla
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={isPending || !newDescription.trim()}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-control bg-action text-ink-inverse text-body font-medium hover:bg-action-hover disabled:opacity-50"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Aggiungi
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-10 text-ink-muted text-body">
          {filter === 'pending' ? 'Nessun articolo da comprare.' : 'Nessun articolo nella lista.'}
        </div>
      )}

      {/* Groups */}
      {groups.map(({ key, supplier, items: groupItems }) => {
        const t = totals(groupItems)
        const isUnassigned = key === SUPPLIER_GROUP_UNASSIGNED
        return (
          <div key={key} className="rounded-control border border-line bg-surface">
            <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 border-b border-line bg-surface-raised/70 rounded-t-lg">
              <div className="flex items-center gap-2 min-w-0">
                {isUnassigned ? (
                  <Store className="w-4 h-4 text-ink-muted shrink-0" />
                ) : (
                  <Truck className="w-4 h-4 text-action shrink-0" />
                )}
                <h3 className="text-body font-semibold text-ink truncate">
                  {isUnassigned ? '🗂 Da assegnare fornitore' : supplier?.name ?? '—'}
                </h3>
                {supplier?.website && (
                  <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-ink-muted hover:text-action shrink-0">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <div className="flex items-center gap-3 text-label text-ink-muted shrink-0">
                <span>{t.purchased}/{t.total}</span>
                <span className="hidden sm:inline tabular-nums">{formatCurrency(t.planned)}</span>
              </div>
            </div>

            <ul className="divide-y divide-line">
              {groupItems.map((item) => (
                <ShoppingListRow
                  key={item.id}
                  item={item}
                  suppliers={suppliers}
                  projectId={projectId}
                  canEdit={canEdit}
                  isPending={isPending}
                  onPatch={(data) => patch(item.id, data)}
                  onDelete={() => handleDelete(item.id)}
                  onMoveUp={() => handleReorder(item.id, 'up')}
                  onMoveDown={() => handleReorder(item.id, 'down')}
                />
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

function ShoppingListRow({
  item,
  suppliers,
  projectId,
  canEdit,
  isPending,
  onPatch,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  item: Item
  suppliers: SupplierOption[]
  projectId: string
  canEdit: boolean
  isPending: boolean
  onPatch: (data: Partial<{ description: string; unit: string | null; qtyPlanned: number; qtyPurchased: number | null; unitPriceEstimated: number | null; unitPricePaid: number | null; supplierId: string | null; status: typeof STATUS_VALUES[number]; notes: string | null }>) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const isPurchased = item.status === 'PURCHASED' || item.status === 'RECEIVED'

  return (
    <li className={`px-3 sm:px-4 py-3 ${isPurchased ? 'bg-positive-surface/30' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
        {/* Status toggle / checkbox */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={!canEdit || isPending}
            onClick={() => onPatch({ status: isPurchased ? 'PENDING' : 'PURCHASED' })}
            className={`h-6 w-6 rounded-full border flex items-center justify-center transition-colors ${isPurchased ? 'bg-positive border-positive text-ink-inverse' : 'border-line-strong hover:border-action'}`}
            title={isPurchased ? 'Segna come da comprare' : 'Segna come acquistato'}
          >
            {isPurchased && <CheckCircle2 className="h-4 w-4" />}
          </button>
        </div>

        {/* Main row */}
        <div className="flex-1 min-w-0">
          {canEdit ? (
            <InlineText
              value={item.description}
              onChange={(v) => onPatch({ description: v })}
              className={`text-body font-medium ${isPurchased ? 'line-through text-ink-muted' : 'text-ink'}`}
            />
          ) : (
            <p className={`text-body font-medium ${isPurchased ? 'line-through text-ink-muted' : 'text-ink'}`}>{item.description}</p>
          )}

          {/* meta row 1: qty / unit / price */}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-label text-ink-muted">
            <span className="inline-flex items-center gap-1">
              {canEdit ? (
                <InlineNumber
                  value={item.qtyPlanned}
                  onChange={(v) => onPatch({ qtyPlanned: v })}
                  className="w-14"
                />
              ) : (
                <span>{item.qtyPlanned}</span>
              )}
              {item.unit && <span>{item.unit}</span>}
            </span>

            {item.unitPriceEstimated != null && (
              <span title="Prezzo stimato">~ {formatCurrency(item.unitPriceEstimated)}</span>
            )}

            {item.unitPricePaid != null && (
              <span className="text-positive font-medium">Pagato {formatCurrency(item.unitPricePaid)}</span>
            )}

            {/* Status select */}
            <select
              disabled={!canEdit || isPending}
              value={item.status}
              onChange={(e) => onPatch({ status: e.target.value as typeof STATUS_VALUES[number] })}
              className={`text-label rounded border px-1.5 py-0.5 ${STATUS_COLOR[item.status] ?? STATUS_COLOR.PENDING}`}
            >
              {STATUS_VALUES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>

            {item.sourceUrl && (
              <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-action hover:underline inline-flex items-center gap-0.5">
                Link <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {item.expenseId && (
              <Link href={`/expenses/${item.expenseId}`} className="text-positive hover:underline inline-flex items-center gap-0.5">
                Spesa <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>

          {/* Expanded edit area */}
          {expanded && canEdit && (
            <div className="mt-2 rounded-control border border-line bg-surface-raised/50 p-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-label">
              <label className="flex flex-col gap-0.5">
                <span className="text-ink-muted">Fornitore</span>
                <select
                  value={item.supplierId ?? ''}
                  onChange={(e) => onPatch({ supplierId: e.target.value || null })}
                  className="rounded-control border border-line px-2 py-1 text-body"
                >
                  <option value="">— Nessuno —</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>

              <label className="flex flex-col gap-0.5">
                <span className="text-ink-muted">Qty acquistata</span>
                <InlineNumber
                  value={item.qtyPurchased ?? 0}
                  onChange={(v) => onPatch({ qtyPurchased: v || null })}
                  className="w-full text-body"
                  full
                />
              </label>

              <label className="flex flex-col gap-0.5">
                <span className="text-ink-muted">Unità</span>
                <UnitSelect
                  value={item.unit ?? ''}
                  onChange={(value) => onPatch({ unit: value || null })}
                />
              </label>

              <label className="flex flex-col gap-0.5">
                <span className="text-ink-muted">Prezzo stimato</span>
                <InlineNumber
                  value={item.unitPriceEstimated ?? 0}
                  onChange={(v) => onPatch({ unitPriceEstimated: v || null })}
                  className="w-full text-body"
                  full
                />
              </label>

              <label className="flex flex-col gap-0.5">
                <span className="text-ink-muted">Prezzo pagato</span>
                <InlineNumber
                  value={item.unitPricePaid ?? 0}
                  onChange={(v) => onPatch({ unitPricePaid: v || null })}
                  className="w-full text-body"
                  full
                />
              </label>

              <label className="sm:col-span-2 flex flex-col gap-0.5">
                <span className="text-ink-muted">Note</span>
                <textarea
                  rows={2}
                  defaultValue={item.notes ?? ''}
                  onBlur={(e) => {
                    const next = e.target.value
                    if (next !== (item.notes ?? '')) onPatch({ notes: next || null })
                  }}
                  className="rounded-control border border-line px-2 py-1 text-body"
                />
              </label>
            </div>
          )}
        </div>

        {/* Actions */}
        {canEdit && (
          <div className="flex items-center gap-1 shrink-0 self-end sm:self-start">
            <button type="button" onClick={onMoveUp} disabled={isPending} className="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface-raised" aria-label="Sposta su"><ArrowUp className="w-3.5 h-3.5" /></button>
            <button type="button" onClick={onMoveDown} disabled={isPending} className="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface-raised" aria-label="Sposta giù"><ArrowDown className="w-3.5 h-3.5" /></button>
            {!item.expenseId && (
              <Link
                href={`/expenses/new?projectId=${projectId}&description=${encodeURIComponent(item.description)}&supplierId=${item.supplierId ?? ''}&amount=${item.unitPriceEstimated ? item.unitPriceEstimated * item.qtyPlanned : ''}&shoppingListItemId=${item.id}`}
                className="p-1 rounded text-ink-muted hover:text-positive hover:bg-positive-surface"
                aria-label="Crea spesa da questo articolo"
              >
                <CreditCard className="w-3.5 h-3.5" />
              </Link>
            )}
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="px-2 py-1 rounded text-label text-ink-muted hover:text-ink hover:bg-surface-raised"
              title="Modifica dettagli"
            >
              {expanded ? '−' : '+'}
            </button>
            <button type="button" onClick={onDelete} disabled={isPending} className="p-1 rounded text-ink-muted hover:text-negative hover:bg-negative-surface" aria-label="Elimina"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        )}
      </div>
    </li>
  )
}

function UnitSelect({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  const [custom, setCustom] = useState(!value || isKnownMaterialUnit(value) ? '' : value)
  const selected = value && isKnownMaterialUnit(value) ? value : (value ? 'Altro' : '')

  return (
    <div className={`flex gap-1 ${className ?? ''}`}>
      <select
        value={selected}
        onChange={(event) => {
          const next = event.target.value
          if (next === 'Altro') {
            const fallback = custom || ''
            onChange(fallback)
            return
          }
          setCustom('')
          onChange(next)
        }}
        className="min-w-0 flex-1 rounded-control border border-line px-2 py-1.5 text-body bg-surface"
      >
        <option value="">Unità</option>
        {MATERIAL_UNITS.map((unit) => (
          <option key={unit} value={unit}>{unit}</option>
        ))}
        <option value="Altro">Altro</option>
      </select>
      {selected === 'Altro' && (
        <input
          type="text"
          value={custom}
          onChange={(event) => {
            setCustom(event.target.value)
            onChange(event.target.value)
          }}
          placeholder="Unità"
          className="w-24 rounded-control border border-line px-2 py-1.5 text-body"
        />
      )}
    </div>
  )
}

// ─── Inline editable primitives ──────────────────────────────────────────────

function InlineText({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  function save() {
    const next = draft.trim()
    setEditing(false)
    if (next && next !== value) onChange(next)
  }

  if (!editing) {
    return (
      <button type="button" onClick={() => { setDraft(value); setEditing(true) }} className={`whitespace-pre-wrap break-words text-left ${className ?? ''}`}>
        {value}
      </button>
    )
  }
  return (
    <div className="w-full space-y-2">
      <textarea
        autoFocus
        rows={3}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) save()
          if (e.key === 'Escape') { setDraft(value); setEditing(false) }
        }}
        className={`w-full rounded-control border border-action px-2 py-1.5 leading-relaxed outline-none ${className ?? ''}`}
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => { setDraft(value); setEditing(false) }}
          className="rounded-control px-2 py-1 text-label text-ink-muted hover:bg-surface-raised"
        >
          Annulla
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!draft.trim()}
          className="rounded-control bg-action px-2 py-1 text-label font-medium text-ink-inverse disabled:opacity-50"
        >
          Salva
        </button>
      </div>
    </div>
  )
}

function InlineNumber({ value, onChange, className, full }: { value: number; onChange: (v: number) => void; className?: string; full?: boolean }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))
  if (!editing) {
    return (
      <button type="button" onClick={() => { setDraft(String(value)); setEditing(true) }} className={`tabular-nums text-left ${className ?? ''} ${full ? 'w-full px-2 py-1 rounded border border-line bg-surface' : ''}`}>
        {value}
      </button>
    )
  }
  return (
    <input
      autoFocus
      type="number"
      step="0.01"
      min="0"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => { setEditing(false); const n = parseFloat(draft); if (!isNaN(n) && n !== value) onChange(n) }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        if (e.key === 'Escape') { setDraft(String(value)); setEditing(false) }
      }}
      className={`rounded-control border border-action px-1 py-0.5 outline-none tabular-nums ${full ? 'w-full px-2 py-1' : 'w-14'}`}
    />
  )
}
