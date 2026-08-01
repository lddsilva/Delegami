import { notFound } from 'next/navigation'
import { getExpenseById } from '@/modules/expenses/queries'
import { getProjects } from '@/modules/projects/queries'
import { getSuppliers } from '@/modules/suppliers/queries'
import { updateExpense } from '@/modules/expenses/actions'
import { ExpenseForm } from '@/components/expenses/expense-form'
import { prisma } from '@/lib/db'

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [expense, projects, suppliers, settings] = await Promise.all([
    getExpenseById(id),
    getProjects(),
    getSuppliers(),
    prisma.companySettings.findFirst({ select: { eurChfRate: true, eurChfRateUpdatedAt: true }, orderBy: { createdAt: 'asc' } }),
  ])
  if (!expense) notFound()

  const action = updateExpense.bind(null, id)

  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name, client: { name: p.client.name } }))
  const supplierOptions = suppliers.map((s) => ({ id: s.id, name: s.name }))

  return (
    <div className="page-form">
      <div className="mb-6">
        <h1 className="text-display font-semibold text-ink">Modifica spesa</h1>
        <p className="text-body text-ink-muted mt-1">{expense.description}</p>
      </div>
      <ExpenseForm
        action={action}
        expense={{
          projectId: expense.projectId,
          supplierId: expense.supplierId,
          expenseType: expense.expenseType,
          paymentStatus: expense.paymentStatus,
          description: expense.description,
          amount: expense.amount,
          currency: expense.currency,
          amountChf: expense.amountChf,
          exchangeRate: expense.exchangeRate,
          exchangeRateUpdatedAt: expense.exchangeRateUpdatedAt,
          isItalianPurchase: expense.isItalianPurchase,
          date: expense.date,
          notes: expense.notes,
        }}
        projects={projectOptions}
        suppliers={supplierOptions}
        title="Dati spesa"
        backHref={`/expenses/${id}`}
        isEdit={true}
        defaultEurChfRate={settings?.eurChfRate ?? 0.9119}
        eurChfRateUpdatedAt={settings?.eurChfRateUpdatedAt ?? '2026-05-22'}
      />
    </div>
  )
}
