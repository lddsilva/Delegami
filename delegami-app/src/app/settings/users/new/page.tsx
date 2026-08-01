import { notFound } from 'next/navigation'
import { getSession, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createUser } from '@/modules/users/actions'
import { getSupplierOptions } from '@/modules/suppliers/queries'
import { UserForm } from '@/components/users/user-form'

export default async function NewUserPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>
}) {
  const session = await getSession()
  if (!session || !isAdmin(session.role)) notFound()

  const sp = await searchParams
  const lockRoleToWorker = sp.role === 'WORKER'

  const [settings, suppliers] = await Promise.all([
    prisma.companySettings.findFirst({ select: { defaultWorkerHourlyRate: true } }),
    getSupplierOptions(),
  ])

  return (
    <div className="page-form">
      <div className="mb-6">
        <h1 className="text-display font-semibold text-ink">{lockRoleToWorker ? 'Nuovo operaio' : 'Nuovo utente'}</h1>
        <p className="text-body text-ink-muted mt-1">{lockRoleToWorker ? 'Crea l’account e la scheda dell’operaio' : 'Crea un nuovo account di accesso'}</p>
      </div>
      <UserForm
        action={createUser}
        backHref="/settings/users"
        defaultHourlyRate={settings?.defaultWorkerHourlyRate ?? 25}
        suppliers={suppliers}
        lockRoleToWorker={lockRoleToWorker}
        defaultValues={lockRoleToWorker ? { role: 'WORKER', employmentType: 'DIRECT' } : undefined}
      />
    </div>
  )
}
