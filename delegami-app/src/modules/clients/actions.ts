'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession, canMutate, canDelete } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log'

const clientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default('CH'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  vatNumber: z.string().optional(),
  notes: z.string().optional(),
})

export type ClientFormState = {
  errors?: Record<string, string[]>
  message?: string
} | null

function parseFormData(formData: FormData) {
  return {
    name: formData.get('name') as string,
    address: formData.get('address') as string || undefined,
    city: formData.get('city') as string || undefined,
    postalCode: formData.get('postalCode') as string || undefined,
    country: formData.get('country') as string || 'CH',
    email: formData.get('email') as string || undefined,
    phone: formData.get('phone') as string || undefined,
    vatNumber: formData.get('vatNumber') as string || undefined,
    notes: formData.get('notes') as string || undefined,
  }
}

export async function createClient(
  prevState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { message: 'Non autorizzato' }

  const parsed = clientSchema.safeParse(parseFormData(formData))

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const client = await prisma.client.create({ data: parsed.data })
  await logActivity(session, 'CREATE', 'Cliente', { entityId: client.id, entityLabel: parsed.data.name })
  revalidatePath('/clients')
  redirect('/clients')
}

export async function updateClient(
  id: string,
  prevState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { message: 'Non autorizzato' }

  const parsed = clientSchema.safeParse(parseFormData(formData))

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  await prisma.client.update({ where: { id }, data: parsed.data })
  await logActivity(session, 'UPDATE', 'Cliente', { entityId: id, entityLabel: parsed.data.name })
  revalidatePath('/clients')
  revalidatePath(`/clients/${id}`)
  redirect(`/clients/${id}`)
}

export async function deleteClient(id: string) {
  const session = await getSession()
  if (!session || !canDelete(session.role)) return

  const client = await prisma.client.findUnique({ where: { id }, select: { name: true } })
  await prisma.client.delete({ where: { id } })
  await logActivity(session, 'DELETE', 'Cliente', { entityId: id, entityLabel: client?.name })
  revalidatePath('/clients')
  redirect('/clients')
}
