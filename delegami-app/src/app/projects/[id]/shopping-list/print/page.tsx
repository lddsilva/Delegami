import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getProjectById } from '@/modules/projects/queries'
import { getShoppingListByProjectId } from '@/modules/shopping-lists/queries'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PrintButton } from '@/components/ui/print-button'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const project = await getProjectById(id)
  return { title: project ? `Lista acquisti — ${project.name}` : 'Lista acquisti' }
}

type Item = {
  id: string
  description: string
  unit: string | null
  qtyPlanned: number
  qtyPurchased: number | null
  unitPriceEstimated: number | null
  unitPricePaid: number | null
  supplierId: string | null
  supplier: { id: string; name: string; address: string | null; website: string | null } | null
  status: string
  sourceUrl: string | null
  notes: string | null
}

const UNASSIGNED = '__unassigned__'

function group(items: Item[]) {
  const map = new Map<string, { supplier: Item['supplier']; items: Item[] }>()
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

export default async function ShoppingListPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [project, list] = await Promise.all([
    getProjectById(id),
    getShoppingListByProjectId(id),
  ])
  if (!project || !list) notFound()

  const items: Item[] = list.items.map((i) => ({
    id: i.id,
    description: i.description,
    unit: i.unit,
    qtyPlanned: i.qtyPlanned,
    qtyPurchased: i.qtyPurchased,
    unitPriceEstimated: i.unitPriceEstimated,
    unitPricePaid: i.unitPricePaid,
    supplierId: i.supplierId,
    supplier: i.supplier
      ? { id: i.supplier.id, name: i.supplier.name, address: i.supplier.address, website: i.supplier.website }
      : null,
    status: i.status,
    sourceUrl: i.sourceUrl,
    notes: i.notes,
  }))

  const groups = group(items)
  const totalPlanned = items.reduce((s, i) => s + (i.unitPriceEstimated ?? 0) * i.qtyPlanned, 0)
  const totalPaid = items.reduce((s, i) => s + (i.unitPricePaid ?? 0) * (i.qtyPurchased ?? i.qtyPlanned), 0)

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      <style>{`
        @media print {
          @page { margin: 18mm 16mm; size: A4; }
          html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
          .no-print { display: none !important; }
          .supplier { page-break-after: always; }
          .supplier:last-child { page-break-after: auto; }
          .group { break-inside: avoid; page-break-inside: avoid; }
        }
        .sheet { background: white; max-width: 800px; margin: 0 auto; padding: 36px 36px 48px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        @media print { .sheet { padding: 0; max-width: none; box-shadow: none; } }
      `}</style>

      <div className="max-w-4xl mx-auto px-4 mb-4 print:hidden flex items-center justify-between">
        <a href={`/projects/${id}/shopping-list`} className="text-sm text-gray-500 hover:text-gray-800">← Torna alla lista</a>
        <PrintButton />
      </div>

      <article className="sheet">
        <header style={{ borderBottom: '2px solid var(--doc-ink-strong)', paddingBottom: 8, marginBottom: 16 }}>
          <h1 style={{ fontSize: '20pt', margin: '0 0 4px', color: 'var(--doc-ink-strong)' }}>Lista acquisti</h1>
          <div style={{ color: 'var(--doc-ink-muted)', fontSize: '10pt' }}>
            {project.client.name} · {project.name}
            {project.address && <> · {project.address}</>}
            <br />
            Stampata il {formatDate(new Date())}
          </div>
        </header>

        {groups.map(({ key, supplier, items: groupItems }) => (
          <section key={key} className="supplier" style={{ marginBottom: 16 }}>
            <div className="group">
              <h2 style={{ fontSize: '14pt', margin: '0 0 6px', color: 'var(--doc-accent)' }}>
                {supplier?.name ?? 'Da assegnare fornitore'}
              </h2>
              {supplier && (supplier.address || supplier.website) && (
                <div style={{ color: 'var(--doc-ink-muted)', fontSize: '9pt', marginBottom: 8 }}>
                  {supplier.address && <>📍 {supplier.address}</>}
                  {supplier.website && <> · 🌐 {supplier.website}</>}
                </div>
              )}
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--doc-fill)' }}>
                    <th style={{ padding: '6px 8px', borderBottom: '1px solid var(--doc-line)', textAlign: 'left', textTransform: 'uppercase', fontSize: '9pt', letterSpacing: '0.04em', width: 30 }}>☐</th>
                    <th style={{ padding: '6px 8px', borderBottom: '1px solid var(--doc-line)', textAlign: 'left', textTransform: 'uppercase', fontSize: '9pt', letterSpacing: '0.04em' }}>Articolo</th>
                    <th style={{ padding: '6px 8px', borderBottom: '1px solid var(--doc-line)', textAlign: 'right', textTransform: 'uppercase', fontSize: '9pt', letterSpacing: '0.04em', width: 80 }}>Qty</th>
                    <th style={{ padding: '6px 8px', borderBottom: '1px solid var(--doc-line)', textAlign: 'right', textTransform: 'uppercase', fontSize: '9pt', letterSpacing: '0.04em', width: 90 }}>Prezzo stim.</th>
                    <th style={{ padding: '6px 8px', borderBottom: '1px solid var(--doc-line)', textAlign: 'right', textTransform: 'uppercase', fontSize: '9pt', letterSpacing: '0.04em', width: 90 }}>Pagato</th>
                  </tr>
                </thead>
                <tbody>
                  {groupItems.map((item) => {
                    const isDone = item.status === 'PURCHASED' || item.status === 'RECEIVED'
                    return (
                      <tr key={item.id}>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--doc-line)', verticalAlign: 'top' }}>
                          <span style={{
                            display: 'inline-block',
                            width: 16, height: 16,
                            border: '1.5px solid var(--doc-ink-muted)',
                            borderRadius: 3,
                            background: isDone ? 'var(--doc-positive)' : 'transparent',
                            borderColor: isDone ? 'var(--doc-positive)' : 'var(--doc-ink-muted)',
                          }} />
                        </td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--doc-line)', fontSize: '10pt' }}>
                          <div style={{ fontWeight: 500 }}>{item.description}</div>
                          {item.notes && <div style={{ color: 'var(--doc-ink-muted)', fontSize: '9pt', fontStyle: 'italic' }}>{item.notes}</div>}
                          {item.sourceUrl && <div style={{ color: 'var(--doc-ink-muted)', fontSize: '9pt' }}>{item.sourceUrl}</div>}
                        </td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--doc-line)', textAlign: 'right', fontSize: '10pt', whiteSpace: 'nowrap' }}>{item.qtyPlanned}{item.unit ? ` ${item.unit}` : ''}</td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--doc-line)', textAlign: 'right', fontSize: '10pt' }}>{item.unitPriceEstimated != null ? formatCurrency(item.unitPriceEstimated) : '—'}</td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--doc-line)', textAlign: 'right', fontSize: '10pt' }}>{item.unitPricePaid != null ? formatCurrency(item.unitPricePaid) : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        <footer style={{ marginTop: 24, paddingTop: 12, borderTop: '1px solid var(--doc-line-strong)', display: 'flex', justifyContent: 'space-between', fontSize: '10pt', color: 'var(--doc-ink-strong)' }}>
          <span>Totale stimato: <strong>{formatCurrency(totalPlanned)}</strong></span>
          {totalPaid > 0 && <span>Totale pagato: <strong>{formatCurrency(totalPaid)}</strong></span>}
        </footer>
      </article>
    </div>
  )
}
