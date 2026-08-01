import { Fragment } from 'react'
import Link from 'next/link'
import { Building2, FileText, Pencil, Plus } from 'lucide-react'
import { getQuoteFamilies } from '@/modules/quotes/queries'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { InitialAvatar } from '@/components/ui/avatar'
import { QuoteStatusBadge } from '@/components/quotes/quote-status-badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { canMutate, getSession } from '@/lib/auth'
import { Pagination, clampPage, parsePage } from '@/components/ui/pagination'

const PROJECTS_PER_PAGE = 15

type QuoteRow = Awaited<ReturnType<typeof getQuoteFamilies>>[number]

type ProjectGroup = {
  project: QuoteRow['project']
  quotes: QuoteRow[]
  latestUpdatedAt: Date
  total: number
}

function groupQuotesByProject(quotes: QuoteRow[]): ProjectGroup[] {
  const map = new Map<string, ProjectGroup>()

  for (const quote of quotes) {
    const group = map.get(quote.project.id) ?? {
      project: quote.project,
      quotes: [],
      latestUpdatedAt: quote.updatedAt,
      total: 0,
    }

    group.quotes.push(quote)
    group.total += quote.total
    if (quote.updatedAt.getTime() > group.latestUpdatedAt.getTime()) {
      group.latestUpdatedAt = quote.updatedAt
    }

    map.set(quote.project.id, group)
  }

  return Array.from(map.values())
    .map((group) => ({
      ...group,
      quotes: [...group.quotes].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
    }))
    .sort((a, b) => b.latestUpdatedAt.getTime() - a.latestUpdatedAt.getTime())
}

type ClientGroup = {
  client: QuoteRow['project']['client']
  projectGroups: ProjectGroup[]
  total: number
  latestUpdatedAt: Date
}

function groupByClient(projectGroups: ProjectGroup[]): ClientGroup[] {
  const map = new Map<string, ClientGroup>()

  for (const pg of projectGroups) {
    const clientId = pg.project.client.id
    const group = map.get(clientId) ?? {
      client: pg.project.client,
      projectGroups: [],
      total: 0,
      latestUpdatedAt: pg.latestUpdatedAt,
    }
    group.projectGroups.push(pg)
    group.total += pg.total
    if (pg.latestUpdatedAt.getTime() > group.latestUpdatedAt.getTime()) {
      group.latestUpdatedAt = pg.latestUpdatedAt
    }
    map.set(clientId, group)
  }

  return Array.from(map.values()).sort((a, b) => b.latestUpdatedAt.getTime() - a.latestUpdatedAt.getTime())
}

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const page = parsePage((await searchParams).page)
  const [quotes, session] = await Promise.all([getQuoteFamilies(), getSession()])
  const canEdit = session ? canMutate(session.role) : false
  // Paged by opera rather than by quote: a project's quotes belong together,
  // and splitting a card across pages would be worse than an uneven page size.
  const allProjectGroups = groupQuotesByProject(quotes)
  const safePage = clampPage(page, allProjectGroups.length, PROJECTS_PER_PAGE)
  const projectGroups = allProjectGroups.slice(
    (safePage - 1) * PROJECTS_PER_PAGE,
    safePage * PROJECTS_PER_PAGE,
  )
  const clientGroups = groupByClient(projectGroups)

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-title sm:text-display font-semibold text-ink">Preventivi</h1>
          <p className="text-body text-ink-muted mt-0.5">
            {quotes.length} preventivi · {allProjectGroups.length} opere
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Link href="/quotes/import">
              <Button aria-label="Importa da IA" size="sm" variant="secondary">
                <span className="hidden sm:inline">Importa da IA</span>
                <span className="sm:hidden">Import IA</span>
              </Button>
            </Link>
            <Link href="/quotes/new">
              <Button aria-label="Nuovo preventivo" size="sm">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Nuovo preventivo</span>
              </Button>
            </Link>
          </div>
        )}
      </div>

      {quotes.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-12 h-12 text-ink-subtle mb-4" />
            <h3 className="text-body font-medium text-ink mb-1">Nessun preventivo</h3>
            <p className="text-body text-ink-muted mb-4">Crea il primo preventivo per un&apos;opera.</p>
            {canEdit && (
              <Link href="/quotes/new">
                <Button><Plus className="w-4 h-4" /> Crea preventivo</Button>
              </Link>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-8">
          {clientGroups.map((clientGroup) => (
            <div key={clientGroup.client.id}>
              {/* Client band */}
              <Link href={`/clients/${clientGroup.client.id}`} className="group flex items-center gap-3 min-h-11 mb-3 px-1">
                <InitialAvatar name={clientGroup.client.name} />
                <div className="min-w-0 flex-1">
                  <p className="text-body font-semibold text-ink group-hover:text-action truncate">{clientGroup.client.name}</p>
                  <p className="text-label text-ink-muted">{clientGroup.projectGroups.length} {clientGroup.projectGroups.length === 1 ? 'opera' : 'opere'}</p>
                </div>
                <span className="text-label text-ink-muted tabular-nums shrink-0">{formatCurrency(clientGroup.total)}</span>
              </Link>

              <div className="space-y-4">
                {clientGroup.projectGroups.map((group) => (
                  <Card key={group.project.id} className="overflow-hidden">
                    <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3 border-b border-line bg-surface-raised/60">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Building2 className="w-4 h-4 text-action shrink-0" />
                        <div className="min-w-0">
                          <Link href={`/projects/${group.project.id}`} className="block truncate py-3 -my-3 text-body font-semibold text-ink hover:text-action">
                            {group.project.name}
                          </Link>
                          <p className="text-label text-ink-muted">{group.quotes.length} {group.quotes.length === 1 ? 'preventivo' : 'preventivi'} · agg. {formatDate(group.latestUpdatedAt)}</p>
                        </div>
                      </div>
                      <span className="text-body font-semibold text-ink tabular-nums shrink-0">{formatCurrency(group.total)}</span>
                    </div>

                    <ul className="divide-y divide-line">
                      {group.quotes.map((q) => {
                        const previousVersions = q.versions
                          .filter((version) => version.id !== q.id)
                          .sort((a, b) => b.version - a.version)

                        return (
                          <Fragment key={q.id}>
                            <li className="group relative flex items-center gap-3 px-4 sm:px-5 py-2.5 hover:bg-action-surface/40 transition-colors">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Link href={`/quotes/${q.id}`} className="text-body font-mono font-medium text-ink group-hover:text-action after:absolute after:inset-0">
                                    {q.quoteNumber}
                                  </Link>
                                  <QuoteStatusBadge status={q.status} />
                                </div>
                                <p className="text-label text-ink-muted mt-0.5">
                                  v{q.version} corrente{q.versionCount > 1 ? ` · ${q.versionCount} versioni` : ''} · {formatDate(q.updatedAt)}
                                </p>
                              </div>
                              <span className="shrink-0 text-body font-medium text-ink tabular-nums">{formatCurrency(q.total)}</span>
                              {canEdit && (
                                <Link
                                  href={`/quotes/${q.id}/edit`}
                                  aria-label={`Modifica il preventivo ${q.quoteNumber}`}
                                  className="tap-target relative z-10 -my-2 inline-flex shrink-0 items-center justify-center rounded-control text-ink-muted hover:text-action opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-state"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Link>
                              )}
                            </li>
                            {previousVersions.map((version) => (
                              <li key={version.id} className="flex items-center gap-3 px-4 sm:px-5 py-2 pl-8 sm:pl-10 bg-surface-raised/50">
                                <span className="h-px w-4 bg-surface-raised shrink-0" />
                                <Link href={`/quotes/${version.id}`} className="text-label font-mono font-medium text-ink-muted hover:text-action hover:underline">
                                  {q.quoteNumber} v{version.version}
                                </Link>
                                <QuoteStatusBadge status={version.status} />
                                <span className="ml-auto text-label font-medium text-ink-muted tabular-nums">{formatCurrency(version.total)}</span>
                              </li>
                            ))}
                          </Fragment>
                        )
                      })}
                    </ul>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={safePage} pageSize={PROJECTS_PER_PAGE} total={allProjectGroups.length} />
    </div>
  )
}
