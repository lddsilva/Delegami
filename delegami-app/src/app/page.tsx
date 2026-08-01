import Link from 'next/link'
import { AlertTriangle, Building2, Camera, CheckCircle, CreditCard, HardHat, Plus, Send } from 'lucide-react'
import { ReceiptUploadButton } from '@/components/receipt-inbox/receipt-upload-modal'
import { getDashboardStats, getProjects } from '@/modules/projects/queries'
import { getPendingWorkLogsCount } from '@/modules/work-logs/queries'
import { getSession, canMutate } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProjectStatusBadge } from '@/components/ui/badge'
import { InitialAvatar } from '@/components/ui/avatar'
import { formatAmount, formatCurrency, formatDate } from '@/lib/utils'

type DashboardData = Awaited<ReturnType<typeof getDashboardStats>>
type Receivable = DashboardData['receivables'][number]
type DashboardProject = DashboardData['sortedProjects'][number]

function groupByClient(projects: DashboardProject[]) {
  const groups: { client: DashboardProject['client']; projects: DashboardProject[] }[] = []
  const indexByClient = new Map<string, number>()
  for (const project of projects) {
    const idx = indexByClient.get(project.client.id)
    if (idx == null) {
      indexByClient.set(project.client.id, groups.length)
      groups.push({ client: project.client, projects: [project] })
    } else {
      groups[idx].projects.push(project)
    }
  }
  return groups
}

/** Overdue is not a boolean. Two months late and two days late are different problems. */
function overdueTone(days: number) {
  if (days >= 60) return 'bg-negative text-ink-inverse'
  if (days >= 14) return 'bg-negative-surface text-negative'
  return 'bg-attention-surface text-attention'
}

function ReceivableRow({ row }: { row: Receivable }) {
  const { invoice, outstanding, paid, daysOverdue } = row
  const clientEmail = invoice.project.client.email
  const subject = encodeURIComponent(`Promemoria pagamento fattura ${invoice.invoiceNumber}`)
  const body = encodeURIComponent(
    `Gentile ${invoice.project.client.name},\n\nLe ricordiamo che la fattura n° ${invoice.invoiceNumber} di CHF ${outstanding.toFixed(2)}${invoice.dueDate ? `, scaduta in data ${formatDate(invoice.dueDate)}` : ''}, risulta ancora non saldata.\n\nLa preghiamo di provvedere al pagamento nel più breve tempo possibile.\n\nCordiali saluti,\nZanetti Edili`,
  )

  return (
    <li className="px-4 py-3 sm:px-5">
      {/* Identity + amount on one line, context on the next. Keeping all of it
          in a single flex row squeezed the client name down to an ellipsis. */}
      <div className="flex items-baseline gap-3">
        <Link
          href={`/invoices/${invoice.id}`}
          className="-my-2 inline-flex min-h-11 items-center font-mono text-body font-medium text-ink hover:text-action"
        >
          {invoice.invoiceNumber}
        </Link>
        {daysOverdue !== null && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-label font-semibold ${overdueTone(daysOverdue)}`}>
            {daysOverdue} giorni
          </span>
        )}
        <span className="ml-auto shrink-0 text-body font-semibold text-ink numeric">
          {formatCurrency(outstanding)}
        </span>
      </div>

      <div className="mt-1 flex items-end gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-label text-ink-muted">
            {invoice.project.client.name} · {invoice.project.name}
          </p>
          {/* `numeric` forbids word-breaking, which is right for one figure and
              wrong for a sentence containing three: the line could not wrap and
              ran 8px past the card. It goes on the numbers only. */}
          <p className="text-label text-ink-muted">
            {invoice.dueDate && <>scad. <span className="numeric">{formatDate(invoice.dueDate)}</span></>}
            {paid > 0 && (
              <> · già incassato <span className="numeric">{formatAmount(paid)}</span> di{' '}
                <span className="numeric">{formatAmount(invoice.total)}</span></>
            )}
          </p>
        </div>
        {clientEmail && (
          <a
            href={`mailto:${clientEmail}?subject=${subject}&body=${body}`}
            aria-label={`Invia promemoria per la fattura ${invoice.invoiceNumber}`}
            title="Invia promemoria"
            className="tap-target -mb-1 -mr-2 inline-flex shrink-0 items-center justify-center rounded-control text-ink-muted transition-colors duration-state hover:bg-action-surface hover:text-action"
          >
            <Send className="h-4 w-4" />
          </a>
        )}
      </div>
    </li>
  )
}

function QueueCard({
  href, icon: Icon, count, label,
}: { href: string; icon: typeof Camera; count: number; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-surface border border-attention-border bg-attention-surface px-4 py-3 transition-colors duration-state hover:brightness-[0.98]"
    >
      <Icon className="h-5 w-5 shrink-0 text-attention" />
      <p className="text-body text-ink">
        <span className="font-semibold numeric">{count}</span> {label}
      </p>
    </Link>
  )
}

export default async function DashboardPage() {
  const session = await getSession()
  const [stats, projects, pendingWorkLogsCount] = await Promise.all([
    getDashboardStats(),
    getProjects(),
    session && canMutate(session.role) ? getPendingWorkLogsCount() : Promise.resolve(0),
  ])

  const {
    receivables, receivableTotal, overdueCount, overdueTotal,
    unpaidExpensesCount, unpaidExpensesTotal, quotesResidualProjects, quotesResidualTotal,
    pendingReceiptsCount, sortedProjects, hasMoreProjects, activeProjectCount,
  } = stats

  const projectOptions = projects.map((p) => ({
    id: p.id,
    name: p.name,
    isPlaceholder: p.isPlaceholder ?? false,
  }))

  const projectGroups = groupByClient(sortedProjects)

  return (
    <div className="page-content space-y-8">
      {/* ── The answer ────────────────────────────────────────────────────
          One question: how much is owed to me, and how much of it is late.
          Everything else on this page is secondary to that figure. */}
      <section>
        <h1 className="text-label font-medium uppercase tracking-wider text-ink-muted">Da incassare</h1>
        <p className="mt-1 text-display font-semibold text-ink numeric">{formatAmount(receivableTotal)}</p>
        <p className="mt-1 text-body text-ink-muted">
          {receivables.length === 0 ? (
            'Nessuna fattura aperta.'
          ) : overdueCount > 0 ? (
            <>
              di cui <span className="font-medium text-negative numeric">{formatAmount(overdueTotal)}</span>{' '}
              {overdueCount === 1 ? 'scaduto' : 'scaduti'} su {overdueCount}{' '}
              {overdueCount === 1 ? 'fattura' : 'fatture'}
            </>
          ) : (
            <>
              {receivables.length} {receivables.length === 1 ? 'fattura aperta' : 'fatture aperte'}, nessuna scaduta
            </>
          )}
        </p>
      </section>

      {/* Primary action. One per screen — capturing a scontrino is the thing
          Marcos does daily from his phone; everything else can wait. */}
      <div className="flex flex-wrap gap-2">
        <ReceiptUploadButton
          label="Scontrini"
          className="inline-flex min-h-11 items-center gap-2 rounded-control bg-action px-4 text-body font-medium text-ink-inverse transition-colors duration-state hover:bg-action-hover"
          redirectAfter="/receipts"
          projects={projectOptions}
        />
        <Link
          href="/expenses/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-control border border-line-strong bg-surface px-4 text-body font-medium text-ink transition-colors duration-state hover:bg-surface-raised"
        >
          <Plus className="h-4 w-4" />
          Nuova spesa
        </Link>
      </div>

      {/* ── Receivables, listed once ───────────────────────────────────── */}
      {receivables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fatture aperte</CardTitle>
            <Link href="/invoices" className="-mr-2 inline-flex min-h-11 items-center rounded-control px-2 text-label text-action hover:underline">
              Tutte le fatture
            </Link>
          </CardHeader>
          <ul className="divide-y divide-line">
            {receivables.map((row) => (
              <ReceivableRow key={row.invoice.id} row={row} />
            ))}
          </ul>
        </Card>
      )}

      {/* ── Work waiting on Marcos ─────────────────────────────────────── */}
      {(pendingReceiptsCount > 0 ||
        pendingWorkLogsCount > 0 ||
        quotesResidualProjects > 0 ||
        unpaidExpensesCount > 0) && (
        <section className="space-y-3">
          <h2 className="text-label font-medium uppercase tracking-wider text-ink-muted">Da sistemare</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {pendingReceiptsCount > 0 && (
              <QueueCard href="/receipts" icon={Camera} count={pendingReceiptsCount} label="scontrini da processare" />
            )}
            {pendingWorkLogsCount > 0 && (
              <QueueCard href="/rapportini" icon={HardHat} count={pendingWorkLogsCount} label="rapportini da verificare" />
            )}
            {quotesResidualProjects > 0 && (
              <Link
                href="/projects"
                className="flex items-center gap-3 rounded-surface border border-positive-border bg-positive-surface px-4 py-3 transition-colors duration-state hover:brightness-[0.98]"
              >
                <CheckCircle className="h-5 w-5 shrink-0 text-positive" />
                <p className="text-body text-ink">
                  <span className="font-semibold numeric">{formatAmount(quotesResidualTotal)}</span> da fatturare
                  <span className="text-ink-muted">
                    {' · '}
                    {quotesResidualProjects} {quotesResidualProjects === 1 ? 'opera' : 'opere'}
                  </span>
                </p>
              </Link>
            )}
            {unpaidExpensesCount > 0 && (
              <Link
                href="/expenses"
                className="flex items-center gap-3 rounded-surface border border-line bg-surface px-4 py-3 transition-colors duration-state hover:bg-surface-raised"
              >
                <CreditCard className="h-5 w-5 shrink-0 text-ink-muted" />
                <p className="text-body text-ink">
                  <span className="font-semibold numeric">{formatAmount(unpaidExpensesTotal)}</span> da pagare ai
                  fornitori
                  <span className="text-ink-muted"> · {unpaidExpensesCount}</span>
                </p>
              </Link>
            )}
          </div>
        </section>
      )}

      {/* ── Live work ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Opere in corso</CardTitle>
          <Link href="/projects" className="-mr-2 inline-flex min-h-11 items-center rounded-control px-2 text-label text-action hover:underline">
            {hasMoreProjects ? `Tutte (${activeProjectCount})` : 'Tutte le opere'}
          </Link>
        </CardHeader>

        {sortedProjects.length === 0 ? (
          <CardContent>
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Building2 className="h-8 w-8 text-ink-subtle" />
              <p className="text-body text-ink-muted">Nessuna opera in corso.</p>
              <Link href="/projects/new" className="text-body font-medium text-action hover:underline">
                Crea la prima opera
              </Link>
            </div>
          </CardContent>
        ) : (
          <div className="divide-y divide-line">
            {projectGroups.map((group) => (
              <div key={group.client.id}>
                <Link
                  href={`/clients/${group.client.id}`}
                  className="flex min-h-11 items-center gap-2 bg-surface-raised px-4 py-2 transition-colors duration-state hover:brightness-[0.98] sm:px-5"
                >
                  <InitialAvatar name={group.client.name} size="sm" />
                  <span className="truncate text-label font-medium text-ink-muted">{group.client.name}</span>
                </Link>
                <ul className="divide-y divide-line">
                  {group.projects.map((project) => (
                    <li key={project.id} className="group relative flex items-center gap-3 px-4 py-3 transition-colors duration-state hover:bg-surface-raised sm:px-5">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/projects/${project.id}`}
                          className="text-body font-medium text-ink after:absolute after:inset-0 group-hover:text-action"
                        >
                          {project.name}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <ProjectStatusBadge status={project.status} />
                          {project.referenceCode && (
                            <span className="font-mono text-label text-ink-muted">{project.referenceCode}</span>
                          )}
                        </div>
                      </div>
                      <span className="shrink-0 text-body text-ink-muted numeric">
                        {formatAmount(project.estimatedValue)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>

      {receivables.length === 0 && sortedProjects.length === 0 && (
        <p className="flex items-center justify-center gap-2 py-4 text-body text-ink-muted">
          <AlertTriangle className="h-4 w-4" />
          Niente da fare oggi.
        </p>
      )}
    </div>
  )
}
