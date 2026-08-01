import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, Globe, Smartphone } from 'lucide-react'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatDate, formatTime } from '@/lib/utils'
import type { Prisma } from '@/generated/prisma/client'

const ACTION_LABEL: Record<string, string> = {
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  CREATE: 'Creato',
  UPDATE: 'Aggiornato',
  DELETE: 'Eliminato',
  STATUS_CHANGE: 'Stato cambiato',
  CLONE: 'Clonato',
  UPLOAD: 'Caricato',
  PROCESS: 'Processato',
  AI_ANALYZE: 'Analizzato IA',
  IMPORT: 'Importato',
  UNARCHIVE: 'Ripristinato',
  ADD_PAYMENT: 'Pagamento aggiunto',
  UPDATE_SIGNATORIES: 'Firmatari aggiornati',
  ACTIVATE: 'Attivato',
  DEACTIVATE: 'Disattivato',
  SAVE_TO_CATALOG: 'Salvato nel prezzario',
}

const ACTION_COLOR: Record<string, string> = {
  LOGIN: 'bg-positive-surface text-positive',
  LOGOUT: 'bg-surface-raised text-ink-muted',
  CREATE: 'bg-action-surface text-action',
  UPDATE: 'bg-attention-surface text-attention',
  DELETE: 'bg-negative-surface text-negative',
  STATUS_CHANGE: 'bg-action text-action',
  CLONE: 'bg-cyan-100 text-cyan-700',
  UPLOAD: 'bg-teal-100 text-teal-700',
  PROCESS: 'bg-action text-action',
  AI_ANALYZE: 'bg-action text-action',
  IMPORT: 'bg-cyan-100 text-cyan-700',
  UNARCHIVE: 'bg-attention-surface text-attention',
  ADD_PAYMENT: 'bg-positive-surface text-positive',
  UPDATE_SIGNATORIES: 'bg-attention-surface text-attention',
  ACTIVATE: 'bg-positive-surface text-positive',
  DEACTIVATE: 'bg-surface-raised text-ink-muted',
  SAVE_TO_CATALOG: 'bg-action-surface text-action',
}

interface Props {
  searchParams: Promise<{
    all?: string
    action?: string
    entityType?: string
    userId?: string
    success?: string
    from?: string
    to?: string
  }>
}

function isMobileUA(ua: string | null): boolean {
  if (!ua) return false
  return /iOS|Android/i.test(ua)
}

export default async function LogsPage({ searchParams }: Props) {
  const session = await getSession()
  if (!session || !isAdmin(session.role)) redirect('/')

  const params = await searchParams
  const showAll = params.all === '1'

  const where: Prisma.ActivityLogWhereInput = {}
  if (params.action) where.action = params.action
  if (params.entityType) where.entityType = params.entityType
  if (params.userId) where.userId = params.userId
  if (params.success === 'true') where.success = true
  if (params.success === 'false') where.success = false
  if (params.from || params.to) {
    where.createdAt = {}
    if (params.from) where.createdAt.gte = new Date(params.from)
    if (params.to) {
      const end = new Date(params.to)
      end.setHours(23, 59, 59, 999)
      where.createdAt.lte = end
    }
  }

  const [logs, totalCount, distinctActions, distinctEntityTypes, distinctUsers] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: showAll ? 500 : 20,
    }),
    prisma.activityLog.count({ where }),
    prisma.activityLog.groupBy({ by: ['action'], orderBy: { action: 'asc' } }),
    prisma.activityLog.groupBy({ by: ['entityType'], orderBy: { entityType: 'asc' } }),
    prisma.activityLog.groupBy({ by: ['userId', 'userName'], orderBy: { userName: 'asc' } }),
  ])

  const hasFilters = Boolean(
    params.action || params.entityType || params.userId || params.success || params.from || params.to,
  )

  function buildHref(overrides: Record<string, string | undefined>) {
    const merged: Record<string, string | undefined> = {
      all: params.all,
      action: params.action,
      entityType: params.entityType,
      userId: params.userId,
      success: params.success,
      from: params.from,
      to: params.to,
      ...overrides,
    }
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(merged)) {
      if (value) search.set(key, value)
    }
    const qs = search.toString()
    return qs ? `/logs?${qs}` : '/logs'
  }

  return (
    <div className="page-content space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-display font-bold text-ink">Log attività</h1>
          <p className="text-body text-ink-muted mt-1">
            {showAll
              ? `${logs.length}${totalCount > logs.length ? ` di ${totalCount}` : ''} eventi`
              : `Ultimi ${logs.length}${totalCount > logs.length ? ` di ${totalCount}` : ''} eventi`}
            {hasFilters && ' · filtri attivi'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <Link
              href={showAll ? '/logs?all=1' : '/logs'}
              className="px-3 py-2 rounded-control border border-line text-body text-ink-muted hover:bg-surface-raised transition-colors"
            >
              Azzera filtri
            </Link>
          )}
          {!showAll && totalCount > 20 && (
            <Link
              href={buildHref({ all: '1' })}
              className="px-4 py-2 rounded-control border border-line text-body font-medium text-ink hover:bg-surface-raised transition-colors"
            >
              Vedi tutti
            </Link>
          )}
          {showAll && (
            <Link
              href={buildHref({ all: undefined })}
              className="px-4 py-2 rounded-control border border-line text-body font-medium text-ink hover:bg-surface-raised transition-colors"
            >
              Mostra ultimi 20
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <form method="get" className="bg-surface rounded-surface border border-line p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {showAll && <input type="hidden" name="all" value="1" />}
        <div>
          <label className="block text-label font-medium text-ink-muted mb-1">Azione</label>
          <select name="action" defaultValue={params.action ?? ''} className="w-full border border-line rounded-control px-2 min-h-11 text-body">
            <option value="">Tutte</option>
            {distinctActions.map((a) => (
              <option key={a.action} value={a.action}>{ACTION_LABEL[a.action] ?? a.action}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-label font-medium text-ink-muted mb-1">Entità</label>
          <select name="entityType" defaultValue={params.entityType ?? ''} className="w-full border border-line rounded-control px-2 min-h-11 text-body">
            <option value="">Tutte</option>
            {distinctEntityTypes.map((e) => (
              <option key={e.entityType} value={e.entityType}>{e.entityType}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-label font-medium text-ink-muted mb-1">Utente</label>
          <select name="userId" defaultValue={params.userId ?? ''} className="w-full border border-line rounded-control px-2 min-h-11 text-body">
            <option value="">Tutti</option>
            {distinctUsers.map((u) => (
              <option key={u.userId} value={u.userId}>{u.userName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-label font-medium text-ink-muted mb-1">Esito</label>
          <select name="success" defaultValue={params.success ?? ''} className="w-full border border-line rounded-control px-2 min-h-11 text-body">
            <option value="">Tutti</option>
            <option value="true">Riusciti</option>
            <option value="false">Falliti</option>
          </select>
        </div>
        <div>
          <label className="block text-label font-medium text-ink-muted mb-1">Dal</label>
          <input type="date" name="from" defaultValue={params.from ?? ''} className="w-full border border-line rounded-control px-2 min-h-11 text-body" />
        </div>
        <div>
          <label className="block text-label font-medium text-ink-muted mb-1">Al</label>
          <input type="date" name="to" defaultValue={params.to ?? ''} className="w-full border border-line rounded-control px-2 min-h-11 text-body" />
        </div>
        <div className="sm:col-span-2 lg:col-span-6 flex justify-end">
          <button type="submit" className="px-4 min-h-11 rounded-control bg-action text-ink-inverse text-body font-medium hover:bg-action-hover transition-colors">
            Applica filtri
          </button>
        </div>
      </form>

      <div className="bg-surface rounded-surface border border-line overflow-hidden">
        {logs.length === 0 ? (
          <div className="text-center py-16 text-ink-subtle">Nessuna attività registrata</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => {
              const actionLabel = ACTION_LABEL[log.action] ?? log.action
              const actionColor = ACTION_COLOR[log.action] ?? 'bg-surface-raised text-ink-muted'
              const ts = new Date(log.createdAt)
              const timeStr = formatTime(ts)
              const dateStr = formatDate(ts)
              const mobile = isMobileUA(log.userAgent)

              return (
                <div key={log.id} className="flex items-start gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-3.5 hover:bg-surface-raised transition-colors">
                  <div className="shrink-0 text-right min-w-[58px] sm:min-w-[120px]">
                    <p className="text-label font-medium text-ink">{dateStr}</p>
                    <p className="text-[11px] sm:text-label text-ink-subtle font-mono">{timeStr}</p>
                  </div>

                  <div className="shrink-0 flex items-center gap-1">
                    <span className={`inline-block px-2 py-0.5 rounded text-label font-semibold ${actionColor}`}>
                      {actionLabel}
                    </span>
                    {log.success === false && (
                      <span title={log.errorMessage ?? 'Errore'} className="inline-flex items-center text-negative">
                        <AlertCircle className="h-3.5 w-3.5" />
                      </span>
                    )}
                    {log.success !== false && log.action === 'LOGIN' && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-positive" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-body text-ink truncate">
                      <span className="font-medium text-ink-muted">{log.entityType}</span>
                      {log.entityLabel && (
                        <span className="text-ink"> — {log.entityLabel}</span>
                      )}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-label text-ink-subtle font-mono">
                      <span className="text-ink-muted sm:hidden">{log.userName}</span>
                      {log.path && <span title="Percorso" className="truncate max-w-[60vw] sm:max-w-none">{log.path}</span>}
                      {log.durationMs != null && <span title="Durata">{log.durationMs}ms</span>}
                      {log.errorMessage && <span className="text-negative truncate max-w-[60vw] sm:max-w-none" title={log.errorMessage}>{log.errorMessage}</span>}
                      {log.details && <span className="hidden sm:inline truncate" title={log.details}>{log.details}</span>}
                    </div>
                  </div>

                  <div className="hidden sm:block shrink-0 text-right">
                    <p className="text-label font-medium text-ink-muted flex items-center justify-end gap-1">
                      {mobile ? <Smartphone className="h-3 w-3 text-ink-subtle" /> : <Globe className="h-3 w-3 text-ink-subtle" />}
                      {log.userName}
                    </p>
                    {log.userAgent && <p className="text-[10px] text-ink-subtle mt-0.5">{log.userAgent}</p>}
                    {log.ipAddress && <p className="text-[10px] text-ink-subtle font-mono">{log.ipAddress}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
