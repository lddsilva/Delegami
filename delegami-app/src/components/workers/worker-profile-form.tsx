'use client'

import { useActionState, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { updateWorkerProfile, type WorkerFormState } from '@/modules/workers/actions'

interface SupplierOption {
  id: string
  name: string
  category?: string | null
}

interface Props {
  userId: string
  defaults: {
    phone?: string | null
    address?: string | null
    hourlyRate?: number | null
    employmentType?: string | null
    agencySupplierId?: string | null
    costRate?: number | null
    contractStart?: string | null   // 'YYYY-MM-DD'
    contractType?: string | null
    identityNumber?: string | null
    notes?: string | null
  }
  suppliers?: SupplierOption[]
}

export function WorkerProfileForm({ userId, defaults, suppliers = [] }: Props) {
  const action = updateWorkerProfile.bind(null, userId)
  const [state, formAction, pending] = useActionState<WorkerFormState, FormData>(action, null)
  const [employmentType, setEmploymentType] = useState(defaults.employmentType ?? 'DIRECT')
  const isAgency = employmentType === 'AGENCY'

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Telefono" name="phone" type="tel" inputMode="tel" defaultValue={defaults.phone ?? ''} placeholder="+41 …" />
        <Input label="Indirizzo" name="address" defaultValue={defaults.address ?? ''} placeholder="Via, CAP città" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Tipo di rapporto"
          name="employmentType"
          value={employmentType}
          onChange={(e) => setEmploymentType(e.target.value)}
          options={[
            { value: 'DIRECT', label: 'Diretto (lo paghi tu)' },
            { value: 'AGENCY', label: 'Tramite agenzia' },
          ]}
        />
        <Input
          label="Tariffa oraria operaio (CHF)"
          name="hourlyRate"
          type="text"
          inputMode="decimal"
          defaultValue={defaults.hourlyRate != null ? String(defaults.hourlyRate) : ''}
          placeholder="es. 20"
          hint="Quanto guadagna l’operaio/ora. I giorni già registrati mantengono la tariffa precedente"
          error={state?.errors?.hourlyRate?.[0]}
        />
      </div>

      {isAgency && (
        <div className="rounded-control border border-attention-border bg-attention-surface/50 p-4 space-y-4">
          <p className="text-label text-attention">Costi dell’agenzia — <strong>solo interni</strong>, mai visibili all’operaio.</p>
          <Select
            label="Agenzia (fornitore)"
            name="agencySupplierId"
            defaultValue={defaults.agencySupplierId ?? ''}
            options={[
              { value: '', label: '— Seleziona agenzia —' },
              ...suppliers.map((s) => ({ value: s.id, label: s.category === 'Agenzia di lavoro' ? `${s.name} ⭐` : s.name })),
            ]}
            hint="Crea prima l’agenzia in Fornitori (categoria “Agenzia di lavoro”) se non compare qui"
          />
          <Input
            label="Tariffa oraria agenzia — costo stimato (CHF)"
            name="costRate"
            type="text"
            inputMode="decimal"
            defaultValue={defaults.costRate != null ? String(defaults.costRate) : ''}
            placeholder="es. 32"
            hint="Stima finché non arriva la fattura reale (es. 20 × 1,6)"
            error={state?.errors?.costRate?.[0]}
          />
        </div>
      )}

      <Input
        label="N. identità / matricola"
        name="identityNumber"
        defaultValue={defaults.identityNumber ?? ''}
        placeholder="es. permesso, documento o matricola agenzia"
        hint="Stampato sul rapporto ore consegnato all’agenzia"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Inizio rapporto" name="contractStart" type="date" className="min-w-0" defaultValue={defaults.contractStart ?? ''} />
        <Input label="Tipo contratto" name="contractType" defaultValue={defaults.contractType ?? ''} placeholder="es. Interinale, A ore" />
      </div>

      <Textarea label="Note interne" name="notes" defaultValue={defaults.notes ?? ''} rows={2} />

      {state?.message && <p className="text-body text-negative">{state.message}</p>}
      {state?.ok && <p className="text-body text-positive">Salvato.</p>}

      <div className="flex justify-end">
        <Button type="submit" loading={pending}>Salva anagrafica</Button>
      </div>
    </form>
  )
}
