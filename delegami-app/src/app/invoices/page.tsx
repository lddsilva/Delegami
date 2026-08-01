import Link from 'next/link'
import { Plus, Receipt, ChevronRight, AlertCircle } from 'lucide-react'
import { getInvoices } from '@/modules/invoices/queries'
import { getSession, canMutate } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { InitialAvatar } from '@/components/ui/avatar'
import { InvoiceStatusBadge } from '@/components/invoices/invoice-status-badge'
import { MarkInvoiceInlineButton } from '@/components/invoices/mark-invoice-inline-button'
import { formatAmount, formatCurrency, formatDate } from '@/lib/utils'
import { invoiceOutstanding, invoicePaid, totalOutstanding } from '@/modules/finance/rules'
import { Pagination, clampPage, parsePage } from '@/components/ui/pagination'

const INVOICES_PER_PAGE = 25

type InvoiceRow = Awaited<ReturnType<typeof getInvoices>>[number]

function groupByClient(invoices: InvoiceRow[]) {
  const groups: { client: InvoiceRow['project']['client']; invoices: InvoiceRow[]; total: number }[] = []
  const indexByClient = new Map<string, number>()
  for (const invoice of invoices) {
    const clientId = invoice.project.client.id
    const idx = indexByClient.get(clientId)
    if (idx == null) {
      indexByClient.set(clientId, groups.length)
      groups.push({ client: invoice.project.client, invoices: [invoice], total: invoice.total })
    } else {
      groups[idx].invoices.push(invoice)
      groups[idx].total += invoice.total
    }
  }
  return groups
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const page = parsePage((await searchParams).page)
  const [invoices, session] = await Promise.all([getInvoices(), getSession()])
  const canEdit = session ? canMutate(session.role) : false
  // What is still owed, not what was billed — partial payments must count.
  const unpaid = invoices.filter((i) => invoiceOutstanding(i) > 0)
  const unpaidTotal = totalOutstanding(invoices)
  // Totals stay over the whole set; grouping happens within the page, so a
  // client can span two pages — acceptable, and honest about the order.
  const safePage = clampPage(page, invoices.length, INVOICES_PER_PAGE)
  const pageItems = invoices.slice((safePage - 1) * INVOICES_PER_PAGE, safePage * INVOICES_PER_PAGE)
  const clientGroups = groupByClient(pageItems)

  return (
    <div className="page-content">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-title font-semibold text-ink">Fatture</h1>
          <p className="mt-1 text-body text-ink-muted">
            {invoices.length} fatture
            {unpaid.length > 0 && (
              <>
                {' · '}
                <span className="font-medium text-ink numeric">{formatAmount(unpaidTotal)}</span> da incassare su{' '}
                {unpaid.length}
              </>
            )}
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Link href="/invoices/import">
              <Button aria-label="Importa da IA" size="sm" variant="secondary">
                <span className="hidden sm:inline">Importa da IA</span>
                <span className="sm:hidden">Import IA</span>
              </Button>
            </Link>
            <Link href="/invoices/new">
              <Button aria-label="Nuova fattura" size="sm">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Nuova fattura</span>
              </Button>
            </Link>
          </div>
        )}
      </div>

      {invoices.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Receipt className="mb-4 h-10 w-10 text-ink-subtle" />
            <h3 className="mb-1 text-body font-medium text-ink">Nessuna fattura</h3>
            <p className="mb-4 text-body text-ink-muted">Crea la prima fattura o genera da un preventivo approvato.</p>
            {canEdit && <Link href="/invoices/new"><Button><Plus className="w-4 h-4" /> Crea fattura</Button></Link>}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {clientGroups.map((group) => (
            <Card key={group.client.id} className="overflow-hidden">
              <Link
                href={`/clients/${group.client.id}`}
                className="flex min-h-11 items-center gap-3 border-b border-line bg-surface-raised px-4 py-3 transition-colors duration-state hover:brightness-[0.98] sm:px-5"
              >
                <InitialAvatar name={group.client.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-medium text-ink">{group.client.name}</p>
                  <p className="text-label text-ink-muted">{group.invoices.length} {group.invoices.length === 1 ? 'fattura' : 'fatture'}</p>
                </div>
                <span className="shrink-0 text-body font-semibold text-ink numeric">{formatAmount(group.total)}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-ink-subtle" />
              </Link>

              <ul className="divide-y divide-line">
                {group.invoices.map((inv) => {
                  const isOverdue = inv.status === 'SENT' && inv.dueDate && new Date(inv.dueDate) < new Date()
                  return (
                    <li key={inv.id} className="group relative flex items-center gap-3 px-4 py-3 transition-colors duration-state hover:bg-surface-raised sm:px-5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href={`/invoices/${inv.id}`} className="font-mono text-body font-medium text-ink after:absolute after:inset-0 group-hover:text-action">
                            {inv.invoiceNumber}
                          </Link>
                          <InvoiceStatusBadge status={inv.status} />
                          {isOverdue && (
                            <span className="inline-flex items-center gap-1 text-label font-medium text-negative">
                              <AlertCircle className="h-3 w-3" /> scaduta
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-label text-ink-muted">
                          <Link href={`/projects/${inv.project.id}`} className="relative z-10 -my-3 inline-flex items-center py-3 hover:text-action">{inv.project.name}</Link>
                          {inv.quote && <span>· da {inv.quote.quoteNumber}</span>}
                          {inv.dueDate && <span className={isOverdue ? 'text-negative' : ''}>· scad. {formatDate(inv.dueDate)}</span>}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-body font-semibold text-ink numeric">{formatCurrency(inv.total)}</div>
                        {invoicePaid(inv) > 0 && invoiceOutstanding(inv) > 0 && (
                          <div className="text-label text-attention numeric">
                            residuo {formatCurrency(invoiceOutstanding(inv))}
                          </div>
                        )}
                      </div>
                      {canEdit && (inv.status === 'DRAFT' || inv.status === 'SENT') && (
                        <div className="relative z-10 shrink-0">
                          <MarkInvoiceInlineButton id={inv.id} status={inv.status} />
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </Card>
          ))}
        </div>
      )}

      <Pagination page={safePage} pageSize={INVOICES_PER_PAGE} total={invoices.length} />
    </div>
  )
}
