import { notFound } from 'next/navigation'
import { Fragment } from 'react'
import Link from 'next/link'
import { ArrowLeft, MapPin, Calendar, Euro, FileText, Receipt, CreditCard, Pencil, Camera, ListChecks } from 'lucide-react'
import { getProjectById } from '@/modules/projects/queries'
import { getQuoteFamilies } from '@/modules/quotes/queries'
import { getProjectLaborCost } from '@/modules/workers/queries'
import { getSession, canMutate, canDelete } from '@/lib/auth'
import { ProjectStatusBadge, Badge } from '@/components/ui/badge'
import { QuoteStatusBadge } from '@/components/quotes/quote-status-badge'
import type { QuoteStatus } from '@/generated/prisma/enums'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DeleteProjectButton } from '@/components/projects/delete-project-button'
import { PhotoGallery } from '@/components/projects/photo-gallery'
import { ProjectStatusButton } from '@/components/projects/project-status-button'
import { DocumentList } from '@/components/documents/document-list'
import { uploadProjectDocument } from '@/modules/documents/actions'
import { expenseAmountChf, formatAmount, formatCurrency, formatDate, formatHours, formatPercent, swissNumber } from '@/lib/utils'
import { projectEconomics, quotedMarginPct } from '@/modules/finance/rules'

function formatEstimatedValue(value: number) {
  return swissNumber(new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    maximumFractionDigits: 0,
  }).format(value))
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [project, session, quoteFamilies, labor] = await Promise.all([getProjectById(id), getSession(), getQuoteFamilies(id), getProjectLaborCost(id)])
  if (!project) notFound()
  const canEdit = session ? canMutate(session.role) : false
  const canDel = session ? canDelete(session.role) : false

  const photos = project.documents.filter((d) => d.documentType === 'PHOTO')

  // Single source of truth — see src/modules/finance/rules.ts. DRAFT and CANCELLED
  // invoices are excluded from revenue, so they can no longer inflate the margin.
  const economics = projectEconomics({
    invoices: project.invoices,
    expenses: project.expenses,
    labor: labor.cost,
  })
  // The accepted quote sets the target the opera is measured against.
  const acceptedQuote = quoteFamilies.find((q) => q.status === 'APPROVED' || q.status === 'INVOICED')
  const quotedMargin = quotedMarginPct(acceptedQuote)

  const invoiceStatusLabel: Record<string, string> = { DRAFT: 'Bozza', SENT: 'Inviata', PAID: 'Pagata', CANCELLED: 'Annullata' }
  const invoiceVariant: Record<string, 'gray' | 'blue' | 'emerald' | 'red'> = { DRAFT: 'gray', SENT: 'blue', PAID: 'emerald', CANCELLED: 'red' }

  return (
    <div className="page-content">
      {/* Header.
          Six controls of identical weight gave no clue what to do here. The
          status control is the decision this page exists to support, so it is
          the only strong one; Cronograma and Lista acquisti are navigation, not
          actions, so they read as links; delete sits apart from the rest. */}
      <div className="mb-6">
        <Link
          href="/projects"
          className="inline-flex min-h-11 items-center gap-1.5 -ml-1 text-body text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Opere
        </Link>

        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-title font-semibold text-ink">{project.name}</h1>
              <ProjectStatusBadge status={project.status} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-body">
              <Link href={`/clients/${project.client.id}`} className="text-action hover:underline">
                {project.client.name}
              </Link>
              {project.referenceCode && (
                <span className="font-mono text-label text-ink-muted">{project.referenceCode}</span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {canEdit && <ProjectStatusButton id={project.id} currentStatus={project.status} />}
            {canEdit && (
              <Link href={`/projects/${project.id}/edit`}>
                <Button variant="secondary" size="sm"><Pencil className="h-4 w-4" /> Modifica</Button>
              </Link>
            )}
            {canDel && (
              <span className="ml-auto sm:ml-2">
                <DeleteProjectButton id={project.id} name={project.name} />
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-4">
          <Link
            href={`/projects/${project.id}/schedule`}
            className="inline-flex min-h-11 items-center gap-1.5 text-body text-action hover:underline"
          >
            <Calendar className="h-4 w-4" /> Cronograma
          </Link>
          <Link
            href={`/projects/${project.id}/shopping-list`}
            className="inline-flex min-h-11 items-center gap-1.5 text-body text-action hover:underline"
          >
            <ListChecks className="h-4 w-4" /> Lista acquisti
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="py-3"><CardTitle>Dettagli</CardTitle></CardHeader>
            <CardContent className="space-y-2 pt-0">
              {project.address && (
                <div className="flex items-start gap-2 text-body">
                  <MapPin className="w-4 h-4 text-ink-muted shrink-0 mt-0.5" />
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-action hover:underline"
                  >
                    {project.address}
                  </a>
                </div>
              )}
              {project.estimatedValue != null && (
                <div className="flex items-center gap-2 text-body">
                  <Euro className="w-4 h-4 text-ink-muted shrink-0" />
                  <span className="text-ink font-medium">{formatEstimatedValue(project.estimatedValue)}</span>
                  <span className="text-ink-muted text-label">stimato</span>
                </div>
              )}
              {project.startDate && (
                <div className="flex items-center gap-2 text-body">
                  <Calendar className="w-4 h-4 text-ink-muted shrink-0" />
                  <span className="text-ink">
                    {formatDate(project.startDate)}
                    {project.endDate && ` → ${formatDate(project.endDate)}`}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial summary.
              The margin is the question this page exists to answer, so it leads
              the card instead of sitting in body text at the bottom of a
              seven-card stack — and it is shown against the margin the accepted
              quote promised, which the app has always been able to compute and
              never displayed side by side. */}
          <Card>
            <CardHeader><CardTitle>Riepilogo finanziario</CardTitle></CardHeader>
            <CardContent>
              <p className="text-label uppercase tracking-wider text-ink-muted">Margine</p>
              <p
                className={`mt-1 text-display font-semibold numeric ${
                  economics.marginPct == null
                    ? 'text-ink-muted'
                    : economics.margin >= 0
                      ? 'text-positive'
                      : 'text-negative'
                }`}
              >
                {formatAmount(economics.margin)}
              </p>
              <p className="mt-1 text-label text-ink-muted">
                {economics.marginPct != null ? (
                  <>
                    <span className="numeric">{formatPercent(economics.marginPct)}</span> sul fatturato
                    {quotedMargin != null && (
                      <>
                        {' · preventivato '}
                        <span className="numeric">{formatPercent(quotedMargin)}</span>
                      </>
                    )}
                  </>
                ) : (
                  'Nessuna fattura emessa'
                )}
              </p>

              <dl className="mt-4 space-y-2 border-t border-line pt-3 text-body">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">Fatturato</dt>
                  <dd className="font-medium text-ink numeric">{formatAmount(economics.invoiced)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">Incassato</dt>
                  <dd className="font-medium text-positive numeric">{formatAmount(economics.collected)}</dd>
                </div>
                {economics.outstanding > 0 && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-muted">Da incassare</dt>
                    <dd className="font-medium text-attention numeric">{formatAmount(economics.outstanding)}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">Spese</dt>
                  <dd className="font-medium text-ink numeric">−{formatAmount(economics.expenses)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">
                    Manodopera{' '}
                    {labor.hours > 0 && <span className="text-ink-subtle numeric">{formatHours(labor.hours)}</span>}
                  </dt>
                  <dd className="font-medium text-ink numeric">−{formatAmount(economics.labor)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {project.description && (
            <Card>
              <CardHeader className="py-3"><CardTitle>Descrizione</CardTitle></CardHeader>
              <CardContent className="pt-0"><p className="text-body text-ink-muted whitespace-pre-wrap">{project.description}</p></CardContent>
            </Card>
          )}
          {project.billingNotes && (
            <Card>
              <CardHeader className="py-3"><CardTitle>Note di fatturazione</CardTitle></CardHeader>
              <CardContent className="pt-0"><p className="text-body text-ink-muted whitespace-pre-wrap">{project.billingNotes}</p></CardContent>
            </Card>
          )}
          {project.notes && (
            <Card>
              <CardHeader className="py-3"><CardTitle>Note interne</CardTitle></CardHeader>
              <CardContent className="pt-0"><p className="text-body text-ink-muted whitespace-pre-wrap">{project.notes}</p></CardContent>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Quotes */}
          <Card>
            <CardHeader className="py-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-ink-muted" />
                <CardTitle>Preventivi ({quoteFamilies.length})</CardTitle>
              </div>
              {canEdit && (
                <Link href={`/quotes/new?projectId=${project.id}`}>
                  <Button size="sm" variant="secondary">+ Nuovo</Button>
                </Link>
              )}
            </CardHeader>
            {quoteFamilies.length === 0 ? (
              <CardContent className="pt-0"><p className="text-body text-ink-muted text-center py-6">Nessun preventivo ancora.</p></CardContent>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-body">
                  <tbody className="divide-y divide-line">
                    {quoteFamilies.map((q) => {
                      const previousVersions = q.versions
                        .filter((version) => version.id !== q.id)
                        .sort((a, b) => b.version - a.version)

                      return (
                        <Fragment key={q.id}>
                          <tr className="hover:bg-surface-raised">
                            <td className="px-4 sm:px-6 py-2.5">
                              <Link href={`/quotes/${q.id}`} className="font-mono font-medium text-action hover:underline">{q.quoteNumber}</Link>
                              <p className="text-label text-ink-muted">
                                v{q.version} corrente{q.versionCount > 1 ? ` - ${q.versionCount} versioni` : ''}
                              </p>
                            </td>
                            <td className="px-3 py-2.5"><QuoteStatusBadge status={q.status as QuoteStatus} /></td>
                            <td className="px-3 py-2.5 text-right tabular-nums font-medium">{formatCurrency(q.total)}</td>
                          </tr>
                          {previousVersions.map((version) => (
                            <tr key={version.id} className="bg-surface-raised/60">
                              <td className="px-4 sm:px-6 py-2 pl-8 sm:pl-10">
                                <div className="flex items-center gap-2">
                                  <span className="h-px w-4 bg-surface-raised" />
                                  <Link href={`/quotes/${version.id}`} className="text-label font-mono font-medium text-ink-muted hover:text-action hover:underline">
                                    {q.quoteNumber} v{version.version}
                                  </Link>
                                </div>
                              </td>
                              <td className="px-3 py-2"><QuoteStatusBadge status={version.status as QuoteStatus} /></td>
                              <td className="px-3 py-2 text-right text-label tabular-nums font-medium text-ink-muted">{formatCurrency(version.total)}</td>
                            </tr>
                          ))}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Invoices */}
          <Card>
            <CardHeader className="py-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-ink-muted" />
                <CardTitle>Fatture ({project.invoices.length})</CardTitle>
              </div>
              {canEdit && (
                <Link href={`/invoices/new?projectId=${project.id}`}>
                  <Button size="sm" variant="secondary">+ Nuova</Button>
                </Link>
              )}
            </CardHeader>
            {project.invoices.length === 0 ? (
              <CardContent className="pt-0"><p className="text-body text-ink-muted text-center py-6">Nessuna fattura ancora.</p></CardContent>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-body">
                  <tbody className="divide-y divide-line">
                    {project.invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-surface-raised">
                        <td className="px-4 sm:px-6 py-2.5">
                          <Link href={`/invoices/${inv.id}`} className="font-mono font-medium text-action hover:underline">{inv.invoiceNumber}</Link>
                          <p className="text-label text-ink-muted">{formatDate(inv.issueDate)}</p>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant={invoiceVariant[inv.status] ?? 'gray'}>{invoiceStatusLabel[inv.status] ?? inv.status}</Badge>
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums font-medium">{formatCurrency(inv.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Expenses */}
          <Card>
            <CardHeader className="py-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-ink-muted" />
                <CardTitle>Spese ({project.expenses.length})</CardTitle>
              </div>
              {canEdit && (
                <Link href={`/expenses/new?projectId=${project.id}`}>
                  <Button size="sm" variant="secondary">+ Nuova</Button>
                </Link>
              )}
            </CardHeader>
            {project.expenses.length === 0 ? (
              <CardContent className="pt-0"><p className="text-body text-ink-muted text-center py-6">Nessuna spesa ancora.</p></CardContent>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-body">
                  <tbody className="divide-y divide-line">
                    {project.expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-surface-raised">
                        <td className="px-4 sm:px-6 py-2.5">
                          <Link href={`/expenses/${exp.id}`} className="font-medium text-action hover:underline">{exp.description}</Link>
                          <p className="text-label text-ink-muted">{formatDate(exp.date)}</p>
                        </td>
                        <td className="hidden sm:table-cell px-3 py-2.5 text-ink-muted text-label">{exp.supplier?.name ?? '—'}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums font-medium text-attention">
                          {formatCurrency(expenseAmountChf(exp))}
                          {exp.currency !== 'CHF' && (
                            <p className="text-label font-normal text-ink-muted">{exp.amount.toFixed(2)} {exp.currency}</p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Communications & Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Comunicazioni / Documenti</CardTitle>
              <p className="text-label text-ink-muted mt-0.5">Screenshot WhatsApp, email, contratti, permessi, foto non cantiere</p>
            </CardHeader>
            <CardContent>
              <DocumentList
                documents={project.documents.filter(d => d.documentType === 'ATTACHMENT')}
                uploadAction={uploadProjectDocument}
                uploadFieldName="projectId"
                uploadFieldValue={project.id}
                uploadDocumentType="ATTACHMENT"
                revalidatePath={`/projects/${project.id}`}
                canEdit={canEdit}
                emptyLabel="Nessun documento — carica screenshot, email, contratti o permessi relativi a questa opera"
                acceptCamera={true}
                cameraLabel="Foto documento"
              />
            </CardContent>
          </Card>

          {/* Photos (last — documentation/evidence) */}
          <Card>
            <CardHeader className="py-3 flex flex-row items-center gap-2">
              <Camera className="w-4 h-4 text-ink-muted" />
              <CardTitle>Foto cantiere ({photos.length})</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <PhotoGallery projectId={project.id} photos={photos} canEdit={canEdit} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
