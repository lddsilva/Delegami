'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession, canMutate, canDelete } from '@/lib/auth'
import { ProjectStatus } from '@/generated/prisma/enums'
import { logActivity } from '@/lib/activity-log'

const AUTO_PROJECT_CODE = /^OBR-\d{4}-\d{3}$/

const projectSchema = z.object({
  clientId: z.string().min(1, 'Cliente é obrigatório'),
  name: z.string().min(1, 'Nome é obrigatório'),
  referenceCode: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.LEAD),
  estimatedValue: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number().positive('Valor deve ser positivo').transform((value) => Math.round(value)).optional(),
  ),
  paymentTerms: z.string().optional(),
  billingNotes: z.string().optional(),
  startDate: z.preprocess(
    (v) => (v === '' || v == null ? undefined : new Date(v as string)),
    z.date().optional(),
  ),
  endDate: z.preprocess(
    (v) => (v === '' || v == null ? undefined : new Date(v as string)),
    z.date().optional(),
  ),
  notes: z.string().optional(),
})

export type ProjectFormState = {
  errors?: Record<string, string[]>
  message?: string
} | null

function parseFormData(formData: FormData) {
  return {
    clientId: formData.get('clientId') as string,
    name: formData.get('name') as string,
    referenceCode: formData.get('referenceCode') as string || undefined,
    address: formData.get('address') as string || undefined,
    description: formData.get('description') as string || undefined,
    status: formData.get('status') as ProjectStatus || ProjectStatus.LEAD,
    estimatedValue: formData.get('estimatedValue') || undefined,
    paymentTerms: formData.get('paymentTerms') as string || undefined,
    billingNotes: formData.get('billingNotes') as string || undefined,
    startDate: formData.get('startDate') || undefined,
    endDate: formData.get('endDate') || undefined,
    notes: formData.get('notes') as string || undefined,
  }
}

export async function createProject(
  prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { message: 'Non autorizzato' }

  const parsed = projectSchema.safeParse(parseFormData(formData))

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const project = await prisma.$transaction(async (tx) => {
    const submittedCode = parsed.data.referenceCode?.trim()
    const useCustomCode = submittedCode && !AUTO_PROJECT_CODE.test(submittedCode)
    let referenceCode = submittedCode

    if (!useCustomCode) {
      const year = new Date().getFullYear()
      const prefix = `OBR-${year}-`
      const [sequence, lastProject] = await Promise.all([
        tx.documentSequence.findUnique({ where: { type_year: { type: 'PROJECT', year } } }),
        tx.project.findFirst({
          where: { referenceCode: { startsWith: prefix } },
          orderBy: { referenceCode: 'desc' },
          select: { referenceCode: true },
        }),
      ])
      const lastFromProjects = lastProject?.referenceCode ? parseInt(lastProject.referenceCode.slice(prefix.length), 10) : 0
      const base = Math.max(sequence?.lastNumber ?? 0, Number.isNaN(lastFromProjects) ? 0 : lastFromProjects)
      const nextNumber = base + 1
      await tx.documentSequence.upsert({
        where: { type_year: { type: 'PROJECT', year } },
        update: { lastNumber: nextNumber },
        create: { type: 'PROJECT', year, lastNumber: nextNumber },
      })
      referenceCode = `${prefix}${String(nextNumber).padStart(3, '0')}`
    }

    return tx.project.create({ data: { ...parsed.data, referenceCode } })
  })
  await logActivity(session, 'CREATE', 'Opera', { entityId: project.id, entityLabel: `${project.referenceCode} – ${parsed.data.name}` })
  revalidatePath('/projects')
  redirect(`/projects/${project.id}`)
}

export async function updateProject(
  id: string,
  prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { message: 'Non autorizzato' }

  const parsed = projectSchema.safeParse(parseFormData(formData))

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  await prisma.project.update({ where: { id }, data: parsed.data })
  await logActivity(session, 'UPDATE', 'Opera', { entityId: id, entityLabel: parsed.data.name })
  revalidatePath('/projects')
  revalidatePath(`/projects/${id}`)
  redirect(`/projects/${id}`)
}

export async function deleteProject(id: string) {
  const session = await getSession()
  if (!session || !canDelete(session.role)) return

  const project = await prisma.project.findUnique({ where: { id }, select: { name: true, referenceCode: true } })
  await prisma.project.delete({ where: { id } })
  await logActivity(session, 'DELETE', 'Opera', { entityId: id, entityLabel: project ? `${project.referenceCode} – ${project.name}` : id })
  revalidatePath('/projects')
  redirect('/projects')
}

export async function updateProjectStatus(id: string, status: ProjectStatus): Promise<{ error?: string }> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }
  const project = await prisma.project.findUnique({ where: { id }, select: { name: true } })
  await prisma.project.update({ where: { id }, data: { status } })
  await logActivity(session, 'STATUS_CHANGE', 'Opera', { entityId: id, entityLabel: project?.name, details: { status } })
  revalidatePath(`/projects/${id}`)
  revalidatePath('/projects')
  return {}
}
