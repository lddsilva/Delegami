'use client'

import { DeleteButton } from '@/components/ui/delete-button'
import { deleteSupplier } from '@/modules/suppliers/actions'

export function DeleteSupplierButton({ id }: { id: string }) {
  return (
    <DeleteButton
      onDelete={() => deleteSupplier(id)}
      entityLabel={'il fornitore'}
      deletedLabel="Fornitore eliminato"
    />
  )
}
