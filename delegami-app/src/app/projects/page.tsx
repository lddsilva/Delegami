import Link from 'next/link'
import { Plus, Building2, ChevronRight, MapPin } from 'lucide-react'
import { getProjectsOverview, PROJECT_STATUS_PRIORITY } from '@/modules/projects/queries'
import { ProjectStatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { InitialAvatar } from '@/components/ui/avatar'
import { formatAmount, formatPercent } from '@/lib/utils'
import { getSession, canMutate } from '@/lib/auth'

type ProjectRow = Awaited<ReturnType<typeof getProjectsOverview>>[number]

const ACTIVE_STATUSES = ['IN_PROGRESS', 'APPROVED', 'QUOTING', 'LEAD']
const CLOSED_STATUSES = ['COMPLETED', 'CANCELLED']

type Filter = 'tutte' | 'attive' | 'concluse'

function matchesFilter(project: ProjectRow, filter: Filter) {
  if (filter === 'attive') return ACTIVE_STATUSES.includes(project.status)
  if (filter === 'concluse') return CLOSED_STATUSES.includes(project.status)
  return true
}

function groupByClient(projects: ProjectRow[]) {
  const groups: { client: ProjectRow['client']; projects: ProjectRow[]; invoiced: number }[] = []
  const indexByClient = new Map<string, number>()
  for (const project of projects) {
    const idx = indexByClient.get(project.client.id)
    if (idx == null) {
      indexByClient.set(project.client.id, groups.length)
      groups.push({ client: project.client, projects: [project], invoiced: project.economics.invoiced })
    } else {
      groups[idx].projects.push(project)
      groups[idx].invoiced += project.economics.invoiced
    }
  }
  return groups
}

/**
 * The headline figure per row. `estimatedValue` is filled on a minority of
 * projects, so a row that has been invoiced leads with real money and only
 * falls back to the estimate — explicitly labelled — while nothing is billed.
 */
function headlineValue(project: ProjectRow) {
  if (project.economics.invoiced > 0) {
    return { value: formatAmount(project.economics.invoiced), label: 'fatturato', muted: false }
  }
  if (project.estimatedValue && project.estimatedValue > 0) {
    return { value: formatAmount(project.estimatedValue), label: 'stimato', muted: true }
  }
  return { value: '—', label: '', muted: true }
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>
}) {
  const [projects, session, sp] = await Promise.all([getProjectsOverview(), getSession(), searchParams])
  const canEdit = session ? canMutate(session.role) : false

  const filter: Filter = sp.filtro === 'attive' || sp.filtro === 'concluse' ? sp.filtro : 'tutte'

  const sorted = [...projects].sort((a, b) => {
    const pa = PROJECT_STATUS_PRIORITY[a.status] ?? 99
    const pb = PROJECT_STATUS_PRIORITY[b.status] ?? 99
    if (pa !== pb) return pa - pb
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  const visible = sorted.filter((p) => matchesFilter(p, filter))
  const clientGroups = groupByClient(visible)

  const counts = {
    tutte: projects.length,
    attive: projects.filter((p) => matchesFilter(p, 'attive')).length,
    concluse: projects.filter((p) => matchesFilter(p, 'concluse')).length,
  }

  // KPIs always describe the whole portfolio, not the current filter: they are
  // the reason to switch filter, so they must not move when you do.
  const kpis = {
    active: counts.attive,
    invoiced: projects.reduce((sum, p) => sum + p.economics.invoiced, 0),
    outstanding: projects.reduce((sum, p) => sum + p.economics.outstanding, 0),
    pendingQuotes: projects.reduce((sum, p) => sum + p.flags.pendingQuotes, 0),
  }

  const filterTabs: { key: Filter; label: string; count: number }[] = [
    { key: 'tutte', label: 'Tutte', count: counts.tutte },
    { key: 'attive', label: 'Attive', count: counts.attive },
    { key: 'concluse', label: 'Concluse', count: counts.concluse },
  ]

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-title sm:text-display font-semibold text-ink">Opere</h1>
          <p className="text-body text-ink-muted mt-0.5">
            {projects.length} opere · {new Set(projects.map((p) => p.client.id)).size} clienti
          </p>
        </div>
        {canEdit && (
          <Link href="/projects/new">
            <Button aria-label="Nuova opera" size="sm">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Nuova opera</span>
            </Button>
          </Link>
        )}
      </div>

      {projects.length > 0 && (
        <>
          {/* Portfolio KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Opere attive', value: String(kpis.active), color: 'text-ink' },
              { label: 'Fatturato', value: formatAmount(kpis.invoiced), color: 'text-ink' },
              {
                label: 'Da incassare',
                value: formatAmount(kpis.outstanding),
                color: kpis.outstanding > 0 ? 'text-attention' : 'text-ink',
              },
              { label: 'Preventivi in attesa', value: String(kpis.pendingQuotes), color: 'text-ink' },
            ].map((kpi) => (
              <Card key={kpi.label}>
                <CardContent>
                  <p className="text-label uppercase tracking-wide text-ink-muted">{kpi.label}</p>
                  <p className={`mt-1 text-title font-semibold numeric ${kpi.color}`}>{kpi.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {filterTabs.map((tab) => {
              const active = tab.key === filter
              return (
                <Link
                  key={tab.key}
                  href={tab.key === 'tutte' ? '/projects' : `/projects?filtro=${tab.key}`}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-label font-medium transition-colors duration-state ${
                    active ? 'bg-action text-white' : 'border border-line text-ink-muted hover:bg-surface-raised'
                  }`}
                >
                  {tab.label}
                  <span className={active ? 'opacity-80' : 'text-ink-subtle'}>{tab.count}</span>
                </Link>
              )
            })}
          </div>
        </>
      )}

      {projects.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="w-12 h-12 text-ink-subtle mb-4" />
            <h3 className="text-body font-medium text-ink mb-1">Nessuna opera</h3>
            <p className="text-body text-ink-muted mb-4">Inizia aggiungendo la tua prima opera.</p>
            {canEdit && (
              <Link href="/projects/new">
                <Button>
                  <Plus className="w-4 h-4" /> Aggiungi opera
                </Button>
              </Link>
            )}
          </div>
        </Card>
      ) : visible.length === 0 ? (
        <Card>
          <div className="py-12 text-center text-body text-ink-muted">Nessuna opera in questo filtro.</div>
        </Card>
      ) : (
        <div className="space-y-4">
          {clientGroups.map((group) => (
            <Card key={group.client.id} className="overflow-hidden">
              {/* Client header */}
              <Link
                href={`/clients/${group.client.id}`}
                className="flex items-center gap-3 px-4 sm:px-5 py-3 bg-surface-raised/70 hover:bg-surface-raised/70 transition-colors border-b border-line"
              >
                <InitialAvatar name={group.client.name} />
                <div className="min-w-0 flex-1">
                  <p className="text-body font-semibold text-ink truncate">{group.client.name}</p>
                  <p className="text-label text-ink-muted">
                    {group.projects.length} {group.projects.length === 1 ? 'opera' : 'opere'}
                  </p>
                </div>
                {group.invoiced > 0 && (
                  <span className="text-body font-semibold text-ink numeric shrink-0">{formatAmount(group.invoiced)}</span>
                )}
                <ChevronRight className="w-4 h-4 text-ink-subtle shrink-0" />
              </Link>

              {/* Projects */}
              <ul className="divide-y divide-line">
                {group.projects.map((project) => {
                  const headline = headlineValue(project)
                  const { outstanding, billedPct } = project.economics
                  const hasChips = outstanding > 0 || project.flags.hasOverdue || project.flags.toInvoice
                  return (
                    <li
                      key={project.id}
                      className="group relative px-4 sm:px-5 py-3 hover:bg-action-surface/40 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/projects/${project.id}`}
                            className="text-body font-medium text-ink group-hover:text-action after:absolute after:inset-0"
                          >
                            {project.name}
                          </Link>

                          <div className="mt-1 flex items-center gap-2 flex-wrap text-label text-ink-muted">
                            <ProjectStatusBadge status={project.status} />
                            {project.referenceCode && <span className="font-mono">{project.referenceCode}</span>}
                            {project.address && (
                              <span className="inline-flex items-center gap-0.5 truncate max-w-[16rem]">
                                <MapPin className="w-3 h-3 shrink-0" />
                                {project.address}
                              </span>
                            )}
                            {(project.counts.quotes > 0 || project.counts.invoices > 0) && (
                              <span className="numeric">
                                {project.counts.quotes} prev · {project.counts.invoices} fatt
                              </span>
                            )}
                          </div>

                          {/* Action chips — rendered only when they mean something */}
                          {hasChips && (
                            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                              {outstanding > 0 && (
                                <span className="inline-flex items-center rounded-full bg-attention-surface px-2 py-0.5 text-label font-medium text-attention numeric">
                                  da incassare {formatAmount(outstanding)}
                                </span>
                              )}
                              {project.flags.hasOverdue && (
                                <span className="inline-flex items-center rounded-full bg-negative-surface px-2 py-0.5 text-label font-medium text-negative">
                                  scaduta
                                </span>
                              )}
                              {project.flags.toInvoice && (
                                <span className="inline-flex items-center rounded-full bg-action-surface px-2 py-0.5 text-label font-medium text-action">
                                  da fatturare
                                </span>
                              )}
                            </div>
                          )}

                          {/* Billing progress against the approved quote */}
                          {billedPct != null && (
                            <div className="mt-2 flex items-center gap-2">
                              <div className="h-1 flex-1 max-w-[14rem] rounded-full bg-line overflow-hidden">
                                <div className="h-full rounded-full bg-action" style={{ width: `${billedPct}%` }} />
                              </div>
                              <span className="text-label text-ink-subtle numeric shrink-0">
                                {formatPercent(billedPct)} fatturato
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 text-right">
                          <span
                            className={`block text-body font-medium numeric ${headline.muted ? 'text-ink-muted' : 'text-ink'}`}
                          >
                            {headline.value}
                          </span>
                          {headline.label && <span className="block text-label text-ink-subtle">{headline.label}</span>}
                        </div>

                        {canEdit && (
                          <Link
                            href={`/projects/${project.id}/edit`}
                            className="tap-target relative z-10 inline-flex shrink-0 items-center justify-center rounded-control px-2 text-label font-medium text-ink-muted hover:text-action opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-state"
                          >
                            Modifica
                          </Link>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
