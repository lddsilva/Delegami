import Link from 'next/link'
import { FileText, Receipt, Camera, FolderOpen, MessageSquare, ScanLine, Clock, CheckCircle2 } from 'lucide-react'
import { prisma } from '@/lib/db'
import { getSession, canDelete } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { MediaGallery } from '@/components/media/media-gallery'
import { CompanyDocumentUpload } from '@/components/media/company-document-upload'
import { DeleteMediaDocumentButton } from '@/components/media/delete-media-document-button'
import { MediaDocList, type MediaDocItem } from '@/components/media/media-document-list'
import { getReceiptInbox } from '@/modules/receipt-inbox/queries'

async function getAllDocuments() {
  return prisma.document.findMany({
    orderBy: { uploadedAt: 'desc' },
    include: {
      project: { select: { id: true, name: true } },
      quote: { select: { id: true, quoteNumber: true, project: { select: { id: true, name: true } } } },
      invoice: { select: { id: true, invoiceNumber: true, project: { select: { id: true, name: true } } } },
      expense: { select: { id: true, description: true, project: { select: { id: true, name: true } } } },
    },
  })
}

type Doc = Awaited<ReturnType<typeof getAllDocuments>>[number]

const archiveTypeLabels: Record<string, string> = {
  LEGAL: 'Normativa / legge',
  PERMIT: 'Permesso / licenza',
  CONTRACT: 'Contratto',
  TECHNICAL: 'Documento tecnico',
  ADMINISTRATIVE: 'Enti / assicurazioni',
  INSURANCE: 'Enti / assicurazioni',
  ATTACHMENT: 'Archivio aziendale',
}

function groupByProject<T extends Doc>(docs: T[]) {
  const map: Record<string, { projectId: string; projectName: string; docs: T[] }> = {}
  docs.forEach((doc) => {
    const projectId = doc.projectId ?? doc.quote?.project?.id ?? doc.invoice?.project?.id ?? doc.expense?.project?.id ?? ''
    const projectName = doc.project?.name ?? doc.quote?.project?.name ?? doc.invoice?.project?.name ?? doc.expense?.project?.name ?? 'Archivio aziendale'
    const key = projectId || '__none__'
    if (!map[key]) {
      map[key] = {
        projectId,
        projectName,
        docs: [],
      }
    }
    map[key].docs.push(doc)
  })
  // Sort: named projects first, then "Senza opera"
  return Object.values(map).sort((a, b) => {
    if (!a.projectId && b.projectId) return 1
    if (a.projectId && !b.projectId) return -1
    return a.projectName.localeCompare(b.projectName)
  })
}

export default async function MediaPage() {
  const [docs, session, receiptInbox] = await Promise.all([getAllDocuments(), getSession(), getReceiptInbox()])
  const canDeleteDocs = session ? canDelete(session.role) : false

  const photos = docs.filter((d) => d.documentType === 'PHOTO')
  const receipts = docs.filter((d) => d.documentType === 'RECEIPT')
  // Company-level docs: LEGAL/PERMIT/CONTRACT/TECHNICAL always, plus ATTACHMENT with no entity link
  // (safety net: if uploaded with wrong type from company upload widget, still shown here)
  const isCompanyLevel = (d: Doc) => !d.projectId && !d.quoteId && !d.invoiceId && !d.expenseId
  const archiveDocs = docs.filter((d) =>
    ['LEGAL', 'PERMIT', 'CONTRACT', 'TECHNICAL', 'ADMINISTRATIVE', 'INSURANCE'].includes(d.documentType) ||
    (d.documentType === 'ATTACHMENT' && isCompanyLevel(d))
  )
  // Attachments linked to a project/quote/invoice/expense (communications)
  const attachments = docs.filter((d) => d.documentType === 'ATTACHMENT' && !isCompanyLevel(d))

  const photoGroups = groupByProject(photos)
  const attachmentGroups = groupByProject(attachments)

  return (
    <div className="page-wide">
      <div className="mb-6">
        <h1 className="text-title sm:text-display font-semibold text-ink">Media & Documenti</h1>
        <p className="text-body text-ink-muted mt-0.5">
          {docs.length} file · {photos.length} foto · {receiptInbox.length} scontrini · {receipts.length} ricevute spese · {attachments.length} comunicazioni/allegati
        </p>
      </div>

      <section className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-ink-muted" />
            <h2 className="text-body font-semibold text-ink">Archivio normativo & aziendale</h2>
            <Badge variant="gray">{archiveDocs.length}</Badge>
          </div>
          <CompanyDocumentUpload />
        </div>
        {archiveDocs.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-ink-muted text-body">
            Nessun documento normativo. Carica leggi, permessi, contratti, documenti amministrativi o schede tecniche aziendali.
          </CardContent></Card>
        ) : (
          <Card>
            <MediaDocList
              canDelete={canDeleteDocs}
              docs={archiveDocs.map<MediaDocItem>((doc) => ({
                id: doc.id,
                name: doc.name,
                filePath: doc.filePath,
                fileType: doc.fileType,
                uploadedAt: doc.uploadedAt,
                meta: (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="gray">{archiveTypeLabels[doc.documentType] ?? doc.documentType}</Badge>
                    <span className="text-label text-ink-muted">{formatDate(doc.uploadedAt)}</span>
                  </div>
                ),
                trailing: canDeleteDocs ? <DeleteMediaDocumentButton documentId={doc.id} documentName={doc.name} /> : null,
              }))}
            />
          </Card>
        )}
      </section>

      {/* ── Scontrini ─────────────────────────────────────────────────────── */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <ScanLine className="w-5 h-5 text-attention" />
          <h2 className="text-body font-semibold text-ink">Scontrini</h2>
          <Badge variant="amber">{receiptInbox.filter((r) => !r.processedAt).length} da processare</Badge>
          <Badge variant="gray">{receiptInbox.filter((r) => r.processedAt).length} archiviati</Badge>
          <Link href="/receipts" className="tap-target ml-auto inline-flex items-center justify-center rounded-control px-2 text-label text-action hover:underline">Gestisci →</Link>
        </div>
        {receiptInbox.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-ink-muted text-body">
            Nessuno scontrino. Vai su Scontrini per caricare foto dal cantiere.
          </CardContent></Card>
        ) : (
          <div className="space-y-4">
            {/* Da processare */}
            {receiptInbox.filter((r) => !r.processedAt).length > 0 && (
              <div>
                <p className="text-label font-medium text-attention uppercase tracking-wide mb-2">Da processare</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {receiptInbox.filter((r) => !r.processedAt).map((r) => (
                    <Link key={r.id} href={`/receipts/${r.id}/process`} className="group block">
                      <div className="relative aspect-square bg-surface-raised rounded-control overflow-hidden border border-attention-border hover:border-action transition-colors">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.photoUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </div>
                      <div className="mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-attention shrink-0" />
                        <p className="text-label text-ink-muted truncate">
                          {new Intl.DateTimeFormat('it-CH', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(r.capturedAt))}
                        </p>
                      </div>
                      {r.note && <p className="text-label text-ink-muted truncate mt-0.5">{r.note}</p>}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {/* Archiviati */}
            {receiptInbox.filter((r) => r.processedAt).length > 0 && (
              <div>
                <p className="text-label font-medium text-ink-muted uppercase tracking-wide mb-2">Archiviati</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {receiptInbox.filter((r) => r.processedAt).map((r) => (
                    <div key={r.id} className="opacity-60 hover:opacity-90 transition-opacity">
                      <div className="relative aspect-square bg-surface-raised rounded-control overflow-hidden border border-line">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.photoUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                        <div className="absolute bottom-1 right-1">
                          <CheckCircle2 className="w-4 h-4 text-positive drop-shadow" />
                        </div>
                      </div>
                      {r.expense && (
                        <Link href={`/expenses/${r.expense.id}`} className="text-label text-positive hover:underline mt-1 block truncate">
                          {r.expense.description}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Foto cantiere ─────────────────────────────────────────────────── */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Camera className="w-5 h-5 text-action" />
          <h2 className="text-body font-semibold text-ink">Foto cantiere</h2>
          <Badge variant="gray">{photos.length}</Badge>
          <span className="text-label text-ink-muted ml-1">caricate dal dettaglio di un&apos;opera</span>
        </div>
        {photos.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-ink-muted text-body">
            Nessuna foto. Vai al dettaglio di un&apos;opera → sezione &ldquo;Foto cantiere&rdquo;.
          </CardContent></Card>
        ) : (
          <div className="space-y-6">
            {photoGroups.map((group) => (
              <div key={group.projectId || '__none__'}>
                <div className="flex items-center gap-2 mb-3">
                  <FolderOpen className="w-4 h-4 text-ink-muted" />
                  {group.projectId ? (
                    <Link href={`/projects/${group.projectId}`} className="text-body font-medium text-action hover:underline">
                      {group.projectName}
                    </Link>
                  ) : (
                    <span className="text-body font-medium text-ink-muted">{group.projectName}</span>
                  )}
                  <span className="text-label text-ink-muted">({group.docs.length})</span>
                </div>
                <MediaGallery docs={group.docs} canDelete={canDeleteDocs} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Comunicazioni & Allegati ──────────────────────────────────────── */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-action" />
          <h2 className="text-body font-semibold text-ink">Comunicazioni & Allegati</h2>
          <Badge variant="gray">{attachments.length}</Badge>
          <span className="text-label text-ink-muted ml-1">screenshot WhatsApp, email, contratti, comprovanti, preventivi</span>
        </div>
        {attachments.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-ink-muted text-body">
            Nessun allegato. Carica comunicazioni dal dettaglio di un&apos;opera, preventivo o fattura.
          </CardContent></Card>
        ) : (
          <div className="space-y-4">
            {attachmentGroups.map((group) => (
              <div key={group.projectId || '__none__'}>
                <div className="flex items-center gap-2 mb-2">
                  <FolderOpen className="w-4 h-4 text-ink-muted" />
                  {group.projectId ? (
                    <Link href={`/projects/${group.projectId}`} className="text-body font-medium text-action hover:underline">
                      {group.projectName}
                    </Link>
                  ) : (
                    <span className="text-body font-medium text-ink-muted">{group.projectName}</span>
                  )}
                  <span className="text-label text-ink-muted">({group.docs.length})</span>
                </div>
                <Card>
                  <MediaDocList
                    canDelete={canDeleteDocs}
                    docs={group.docs.map<MediaDocItem>((doc) => ({
                      id: doc.id,
                      name: doc.name,
                      filePath: doc.filePath,
                      fileType: doc.fileType,
                      uploadedAt: doc.uploadedAt,
                      meta: (
                        <div className="flex items-center gap-2 flex-wrap">
                          {doc.quote && (
                            <Link href={`/quotes/${doc.quote.id}`} className="text-label text-action hover:underline">
                              PRE {doc.quote.quoteNumber}
                            </Link>
                          )}
                          {doc.invoice && (
                            <Link href={`/invoices/${doc.invoice.id}`} className="text-label text-action hover:underline">
                              FAT {doc.invoice.invoiceNumber}
                            </Link>
                          )}
                          <span className="text-label text-ink-muted">{formatDate(doc.uploadedAt)}</span>
                        </div>
                      ),
                    }))}
                  />
                </Card>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Ricevute spese ────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="w-5 h-5 text-positive" />
          <h2 className="text-body font-semibold text-ink">Ricevute spese</h2>
          <Badge variant="emerald">{receipts.length}</Badge>
          <span className="text-label text-ink-muted ml-1">foto scontrini e fatture fornitori</span>
        </div>
        {receipts.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-ink-muted text-body">
            Nessuna ricevuta. Carica la foto dello scontrino quando registri una spesa.
          </CardContent></Card>
        ) : (
          <Card>
            <MediaDocList
              canDelete={canDeleteDocs}
              docs={receipts.map<MediaDocItem>((doc) => ({
                id: doc.id,
                name: doc.name,
                filePath: doc.filePath,
                fileType: doc.fileType,
                uploadedAt: doc.uploadedAt,
                meta: (
                  <div className="flex items-center gap-2 flex-wrap">
                    {doc.expense && (
                      <Link href={`/expenses/${doc.expense.id}`} className="text-label text-action hover:underline truncate">
                        {doc.expense.description}
                      </Link>
                    )}
                    {(doc.project ?? doc.expense?.project) ? (
                      <Link href={`/projects/${(doc.project ?? doc.expense?.project)!.id}`} className="text-label text-ink-muted hover:underline truncate">
                        {(doc.project ?? doc.expense?.project)!.name}
                      </Link>
                    ) : (
                      <span className="text-label text-ink-muted italic">Spesa aziendale</span>
                    )}
                    <span className="text-label text-ink-muted">{formatDate(doc.uploadedAt)}</span>
                  </div>
                ),
              }))}
            />
          </Card>
        )}
      </section>
    </div>
  )
}
