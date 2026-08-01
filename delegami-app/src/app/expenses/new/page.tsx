import { createExpense } from '@/modules/expenses/actions'
import { getProjects } from '@/modules/projects/queries'
import { getSuppliers } from '@/modules/suppliers/queries'
import { ExpenseForm } from '@/components/expenses/expense-form'
import { prisma } from '@/lib/db'

export default async function NewExpensePage({
  searchParams,
}: {
  searchParams: Promise<{
    projectId?: string
    supplierId?: string
    description?: string
    amount?: string
    shoppingListItemId?: string
  }>
}) {
  const { projectId, supplierId, description, amount, shoppingListItemId } = await searchParams
  const [projects, suppliers, settings] = await Promise.all([
    getProjects(),
    getSuppliers(),
    prisma.companySettings.findFirst({ select: { eurChfRate: true, eurChfRateUpdatedAt: true }, orderBy: { createdAt: 'asc' } }),
  ])

  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name, client: { name: p.client.name } }))
  const supplierOptions = suppliers.map((s) => ({ id: s.id, name: s.name }))

  return (
    <div className="page-form">
      <div className="mb-6">
        <h1 className="text-display font-semibold text-ink">Nuova spesa</h1>
        <p className="text-body text-ink-muted mt-1">Registra una spesa associata a un progetto</p>
      </div>
      <ExpenseForm
        action={createExpense}
        projects={projectOptions}
        suppliers={supplierOptions}
        title="Dati spesa"
        backHref="/expenses"
        defaultEurChfRate={settings?.eurChfRate ?? 0.9119}
        eurChfRateUpdatedAt={settings?.eurChfRateUpdatedAt ?? '2026-05-22'}
        shoppingListItemId={shoppingListItemId}
        expense={projectId || description || amount || supplierId ? {
          projectId,
          supplierId,
          expenseType: 'MATERIAL',
          paymentStatus: 'PAID',
          description: description ?? '',
          amount: amount ? Number(amount) : 0,
          currency: 'CHF',
          date: new Date(),
        } : undefined}
      />
    </div>
  )
}
