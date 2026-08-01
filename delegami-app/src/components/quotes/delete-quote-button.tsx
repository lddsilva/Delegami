'use client'

import { DeleteButton } from '@/components/ui/delete-button'
import { deleteQuote } from '@/modules/quotes/actions'

export function DeleteQuoteButton({ id }: { id: string }) {
  return (
    <DeleteButton
      onDelete={() => deleteQuote(id)}
      entityLabel={'il preventivo'}
      deletedLabel="Preventivo eliminato"
    />
  )
}
