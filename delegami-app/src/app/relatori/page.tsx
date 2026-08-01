import Link from 'next/link'
import { ArrowRight, Zap, Droplets, Building, Thermometer, FileQuestion, ScrollText, FolderOpen, FileJson, Sparkles } from 'lucide-react'
import { prisma } from '@/lib/db'
import { RELATORI_REGISTRY, type ReportEntry, type ReportType } from '@/lib/relatori-registry'
import { canDelete, getSession } from '@/lib/auth'
import { getCustomReports } from '@/modules/custom-reports/queries'
import { DeleteReportButton } from '@/components/custom-reports/delete-report-button'
import { formatDate } from '@/lib/utils'

const typeConfig: Record<ReportType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  eletrico:    { label: 'Impianto Elettrico', icon: Zap,          color: 'text-attention', bg: 'bg-attention-surface border-attention-border' },
  hidraulico:  { label: 'Impianto Idraulico', icon: Droplets,     color: 'text-action',   bg: 'bg-action-surface border-action-border' },
  strutturale: { label: 'Strutturale',        icon: Building,     color: 'text-ink',   bg: 'bg-surface-raised border-line' },
  termico:     { label: 'Impianto Termico',   icon: Thermometer,  color: 'text-attention', bg: 'bg-attention-surface border-attention-border' },
  altro:       { label: 'Altro',              icon: FileQuestion, color: 'text-ink',  bg: 'bg-surface-raised border-line' },
}

type GroupReport = ReportEntry & { quoteNumber?: string; isCustom?: boolean }

type ProjectGroup = {
  projectId: string
  projectName: string
  clientName: string
  reports: GroupReport[]
}

function normalizeReportType(type: string | null | undefined): ReportType {
  if (type === 'eletrico' || type === 'hidraulico' || type === 'strutturale' || type === 'termico') return type
  return 'altro'
}

export default async function RelatoriFPage() {
  const session = await getSession()
  const canDel = session ? canDelete(session.role) : false

  // Static (hardcoded) reports — keep working as before
  const quoteIds = RELATORI_REGISTRY.map((r) => r.quoteId).filter(Boolean) as string[]
  const projectIds = RELATORI_REGISTRY.map((r) => r.projectId).filter(Boolean) as string[]

  const [quotes, projects, customReports] = await Promise.all([
    quoteIds.length
      ? prisma.quote.findMany({
          where: { id: { in: quoteIds } },
          select: { id: true, quoteNumber: true, project: { select: { id: true, name: true, client: { select: { name: true } } } } },
        })
      : [],
    projectIds.length
      ? prisma.project.findMany({
          where: { id: { in: projectIds } },
          select: { id: true, name: true, client: { select: { name: true } } },
        })
      : [],
    getCustomReports(),
  ])

  const quoteMap = Object.fromEntries(quotes.map((q) => [q.id, q]))
  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]))

  const groups = new Map<string, ProjectGroup>()

  // Static registry entries
  for (const report of RELATORI_REGISTRY) {
    let projectId = report.projectId ?? ''
    let projectName = 'Senza progetto'
    let clientName = ''
    let quoteNumber: string | undefined

    if (report.quoteId && quoteMap[report.quoteId]) {
      const q = quoteMap[report.quoteId]
      projectId = q.project.id
      projectName = q.project.name
      clientName = q.project.client.name
      quoteNumber = q.quoteNumber
    } else if (report.projectId && projectMap[report.projectId]) {
      const p = projectMap[report.projectId]
      projectId = report.projectId
      projectName = p.name
      clientName = p.client.name
    }

    if (!groups.has(projectId)) {
      groups.set(projectId, { projectId, projectName, clientName, reports: [] })
    }
    groups.get(projectId)!.reports.push({ ...report, quoteNumber })
  }

  // DB (AI-imported) reports
  for (const r of customReports) {
    const projectId = r.project?.id ?? ''
    const projectName = r.project?.name ?? 'Senza progetto'
    const clientName = r.project?.client?.name ?? ''

    if (!groups.has(projectId)) {
      groups.set(projectId, { projectId, projectName, clientName, reports: [] })
    }
    groups.get(projectId)!.reports.push({
      id: r.id,
      title: r.title,
      description: r.description ?? '',
      type: normalizeReportType(r.type),
      href: `/relatorio/${r.id}`,
      quoteId: r.quote?.id,
      projectId: r.project?.id,
      createdAt: r.createdAt.toISOString(),
      quoteNumber: r.quote?.quoteNumber,
      isCustom: true,
    })
  }

  // Sort each group's reports by createdAt desc
  for (const group of groups.values()) {
    group.reports.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  }

  const sortedGroups = Array.from(groups.values()).sort((a, b) => {
    if (!a.projectId && b.projectId) return 1
    if (a.projectId && !b.projectId) return -1
    return a.projectName.localeCompare(b.projectName)
  })

  return (
    <div className="page-content">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-surface-raised p-2 rounded-control">
            <ScrollText className="w-6 h-6 text-ink-muted" />
          </div>
          <div>
            <h1 className="text-display font-semibold text-ink">Relatori Tecnici</h1>
            <p className="text-body text-ink-muted mt-0.5">Analisi e documentazione interna. Genera con IA o registra manualmente.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/relatori/import"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-action text-ink-inverse text-body font-medium rounded-control hover:bg-action-hover transition-colors"
          >
            <FileJson className="w-4 h-4" />
            Importa da IA
          </Link>
        </div>
      </div>

      {sortedGroups.length === 0 && (
        <div className="text-center py-16 text-ink-muted">
          <ScrollText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-body">Nessun relatorio disponibile</p>
          <Link href="/relatori/import" className="mt-3 inline-block text-body text-action hover:underline">
            Importa il primo relatorio da chat IA →
          </Link>
        </div>
      )}

      <div className="space-y-8">
        {sortedGroups.map((group) => (
          <div key={group.projectId}>
            <div className="flex items-center gap-2 mb-3">
              <FolderOpen className="w-4 h-4 text-ink-subtle" />
              <div>
                {group.projectId ? (
                  <Link href={`/projects/${group.projectId}`} className="text-body font-semibold text-ink hover:text-action transition-colors">
                    {group.projectName}
                  </Link>
                ) : (
                  <span className="text-body font-semibold text-ink-muted">{group.projectName}</span>
                )}
                {group.clientName && (
                  <span className="text-label text-ink-muted ml-2">— {group.clientName}</span>
                )}
              </div>
            </div>

            <div className="space-y-3 pl-6 border-l-2 border-line">
              {group.reports.map((report) => {
                const cfg = typeConfig[report.type]
                const Icon = cfg.icon
                return (
                  <div key={report.id} className="bg-surface border border-line rounded-surface shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-label font-medium ${cfg.bg} ${cfg.color}`}>
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </div>
                          {report.quoteNumber && (
                            <Link
                              href={`/quotes/${report.quoteId}`}
                              className="text-label px-2 py-0.5 rounded bg-action-surface text-action border border-action-border hover:bg-action-surface transition-colors"
                            >
                              {report.quoteNumber}
                            </Link>
                          )}
                          {report.isCustom && (
                            <span className="inline-flex items-center gap-1 text-label px-2 py-0.5 rounded bg-action text-action border border-action">
                              <Sparkles className="w-3 h-3" />
                              IA
                            </span>
                          )}
                        </div>
                        <span className="text-label text-ink-muted flex-shrink-0">{formatDate(new Date(report.createdAt))}</span>
                      </div>

                      <h2 className="text-body font-semibold text-ink mt-2">{report.title}</h2>
                      {report.description && (
                        <p className="text-label text-ink-muted mt-1 leading-relaxed">{report.description}</p>
                      )}
                    </div>

                    <div className="px-4 py-2.5 border-t border-line flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {report.isCustom && canDel && (
                          <DeleteReportButton reportId={report.id} reportTitle={report.title} />
                        )}
                      </div>
                      <Link
                        href={report.href}
                        className="inline-flex items-center gap-1.5 text-label font-medium text-action hover:text-action transition-colors"
                      >
                        Apri relatorio
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
