import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getSession, isAdmin } from '@/lib/auth'
import { updateUser } from '@/modules/users/actions'
import { getSupplierOptions } from '@/modules/suppliers/queries'
import { UserForm } from '@/components/users/user-form'

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session || !isAdmin(session.role)) notFound()

  const [user, suppliers] = await Promise.all([
    prisma.user.findUnique({ where: { id } }),
    getSupplierOptions(),
  ])
  if (!user) notFound()

  const action = updateUser.bind(null, id)

  return (
    <div className="page-form">
      <div className="mb-6">
        <h1 className="text-display font-semibold text-ink">Modifica utente</h1>
        <p className="text-body text-ink-muted mt-1">{user.name}</p>
      </div>
      <UserForm
        action={action}
        defaultValues={{
          ...user,
          contractStart: user.contractStart ? user.contractStart.toISOString().slice(0, 10) : null,
        }}
        isEdit
        backHref="/settings/users"
        suppliers={suppliers}
      />
    </div>
  )
}
