'use client'

import { useActionState } from 'react'
import { upsertSettings } from '@/modules/settings/actions'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AddressAutocomplete } from '@/components/ui/address-autocomplete'
import { formatDateInput } from '@/lib/utils'

interface CompanySettingsData {
  name: string
  address?: string | null
  city?: string | null
  postalCode?: string | null
  country: string
  phone?: string | null
  email?: string | null
  iban?: string | null
  vatNumber?: string | null
  registrationNumber?: string | null
  accountantEmail?: string | null
  paymentTerms?: string | null
  quoteFooterText?: string | null
  invoiceFooterText?: string | null
  worksDirector?: string | null
  defaultQuoteNotes?: string | null
  defaultMargin?: number | null
  defaultTaxRate?: number | null
  defaultQuoteValidityDays?: number | null
  defaultInvoiceDueDays?: number | null
  eurChfRate?: number | null
  eurChfRateUpdatedAt?: Date | string | null
  defaultWorkerHourlyRate?: number | null
}

interface Props {
  settings: CompanySettingsData | null
  canEdit: boolean
}

export function SettingsForm({ settings, canEdit }: Props) {
  const [state, action, pending] = useActionState(upsertSettings, null)

  return (
    <form action={action} className="space-y-6">
      {state?.success && (
        <div className="rounded-control bg-positive-surface border border-positive-border px-4 py-3 text-body text-positive">
          Impostazioni salvate con successo.
        </div>
      )}
      {!canEdit && (
        <div className="rounded-control bg-attention-surface border border-attention-border px-4 py-3 text-body text-attention">
          Solo gli amministratori e manager possono modificare queste impostazioni.
        </div>
      )}

      <fieldset disabled={!canEdit} className="space-y-6 disabled:opacity-70">
      <Card>
        <CardHeader><CardTitle>Dati aziendali</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Ragione sociale"
            name="name"
            required
            defaultValue={settings?.name ?? ''}
            error={state?.errors?.name?.[0]}
          />
          <AddressAutocomplete
            label="Indirizzo"
            name="address"
            defaultValue={settings?.address ?? ''}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="CAP"
              name="postalCode"
              defaultValue={settings?.postalCode ?? ''}
            />
            <Input
              label="Città"
              name="city"
              defaultValue={settings?.city ?? ''}
            />
          </div>
          <Input
            label="Paese"
            name="country"
            defaultValue={settings?.country ?? 'CH'}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Contatti</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Telefono"
            name="phone"
            type="tel"
            defaultValue={settings?.phone ?? ''}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            defaultValue={settings?.email ?? ''}
            error={state?.errors?.email?.[0]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Dati fiscali e bancari</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Numero IVA (UID)"
            name="vatNumber"
            placeholder="CHE-000.000.000"
            defaultValue={settings?.vatNumber ?? ''}
          />
          <Input
            label="Numero di registro (REA / CH-501...)"
            name="registrationNumber"
            placeholder="CH-501.3.000.000-0"
            defaultValue={settings?.registrationNumber ?? ''}
          />
          <Input
            label="IBAN"
            name="iban"
            placeholder="CH00 0000 0000 0000 0000 0"
            defaultValue={settings?.iban ?? ''}
          />
          <Input
            label="Email commercialista"
            name="accountantEmail"
            type="email"
            placeholder="commercialista@studio.ch"
            defaultValue={settings?.accountantEmail ?? ''}
            error={state?.errors?.accountantEmail?.[0]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Preventivi</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Margine predefinito (%)"
              name="defaultMargin"
              type="number"
              min="0"
              max="100"
              step="0.1"
              defaultValue={settings?.defaultMargin ?? 0}
              placeholder="0"
              hint="Applicato automaticamente a nuovi preventivi"
            />
            <div>
              <Input
                label="IVA predefinita (%)"
                name="defaultTaxRate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                defaultValue={(settings as { defaultTaxRate?: number | null })?.defaultTaxRate ?? 8.1}
                placeholder="8.1"
                hint="0% = non assoggettato IVA · 8.1% = aliquota standard CH"
              />
              {((settings as { defaultTaxRate?: number | null })?.defaultTaxRate ?? 8.1) === 0 && (
                <p className="text-label text-attention mt-1">⚠ IVA 0%: i preventivi e le fatture non includeranno l&apos;IVA</p>
              )}
            </div>
            <Input
              label="Validita preventivi (giorni)"
              name="defaultQuoteValidityDays"
              type="number"
              min="1"
              max="180"
              step="1"
              defaultValue={settings?.defaultQuoteValidityDays ?? 30}
              hint="Usato per proporre automaticamente la data 'Valido fino al'"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Fatture e cambi</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Scadenza fatture (giorni)"
            name="defaultInvoiceDueDays"
            type="number"
            min="0"
            max="180"
            step="1"
            defaultValue={settings?.defaultInvoiceDueDays ?? 5}
            hint="Usato per proporre automaticamente la data di scadenza"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Cambio EUR -> CHF"
              name="eurChfRate"
              type="number"
              min="0"
              step="0.0001"
              defaultValue={settings?.eurChfRate ?? 0.9119}
              hint="Riferimento ECB: 1 EUR = 0.9119 CHF al 22.05.2026"
            />
            <Input
              label="Aggiornato il"
              name="eurChfRateUpdatedAt"
              type="date"
              defaultValue={formatDateInput(settings?.eurChfRateUpdatedAt ?? '2026-05-22')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Operai</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Tariffa oraria predefinita (CHF)"
            name="defaultWorkerHourlyRate"
            type="number"
            min="0"
            step="0.5"
            defaultValue={settings?.defaultWorkerHourlyRate ?? 25}
            placeholder="25"
            hint="Pre-compila la tariffa oraria quando crei un nuovo account Operaio"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Cantiere</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Direttore dei lavori"
            name="worksDirector"
            placeholder="Marcos Zanetti Filho"
            defaultValue={settings?.worksDirector ?? ''}
            hint="Appare nel blocco firma dei preventivi PDF"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Testi predefiniti per i documenti</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            label="Condizioni di pagamento"
            name="paymentTerms"
            rows={3}
            placeholder="Pagamento entro 30 giorni dalla data fattura."
            defaultValue={settings?.paymentTerms ?? ''}
          />
          <Textarea
            label="Testo piè di pagina preventivi"
            name="quoteFooterText"
            rows={3}
            defaultValue={settings?.quoteFooterText ?? ''}
          />
          <Textarea
            label="Testo piè di pagina fatture"
            name="invoiceFooterText"
            rows={3}
            defaultValue={settings?.invoiceFooterText ?? ''}
          />
          <Textarea
            label="Note predefinite preventivi"
            name="defaultQuoteNotes"
            rows={4}
            placeholder={"Responsabile per la sicurezza cantiere: Marcos Zanetti Filho\n\nI lavori verranno eseguiti nel rispetto delle normative vigenti in materia di sicurezza (LCA/CFSL)."}
            defaultValue={(settings as { defaultQuoteNotes?: string | null })?.defaultQuoteNotes ?? ''}
            hint="Pre-compila il campo 'Note e condizioni' di ogni nuovo preventivo. Modificabile o eliminabile per ogni preventivo individualmente."
          />
        </CardContent>
      </Card>

      {state?.errors?._?.[0] && <p className="text-body text-negative">{state.errors._[0]}</p>}

      {canEdit && (
        <div className="flex justify-end">
          <Button type="submit" loading={pending}>Salva impostazioni</Button>
        </div>
      )}
      </fieldset>
    </form>
  )
}
