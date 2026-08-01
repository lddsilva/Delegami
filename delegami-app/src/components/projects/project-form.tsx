'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import type { ProjectModel as Project } from '@/generated/prisma/models'
import type { ProjectStatus } from '@/generated/prisma/enums'
import type { ProjectFormState } from '@/modules/projects/actions'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button, ButtonLink } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateInput } from '@/lib/utils'
import { AddressAutocomplete } from '@/components/ui/address-autocomplete'

interface ClientOption {
  id: string
  name: string
  city: string | null
}

const statusOptions: { value: ProjectStatus; label: string }[] = [
  { value: 'LEAD', label: 'Nuova richiesta' },
  { value: 'QUOTING', label: 'In preventivo' },
  { value: 'APPROVED', label: 'Approvato' },
  { value: 'IN_PROGRESS', label: 'In corso' },
  { value: 'COMPLETED', label: 'Completato' },
  { value: 'CANCELLED', label: 'Annullato' },
]

interface ProjectFormProps {
  action: (prevState: ProjectFormState, formData: FormData) => Promise<ProjectFormState>
  project?: Project
  clients: ClientOption[]
  defaultClientId?: string
  suggestedCode?: string
  defaultPaymentTerms?: string
  title: string
  backHref: string
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" loading={pending}>
      {label}
    </Button>
  )
}

export function ProjectForm({
  action,
  project,
  clients,
  defaultClientId,
  suggestedCode,
  defaultPaymentTerms,
  title,
  backHref,
}: ProjectFormProps) {
  const [state, formAction] = useActionState(action, null)

  const e = state?.errors ?? {}

  const clientOptions = clients.map((c) => ({
    value: c.id,
    label: c.city ? `${c.name} — ${c.city}` : c.name,
  }))

  return (
    <form action={formAction}>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Main info */}
          <div>
            <h3 className="text-body font-medium text-ink-muted uppercase tracking-wide mb-4">
              Informazioni principali
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                name="clientId"
                label="Cliente"
                required
                options={clientOptions}
                defaultValue={project?.clientId ?? defaultClientId ?? ''}
                placeholder="Seleziona un cliente"
                error={e.clientId?.[0]}
              />
              <Select
                name="status"
                label="Stato"
                required
                options={statusOptions}
                defaultValue={project?.status ?? 'LEAD'}
                error={e.status?.[0]}
              />
              <div className="md:col-span-2">
                <Input
                  name="name"
                  label="Nome opera"
                  required
                  defaultValue={project?.name}
                  error={e.name?.[0]}
                  placeholder="Ristrutturazione appartamento via Roma"
                />
              </div>
              <Input
                name="referenceCode"
                label="Codice riferimento"
                defaultValue={project?.referenceCode ?? suggestedCode ?? ''}
                placeholder="OBR-2026-001"
                hint={suggestedCode && !project ? `Suggerito: ${suggestedCode}` : 'Modificabile'}
              />
              <Input
                name="estimatedValue"
                label="Valore stimato (CHF)"
                type="number"
                step="1"
                min="0"
                defaultValue={project?.estimatedValue != null ? Math.round(project.estimatedValue).toString() : ''}
                error={e.estimatedValue?.[0]}
                placeholder="10000"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <h3 className="text-body font-medium text-ink-muted uppercase tracking-wide mb-4">
              Ubicazione
            </h3>
            <AddressAutocomplete
              name="address"
              label="Indirizzo cantiere"
              defaultValue={project?.address ?? ''}
              placeholder="Via del Cantiere 5, Lugano"
            />
          </div>

          {/* Dates */}
          <div>
            <h3 className="text-body font-medium text-ink-muted uppercase tracking-wide mb-4">
              Date
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                name="startDate"
                label="Data inizio"
                type="date"
                defaultValue={formatDateInput(project?.startDate)}
                hint="Lascia vuoto se la data non e ancora definita"
              />
              <Input
                name="endDate"
                label="Data fine prevista"
                type="date"
                defaultValue={formatDateInput(project?.endDate)}
                hint="Lascia vuoto se la fine lavori non e ancora stimabile"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-body font-medium text-ink-muted uppercase tracking-wide mb-4">
              Note
            </h3>
            <div className="space-y-4">
              <Textarea
                name="description"
                label="Descrizione lavori"
                defaultValue={project?.description ?? ''}
                placeholder="Descrizione generale dei lavori da eseguire..."
                rows={3}
              />
              <Textarea
                name="paymentTerms"
                label="Condizioni di pagamento"
                defaultValue={project?.paymentTerms ?? defaultPaymentTerms ?? ''}
                placeholder="es. 30% acconto, 70% a fine lavori · pagamento entro 30 giorni"
                rows={2}
                hint={!project?.paymentTerms && defaultPaymentTerms ? 'Valore predefinito dalle impostazioni aziendali' : undefined}
              />
              <Textarea
                name="billingNotes"
                label="Note di fatturazione"
                defaultValue={project?.billingNotes ?? ''}
                placeholder="Modalità di pagamento, scadenze, condizioni..."
                rows={2}
              />
              <Textarea
                name="notes"
                label="Note interne"
                defaultValue={project?.notes ?? ''}
                placeholder="Annotazioni interne..."
                rows={2}
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <ButtonLink href={backHref} variant="secondary">
              Annulla
            </ButtonLink>
          <SubmitButton label={project ? 'Salva modifiche' : 'Crea opera'} />
        </CardFooter>
      </Card>
    </form>
  )
}
