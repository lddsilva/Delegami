import Link from 'next/link'
import { Plus, CreditCard } from 'lucide-react'
import { getExpenses } from '@/modules/expenses/queries'
import { getProjects } from '@/modules/projects/queries'
import { getSession, canMutate } from '@/lib/auth'
import { Button, ButtonLink } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MarkExpensePaidButton } from '@/components/expenses/mark-expense-paid-button'
import { ExpenseFilters } from '@/components/expenses/expense-filters'
import { Pagination, clampPage, parsePage } from '@/components/ui/pagination'
import { expenseAmountChf, formatAmount, formatCurrency, formatDate } from '@/lib/utils'

const EXPENSES_PER_PAGE = 25

const expenseTypeLabel: Record<string, string> = {
  MATERIAL: 'Materiale', LABOR: 'Manodopera', TRANSPORT: 'Trasporto',
  EQUIPMENT: 'Attrezzatura', ADMIN: 'Amministrativo', OTHER: 'Altro',
}

const paymentStatusConfig: Record<string, { label: string; variant: 'gray' | 'emerald' | 'blue' }> = {
  PENDING: { label: 'In attesa', variant: 'gray' },
  PAID: { label: 'Pagata', variant: 'emerald' },
  PARTIALLY_PAID: { label: 'Parz.', variant: 'blue' },
}

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; status?: string; page?: string }>
}) {
  const { projectId, status, page: pageParam } = await searchParams
  const page = parsePage(pageParam)
  const [expenses, projects, session] = await Promise.all([
    getExpenses({ projectId, status }),
    getProjects(),
    getSession(),
  ])
  const canEdit = session ? canMutate(session.role) : false
  const total = expenses.reduce((s, e) => s + expenseAmountChf(e), 0)
  const unpaid = expenses.filter((e) => e.paymentStatus === 'PENDING' || e.paymentStatus === 'PARTIALLY_PAID')
  const unpaidTotal = unpaid.reduce((s, e) => s + expenseAmountChf(e), 0)
  // Totals above stay over the whole filtered set; only the rows are paged.
  const safePage = clampPage(page, expenses.length, EXPENSES_PER_PAGE)
  const pageItems = expenses.slice((safePage - 1) * EXPENSES_PER_PAGE, safePage * EXPENSES_PER_PAGE)

  return (
    <div className="page-content">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-title font-semibold text-ink">Spese</h1>
          {/* "4 da pagare" never said how much. The amount is the decision. */}
          <p className="mt-1 text-body text-ink-muted">
            {expenses.length} spese · <span className="numeric">{formatAmount(total)}</span>
            {unpaidTotal > 0 && (
              <>
                {' · '}
                <span className="font-medium text-attention numeric">{formatAmount(unpaidTotal)}</span> da pagare
              </>
            )}
          </p>
        </div>
        {canEdit && (
          <Link href="/expenses/new" className="shrink-0">
            <Button aria-label="Nuova spesa" size="sm">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuova spesa</span>
            </Button>
          </Link>
        )}
      </div>

      <ExpenseFilters projects={projects.map((p) => ({ id: p.id, name: p.name, client: { name: p.client.name } }))} />

      {expenses.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CreditCard className="mb-4 h-10 w-10 text-ink-subtle" />
            <h3 className="mb-1 text-body font-medium text-ink">Nessuna spesa</h3>
            <p className="mb-4 text-body text-ink-muted">Registra le spese di progetto per tenere traccia dei costi.</p>
            {canEdit && <Link href="/expenses/new"><Button><Plus className="w-4 h-4" /> Registra spesa</Button></Link>}
          </div>
        </Card>
      ) : (
        /* Rows, not a table.
           As a table this was the worst screen in the app at 375px: Data and
           Fornitore were hidden with no fallback, the description column was left
           with ~110px so it broke one word per line at ~180px of row height, and
           the action column was clipped off the right edge. A row layout keeps
           every field and reflows instead of truncating. */
        <Card>
          <ul className="divide-y divide-line">
            {pageItems.map((exp) => {
              const ps = paymentStatusConfig[exp.paymentStatus] ?? paymentStatusConfig.PENDING
              // The description link is the row: stretching it over the whole
              // `li` turns an 18px line of text into the full ~100px band. The
              // action controls sit on z-10 to keep their own hit areas on top.
              return (
                <li key={exp.id} className="group relative px-4 py-3 transition-colors duration-state hover:bg-surface-raised sm:px-5">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/expenses/${exp.id}`}
                        className="text-body font-medium text-ink after:absolute after:inset-0 group-hover:text-action"
                      >
                        {exp.description}
                      </Link>

                      <p className="mt-1 text-label text-ink-muted">
                        <span className="numeric">{formatDate(exp.date)}</span>
                        {' · '}
                        {exp.supplier ? exp.supplier.name : 'senza fornitore'}
                        {' · '}
                        {expenseTypeLabel[exp.expenseType] ?? exp.expenseType}
                      </p>

                      <p className="mt-0.5 truncate text-label text-ink-muted">
                        {exp.project ? `${exp.project.client.name} · ${exp.project.name}` : 'Spesa aziendale'}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="text-body font-semibold text-ink numeric">
                        {formatCurrency(expenseAmountChf(exp))}
                      </div>
                      {exp.currency !== 'CHF' && (
                        <div className="text-label text-ink-muted numeric">
                          {exp.amount.toFixed(2)} {exp.currency}
                        </div>
                      )}
                      <div className="mt-1">
                        <Badge variant={ps.variant}>{ps.label}</Badge>
                      </div>
                    </div>
                  </div>

                  {canEdit && (
                    <div className="relative z-10 mt-2 flex w-fit items-center gap-2">
                      <MarkExpensePaidButton id={exp.id} currentStatus={exp.paymentStatus} />
                      <ButtonLink href={`/expenses/${exp.id}/edit`} variant="ghost" size="sm">
                        Modifica
                      </ButtonLink>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      <Pagination
        page={safePage}
        pageSize={EXPENSES_PER_PAGE}
        total={expenses.length}
        searchParams={{ projectId, status }}
      />
    </div>
  )
}
