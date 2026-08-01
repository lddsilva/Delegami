'use client'

import { useState } from 'react'
import { ClipboardList, FolderOpenDot, UserRound, Phone, MapPin, Plus, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { WorkLogForm, type ProjectOption } from './work-log-form'
import { WorkLogList, type WorkLogView } from './work-log-list'
import { WorkerPayments, type PaymentView } from '@/components/workers/worker-payments'
import { WorkerDocuments, type WorkerDocView } from '@/components/workers/worker-documents'

interface WorkerInfo {
  name: string
  phone?: string | null
  address?: string | null
  identityNumber?: string | null
}

interface Props {
  logs: WorkLogView[]
  projects: ProjectOption[]
  currentUserId: string
  payments: PaymentView[]
  documents: WorkerDocView[]
  worker: WorkerInfo
}

type Tab = 'rapportino' | 'documenti' | 'profilo'

function isThisMonth(d: string | Date) {
  const date = new Date(d)
  const now = new Date()
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
}

const tabs: { key: Tab; label: string; icon: typeof ClipboardList }[] = [
  { key: 'rapportino', label: 'Rapportino', icon: ClipboardList },
  { key: 'documenti', label: 'Documenti', icon: FolderOpenDot },
  { key: 'profilo', label: 'Profilo', icon: UserRound },
]

export function RapportinoClient({ logs, projects, currentUserId, payments, documents, worker }: Props) {
  const [tab, setTab] = useState<Tab>('rapportino')
  const [showForm, setShowForm] = useState(false)

  const hoursTotal = logs.reduce((s, l) => s + (l.hours ?? 0), 0)
  const hoursMonth = logs.filter((l) => isThisMonth(l.workDate)).reduce((s, l) => s + (l.hours ?? 0), 0)
  const paidTotal = payments.reduce((s, p) => s + p.amount, 0)

  return (
    <div className="pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-0">
      {/* Desktop / tablet tabs */}
      <div className="hidden sm:flex gap-1 mb-6 border-b border-line">
        {tabs.map((t) => {
          const Icon = t.icon
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-body font-medium border-b-2 -mb-px transition-colors ${
                active ? 'border-action text-action' : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'rapportino' && (
        <div className="space-y-6">
          {showForm ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Nuovo rapportino</CardTitle>
                <button onClick={() => setShowForm(false)} className="text-ink-muted hover:text-ink-muted" aria-label="Chiudi">
                  <X className="w-4 h-4" />
                </button>
              </CardHeader>
              <CardContent>
                <WorkLogForm
                  mode="create"
                  projects={projects}
                  currentUserId={currentUserId}
                  canSetProject={false}
                  onDone={() => setShowForm(false)}
                />
              </CardContent>
            </Card>
          ) : (
            <Button onClick={() => setShowForm(true)} size="lg" className="w-full sm:w-auto">
              <Plus className="w-4 h-4" /> Inserisci rapportino
            </Button>
          )}

          <div>
            <h2 className="text-body font-semibold text-ink-muted uppercase tracking-wider mb-2">I miei rapportini</h2>
            <WorkLogList
              logs={logs}
              projects={projects}
              canManage={false}
              currentUserId={currentUserId}
              showMoney={false}
            />
          </div>
        </div>
      )}

      {tab === 'documenti' && (
        <Card>
          <CardHeader><CardTitle>I miei documenti</CardTitle></CardHeader>
          <CardContent>
            <WorkerDocuments
              userId={currentUserId}
              documents={documents}
              canManage={false}
              canDelete={false}
              allowSelfUpload
              maxDocuments={10}
            />
          </CardContent>
        </Card>
      )}

      {tab === 'profilo' && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>I miei dati</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-body text-ink">
              <p className="font-medium text-ink">{worker.name}</p>
              {worker.identityNumber && <p className="text-ink-muted">N. identità / matricola: {worker.identityNumber}</p>}
              {worker.phone && <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-ink-muted" /> {worker.phone}</p>}
              {worker.address && <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-ink-muted" /> {worker.address}</p>}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card><CardContent className="py-4">
              <p className="text-label text-ink-muted uppercase tracking-wider">Ore questo mese</p>
              <p className="text-display font-semibold text-ink mt-1">{hoursMonth.toLocaleString('it-CH')} h</p>
            </CardContent></Card>
            <Card><CardContent className="py-4">
              <p className="text-label text-ink-muted uppercase tracking-wider">Ore totali</p>
              <p className="text-display font-semibold text-ink mt-1">{hoursTotal.toLocaleString('it-CH')} h</p>
            </CardContent></Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pagamenti ricevuti</CardTitle>
              <span className="text-body font-semibold text-positive">{formatCurrency(paidTotal)}</span>
            </CardHeader>
            <CardContent>
              {payments.length === 0
                ? <p className="text-body text-ink-muted py-4 text-center">Nessun pagamento registrato.</p>
                : <WorkerPayments userId={currentUserId} payments={payments} canManage={false} canDelete={false} />}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mobile bottom tab bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] sm:hidden">
        {tabs.map((t) => {
          const Icon = t.icon
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${active ? 'text-action' : 'text-ink-muted'}`}
            >
              <Icon className="w-5 h-5" /> {t.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
