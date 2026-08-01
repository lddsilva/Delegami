import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import { getExpenseById } from '@/modules/expenses/queries'
import { getProjects } from '@/modules/projects/queries'
import { getSession, canMutate, canDelete } from '@/lib/auth'
import { Button, ButtonLink } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DeleteExpenseButton } from '@/components/expenses/delete-expense-button'
import { MarkExpensePaidButton } from '@/components/expenses/mark-expense-paid-button'
import { MoveExpenseButton } from '@/components/expenses/move-expense-button'
import { ExpenseReceiptList } from '@/components/expenses/expense-receipt-list'
import { formatCurrency, formatDate } from '@/lib/utils'

const expenseTypeLabel: Record<string, string> = {
  MATERIAL: 'Materiale', LABOR: 'Manodopera', TRANSPORT: 'Trasporto',
  EQUIPMENT: 'Attrezzatura', ADMIN: 'Amministrativo', OTHER: 'Altro',
}

const paymentStatusConfig: Record<string, { label: string; variant: 'gray' | 'emerald' | 'blue' }> = {
  PENDING: { label: 'In attesa', variant: 'gray' },
  PAID: { label: 'Pagata', variant: 'emerald' },
  PARTIALLY_PAID: { label: 'Parz. pagata', variant: 'blue' },
}

export default async function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [expense, session, projects] = await Promise.all([
    getExpenseById(id),
    getSession(),
    getProjects(),
  ])
  if (!expense) notFound()
  const canEdit = session ? canMutate(session.role) : false
  const canDel = session ? canDelete(session.role) : false
  const projectOptions = projects.map((p) => ({
    id: p.id,
    name: p.name,
    isPlaceholder: p.isPlaceholder ?? false,
  }))

  const ps = paymentStatusConfig[expense.paymentStatus] ?? paymentStatusConfig.PENDING

  return (
    <div className="page-content">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <ButtonLink href="/expenses" variant="ghost" size="sm" aria-label="Torna indietro"><ArrowLeft className="w-4 h-4" /></ButtonLink>
          <div>
            <h1 className="text-title sm:text-display font-semibold text-ink">{expense.description}</h1>
            <div className="flex items-center gap-2 mt-1 text-body flex-wrap">
              {expense.project ? (
                <>
                  <Link href={`/projects/${expense.project.id}`} className="text-action hover:underline">{expense.project.name}</Link>
                  <span className="text-ink-muted">·</span>
                  <Link href={`/clients/${expense.project.client.id}`} className="text-ink-muted hover:text-action">{expense.project.client.name}</Link>
                </>
              ) : (
                <span className="text-ink-muted italic">Spesa aziendale</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {canEdit && <MarkExpensePaidButton id={id} currentStatus={expense.paymentStatus} />}
          {canEdit && (
            <MoveExpenseButton expenseId={id} currentProjectId={expense.projectId ?? null} projects={projectOptions} />
          )}
          {canDel && <DeleteExpenseButton id={id} />}
          {canEdit && (
            <Link href={`/expenses/${id}/edit`}><Button variant="secondary" size="sm"><Pencil className="w-4 h-4" /> Modifica</Button></Link>
          )}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Dettagli</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-body">
          <div className="flex justify-between"><span className="text-ink-muted">Stato pagamento</span><Badge variant={ps.variant}>{ps.label}</Badge></div>
          <div className="flex justify-between"><span className="text-ink-muted">Tipo</span><span>{expenseTypeLabel[expense.expenseType] ?? expense.expenseType}</span></div>
          <div className="flex justify-between"><span className="text-ink-muted">Data</span><span>{formatDate(expense.date)}</span></div>
          {expense.isItalianPurchase && <div className="flex justify-between"><span className="text-ink-muted">Acquisto Italia</span><span>Si</span></div>}
          {expense.supplier && <div className="flex justify-between"><span className="text-ink-muted">Fornitore</span><Link href={`/suppliers/${expense.supplier.id}`} className="text-action hover:underline">{expense.supplier.name}</Link></div>}
          <div className="border-t pt-2 flex justify-between font-bold text-body">
            <span>Importo</span>
            <span className="text-action tabular-nums">
              {expense.currency !== 'CHF' ? (
                <>
                  {expense.amount.toFixed(2)} {expense.currency}
                  {expense.amountChf != null && (
                    <span className="ml-2 text-ink-muted font-normal text-body">≈ {formatCurrency(expense.amountChf)}</span>
                  )}
                </>
              ) : (
                formatCurrency(expense.amount)
              )}
            </span>
          </div>
          {expense.currency !== 'CHF' && expense.exchangeRate != null && (
            <div className="flex justify-between text-label text-ink-muted">
              <span>Cambio usato</span>
              <span>1 {expense.currency} = {expense.exchangeRate.toFixed(4)} CHF · aggiornato {expense.exchangeRateUpdatedAt ? formatDate(expense.exchangeRateUpdatedAt) : '—'}</span>
            </div>
          )}
          {expense.notes && (
            <div className="border-t pt-2">
              <p className="text-ink-muted mb-1">Note</p>
              <p className="text-ink-muted whitespace-pre-wrap">{expense.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader><CardTitle>Documenti & Ricevute</CardTitle></CardHeader>
        <CardContent>
          <ExpenseReceiptList
            expenseId={id}
            receipts={expense.documents}
            canEdit={canEdit}
          />
        </CardContent>
      </Card>
    </div>
  )
}
