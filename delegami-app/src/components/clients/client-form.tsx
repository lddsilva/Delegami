'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import type { ClientModel as Client } from '@/generated/prisma/models'
import type { ClientFormState } from '@/modules/clients/actions'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button, ButtonLink } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AddressAutocomplete } from '@/components/ui/address-autocomplete'

const countryOptions = [
  { value: 'CH', label: 'Svizzera' },
  { value: 'IT', label: 'Italia' },
  { value: 'DE', label: 'Germania' },
  { value: 'FR', label: 'Francia' },
  { value: 'AT', label: 'Austria' },
]

interface ClientFormProps {
  action: (prevState: ClientFormState, formData: FormData) => Promise<ClientFormState>
  client?: Client
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

export function ClientForm({ action, client, title, backHref }: ClientFormProps) {
  const [state, formAction] = useActionState(action, null)
  const [city, setCity] = useState(client?.city ?? '')
  const [postalCode, setPostalCode] = useState(client?.postalCode ?? '')
  const [country, setCountry] = useState(client?.country ?? 'CH')

  const e = state?.errors ?? {}

  return (
    <form action={formAction}>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Personal info */}
          <div>
            <h3 className="text-body font-medium text-ink-muted uppercase tracking-wide mb-4">
              Informazioni principali
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  name="name"
                  label="Nome / Ragione sociale"
                  required
                  defaultValue={client?.name}
                  error={e.name?.[0]}
                  placeholder="Mario Rossi / Rossi Costruzioni SA"
                />
              </div>
              <Input
                name="email"
                label="Email"
                type="email"
                defaultValue={client?.email ?? ''}
                error={e.email?.[0]}
                placeholder="mario@esempio.ch"
              />
              <Input
                name="phone"
                label="Telefono"
                type="tel"
                defaultValue={client?.phone ?? ''}
                placeholder="+41 79 000 00 00"
              />
              <Input
                name="vatNumber"
                label="Partita IVA / UID"
                defaultValue={client?.vatNumber ?? ''}
                placeholder="CHE-123.456.789"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-body font-medium text-ink-muted uppercase tracking-wide mb-4">
              Indirizzo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <AddressAutocomplete
                  name="address"
                  label="Via / Indirizzo"
                  defaultValue={client?.address ?? ''}
                  placeholder="Via Principale 10"
                  selectionMode="street"
                  onAddressSelect={(selection) => {
                    if (selection.city) setCity(selection.city)
                    if (selection.postalCode) setPostalCode(selection.postalCode)
                    if (selection.country) setCountry(selection.country)
                  }}
                />
              </div>
              <Input
                name="city"
                label="Città"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Lugano"
              />
              <Input
                name="postalCode"
                label="CAP"
                value={postalCode}
                onChange={(event) => setPostalCode(event.target.value)}
                placeholder="6900"
              />
              <Select
                name="country"
                label="Paese"
                options={countryOptions}
                value={country}
                onChange={(event) => setCountry(event.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Textarea
              name="notes"
              label="Note interne"
              defaultValue={client?.notes ?? ''}
              placeholder="Annotazioni interne sul cliente..."
              rows={3}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <ButtonLink href={backHref} variant="secondary">
              Annulla
            </ButtonLink>
          <SubmitButton label={client ? 'Salva modifiche' : 'Crea cliente'} />
        </CardFooter>
      </Card>
    </form>
  )
}
