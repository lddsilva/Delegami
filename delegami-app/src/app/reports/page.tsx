import Link from 'next/link'
import { FileSpreadsheet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InvoiceStatusBadge } from '@/components/invoices/invoice-status-badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getFinancialOverview } from '@/modules/finance/queries'
import { invoiceOutstanding } from '@/modules/finance/rules'
import { formatAmount, formatPercent } from '@/lib/utils'

/** A number needs a comparison to mean anything. */
function percentOfInvoiced(part: number, whole: number): string {
  if (whole <= 0) return '—'
  return `${formatPercent((part / whole) * 100)} del fatturato`
}

export default async function ReportsPage() {
  const { projectRows, invoices, pendingExpenses: expenses, totals } = await getFinancialOverview()

  const openInvoices = invoices.filter((i) => invoiceOutstanding(i) > 0)
  const totalInvoiced = totals.invoiced
  const totalPaid = totals.collected
  const totalPending = totals.outstanding
  const totalExpensesPending = totals.expensesPending
  // Same source as the P&L rows below, so the KPI and the table never disagree.
  const totalResult = projectRows.reduce((sum, p) => sum + p.economics.margin, 0)

  const year = new Date().getFullYear()
  const quarterStart = new Date(new Date().setMonth(new Date().getMonth() - 3))
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  const accountingPeriods = [
    { label: 'Anno corrente', from: `${year}-01-01`, to: `${year}-12-31` },
    { label: 'Ultimi 3 mesi', from: iso(quarterStart), to: iso(new Date()) },
  ]

  return (
    <div className="page-content">
      <div className="mb-6">
        <h1 className="text-display font-semibold text-ink">Report</h1>
        <p className="text-body text-ink-muted mt-1">Panoramica finanziaria e stato dei progetti · tutti i periodi</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {/* `break-all` used to split a negative value into "CHF-" on one line and
            "12'180.00" on the next. The `numeric` utility forbids that, and
            formatAmount drops the centimes that made the strings long enough to
            wrap in the first place. */}
        {[
          { label: 'Fatturato', value: formatAmount(totalInvoiced), sub: 'emesso (esclusi preventivi e bozze)', color: 'text-ink' },
          { label: 'Incassato', value: formatAmount(totalPaid), sub: percentOfInvoiced(totalPaid, totalInvoiced), color: 'text-positive' },
          { label: 'Da incassare', value: formatAmount(totalPending), sub: `${openInvoices.length} fatture aperte`, color: 'text-ink' },
          { label: 'Spese da pagare', value: formatAmount(totalExpensesPending), sub: `${expenses.length} in sospeso`, color: 'text-attention' },
          { label: 'Risultato', value: formatAmount(totalResult), sub: 'fatturato − costi − manodopera', color: totalResult >= 0 ? 'text-positive' : 'text-negative' },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent>
              <p className="text-label uppercase tracking-wide text-ink-muted">{kpi.label}</p>
              <p className={`mt-1 text-title font-semibold numeric sm:text-display ${kpi.color}`}>{kpi.value}</p>
              <p className="mt-0.5 text-label text-ink-muted">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rapporto contabile — the packaged, printable version of this page for the bookkeeper */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex gap-3 min-w-0">
              <div className="mt-0.5 shrink-0 rounded-control bg-action-surface p-2 text-action">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-body font-semibold text-ink">Rapporto contabile</p>
                <p className="text-label text-ink-muted mt-0.5">
                  Registro fatture, incassi, partite aperte con scadenziario, costi e note metodologiche —
                  pronto da stampare o inviare al contabile.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {accountingPeriods.map((p) => (
                <Link
                  key={p.label}
                  href={`/relatorio/contabile?from=${p.from}&to=${p.to}`}
                  className="inline-flex items-center rounded-full border border-line px-3 py-1.5 text-label font-medium text-ink-muted hover:bg-surface-raised transition-colors duration-state"
                >
                  {p.label}
                </Link>
              ))}
              <Link
                href="/relatorio/contabile"
                className="inline-flex items-center rounded-control bg-action px-3 py-1.5 text-label font-medium text-white hover:opacity-90 transition-opacity duration-state"
              >
                Apri rapporto
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Project P&L */}
        <Card>
          <CardHeader className="py-3 px-4 sm:px-6"><CardTitle className="text-body sm:text-body">P&L per progetto</CardTitle></CardHeader>
          {/* A margin with its inputs hidden is unreadable: CHF 2'000 is excellent
              on CHF 8'000 invoiced and dismal on CHF 200'000. The old table hid
              Fatturato and Spese below `sm` and kept only Margine. Rows show all
              three at every width. */}
          <ul className="divide-y divide-line">
            {projectRows.map((p) => {
              const { invoiced, expenses: spent, labor, margin, marginPct } = p.economics
              // The whole row is the target, not the 20px-tall project name:
              // the stretched pseudo-element turns a 66px band into one tap.
              return (
                <li key={p.id} className="group relative px-4 py-3 transition-colors duration-state hover:bg-surface-raised sm:px-5">
                  <div className="flex items-baseline gap-3">
                    <Link href={`/projects/${p.id}`} className="min-w-0 flex-1 truncate text-body font-medium text-ink after:absolute after:inset-0 group-hover:text-action">
                      {p.name}
                    </Link>
                    <span className={`shrink-0 text-body font-semibold numeric ${margin >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {formatAmount(margin)}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-label text-ink-muted">
                    <span className="truncate">{p.clientName}</span>
                    <span className="numeric">fatturato {formatAmount(invoiced)}</span>
                    <span className="numeric">costi {formatAmount(spent + labor)}</span>
                    {marginPct != null && <span className="numeric">margine {formatPercent(marginPct)}</span>}
                  </div>
                </li>
              )
            })}
            {projectRows.length === 0 && (
              <li className="px-4 py-8 text-center text-body text-ink-muted">Nessun progetto attivo</li>
            )}
          </ul>
        </Card>

        {/* Open invoices */}
        <Card>
          <CardHeader className="py-3 px-4 sm:px-6"><CardTitle className="text-body sm:text-body">Fatture aperte</CardTitle></CardHeader>
          {/* Rows, not a table: the invoice number was a 16px-tall link inside a
              four-column grid that had to be scrolled sideways on a phone. The
              row is the target and everything about the invoice is on it. */}
          <ul className="divide-y divide-line">
            {openInvoices.map((inv) => (
              <li key={inv.id} className="group relative px-4 py-3 transition-colors duration-state hover:bg-surface-raised sm:px-5">
                <div className="flex items-baseline gap-3">
                  <Link href={`/invoices/${inv.id}`} className="min-w-0 flex-1 truncate font-mono text-body font-medium text-ink after:absolute after:inset-0 group-hover:text-action">
                    {inv.invoiceNumber}
                  </Link>
                  <InvoiceStatusBadge status={inv.status} />
                  <span className="shrink-0 text-body font-semibold text-ink numeric">{formatCurrency(inv.total)}</span>
                </div>
                {/* Wraps rather than truncates: on a phone `truncate` cut the
                    line at the client name and took the issue date with it. */}
                <p className="mt-1 text-label text-ink-muted">
                  {inv.project.name} · {inv.project.client.name} · <span className="numeric">emessa {formatDate(inv.issueDate)}</span>
                </p>
              </li>
            ))}
            {openInvoices.length === 0 && (
              <li className="px-4 py-8 text-center text-body text-ink-muted">Nessuna fattura aperta</li>
            )}
          </ul>
        </Card>
      </div>

      {/* Unpaid expenses */}
      {expenses.length > 0 && (
        <Card>
          <CardHeader className="py-3 px-4 sm:px-6"><CardTitle className="text-body sm:text-body">Spese da pagare ({expenses.length})</CardTitle></CardHeader>
          {/* Same treatment. The five-column version hid the fornitore below
              `md` and the date below `sm`, which left a phone reading a
              description and an amount with no way to tell them apart. */}
          <ul className="divide-y divide-line">
            {expenses.map((exp) => (
              <li key={exp.id} className="group relative px-4 py-3 transition-colors duration-state hover:bg-surface-raised sm:px-5">
                <div className="flex items-baseline gap-3">
                  <Link href={`/expenses/${exp.id}`} className="min-w-0 flex-1 truncate text-body font-medium text-ink after:absolute after:inset-0 group-hover:text-action">
                    {exp.description}
                  </Link>
                  <span className="shrink-0 text-body font-semibold text-attention numeric">
                    {exp.currency !== 'CHF' && exp.amountChf != null
                      ? formatCurrency(exp.amountChf)
                      : formatCurrency(exp.amount)}
                  </span>
                </div>
                <p className="mt-1 text-label text-ink-muted">
                  <span className="numeric">{formatDate(exp.date)}</span>
                  {' · '}
                  {exp.supplier?.name ?? 'senza fornitore'}
                  {' · '}
                  {exp.project?.name ?? 'Spesa aziendale'}
                  {exp.currency !== 'CHF' && (
                    <>
                      {' · '}
                      <span className="numeric">{exp.amount.toFixed(2)} {exp.currency}</span>
                    </>
                  )}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
