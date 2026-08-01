'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession, canMutate, canDelete } from '@/lib/auth'
import { normalizeSupplierCategory } from '@/lib/supplier-taxonomy'
import { logActivity } from '@/lib/activity-log'

const supplierSchema = z.object({
  name: z.string().min(1, 'Nome obbligatorio'),
  address: z.string().optional(),
  email: z.string().email('Email non valida').optional().or(z.literal('')),
  phone: z.string().optional(),
  vatNumber: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  website: z.string().optional(),
  notes: z.string().optional(),
})

export type SupplierFormState = { errors?: Record<string, string[]>; message?: string } | null

function parseFormData(formData: FormData) {
  return {
    name: formData.get('name') as string,
    address: (formData.get('address') as string) || undefined,
    email: (formData.get('email') as string) || undefined,
    phone: (formData.get('phone') as string) || undefined,
    vatNumber: (formData.get('vatNumber') as string) || undefined,
    category: normalizeSupplierCategory(formData.get('category') as string),
    tags: (formData.get('tags') as string) || undefined,
    website: (formData.get('website') as string) || undefined,
    notes: (formData.get('notes') as string) || undefined,
  }
}

export async function createSupplier(prevState: SupplierFormState, formData: FormData): Promise<SupplierFormState> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { message: 'Non autorizzato' }

  const parsed = supplierSchema.safeParse(parseFormData(formData))
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }
  const supplier = await prisma.supplier.create({ data: parsed.data })
  await logActivity(session, 'CREATE', 'Fornitore', { entityId: supplier.id, entityLabel: parsed.data.name })
  revalidatePath('/suppliers')
  redirect(`/suppliers/${supplier.id}`)
}

export async function updateSupplier(id: string, prevState: SupplierFormState, formData: FormData): Promise<SupplierFormState> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { message: 'Non autorizzato' }

  const parsed = supplierSchema.safeParse(parseFormData(formData))
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }
  await prisma.supplier.update({ where: { id }, data: parsed.data })
  await logActivity(session, 'UPDATE', 'Fornitore', { entityId: id, entityLabel: parsed.data.name })
  revalidatePath('/suppliers')
  revalidatePath(`/suppliers/${id}`)
  redirect(`/suppliers/${id}`)
}

export async function deleteSupplier(id: string) {
  const session = await getSession()
  if (!session || !canDelete(session.role)) return

  const supplier = await prisma.supplier.findUnique({ where: { id }, select: { name: true } })
  await prisma.supplier.delete({ where: { id } })
  await logActivity(session, 'DELETE', 'Fornitore', { entityId: id, entityLabel: supplier?.name })
  revalidatePath('/suppliers')
  redirect('/suppliers')
}

/** Quick create from inline form in ExpenseForm */
export async function createSupplierQuick(
  name: string,
  vatNumber?: string,
  country?: string,
): Promise<{ id: string; name: string } | { error: string }> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }
  if (!name.trim()) return { error: 'Nome obbligatorio' }
  try {
    const supplier = await prisma.supplier.create({
      data: { name: name.trim(), vatNumber: vatNumber?.trim() || undefined, address: country?.trim() || undefined },
      select: { id: true, name: true },
    })
    revalidatePath('/suppliers')
    revalidatePath('/expenses')
    return supplier
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }
}
