'use client'

import { useMemo, useState } from 'react'
import { Plus, X, ChevronDown, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WorkLogForm, type ProjectOption, type WorkerOption } from './work-log-form'
import { WorkLogList, type WorkLogView } from './work-log-list'

interface Props {
  logs: WorkLogView[]
  totalHours: number
  submittedHours: number
  projects: ProjectOption[]
  workers: WorkerOption[]
  currentUserId: string
  canManage: boolean
}

export function RapportiniClient({ logs, totalHours, submittedHours, projects, workers, currentUserId, canManage }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  // Group logs by operaio (keeps the incoming order within each group).
  const groups = useMemo(() => {
    const map = new Map<string, { userId: string; userName: string; logs: WorkLogView[] }>()
    for (const log of logs) {
      const g = map.get(log.userId)
      if (g) g.logs.push(log)
      else map.set(log.userId, { userId: log.userId, userName: log.userName, logs: [log] })
    }
    return Array.from(map.values()).sort((a, b) => a.userName.localeCompare(b.userName))
  }, [logs])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-label text-ink-muted uppercase tracking-wider">Ore totali (filtro)</p>
            <p className="text-display font-semibold text-ink mt-1">{totalHours.toLocaleString('it-CH')} h</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-label text-ink-muted uppercase tracking-wider">Ore inviate</p>
            <p className="text-display font-semibold text-positive mt-1">{submittedHours.toLocaleString('it-CH')} h</p>
          </CardContent>
        </Card>
      </div>

      <div className={canManage ? '' : 'hidden'}>
        {showForm ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Registra per operaio</CardTitle>
              <button onClick={() => setShowForm(false)} className="text-ink-muted hover:text-ink-muted">
                <X className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent>
              <WorkLogForm
                mode="create"
                projects={projects}
                workers={workers}
                currentUserId={currentUserId}
                onDone={() => setShowForm(false)}
              />
            </CardContent>
          </Card>
        ) : (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> Registra rapportino
          </Button>
        )}
      </div>

      {groups.length === 0 ? (
        <p className="text-body text-ink-muted py-8 text-center">Nessun rapportino registrato.</p>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => {
            const isCollapsed = collapsed.has(g.userId)
            const hours = g.logs.reduce((s, l) => s + (l.hours ?? 0), 0)
            const pending = g.logs.filter((l) => l.status === 'SUBMITTED' || l.revisionRequestedAt).length
            return (
              <div key={g.userId} className="rounded-surface border border-line bg-surface-raised/50 p-3">
                <button
                  type="button"
                  onClick={() => setCollapsed((prev) => {
                    const next = new Set(prev)
                    if (next.has(g.userId)) next.delete(g.userId); else next.add(g.userId)
                    return next
                  })}
                  className="w-full flex items-center justify-between gap-2 px-1 py-1 text-left"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    {isCollapsed ? <ChevronRight className="w-4 h-4 text-ink-muted shrink-0" /> : <ChevronDown className="w-4 h-4 text-ink-muted shrink-0" />}
                    <span className="font-semibold text-ink truncate">{g.userName}</span>
                    {pending > 0 && (
                      <span className="shrink-0 rounded-full bg-attention-surface text-attention text-label font-medium px-2 py-0.5">{pending} da rivedere</span>
                    )}
                  </span>
                  <span className="text-label text-ink-muted tabular-nums shrink-0">{hours.toLocaleString('it-CH')} h</span>
                </button>
                {!isCollapsed && (
                  <div className="mt-2">
                    <WorkLogList
                      logs={g.logs}
                      projects={projects}
                      workers={workers}
                      canManage={canManage}
                      currentUserId={currentUserId}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
