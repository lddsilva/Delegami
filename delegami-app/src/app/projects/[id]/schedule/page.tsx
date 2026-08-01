import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, FileJson, Printer, RefreshCw } from 'lucide-react'
import { getProjectById } from '@/modules/projects/queries'
import { getQuoteFamilies } from '@/modules/quotes/queries'
import { getScheduleByProjectId } from '@/modules/schedules/queries'
import { canDelete, canMutate, getSession } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { GenerateScheduleForm } from '@/components/schedules/generate-form'
import { ScheduleClient } from '@/components/schedules/schedule-client'
import { ScheduleViewer } from '@/components/schedules/schedule-viewer'
import { DeleteScheduleButton } from '@/components/schedules/delete-schedule-button'
import { ExportScheduleAiButton } from '@/components/schedules/export-schedule-ai-button'

export default async function ProjectSchedulePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ edit?: string }>
}) {
  const { id } = await params
  const { edit } = await searchParams
  const [project, schedule, quoteFamilies, session] = await Promise.all([
    getProjectById(id),
    getScheduleByProjectId(id),
    getQuoteFamilies(id),
    getSession(),
  ])

  if (!project) notFound()
  if (!session) redirect('/login')

  const canEdit = canMutate(session.role)
  const canDel = canDelete(session.role)
  const approvedQuotes = quoteFamilies.filter((quote) => quote.status === 'APPROVED' || quote.status === 'INVOICED')

  const quoteOptions = approvedQuotes.map((quote) => ({
    id: quote.id,
    quoteNumber: quote.quoteNumber,
    version: quote.version,
    total: quote.total,
  }))
  const isEditMode = Boolean(schedule && canEdit && edit === '1')
  const phasePayload = schedule?.phases.map((phase) => ({
    id: phase.id,
    name: phase.name,
    startDate: phase.startDate.toISOString(),
    endDate: phase.endDate.toISOString(),
    color: phase.color,
    notes: phase.notes,
    tasks: phase.tasks.map((task) => ({
      id: task.id,
      name: task.name,
      startDate: task.startDate?.toISOString() ?? null,
      endDate: task.endDate?.toISOString() ?? null,
      notes: task.notes,
      status: task.status,
    })),
  })) ?? []

  return (
    <div className="page-content">
      <div className="mb-5">
        <Link href={`/projects/${id}`} className="mb-3 flex items-center gap-1.5 text-body text-ink-muted transition-colors hover:text-ink">
          <ArrowLeft className="h-4 w-4" />
          {project.name}
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-title font-semibold text-ink sm:text-display">
              <CalendarDays className="h-5 w-5 text-action" />
              Cronograma
            </h1>
            <p className="mt-0.5 text-body text-ink-muted">{project.client.name} · {project.name}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canEdit && (
              <>
                <ExportScheduleAiButton projectId={id} label={project.name} />
                <Link href={`/projects/${id}/schedule/import`}>
                  <Button type="button" variant="secondary" size="sm">
                    <FileJson className="h-4 w-4" />
                    Importa da IA
                  </Button>
                </Link>
                {schedule && (
                  <Link href={isEditMode ? `/projects/${id}/schedule` : `/projects/${id}/schedule?edit=1`}>
                    <Button type="button" variant={isEditMode ? 'ghost' : 'primary'} size="sm">
                      {isEditMode ? 'Visualizza' : 'Modifica'}
                    </Button>
                  </Link>
                )}
              </>
            )}
            {schedule && (
              <>
              <Link href={`/projects/${id}/schedule/print`} target="_blank">
                <Button type="button" variant="secondary" size="sm">
                  <Printer className="h-4 w-4" />
                  Stampa PDF
                </Button>
              </Link>
              {canDel && <DeleteScheduleButton scheduleId={schedule.id} />}
              </>
            )}
          </div>
        </div>
      </div>

      {!schedule ? (
        <div className="rounded-surface border border-dashed border-line bg-surface p-8 text-center sm:p-12">
          <CalendarDays className="mx-auto mb-3 h-10 w-10 text-ink-subtle" />
          <h2 className="mb-1 text-body font-medium text-ink">Nessun cronograma per questa opera</h2>
          <p className="mx-auto mb-5 max-w-md text-body text-ink-muted">
            Genera una bozza dalle sezioni del preventivo approvato, poi modifica date e fasi liberamente.
          </p>
          {canEdit && (
            <GenerateScheduleForm
              projectId={id}
              approvedQuotes={quoteOptions}
              projectStartDate={project.startDate}
              allowBlank
            />
          )}
        </div>
      ) : (
        <>
          {isEditMode ? (
            <ScheduleClient
              scheduleId={schedule.id}
              phases={phasePayload}
              notes={schedule.notes}
              canEdit={canEdit}
            />
          ) : (
            <ScheduleViewer
              phases={phasePayload}
              notes={schedule.notes}
              canEdit={canEdit}
            />
          )}

          {isEditMode && canEdit && quoteOptions.length > 0 && (
            <div className="mt-8 rounded-control border border-attention-border bg-attention-surface/50 p-3 text-label text-attention">
              <div className="mb-2 flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Rigenerare dal preventivo sostituira tutte le fasi correnti.</span>
              </div>
              <GenerateScheduleForm
                projectId={id}
                approvedQuotes={quoteOptions}
                projectStartDate={project.startDate}
                buttonLabel="Rigenera"
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
