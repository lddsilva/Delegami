'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession, isAdmin } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log'

async function requireAdmin() {
  const session = await getSession()
  if (!session || !isAdmin(session.role)) {
    throw new Error('Accesso negato: solo gli amministratori possono gestire gli utenti.')
  }
}

const workerFields = {
  hourlyRate: z.coerce.number().min(0).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  employmentType: z.enum(['DIRECT', 'AGENCY']).optional(),
  agencySupplierId: z.string().optional(),
  costRate: z.coerce.number().min(0).optional(),
  contractStart: z.string().optional(),
  contractType: z.string().optional(),
  identityNumber: z.string().optional(),
  notes: z.string().optional(),
}

const createUserSchema = z.object({
  name: z.string().min(1, 'Nome obbligatorio'),
  email: z.string().email('Email non valida'),
  password: z.string().min(8, 'Password minimo 8 caratteri'),
  role: z.enum(['ADMIN', 'MANAGER', 'VIEWER', 'WORKER']),
  ...workerFields,
})

const updateUserSchema = z.object({
  name: z.string().min(1, 'Nome obbligatorio'),
  email: z.string().email('Email non valida'),
  role: z.enum(['ADMIN', 'MANAGER', 'VIEWER', 'WORKER']),
  active: z.coerce.boolean(),
  password: z.string().optional(),
  ...workerFields,
})

/** Build the WORKER-only profile columns from parsed form data (null for non-workers). */
function workerData(role: string, d: z.infer<typeof createUserSchema> | z.infer<typeof updateUserSchema>) {
  if (role !== 'WORKER') {
    return {
      hourlyRate: null, phone: null, address: null,
      employmentType: 'DIRECT', agencySupplierId: null, costRate: null,
      contractStart: null, contractType: null, identityNumber: null, notes: null,
    }
  }
  const isAgency = d.employmentType === 'AGENCY'
  return {
    hourlyRate: d.hourlyRate ?? null,
    phone: d.phone?.trim() || null,
    address: d.address?.trim() || null,
    employmentType: d.employmentType ?? 'DIRECT',
    agencySupplierId: isAgency ? (d.agencySupplierId?.trim() || null) : null,
    costRate: isAgency ? (d.costRate ?? null) : null,
    contractStart: d.contractStart?.trim() ? new Date(`${d.contractStart}T12:00:00`) : null,
    contractType: d.contractType?.trim() || null,
    identityNumber: d.identityNumber?.trim() || null,
    notes: d.notes?.trim() || null,
  }
}

/** Read the raw worker-profile inputs from FormData into the shape the schema expects. */
function readWorkerInputs(formData: FormData) {
  const rateRaw = (formData.get('hourlyRate') as string) || ''
  const costRaw = (formData.get('costRate') as string) || ''
  return {
    hourlyRate: rateRaw.trim() ? rateRaw.replace(',', '.') : undefined,
    phone: (formData.get('phone') as string) || undefined,
    address: (formData.get('address') as string) || undefined,
    employmentType: (formData.get('employmentType') as string) || undefined,
    agencySupplierId: (formData.get('agencySupplierId') as string) || undefined,
    costRate: costRaw.trim() ? costRaw.replace(',', '.') : undefined,
    contractStart: (formData.get('contractStart') as string) || undefined,
    contractType: (formData.get('contractType') as string) || undefined,
    identityNumber: (formData.get('identityNumber') as string) || undefined,
    notes: (formData.get('notes') as string) || undefined,
  }
}

export type UserFormState = {
  errors?: Record<string, string[]>
  message?: string
} | null

export async function createUser(
  prevState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  await requireAdmin()

  const parsed = createUserSchema.safeParse({
    name: formData.get('name'),
    email: (formData.get('email') as string)?.toLowerCase().trim(),
    password: formData.get('password'),
    role: formData.get('role'),
    ...readWorkerInputs(formData),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (existing) {
    return { errors: { email: ['Email già in uso.'] } }
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12)
  const newUser = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
      ...workerData(parsed.data.role, parsed.data),
    },
  })
  const actor = await getSession()
  if (actor) await logActivity(actor, 'CREATE', 'Utente', { entityId: newUser.id, entityLabel: `${parsed.data.name} (${parsed.data.email})` })

  revalidatePath('/settings/users')
  redirect('/settings/users')
}

export async function updateUser(
  id: string,
  prevState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  await requireAdmin()

  const parsed = updateUserSchema.safeParse({
    name: formData.get('name'),
    email: (formData.get('email') as string)?.toLowerCase().trim(),
    role: formData.get('role'),
    active: formData.get('active') === 'true',
    password: formData.get('password') || undefined,
    ...readWorkerInputs(formData),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const data: Record<string, unknown> = {
    name: parsed.data.name,
    email: parsed.data.email,
    role: parsed.data.role,
    active: parsed.data.active,
    ...workerData(parsed.data.role, parsed.data),
  }

  if (parsed.data.password) {
    if (parsed.data.password.length < 8) {
      return { errors: { password: ['Password minimo 8 caratteri.'] } }
    }
    data.passwordHash = await bcrypt.hash(parsed.data.password, 12)
  }

  await prisma.user.update({ where: { id }, data })
  const actor = await getSession()
  if (actor) await logActivity(actor, 'UPDATE', 'Utente', { entityId: id, entityLabel: `${parsed.data.name} (${parsed.data.email})` })
  revalidatePath('/settings/users')
  redirect('/settings/users')
}

export async function deleteUser(id: string) {
  await requireAdmin()
  const session = await getSession()
  if (session?.id === id) throw new Error('Non puoi eliminare il tuo stesso account.')
  const target = await prisma.user.findUnique({ where: { id }, select: { name: true, email: true } })
  await prisma.user.delete({ where: { id } })
  if (session) await logActivity(session, 'DELETE', 'Utente', { entityId: id, entityLabel: target ? `${target.name} (${target.email})` : id })
  revalidatePath('/settings/users')
  redirect('/settings/users')
}
