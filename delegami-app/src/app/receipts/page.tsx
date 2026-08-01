import Link from 'next/link'
import { Camera, CheckCircle2, Clock, FileArchive } from 'lucide-react'
import { getSession, canMutate, canDelete } from '@/lib/auth'
import { getReceiptInbox, getReceiptSuggestedProjects } from '@/modules/receipt-inbox/queries'
import { getProjects } from '@/modules/projects/queries'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ReceiptUploadButton, ArchivedToggle, UnarchiveReceiptButton } from '@/components/receipt-inbox/receipt-upload-modal'
import { ReceiptAiWorkpackButton } from '@/components/receipt-inbox/receipt-ai-workpack-button'
import { ReceiptBulkAssign } from '@/components/receipt-inbox/receipt-bulk-assign'

function formatCapturedAt(date: Date): string {
  return new Intl.DateTimeFormat('it-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export default async function ReceiptsPage() {
  const [receipts, session, projects, suggestedProjectsMap] = await Promise.all([
    getReceiptInbox(),
    getSession(),
    getProjects(),
    getReceiptSuggestedProjects(),
  ])

  const canEdit = session ? canMutate(session.role) : false
  const canDel = session ? canDelete(session.role) : false

  const pending = receipts.filter((r) => !r.processedAt)
  const archived = receipts.filter((r) => r.processedAt)

  const projectOptions = projects.map((p) => ({
    id: p.id,
    name: p.name,
    isPlaceholder: p.isPlaceholder ?? false,
  }))
  const suggestedProjectsObj = Object.fromEntries(suggestedProjectsMap.entries())

  return (
    <div className="page-content">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-title sm:text-display font-semibold text-ink">Scontrini</h1>
          <p className="text-body text-ink-muted mt-0.5">
            {pending.length} da processare - {archived.length} archiviati
          </p>
        </div>
        {canEdit && (
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/receipts/import"
              className="inline-flex items-center gap-2 rounded-control border border-line-strong bg-surface px-4 min-h-11 text-body font-medium text-ink transition-colors hover:bg-surface-raised"
            >
              <FileArchive className="h-4 w-4" />
              Importa IA
            </Link>
            <ReceiptAiWorkpackButton
              receipts={pending.map((receipt) => ({
                id: receipt.id,
                photoUrl: receipt.photoUrl,
                capturedAt: receipt.capturedAt.toISOString(),
                note: receipt.note,
              }))}
            />
            <ReceiptUploadButton projects={projectOptions} />
          </div>
        )}
      </div>

      {/* ── Pending ─────────────────────────────────────────────────────────── */}
      {pending.length === 0 ? (
        <Card className="mb-6">
          <CardContent className="py-12 text-center">
            <Camera className="w-10 h-10 text-ink-subtle mx-auto mb-3" />
            <p className="text-body text-ink-muted">Nessuno scontrino da processare</p>
            {canEdit && (
              <p className="text-label text-ink-subtle mt-1">
                Usa il pulsante &ldquo;Carica scontrini&rdquo; per aggiungere foto dal cantiere
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="mb-8">
          <ReceiptBulkAssign
            receipts={pending.map((r) => ({
              id: r.id,
              photoUrl: r.photoUrl,
              capturedAt: r.capturedAt.toISOString(),
              note: r.note,
              suggestedProjectId: r.suggestedProjectId,
            }))}
            projects={projectOptions}
            suggestedProjects={suggestedProjectsObj}
            canEdit={canEdit}
            canDelete={canDel}
          />
        </div>
      )}

      {/* ── Archived ────────────────────────────────────────────────────────── */}
      {archived.length > 0 && (
        <ArchivedToggle count={archived.length}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {archived.map((receipt) => (
              <div key={receipt.id} className="bg-surface rounded-surface border border-line overflow-hidden flex flex-col opacity-75 hover:opacity-100 transition-opacity">
                <div className="relative aspect-[4/3] bg-surface-raised">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={receipt.photoUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge variant="gray" className="text-label">Archiviato</Badge>
                  </div>
                </div>
                <div className="p-3 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1 text-label text-ink-muted">
                    <Clock className="w-3.5 h-3.5" />
                    {formatCapturedAt(receipt.capturedAt)}
                  </div>
                  {receipt.note && (
                    <p className="text-label text-ink-muted line-clamp-1">{receipt.note}</p>
                  )}
                  {receipt.expense ? (
                    <div className="flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-positive shrink-0" />
                      <Link
                        href={`/expenses/${receipt.expense.id}`}
                        className="text-label text-positive hover:underline truncate"
                      >
                        {receipt.expense.description}
                      </Link>
                    </div>
                  ) : canEdit && (
                    <div className="mt-1">
                      <UnarchiveReceiptButton id={receipt.id} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ArchivedToggle>
      )}
    </div>
  )
}
