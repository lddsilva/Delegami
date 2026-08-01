'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FolderInput } from 'lucide-react'
import { moveExpenseToProject } from '@/modules/expenses/actions'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'

interface ProjectOption {
  id: string
  name: string
  isPlaceholder: boolean
}

interface Props {
  expenseId: string
  currentProjectId: string | null
  projects: ProjectOption[]
}

export function MoveExpenseButton({ expenseId, currentProjectId, projects }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [target, setTarget] = useState<string>(currentProjectId ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setLoading(true)
    setError(null)
    const result = await moveExpenseToProject(expenseId, target || null)
    setLoading(false)
    if (result?.error) {
      setError(result.error)
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <FolderInput className="h-4 w-4" />
        Sposta su opera
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Sposta spesa"
        description="Cambia l&rsquo;opera collegata a questa spesa. I documenti allegati seguiranno la nuova opera."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={loading}>
              Annulla
            </Button>
            <Button onClick={submit} loading={loading}>
              Sposta
            </Button>
          </>
        }
      >
        <Select
          label="Opera di destinazione"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          options={[
            { value: '', label: '— Spesa aziendale (nessuna opera) —' },
            ...projects.map((project) => ({
              value: project.id,
              label: `${project.isPlaceholder ? '🗂 ' : ''}${project.name}`,
            })),
          ]}
        />
        {error && <p className="mt-2 text-body text-negative">{error}</p>}
      </Dialog>
    </>
  )
}
