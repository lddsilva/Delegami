import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getProjectById } from '@/modules/projects/queries'
import { getScheduleWithProject } from '@/modules/schedules/queries'
import { PrintButton } from '@/components/ui/print-button'
import { formatDate } from '@/lib/utils'
import { phaseColorAt } from '@/lib/schedule-colors'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const project = await getProjectById(id)
  return { title: project ? `Cronograma - ${project.name}` : 'Cronograma' }
}

function dateOnly(value: Date) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

function dayDiff(a: Date, b: Date) {
  return Math.round((dateOnly(b).getTime() - dateOnly(a).getTime()) / 86400000)
}

function addDays(value: Date, days: number) {
  const date = dateOnly(value)
  date.setDate(date.getDate() + days)
  return date
}

function compactDate(value: Date | null | undefined) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Zurich' }).format(value)
}

function compactWeekday(value: Date) {
  return new Intl.DateTimeFormat('it-CH', { weekday: 'short', timeZone: 'Europe/Zurich' }).format(value)
}

function timelineTickEvery(totalDays: number) {
  if (totalDays <= 16) return 1
  if (totalDays <= 35) return 3
  if (totalDays <= 80) return 7
  return 14
}

export default async function SchedulePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const schedule = await getScheduleWithProject(id)
  if (!schedule) notFound()

  const phases = schedule.phases
  const starts = phases.map((phase) => dateOnly(phase.startDate).getTime())
  const ends = phases.map((phase) => dateOnly(phase.endDate).getTime())
  const timelineStart = phases.length > 0 ? new Date(Math.min(...starts)) : null
  const timelineEnd = phases.length > 0 ? new Date(Math.max(...ends)) : null
  const totalDays = timelineStart && timelineEnd ? Math.max(1, dayDiff(timelineStart, timelineEnd) + 1) : 1
  const tickEvery = timelineTickEvery(totalDays)
  const ticks = timelineStart
    ? Array.from({ length: Math.ceil(totalDays / tickEvery) + 1 }, (_, index) => {
        const offset = Math.min(index * tickEvery, totalDays - 1)
        return { offset, date: addDays(timelineStart, offset) }
      })
    : []

  const useLandscape = totalDays > 60

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      <style>{`
        @media print {
          @page { margin: 12mm 10mm; size: A4 ${useLandscape ? 'landscape' : 'portrait'}; }
          html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
          .no-print { display: none !important; }
          .sheet { padding: 0 !important; max-width: none !important; box-shadow: none !important; }
          .timeline-scroll { overflow: hidden !important; }
          .timeline-inner { min-width: 0 !important; width: 100% !important; }
          .tick-label { font-size: 6.5pt !important; }
          .tick-sub { font-size: 6pt !important; }
          tr, .phase-block, .timeline-row { break-inside: avoid; page-break-inside: avoid; }
        }
        .sheet { background: white; max-width: 920px; margin: 0 auto; padding: 34px 34px 46px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .timeline-inner { min-width: 760px; }
      `}</style>

      <div className="no-print mx-auto mb-4 flex max-w-5xl items-center justify-between px-4">
        <a href={`/projects/${id}/schedule`} className="text-sm text-gray-500 hover:text-gray-800">
          Torna al cronograma
        </a>
        <PrintButton />
      </div>

      <article className="sheet">
        <header style={{ borderBottom: '2px solid var(--doc-ink-strong)', marginBottom: 16, paddingBottom: 9 }}>
          <h1 style={{ color: 'var(--doc-ink-strong)', fontSize: '20pt', margin: '0 0 4px' }}>Cronograma lavori</h1>
          <div style={{ color: 'var(--doc-ink-muted)', fontSize: '9.5pt' }}>
            {schedule.project.client.name} - {schedule.project.name}
            {schedule.project.address && <> - {schedule.project.address}</>}
            <br />
            Stampato il {formatDate(new Date())}
            {timelineStart && timelineEnd && <> - Periodo: {compactDate(timelineStart)} - {compactDate(timelineEnd)} ({totalDays} gg)</>}
          </div>
        </header>

        {phases.length === 0 ? (
          <p style={{ color: 'var(--doc-ink-muted)', fontSize: '11pt' }}>Nessuna fase registrata.</p>
        ) : (
          <>
            {timelineStart && timelineEnd && (
              <section style={{ marginBottom: 18 }}>
                <h2 style={{ color: 'var(--doc-ink-strong)', fontSize: '12pt', margin: '0 0 8px' }}>Timeline</h2>
                <div className="timeline-scroll" style={{ border: '1px solid var(--doc-line)', borderRadius: 8, overflowX: 'auto', padding: 10 }}>
                  <div className="timeline-inner">
                    <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '150px 1fr', marginBottom: 7 }}>
                      <div style={{ color: 'var(--doc-ink-muted)', fontSize: '8pt', paddingTop: 2 }}>Fasi</div>
                      <div style={{ height: 34, position: 'relative' }}>
                        {ticks.map((tick, index) => {
                          const isLast = index === ticks.length - 1
                          return (
                            <div
                              key={`${tick.offset}-${tick.date.toISOString()}`}
                              style={{
                                borderLeft: isLast ? 'none' : '1px solid var(--doc-line-strong)',
                                borderRight: isLast ? '1px solid var(--doc-line-strong)' : 'none',
                                bottom: 0,
                                left: `${(tick.offset / Math.max(1, totalDays - 1)) * 100}%`,
                                paddingLeft: isLast ? 0 : 3,
                                paddingRight: isLast ? 3 : 0,
                                position: 'absolute',
                                textAlign: isLast ? 'right' : 'left',
                                top: 0,
                                transform: isLast ? 'translateX(-100%)' : 'none',
                              }}
                            >
                              <div className="tick-label" style={{ color: 'var(--doc-ink)', fontSize: '7.5pt', fontWeight: 700, lineHeight: 1.1 }}>{compactDate(tick.date)}</div>
                              <div className="tick-sub" style={{ color: 'var(--doc-ink-muted)', fontSize: '7pt', lineHeight: 1.1 }}>{compactWeekday(tick.date)}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {phases.map((phase, phaseIndex) => {
                      const offset = Math.max(0, dayDiff(timelineStart, phase.startDate))
                      const duration = Math.max(1, dayDiff(phase.startDate, phase.endDate) + 1)
                      const phaseColor = phase.color || phaseColorAt(phaseIndex)
                      return (
                        <div key={phase.id} className="timeline-row" style={{ display: 'grid', gap: 8, gridTemplateColumns: '150px 1fr', marginBottom: 7 }}>
                          <div style={{ color: 'var(--doc-ink-strong)', fontSize: '8.5pt', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {phase.name}
                          </div>
                          <div style={{ background: 'var(--doc-fill)', borderRadius: 5, height: 18, position: 'relative' }}>
                            {ticks.map((tick) => (
                              <span
                                key={tick.offset}
                                style={{
                                  borderLeft: '1px solid rgba(209, 213, 219, 0.75)',
                                  bottom: 0,
                                  left: `${(tick.offset / Math.max(1, totalDays - 1)) * 100}%`,
                                  position: 'absolute',
                                  top: 0,
                                }}
                              />
                            ))}
                            <div
                              style={{
                                background: phaseColor,
                                borderRadius: 5,
                                height: 18,
                                left: `${(offset / totalDays) * 100}%`,
                                position: 'absolute',
                                top: 0,
                                width: `${Math.max(2, (duration / totalDays) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </section>
            )}

            <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: '100%' }}>
              <thead>
                <tr style={{ background: 'var(--doc-fill)' }}>
                  <th style={{ borderBottom: '1px solid var(--doc-line)', fontSize: '8.5pt', letterSpacing: '0.03em', padding: '5px 6px', textAlign: 'left', textTransform: 'uppercase' }}>Fase / attivita</th>
                  <th style={{ borderBottom: '1px solid var(--doc-line)', fontSize: '8.5pt', letterSpacing: '0.03em', padding: '5px 4px', textAlign: 'left', textTransform: 'uppercase', width: 52 }}>Dal</th>
                  <th style={{ borderBottom: '1px solid var(--doc-line)', fontSize: '8.5pt', letterSpacing: '0.03em', padding: '5px 4px', textAlign: 'left', textTransform: 'uppercase', width: 52 }}>Al</th>
                  <th style={{ borderBottom: '1px solid var(--doc-line)', fontSize: '8.5pt', letterSpacing: '0.03em', padding: '5px 4px', textAlign: 'right', textTransform: 'uppercase', width: 34 }}>gg</th>
                </tr>
              </thead>
              <tbody>
                {phases.map((phase, phaseIndex) => (
                  <tr key={phase.id} className="phase-block">
                    <td style={{ borderBottom: '1px solid var(--doc-line)', padding: '6px 6px', verticalAlign: 'top' }}>
                      <div style={{ alignItems: 'center', display: 'flex', gap: 6 }}>
                        <span style={{ background: phase.color || phaseColorAt(phaseIndex), borderRadius: 999, display: 'inline-block', flex: '0 0 auto', height: 9, width: 9 }} />
                        <span style={{ color: 'var(--doc-ink)', fontSize: '9.5pt', fontWeight: 700 }}>{phase.name}</span>
                      </div>
                      {phase.notes && <div style={{ color: 'var(--doc-ink-muted)', fontSize: '8.5pt', fontStyle: 'italic', marginTop: 2, whiteSpace: 'pre-wrap' }}>{phase.notes}</div>}
                      {phase.tasks.length > 0 && (
                        <div style={{ marginTop: 5 }}>
                          {phase.tasks.map((task) => (
                            <div key={task.id} style={{ color: 'var(--doc-ink-muted)', fontSize: '8.5pt', marginTop: 2, paddingLeft: 15 }}>
                              - {task.name}
                              {(task.startDate || task.endDate) && (
                                <span style={{ color: 'var(--doc-ink-muted)' }}>
                                  {' '}({compactDate(task.startDate)} - {compactDate(task.endDate)})
                                </span>
                              )}
                              {task.status === 'DONE' && <span style={{ color: 'var(--doc-positive)' }}> - fatto</span>}
                              {task.status === 'IN_PROGRESS' && <span style={{ color: 'var(--doc-warn)' }}> - in corso</span>}
                              {task.notes && <span style={{ color: 'var(--doc-ink-muted)', fontStyle: 'italic' }}> - {task.notes}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ borderBottom: '1px solid var(--doc-line)', fontSize: '8.8pt', padding: '6px 4px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{compactDate(phase.startDate)}</td>
                    <td style={{ borderBottom: '1px solid var(--doc-line)', fontSize: '8.8pt', padding: '6px 4px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{compactDate(phase.endDate)}</td>
                    <td style={{ borderBottom: '1px solid var(--doc-line)', fontSize: '8.8pt', padding: '6px 4px', textAlign: 'right', verticalAlign: 'top' }}>
                      {Math.max(1, dayDiff(phase.startDate, phase.endDate) + 1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {schedule.notes && (
              <section style={{ borderTop: '1px solid var(--doc-line-strong)', marginTop: 18, paddingTop: 10 }}>
                <h2 style={{ color: 'var(--doc-ink)', fontSize: '11pt', margin: '0 0 6px' }}>Note generali</h2>
                <p style={{ color: 'var(--doc-ink-muted)', fontSize: '9.5pt', lineHeight: 1.45, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {schedule.notes}
                </p>
              </section>
            )}
          </>
        )}
      </article>
    </div>
  )
}
