'use client'

import { useActionState, useMemo, useState } from 'react'
import { useFormStatus } from 'react-dom'
import type { SupplierFormState } from '@/modules/suppliers/actions'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button, ButtonLink } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AddressAutocomplete } from '@/components/ui/address-autocomplete'
import { SUPPLIER_CATEGORIES, SUPPLIER_TAGS_BY_CATEGORY, normalizeSupplierCategory } from '@/lib/supplier-taxonomy'

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return <Button type="submit" loading={pending}>{label}</Button>
}

interface Props {
  action: (prevState: SupplierFormState, formData: FormData) => Promise<SupplierFormState>
  supplier?: {
    name: string; address?: string | null; email?: string | null; phone?: string | null
    vatNumber?: string | null; category?: string | null; tags?: string | null
    website?: string | null; notes?: string | null
  }
  title: string
  backHref: string
}

export function SupplierForm({ action, supplier, title, backHref }: Props) {
  const [state, formAction] = useActionState(action, null)
  const initialCategory = normalizeSupplierCategory(supplier?.category) ?? 'Materiali edili e ferramenta'
  const [category, setCategory] = useState<string>(initialCategory)
  const [selectedTags, setSelectedTags] = useState<string[]>(() =>
    (supplier?.tags ?? '').split(',').map((tag) => tag.trim()).filter(Boolean),
  )
  const [newTag, setNewTag] = useState('')
  const e = state?.errors ?? {}
  const suggestedTags = useMemo(() => SUPPLIER_TAGS_BY_CATEGORY[category] ?? [], [category])

  function toggleTag(tag: string) {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag])
  }

  function addTag() {
    const tag = newTag.trim().toLowerCase()
    if (!tag || selectedTags.includes(tag)) return
    setSelectedTags((prev) => [...prev, tag])
    setNewTag('')
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="tags" value={selectedTags.join(',')} />
      <Card>
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input name="name" label="Ragione sociale" required defaultValue={supplier?.name ?? ''} error={e.name?.[0]} />
            </div>
            <Input name="email" label="Email" type="email" defaultValue={supplier?.email ?? ''} error={e.email?.[0]} />
            <Input name="phone" label="Telefono" defaultValue={supplier?.phone ?? ''} />
            <Input name="vatNumber" label="Partita IVA / UID" defaultValue={supplier?.vatNumber ?? ''} />
            <Select
              name="category"
              label="Categoria"
              options={SUPPLIER_CATEGORIES.map((item) => ({ value: item, label: item }))}
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            />
            <div className="md:col-span-2">
              <AddressAutocomplete name="address" label="Indirizzo" defaultValue={supplier?.address ?? ''} />
            </div>
            <Input name="website" label="Sito web" type="url" placeholder="https://www.fornitore.ch" defaultValue={supplier?.website ?? ''} />
            <div className="md:col-span-2">
              <label className="block text-body font-medium text-ink mb-1">Specialita attive</label>
              <div className="flex min-h-11 flex-wrap gap-1.5 rounded-control border border-line bg-surface-raised p-2">
                {selectedTags.length === 0 && (
                  <span className="px-1 py-1 text-label text-ink-muted">Nessuna specialita selezionata</span>
                )}
                {selectedTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    aria-label={`Rimuovi la specialità ${tag}`}
                    className="inline-flex min-h-11 items-center rounded-full border border-action bg-action px-3 text-label font-medium text-ink-inverse"
                  >
                    {tag} ×
                  </button>
                ))}
              </div>
              {suggestedTags.some((tag) => !selectedTags.includes(tag)) && (
                <div className="mt-2">
                  <p className="mb-1 text-label font-medium text-ink-muted">Suggerimenti per categoria</p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedTags.filter((tag) => !selectedTags.includes(tag)).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        aria-label={`Aggiungi la specialità ${tag}`}
                        className="inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-3 text-label font-medium text-ink-muted transition-colors duration-state hover:border-action hover:text-action"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-2 flex gap-2">
                <Input label="Nuova tag" value={newTag} onChange={(event) => setNewTag(event.target.value)} placeholder="es. marmo" />
                <Button type="button" variant="secondary" onClick={addTag} disabled={!newTag.trim()} className="mt-6">Aggiungi</Button>
              </div>
              <p className="text-label text-ink-muted mt-1">Solo le specialita attive vengono salvate. I suggerimenti aiutano ad aggiungerne di nuove.</p>
            </div>
          </div>
          <Textarea name="notes" label="Note" defaultValue={supplier?.notes ?? ''} rows={2} />
        </CardContent>
        <CardFooter className="flex justify-between">
          <ButtonLink href={backHref} variant="secondary">Annulla</ButtonLink>
          <SubmitButton label={supplier ? 'Salva modifiche' : 'Crea fornitore'} />
        </CardFooter>
      </Card>
    </form>
  )
}
