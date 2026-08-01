'use client'

import { DeleteButton } from '@/components/ui/delete-button'
import { deletePriceItem } from '@/modules/price-catalog/actions'

export function DeletePriceItemButton({ id }: { id: string }) {
  return (
    <DeleteButton
      onDelete={() => deletePriceItem(id)}
      entityLabel={'la voce'}
      deletedLabel="Voce eliminata"
      showLabel={false}
    />
  )
}
