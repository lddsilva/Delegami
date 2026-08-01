'use client'

import { DeleteButton } from '@/components/ui/delete-button'
import { deleteExpense } from '@/modules/expenses/actions'

export function DeleteExpenseButton({ id }: { id: string }) {
  return (
    <DeleteButton
      onDelete={() => deleteExpense(id)}
      entityLabel={'la spesa'}
      deletedLabel="Spesa eliminata"
    />
  )
}
