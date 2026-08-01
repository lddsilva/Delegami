'use client'

import { DeleteButton } from '@/components/ui/delete-button'
import { deleteClient } from '@/modules/clients/actions'

export function DeleteClientButton({ id, name }: { id: string; name: string }) {
  return (
    <DeleteButton
      onDelete={() => deleteClient(id)}
      entityLabel={`il cliente "${name}"`}
      deletedLabel="Cliente eliminato"
      cascades
      cascadeDescription="Verranno eliminate anche tutte le opere del cliente e i loro documenti."
    />
  )
}
