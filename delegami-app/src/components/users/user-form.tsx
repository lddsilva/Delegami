'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button, ButtonLink } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { UserFormState } from '@/modules/users/actions'

interface DefaultValues {
  name?: string
  email?: string
  role?: string
  active?: boolean
  hourlyRate?: number | null
  phone?: string | null
  address?: string | null
  employmentType?: string | null
  agencySupplierId?: string | null
  costRate?: number | null
  contractStart?: string | null   // 'YYYY-MM-DD'
  contractType?: string | null
  identityNumber?: string | null
  notes?: string | null
}

interface SupplierOption {
  id: string
  name: string
  category?: string | null
}

interface Props {
  action: (prevState: UserFormState, formData: FormData) => Promise<UserFormState>
  defaultValues?: DefaultValues | null
  isEdit?: boolean
  backHref: string
  defaultHourlyRate?: number
  suppliers?: SupplierOption[]
  lockRoleToWorker?: boolean
}

const roles = [
  { value: 'ADMIN', label: 'Amministratore', desc: 'Accesso completo + gestione utenti' },
  { value: 'MANAGER', label: 'Responsabile', desc: 'Tutto tranne gestione utenti' },
  { value: 'VIEWER', label: 'Visualizzatore', desc: 'Solo visualizzazione, nessuna modifica' },
  { value: 'WORKER', label: 'Operaio', desc: 'Accede solo al proprio rapportino (ore + foto)' },
]

export function UserForm({ action, defaultValues, isEdit, backHref, defaultHourlyRate, suppliers = [], lockRoleToWorker }: Props) {
  const [state, formAction, pending] = useActionState(action, null)
  const [role, setRole] = useState(defaultValues?.role ?? (lockRoleToWorker ? 'WORKER' : 'MANAGER'))
  const [employmentType, setEmploymentType] = useState(defaultValues?.employmentType ?? 'DIRECT')

  const isWorker = role === 'WORKER'
  const isAgency = employmentType === 'AGENCY'
  const visibleRoles = lockRoleToWorker ? roles.filter((r) => r.value === 'WORKER') : roles

  return (
    <form action={formAction} className="space-y-5">
      <div className="flex items-center gap-3 mb-6">
        <ButtonLink href={backHref} variant="ghost" size="sm" aria-label="Torna indietro"><ArrowLeft className="w-4 h-4" /></ButtonLink>
      </div>

      <Card>
        <CardHeader><CardTitle>Dati accesso</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Nome completo"
            name="name"
            required
            defaultValue={defaultValues?.name ?? ''}
            error={state?.errors?.name?.[0]}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            required
            defaultValue={defaultValues?.email ?? ''}
            error={state?.errors?.email?.[0]}
          />
          <Input
            label={isEdit ? 'Nuova password (lascia vuoto per non cambiare)' : 'Password'}
            name="password"
            type="password"
            required={!isEdit}
            placeholder={isEdit ? '••••••••' : 'Min. 8 caratteri'}
            hint="Minimo 8 caratteri"
            error={state?.errors?.password?.[0]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Ruolo</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {visibleRoles.map((r) => (
            <label
              key={r.value}
              className="flex items-start gap-3 p-3 rounded-control border border-line hover:bg-surface-raised cursor-pointer has-[:checked]:border-action has-[:checked]:bg-action-surface transition-colors"
            >
              <input
                type="radio"
                name="role"
                value={r.value}
                checked={role === r.value}
                onChange={() => setRole(r.value)}
                className="mt-0.5 accent-[var(--color-action)]"
              />
              <div>
                <p className="text-body font-medium text-ink">{r.label}</p>
                <p className="text-label text-ink-muted">{r.desc}</p>
              </div>
            </label>
          ))}
          {state?.errors?.role && <p className="text-label text-negative">{state.errors.role[0]}</p>}
        </CardContent>
      </Card>

      {isWorker && (
        <Card>
          <CardHeader><CardTitle>Dati operaio</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Telefono" name="phone" defaultValue={defaultValues?.phone ?? ''} placeholder="+41 ..." />
              <Input label="Indirizzo" name="address" defaultValue={defaultValues?.address ?? ''} />
            </div>

            {/* Tipo di rapporto */}
            <div className="space-y-2">
              <p className="text-body font-medium text-ink">Tipo di rapporto</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { v: 'DIRECT', label: 'Diretto', desc: 'Lo paghi tu direttamente' },
                  { v: 'AGENCY', label: 'Tramite agenzia', desc: 'Ti fattura un’agenzia (interinale)' },
                ].map((opt) => (
                  <label
                    key={opt.v}
                    className="flex items-start gap-2 p-3 rounded-control border border-line hover:bg-surface-raised cursor-pointer has-[:checked]:border-action has-[:checked]:bg-action-surface transition-colors"
                  >
                    <input
                      type="radio"
                      name="employmentType"
                      value={opt.v}
                      checked={employmentType === opt.v}
                      onChange={() => setEmploymentType(opt.v)}
                      className="mt-0.5 accent-[var(--color-action)]"
                    />
                    <div>
                      <p className="text-body font-medium text-ink">{opt.label}</p>
                      <p className="text-label text-ink-muted">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <Input
              label="Tariffa oraria concordata con l’operaio (CHF)"
              name="hourlyRate"
              type="text"
              inputMode="decimal"
              defaultValue={
                defaultValues?.hourlyRate != null
                  ? String(defaultValues.hourlyRate)
                  : defaultHourlyRate != null ? String(defaultHourlyRate) : ''
              }
              placeholder="25"
              hint="Quanto guadagna l’operaio/ora. Applicata ai nuovi rapportini; modificabile in qualsiasi momento"
              error={state?.errors?.hourlyRate?.[0]}
            />

            {isAgency && (
              <div className="rounded-control border border-attention-border bg-attention-surface/50 p-4 space-y-4">
                <p className="text-label text-attention">
                  Costi dell’agenzia — <strong>solo interni</strong>, mai visibili all’operaio.
                </p>
                <Select
                  label="Agenzia (fornitore)"
                  name="agencySupplierId"
                  defaultValue={defaultValues?.agencySupplierId ?? ''}
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
                  defaultValue={defaultValues?.costRate != null ? String(defaultValues.costRate) : ''}
                  placeholder="es. 32"
                  hint="Stima finché non arriva la fattura reale (es. 20 × 1,6). Usata per costo opera e riconciliazione"
                  error={state?.errors?.costRate?.[0]}
                />
              </div>
            )}

            <Input
              label="N. identità / matricola"
              name="identityNumber"
              defaultValue={defaultValues?.identityNumber ?? ''}
              placeholder="es. permesso, documento o matricola agenzia"
              hint="Stampato sul rapporto ore consegnato all’agenzia"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Inizio rapporto"
                name="contractStart"
                type="date"
                className="min-w-0"
                defaultValue={defaultValues?.contractStart ?? ''}
              />
              <Input
                label="Tipo contratto"
                name="contractType"
                defaultValue={defaultValues?.contractType ?? ''}
                placeholder="es. Interinale, Indeterminato, A ore"
              />
            </div>

            <Textarea
              label="Note interne"
              name="notes"
              defaultValue={defaultValues?.notes ?? ''}
              rows={2}
              placeholder="Note sull’operaio..."
            />
          </CardContent>
        </Card>
      )}

      {isEdit && (
        <Card>
          <CardHeader><CardTitle>Stato account</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              { v: 'true', label: 'Attivo', desc: "L'utente può accedere al sistema" },
              { v: 'false', label: 'Disabilitato', desc: "L'utente non può effettuare il login" },
            ].map((opt) => (
              <label
                key={opt.v}
                className="flex items-start gap-3 p-3 rounded-control border border-line hover:bg-surface-raised cursor-pointer has-[:checked]:border-action has-[:checked]:bg-action-surface transition-colors"
              >
                <input
                  type="radio"
                  name="active"
                  value={opt.v}
                  defaultChecked={String(defaultValues?.active ?? true) === opt.v}
                  className="mt-0.5 accent-[var(--color-action)]"
                />
                <div>
                  <p className="text-body font-medium text-ink">{opt.label}</p>
                  <p className="text-label text-ink-muted">{opt.desc}</p>
                </div>
              </label>
            ))}
          </CardContent>
        </Card>
      )}

      {state?.message && (
        <p className="text-body text-negative">{state.message}</p>
      )}

      <div className="flex justify-end gap-3">
        <Link href={backHref}>
          <Button variant="secondary" type="button">Annulla</Button>
        </Link>
        <Button type="submit" loading={pending}>
          {isEdit ? 'Salva modifiche' : 'Crea utente'}
        </Button>
      </div>
    </form>
  )
}
