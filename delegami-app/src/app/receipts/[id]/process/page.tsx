import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getSession, canMutate } from '@/lib/auth'
import { getReceiptInboxById } from '@/modules/receipt-inbox/queries'
import { analyzeReceiptForExpense, processReceiptAsExpense } from '@/modules/receipt-inbox/actions'
import { getProjects } from '@/modules/projects/queries'
import { getSuppliers } from '@/modules/suppliers/queries'
import { ProcessReceiptForm } from '@/components/receipt-inbox/process-receipt-form'
import { prisma } from '@/lib/db'

export default async function ProcessReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getSession()
  if (!session || !canMutate(session.role)) redirect('/receipts')

  const [receipt, projects, suppliers, settings] = await Promise.all([
    getReceiptInboxById(id),
    getProjects(),
    getSuppliers(),
    prisma.companySettings.findFirst({
      select: { eurChfRate: true, eurChfRateUpdatedAt: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  if (!receipt) notFound()
  if (receipt.processedAt) redirect('/receipts')

  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name, client: { name: p.client.name } }))
  const supplierOptions = suppliers.map((s) => ({ id: s.id, name: s.name }))

  const boundAction = processReceiptAsExpense.bind(null, receipt.id)
  const boundAnalyzeAction = analyzeReceiptForExpense.bind(null, receipt.id)

  function formatCapturedAt(date: Date): string {
    return new Intl.DateTimeFormat('it-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  return (
    <div className="page-form">
      <div className="mb-5">
        <Link href="/receipts" className="flex items-center gap-1.5 text-body text-ink-muted hover:text-ink transition-colors mb-3">
          <ArrowLeft className="w-4 h-4" />
          Scontrini
        </Link>
        <h1 className="text-title sm:text-display font-semibold text-ink">Registra spesa</h1>
        <p className="text-body text-ink-muted mt-0.5">
          Scontrino del {formatCapturedAt(receipt.capturedAt)}
          {receipt.note && <> · {receipt.note}</>}
        </p>
      </div>

      {/* Desktop: side by side | Mobile: stacked */}
      <div className="flex flex-col lg:flex-row gap-6 max-w-5xl">
        {/* Photo panel */}
        <div className="lg:w-80 shrink-0">
          <div className="lg:sticky lg:top-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={receipt.photoUrl}
              alt="Foto scontrino"
              className="w-full rounded-surface border border-line shadow-sm object-contain bg-surface-raised max-h-[60vh] lg:max-h-[80vh]"
            />
            <a
              href={receipt.photoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block text-center text-label text-ink-muted hover:text-action transition-colors"
            >
              Apri originale ↗
            </a>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex-1 min-w-0">
          <ProcessReceiptForm
            action={boundAction}
            analyzeAction={boundAnalyzeAction}
            projects={projectOptions}
            suppliers={supplierOptions}
            defaultEurChfRate={settings?.eurChfRate ?? 0.9119}
            eurChfRateUpdatedAt={settings?.eurChfRateUpdatedAt ?? null}
            defaultProjectId={receipt.suggestedProjectId}
          />
        </div>
      </div>
    </div>
  )
}
