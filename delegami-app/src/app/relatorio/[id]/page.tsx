import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PrintButton } from '@/components/ui/print-button'
import { getCustomReportById } from '@/modules/custom-reports/queries'
import { reportBlockSchema } from '@/modules/custom-reports/schema'
import { ReportBlocks } from '@/components/custom-reports/report-blocks'
import { formatDate } from '@/lib/utils'
import { z } from 'zod'

const renderSchema = z.object({
  kind: z.literal('report').optional(),
  title: z.string(),
  description: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  blocks: z.array(reportBlockSchema),
})

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const report = await getCustomReportById(id)
  return { title: report?.title ?? 'Relatorio' }
}

export default async function CustomReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const report = await getCustomReportById(id)
  if (!report) notFound()

  let content
  try {
    const raw = JSON.parse(report.contentJson)
    content = renderSchema.parse(raw)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Errore'
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <p className="text-sm text-red-600">Errore nel caricamento del relatorio: {msg}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 print:bg-white print:py-0">
      <style>{`
        @media print {
          @page { margin: 14mm 14mm; size: A4; }
          html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
          .no-print { display: none !important; }
          .sheet { padding: 0 !important; max-width: none !important; box-shadow: none !important; }
          h1, h2, h3 { page-break-after: avoid; }
          table, tr { page-break-inside: avoid; }
        }
        .sheet { background: white; max-width: 880px; margin: 0 auto; padding: 28px 36px 40px; box-shadow: 0 4px 14px rgba(0,0,0,0.05); }
      `}</style>

      <div className="no-print mx-auto mb-4 flex max-w-4xl items-center justify-between px-4">
        <Link href="/relatori" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft className="h-4 w-4" />
          Torna ai relatori
        </Link>
        <PrintButton />
      </div>

      <article className="sheet">
        <header style={{ borderBottom: '2px solid var(--doc-brand)', paddingBottom: '8px', marginBottom: '14px' }}>
          <h1 style={{ fontSize: '16pt', fontWeight: 700, color: 'var(--doc-brand)', margin: 0 }}>{content.title}</h1>
          {content.description && (
            <p style={{ fontSize: '9.5pt', color: 'var(--doc-ink-strong)', marginTop: '4px', marginBottom: 0 }}>{content.description}</p>
          )}
          <p style={{ fontSize: '8.5pt', color: 'var(--doc-ink-muted)', marginTop: '6px', marginBottom: 0 }}>
            {report.project ? (
              <>
                {report.project.client.name} — {report.project.name}
                {report.project.address && <> · {report.project.address}</>}
              </>
            ) : (
              <span>Senza progetto</span>
            )}
            {report.quote && <> · Preventivo {report.quote.quoteNumber} v{report.quote.version}</>}
            <span style={{ marginLeft: 8 }}>· Generato il {formatDate(report.createdAt)}</span>
            {report.createdBy && <> · {report.createdBy}</>}
          </p>
        </header>

        <ReportBlocks blocks={content.blocks} />
      </article>
    </div>
  )
}
