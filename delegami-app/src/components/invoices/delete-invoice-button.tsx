'use client'

import { DeleteButton } from '@/components/ui/delete-button'
import { deleteInvoice } from '@/modules/invoices/actions'

export function DeleteInvoiceButton({ id }: { id: string }) {
  return (
    <DeleteButton
      onDelete={() => deleteInvoice(id)}
      entityLabel={'la fattura'}
      deletedLabel="Fattura eliminata"
    />
  )
}
