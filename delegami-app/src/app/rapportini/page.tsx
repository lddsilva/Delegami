import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, UserPlus } from 'lucide-react'
import { getSession, canMutate, isAdmin } from '@/lib/auth'
import { getWorkLogs, getLoggableUsers, getProjectsForWorkLog } from '@/modules/work-logs/queries'
import { getWorkersOverview } from '@/modules/workers/queries'
import { formatCurrency } from '@/lib/utils'
import { RapportiniClient } from '@/components/work-logs/rapportini-client'
import type { WorkLogView } from '@/components/work-logs/work-log-list'

export default async function RapportiniPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string; projectId?: string; from?: string; to?: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role === 'WORKER') redirect('/rapportino')

  const sp = await searchParams
  const from = sp.from ? new Date(`${sp.from}T00:00:00`) : undefined
  const to = sp.to ? new Date(`${sp.to}T23:59:59`) : undefined

  const [{ logs, totalHours, submittedHours }, workers, projects, overview] = await Promise.all([
    getWorkLogs({ userId: sp.userId, projectId: sp.projectId, from, to }),
    getLoggableUsers(),
    getProjectsForWorkLog(),
    getWorkersOverview(),
  ])

  const views: WorkLogView[] = logs.map((log) => ({
    id: log.id,
    userId: log.userId,
    userName: log.userName,
    workDate: log.workDate,
    hours: log.hours,
    hourlyRate: log.hourlyRate,
    amountOverride: log.amountOverride,
    location: log.location,
    description: log.description,
    status: log.status,
    projectId: log.projectId,
    project: log.project,
    photos: log.photos.map((p) => ({ id: p.id, url: p.url })),
    revisionRequestedAt: log.revisionRequestedAt,
    revisionReason: log.revisionReason,
  }))

  const hasFilters = Boolean(sp.userId || sp.projectId || sp.from || sp.to)

  return (
    <div className="page-content">
      <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-display font-semibold text-ink">Rapportini</h1>
          <p className="text-body text-ink-muted mt-1">Ore lavorate e foto registrate dagli operai</p>
        </div>
        {isAdmin(session.role) && (
          <Link
            href="/settings/users/new?role=WORKER"
            className="inline-flex items-center gap-2 rounded-control bg-action text-ink-inverse px-4 min-h-11 text-body font-medium hover:bg-action-hover"
          >
            <UserPlus className="w-4 h-4" /> Nuovo operaio
          </Link>
        )}
      </div>

      {overview.length > 0 && (
        <div className="mb-6">
          <h2 className="text-body font-semibold text-ink-muted uppercase tracking-wider mb-2">Operai</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {overview.map((w) => (
              <Link
                key={w.id}
                href={`/rapportini/${w.id}`}
                className="flex items-center justify-between gap-3 rounded-control border border-line bg-surface p-4 hover:border-action hover:shadow-sm transition"
              >
                <div className="min-w-0">
                  <p className="font-medium text-ink truncate">{w.name}</p>
                  <p className="text-label text-ink-muted mt-0.5">{w.hours.toLocaleString('it-CH')} h · maturato {formatCurrency(w.earned)}</p>
                  <p className="text-label mt-0.5">
                    Saldo: <span className={w.balance > 0.01 ? 'text-attention font-medium' : 'text-ink-muted'}>{formatCurrency(w.balance)}</span>
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-ink-subtle shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <form method="get" className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3 items-end bg-surface border border-line rounded-control p-4">
        <label className="flex flex-col gap-1 text-body col-span-2 sm:col-span-1 min-w-0">
          <span className="text-ink-muted">Operaio</span>
          <select name="userId" defaultValue={sp.userId ?? ''} className="w-full min-w-0 rounded-control border border-line-strong px-3 min-h-11 text-body">
            <option value="">Tutti</option>
            {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-body col-span-2 sm:col-span-1 min-w-0">
          <span className="text-ink-muted">Opera</span>
          <select name="projectId" defaultValue={sp.projectId ?? ''} className="w-full min-w-0 rounded-control border border-line-strong px-3 min-h-11 text-body">
            <option value="">Tutte</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        {/* Full width on a phone: a date field has a wide intrinsic size, and
            two of them side by side in a 390px viewport leaves ~170px each —
            not enough for the control iOS actually renders. */}
        <label className="col-span-2 flex min-w-0 flex-col gap-1 text-body sm:col-span-1">
          <span className="text-ink-muted">Dal</span>
          <input type="date" name="from" defaultValue={sp.from ?? ''} className="w-full min-w-0 rounded-control border border-line-strong px-3 min-h-11 text-body" />
        </label>
        <label className="col-span-2 flex min-w-0 flex-col gap-1 text-body sm:col-span-1">
          <span className="text-ink-muted">Al</span>
          <input type="date" name="to" defaultValue={sp.to ?? ''} className="w-full min-w-0 rounded-control border border-line-strong px-3 min-h-11 text-body" />
        </label>
        <button type="submit" className="tap-target col-span-2 sm:col-span-1 rounded-control bg-action text-ink-inverse px-4 text-body font-medium hover:bg-action-hover">
          Filtra
        </button>
        {hasFilters && (
          <Link href="/rapportini" className="tap-target col-span-2 inline-flex items-center justify-center sm:col-span-1 text-center text-body text-ink-muted hover:text-ink px-2">Azzera filtri</Link>
        )}
      </form>

      <RapportiniClient
        logs={views}
        totalHours={totalHours}
        submittedHours={submittedHours}
        projects={projects}
        workers={workers}
        currentUserId={session.id}
        canManage={canMutate(session.role)}
      />
    </div>
  )
}
