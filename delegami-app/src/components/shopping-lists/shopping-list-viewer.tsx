'use client'

import { useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, CreditCard, ExternalLink, Store, Truck } from 'lucide-react'
import { updateShoppingListItem } from '@/modules/shopping-lists/actions'
import { formatCurrency } from '@/lib/utils'
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
}

interface Props {
  projectId: string
  items: Item[]
  notes: string | null
  canEdit: boolean
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Da comprare',
  ORDERED: 'Ordinato',
  PURCHASED: 'Acquistato',
  RECEIVED: 'Ricevuto',
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'border-line bg-surface-raised text-ink',
  ORDERED: 'border-attention-border bg-attention-surface text-attention',
  PURCHASED: 'border-action-border bg-action-surface text-action',
  RECEIVED: 'border-positive-border bg-positive-surface text-positive',
}

const STATUS_VALUES = ['PENDING', 'ORDERED', 'PURCHASED', 'RECEIVED'] as const
const UNASSIGNED = '__unassigned__'

function groupBySupplier(items: Item[]) {
  const map = new Map<string, { supplier: SupplierOption | null; items: Item[] }>()
  for (const item of items) {
    const key = item.supplier?.id ?? UNASSIGNED
    if (!map.has(key)) map.set(key, { supplier: item.supplier, items: [] })
    map.get(key)!.items.push(item)
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => {
      if (a === UNASSIGNED) return 1
      if (b === UNASSIGNED) return -1
      return 0
    })
    .map(([key, value]) => ({ key, ...value }))
}

export function ShoppingListViewer({ projectId, items, notes, canEdit }: Props) {
  const { toastError, toaster } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const groups = useMemo(() => groupBySupplier(items), [items])
  const pendingCount = items.filter((item) => item.status !== 'PURCHASED' && item.status !== 'RECEIVED').length
  const plannedTotal = items.reduce((sum, item) => sum + (item.unitPriceEstimated ?? 0) * item.qtyPlanned, 0)
  const paidTotal = items.reduce((sum, item) => sum + (item.unitPricePaid ?? 0) * (item.qtyPurchased ?? item.qtyPlanned), 0)

  function patchStatus(itemId: string, status: typeof STATUS_VALUES[number]) {
    startTransition(async () => {
      const result = await updateShoppingListItem(itemId, { status })
      if (result?.error) toastError(result.error)
      else router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {toaster}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Summary label="Articoli" value={items.length.toString()} />
        <Summary label="Da comprare" value={pendingCount.toString()} />
        <Summary label="Stimato" value={formatCurrency(plannedTotal)} />
        <Summary label="Pagato" value={paidTotal > 0 ? formatCurrency(paidTotal) : '-'} />
      </div>

      {items.length === 0 ? (
        <div className="rounded-control border border-dashed border-line bg-surface p-8 text-center text-body text-ink-muted">
          Nessun articolo nella lista.
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map(({ key, supplier, items: groupItems }) => (
            <section key={key} className="overflow-hidden rounded-control border border-line bg-surface">
              <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-raised px-3 py-2.5 sm:px-4">
                <div className="flex min-w-0 items-center gap-2">
                  {supplier ? <Truck className="h-4 w-4 shrink-0 text-action" /> : <Store className="h-4 w-4 shrink-0 text-ink-muted" />}
                  <h2 className="truncate text-body font-semibold text-ink">{supplier?.name ?? 'Da assegnare fornitore'}</h2>
                  {supplier?.website && (
                    <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="shrink-0 text-ink-muted hover:text-action">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
                <span className="shrink-0 text-label text-ink-muted">{groupItems.length} articoli</span>
              </div>

              <div className="divide-y divide-line">
                {groupItems.map((item) => {
                  const isDone = item.status === 'PURCHASED' || item.status === 'RECEIVED'
                  return (
                    <article key={item.id} className="p-3 sm:p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2">
                            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${isDone ? 'border-positive bg-positive text-ink-inverse' : 'border-line-strong bg-surface'}`}>
                              {isDone && <CheckCircle2 className="h-3.5 w-3.5" />}
                            </span>
                            <div className="min-w-0">
                              <h3 className={`whitespace-pre-wrap break-words text-body font-medium ${isDone ? 'text-ink-muted line-through' : 'text-ink'}`}>
                                {item.description}
                              </h3>
                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-label text-ink-muted">
                                <span>{item.qtyPlanned}{item.unit ? ` ${item.unit}` : ''}</span>
                                {item.qtyPurchased != null && <span>Acq. {item.qtyPurchased}{item.unit ? ` ${item.unit}` : ''}</span>}
                                {item.unitPriceEstimated != null && <span>Stimato {formatCurrency(item.unitPriceEstimated)}</span>}
                                {item.unitPricePaid != null && <span className="font-medium text-positive">Pagato {formatCurrency(item.unitPricePaid)}</span>}
                                {item.sourceUrl && (
                                  <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-action hover:underline">
                                    Link <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                                {item.expenseId && (
                                  <Link href={`/expenses/${item.expenseId}`} className="inline-flex items-center gap-0.5 text-positive hover:underline">
                                    Spesa <ExternalLink className="h-3 w-3" />
                                  </Link>
                                )}
                              </div>
                              {item.notes && <p className="mt-1 whitespace-pre-wrap break-words text-label text-ink-muted">{item.notes}</p>}
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2 sm:justify-end">
                          <select
                            value={item.status}
                            disabled={!canEdit || isPending}
                            onChange={(event) => patchStatus(item.id, event.target.value as typeof STATUS_VALUES[number])}
                            className={`w-full rounded-control border px-2 py-1.5 text-label sm:w-auto ${STATUS_COLOR[item.status] ?? STATUS_COLOR.PENDING}`}
                          >
                            {STATUS_VALUES.map((status) => (
                              <option key={status} value={status}>{STATUS_LABEL[status]}</option>
                            ))}
                          </select>
                          {!item.expenseId && canEdit && (
                            <Link
                              href={`/expenses/new?projectId=${projectId}&description=${encodeURIComponent(item.description)}&supplierId=${item.supplierId ?? ''}&amount=${item.unitPriceEstimated ? item.unitPriceEstimated * item.qtyPlanned : ''}&shoppingListItemId=${item.id}`}
                              className="rounded-control border border-line p-2 text-ink-muted hover:bg-positive-surface hover:text-positive"
                              aria-label="Crea spesa"
                            >
                              <CreditCard className="h-4 w-4" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {notes && (
        <section className="rounded-control border border-line bg-surface p-4">
          <h2 className="text-body font-semibold text-ink">Note lista</h2>
          <p className="mt-2 whitespace-pre-wrap break-words text-body text-ink-muted">{notes}</p>
        </section>
      )}
    </div>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-control border border-line bg-surface px-3 py-2">
      <p className="text-label text-ink-muted">{label}</p>
      <p className="mt-0.5 truncate text-body font-semibold text-ink">{value}</p>
    </div>
  )
}
