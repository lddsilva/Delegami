'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import type { TemplateFormState } from '@/modules/quote-templates/actions'
import type { QuoteTemplateRow } from '@/modules/quote-templates/queries'
import { Button, ButtonLink } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { QuoteItemsEditor, type PriceCatalogItem, type QuoteItem } from '@/components/quotes/quote-items-editor'
import { EmojiPicker } from '@/components/quote-templates/emoji-picker'

const categoryValues = [
  'Bagno',
  'Cucina',
  'Pavimenti',
  'Pittura',
  'Impianti',
  'Muratura',
  'Strutture',
  'Infissi',
  'Isolamento',
  'Idraulica',
  'Finiture',
  'Manodopera',
  'Smaltimento',
  'Logistica',
  'Completa',
]


interface Props {
  action: (prevState: TemplateFormState, formData: FormData) => Promise<TemplateFormState>
  template?: QuoteTemplateRow | null
  initialItems?: QuoteItem[]
  priceItems: PriceCatalogItem[]
  sourceQuoteId?: string
  helperText?: string
  title: string
  backHref: string
}

function normalizeItems(items: QuoteItem[] | undefined): QuoteItem[] {
  return (items ?? []).map((item, idx) => ({
    ...item,
    itemType: item.itemType ?? 'ITEM',
    sortOrder: item.sortOrder ?? idx,
    quantity: item.quantity ?? (item.itemType === 'ITEM' ? 1 : undefined),
  }))
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return <Button type="submit" loading={pending}>{label}</Button>
}

function categoryOptions(current?: string | null) {
  const values = current && !categoryValues.includes(current)
    ? [current, ...categoryValues]
    : categoryValues
  return values.map((value) => ({ value, label: value }))
}

export function TemplateForm({
  action,
  template,
  initialItems,
  priceItems,
  sourceQuoteId,
  helperText,
  title,
  backHref,
}: Props) {
  const [state, formAction] = useActionState(action, null)
  const e = state?.errors ?? {}
  const items = normalizeItems(initialItems ?? template?.items)
  const isEditing = Boolean(template?.id)
  const isQuoteDerivedCreate = Boolean(sourceQuoteId && !isEditing)
  const templateType = template?.templateType ?? 'QUOTE'
  const scopeLevel = template?.scopeLevel ?? 'STANDARD'

  return (
    <form action={formAction}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {helperText && (
              <div className="rounded-control border border-action-border bg-action-surface px-4 py-3 text-body text-action">
                {helperText}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                name="name"
                label="Nome template"
                required
                defaultValue={template?.name ?? ''}
                placeholder="Ristrutturazione bagno / Sanitari"
                error={e.name?.[0]}
              />
              {isQuoteDerivedCreate ? (
                <input type="hidden" name="category" value={template?.category ?? 'Completa'} />
              ) : (
                <Select
                  name="category"
                  label="Categoria"
                  required
                  options={categoryOptions(template?.category)}
                  defaultValue={template?.category ?? 'Completa'}
                  error={e.category?.[0]}
                />
              )}
              {isQuoteDerivedCreate ? (
                <input type="hidden" name="subcategory" value={template?.subcategory ?? ''} />
              ) : (
                <Input
                  name="subcategory"
                  label="Sottocategoria (opzionale)"
                  defaultValue={template?.subcategory ?? ''}
                  placeholder="Es. Sanitari, Rivestimenti, Demolizione"
                  hint="Usata per raggruppare varianti dello stesso template."
                />
              )}
              <div className="md:col-span-2">
                <EmojiPicker name="emoji" defaultValue={template?.emoji ?? '📋'} />
              </div>
              <div className="md:col-span-2">
                <Textarea
                  name="description"
                  label="Descrizione interna"
                  defaultValue={template?.description ?? ''}
                  placeholder="Quando usare questo template e cosa controllare prima di applicarlo."
                  rows={3}
                />
              </div>
            </div>

            <input type="hidden" name="templateType" value={templateType} />
            <input type="hidden" name="scopeLevel" value={scopeLevel} />
            <input type="hidden" name="templateGroupKey" value={template?.templateGroupKey ?? ''} />
            <input type="hidden" name="version" value={template?.version ?? 1} />
            <input type="hidden" name="sortOrder" value={template?.sortOrder ?? 0} />
            {isQuoteDerivedCreate ? (
              <input type="hidden" name="isActive" value="on" />
            ) : (
              <label className="inline-flex items-center gap-2 text-body text-ink">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={template?.isActive ?? true}
                  className="rounded border-line-strong"
                />
                Attivo nei picker
              </label>
            )}
            {sourceQuoteId && <input type="hidden" name="sourceQuoteId" value={sourceQuoteId} />}
            {template?.sourceQuoteId && !sourceQuoteId && <input type="hidden" name="sourceQuoteId" value={template.sourceQuoteId} />}
            {state?.message && <p className="text-body text-negative">{state.message}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Voci del template</CardTitle>
          </CardHeader>
          <CardContent>
            <QuoteItemsEditor
              initialItems={items}
              marginPercent={0}
              taxRate={0}
              priceItems={priceItems}
              collapseReferencesByDefault
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <ButtonLink href={backHref} variant="secondary">Annulla</ButtonLink>
            <SubmitButton label={isEditing ? 'Salva template' : 'Crea template'} />
          </CardFooter>
        </Card>
      </div>
    </form>
  )
}
