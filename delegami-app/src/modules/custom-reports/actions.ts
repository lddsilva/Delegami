'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { canDelete, canMutate, getSession } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log'
import { reportBlockSchema, REPORT_TYPES } from '@/modules/custom-reports/schema'

export type ActionResult = { id?: string; error?: string }

const reportImportSchema = z.object({
  kind: z.literal('report').optional(),
  title: z.string().min(1, 'Title obbligatorio'),
  description: z.string().optional().nullable(),
  type: z.enum(REPORT_TYPES).optional(),
  quoteId: z.string().optional().nullable(),
  blocks: z.array(reportBlockSchema).min(1, 'Almeno un blocco richiesto'),
})

// ─── Import ─────────────────────────────────────────────────────────────────

export async function importReportFromJson(
  projectId: string | null,
  jsonText: string,
): Promise<ActionResult> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  let raw: unknown
  try {
    raw = JSON.parse(jsonText)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'JSON non valido'
    return { error: `JSON non valido: ${msg}` }
  }

  const parsed = reportImportSchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { error: `Schema non valido: ${first.path.join('.') || 'root'} - ${first.message}` }
  }

  // Validate project exists (if provided)
  if (projectId) {
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } })
    if (!project) return { error: 'Opera non trovata' }
  }

  // Validate quote exists (if provided) and belongs to project (if both set)
  if (parsed.data.quoteId) {
    const quote = await prisma.quote.findUnique({
      where: { id: parsed.data.quoteId },
      select: { id: true, projectId: true },
    })
    if (!quote) return { error: 'Preventivo non trovato' }
    if (projectId && quote.projectId !== projectId) {
      return { error: 'Il preventivo non appartiene all\'opera selezionata' }
    }
  }

  // Re-serialize only the validated shape so we never persist extra fields the schema rejects later
  const contentJson = JSON.stringify({
    kind: 'report',
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    type: parsed.data.type ?? null,
    blocks: parsed.data.blocks,
  })

  const created = await prisma.customReport.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      type: parsed.data.type ?? null,
      projectId: projectId ?? null,
      quoteId: parsed.data.quoteId ?? null,
      contentJson,
      createdBy: session.name ?? session.email ?? null,
    },
    select: { id: true },
  })

  await logActivity(session, 'IMPORT', 'Relatorio', {
    entityId: created.id,
    entityLabel: parsed.data.title,
    details: { source: 'ai-json', blockCount: parsed.data.blocks.length, hasProject: Boolean(projectId) },
  })

  revalidatePath('/relatori')
  return { id: created.id }
}

// ─── Delete ─────────────────────────────────────────────────────────────────

export async function deleteCustomReport(id: string): Promise<ActionResult> {
  const session = await getSession()
  if (!session || !canDelete(session.role)) return { error: 'Solo admin' }

  const existing = await prisma.customReport.findUnique({
    where: { id },
    select: { id: true, title: true },
  })
  if (!existing) return { error: 'Relatorio non trovato' }

  await prisma.customReport.delete({ where: { id } })

  await logActivity(session, 'DELETE', 'Relatorio', {
    entityId: id,
    entityLabel: existing.title,
  })

  revalidatePath('/relatori')
  return {}
}
