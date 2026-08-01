import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Phone, MapPin, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getSession, canMutate, canDelete } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import {
  getWorkerProfile,
  getWorkerDocuments,
  getWorkerPayments,
  getWorkerLedger,
  getAgencyReconciliation,
} from '@/modules/workers/queries'
import { getWorkLogsForUser, getProjectsForWorkLog, getLoggableUsers } from '@/modules/work-logs/queries'
import { getSupplierOptions } from '@/modules/suppliers/queries'
import { WorkerProfileForm } from '@/components/workers/worker-profile-form'
import { WorkerPayments } from '@/components/workers/worker-payments'
import { WorkerDocuments } from '@/components/workers/worker-documents'
import { WorkLogList, type WorkLogView } from '@/components/work-logs/work-log-list'

export default async function WorkerDossierPage({ params }: { params: Promise<{ userId: string }> }) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role === 'WORKER') redirect('/rapportino')

  const { userId } = await params
  const worker = await getWorkerProfile(userId)
  if (!worker) notFound()

  const [documents, payments, ledger, logs, projects, workers, suppliers, reconciliation] = await Promise.all([
    getWorkerDocuments(userId),
    getWorkerPayments(userId),
    getWorkerLedger(userId),
    getWorkLogsForUser(userId),
    getProjectsForWorkLog(),
    getLoggableUsers(),
    getSupplierOptions(),
    getAgencyReconciliation(userId),
  ])
  const isAgency = worker.employmentType === 'AGENCY'

  const canManage = canMutate(session.role)
  const canDel = canDelete(session.role)

  const logViews: WorkLogView[] = logs.map((log) => ({
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

  const agencyName = suppliers.find((s) => s.id === worker.agencySupplierId)?.name

  return (
    <div className="page-content">
      <Link href="/rapportini" className="inline-flex items-center gap-1 text-body text-ink-muted hover:text-ink mb-4">
        <ArrowLeft className="w-4 h-4" /> Rapportini
      </Link>

      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-display font-semibold text-ink">{worker.name}</h1>
          {worker.role === 'WORKER' && <Badge variant="amber">Operaio</Badge>}
          {isAgency ? <Badge variant="blue">Agenzia{agencyName ? ` · ${agencyName}` : ''}</Badge> : <Badge variant="gray">Diretto</Badge>}
          {!worker.active && <Badge variant="gray">Disabilitato</Badge>}
        </div>
        <Link href={`/rapportini/${userId}/print`} target="_blank">
          <Button variant="secondary" size="sm"><Printer className="w-4 h-4" /> Stampa rapportino</Button>
        </Link>
      </div>

      {/* Compenso summary — rows on mobile (no clipping), 3 columns on sm+ */}
      <Card className="mb-6"><CardContent className="py-4 space-y-2 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-3">
        <div className="flex items-baseline justify-between gap-3 sm:block min-w-0">
          <p className="text-label text-ink-muted uppercase tracking-wider">Maturato</p>
          <p className="text-title sm:text-display font-semibold text-ink sm:mt-1 tabular-nums">{formatCurrency(ledger.earned)}</p>
        </div>
        <div className="flex items-baseline justify-between gap-3 sm:block min-w-0">
          <p className="text-label text-ink-muted uppercase tracking-wider">Pagato</p>
          <p className="text-title sm:text-display font-semibold text-positive sm:mt-1 tabular-nums">{formatCurrency(ledger.paid)}</p>
        </div>
        <div className="flex items-baseline justify-between gap-3 sm:block min-w-0">
          <p className="text-label text-ink-muted uppercase tracking-wider">Saldo</p>
          <p className={`text-title sm:text-display font-semibold sm:mt-1 tabular-nums ${ledger.balance > 0.01 ? 'text-attention' : 'text-ink'}`}>{formatCurrency(ledger.balance)}</p>
        </div>
      </CardContent></Card>

      {isAgency && reconciliation && (
        <Card className="mb-6 border-attention-border">
          <CardHeader><CardTitle>Riconciliazione agenzia{reconciliation.agency ? ` · ${reconciliation.agency.name}` : ''}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <p className="text-label text-ink-muted uppercase tracking-wider">Costo stimato</p>
                <p className="text-title font-semibold text-ink mt-1">{formatCurrency(reconciliation.expectedCost)}</p>
                <p className="text-[11px] text-ink-muted">ore approvate × {reconciliation.costRate != null ? `${formatCurrency(reconciliation.costRate)}/h` : 'tariffa agenzia'}</p>
              </div>
              <div>
                <p className="text-label text-ink-muted uppercase tracking-wider">Fatturato agenzia</p>
                <p className="text-title font-semibold text-action mt-1">{formatCurrency(reconciliation.invoicedTotal)}</p>
                <p className="text-[11px] text-ink-muted">{reconciliation.expenseCount} spes{reconciliation.expenseCount === 1 ? 'a' : 'e'} registrate</p>
              </div>
              <div>
                <p className="text-label text-ink-muted uppercase tracking-wider">Scostamento</p>
                <p className={`text-title font-semibold mt-1 ${Math.abs(reconciliation.variance) < 0.01 ? 'text-ink' : reconciliation.variance > 0 ? 'text-negative' : 'text-positive'}`}>
                  {formatCurrency(reconciliation.variance)}
                </p>
                <p className="text-[11px] text-ink-muted">fatturato − stimato</p>
              </div>
            </div>
            <p className="text-label text-ink-muted">
              Registra le fatture dell’agenzia come <Link href="/expenses/new" className="text-action hover:underline">spesa</Link> (fornitore = agenzia, tipo Manodopera) per aggiornare il fatturato reale.
              {reconciliation.expenseCount === 0 && ' Nessuna fattura ancora registrata — il costo mostrato è solo la stima.'}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {/* Anagrafica */}
        <Card>
          <CardHeader><CardTitle>Anagrafica</CardTitle></CardHeader>
          <CardContent>
            {canManage ? (
              <WorkerProfileForm
                userId={userId}
                suppliers={suppliers}
                defaults={{
                  phone: worker.phone,
                  address: worker.address,
                  hourlyRate: worker.hourlyRate,
                  employmentType: worker.employmentType,
                  agencySupplierId: worker.agencySupplierId,
                  costRate: worker.costRate,
                  contractStart: worker.contractStart ? worker.contractStart.toISOString().slice(0, 10) : null,
                  contractType: worker.contractType,
                  identityNumber: worker.identityNumber,
                  notes: worker.notes,
                }}
              />
            ) : (
              <div className="space-y-2 text-body text-ink">
                {worker.phone && <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-ink-muted" /> {worker.phone}</p>}
                {worker.address && <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-ink-muted" /> {worker.address}</p>}
                {worker.hourlyRate != null && <p>Tariffa: {formatCurrency(worker.hourlyRate)}/h</p>}
                {worker.notes && <p className="text-ink-muted whitespace-pre-wrap">{worker.notes}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documenti */}
        <Card>
          <CardHeader><CardTitle>Documenti</CardTitle></CardHeader>
          <CardContent>
            <WorkerDocuments userId={userId} documents={documents} canManage={canManage} canDelete={canDel} />
          </CardContent>
        </Card>

        {/* Compenso / pagamenti */}
        <Card>
          <CardHeader><CardTitle>Pagamenti</CardTitle></CardHeader>
          <CardContent>
            <WorkerPayments userId={userId} payments={payments} canManage={canManage} canDelete={canDel} />
          </CardContent>
        </Card>

        {/* Rapportini */}
        <div>
          <h2 className="text-body font-semibold text-ink-muted uppercase tracking-wider mb-2">Rapportini</h2>
          <WorkLogList
            logs={logViews}
            projects={projects}
            workers={workers}
            canManage={canManage}
            currentUserId={session.id}
            paidByLogId={ledger.paidByLogId}
          />
        </div>
      </div>
    </div>
  )
}
