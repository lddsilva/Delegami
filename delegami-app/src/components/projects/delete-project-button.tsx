'use client'

import { DeleteButton } from '@/components/ui/delete-button'
import { deleteProject } from '@/modules/projects/actions'

export function DeleteProjectButton({ id, name }: { id: string; name: string }) {
  return (
    <DeleteButton
      onDelete={() => deleteProject(id)}
      entityLabel={`l’opera "${name}"`}
      deletedLabel="Opera eliminata"
      cascades
      cascadeDescription="Verranno eliminati anche preventivi, fatture, spese e documenti collegati a quest’opera."
    />
  )
}
