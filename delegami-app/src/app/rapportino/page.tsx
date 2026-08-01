import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getWorkLogsForUser, getProjectsForWorkLog } from '@/modules/work-logs/queries'
import { getWorkerProfile, getWorkerPayments, getWorkerDocuments } from '@/modules/workers/queries'
import { RapportinoClient } from '@/components/work-logs/rapportino-client'
import type { WorkLogView } from '@/components/work-logs/work-log-list'

export default async function RapportinoPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [logs, projects, profile, payments, documents] = await Promise.all([
    getWorkLogsForUser(session.id),
    getProjectsForWorkLog(),
    getWorkerProfile(session.id),
    getWorkerPayments(session.id),
    getWorkerDocuments(session.id),
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

  return (
    <div className="page-form">
      <div className="mb-6">
        <h1 className="text-display font-semibold text-ink">Rapportino</h1>
        <p className="text-body text-ink-muted mt-1">Registra le ore lavorate e le foto del lavoro svolto</p>
      </div>
      <RapportinoClient
        logs={views}
        projects={projects}
        currentUserId={session.id}
        payments={payments}
        documents={documents}
        worker={{ name: profile?.name ?? session.name, phone: profile?.phone, address: profile?.address, identityNumber: profile?.identityNumber }}
      />
    </div>
  )
}
