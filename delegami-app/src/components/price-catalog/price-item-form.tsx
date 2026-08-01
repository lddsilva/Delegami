'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import type { PriceItemFormState } from '@/modules/price-catalog/actions'
import { getNextPriceCode } from '@/modules/price-catalog/actions'
import { PRICE_CATALOG_CATEGORIES, normalizePriceCategory } from '@/lib/price-catalog-taxonomy'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export const UNITS = ['m²', 'm³', 'ml', 'h', 'pz', 'kg', 't', 'l', 'set', 'corpo']

const QUALITY_OPTIONS = [
  { value: '', label: 'Nessuna fascia (servizio / manodopera)' },
  { value: 'ESSENTIAL', label: 'Essenziale' },
  { value: 'STANDARD', label: 'Standard' },
  { value: 'PREMIUM', label: 'Premium' },
]

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return <Button type="submit" loading={pending}>{label}</Button>
}

function tierFromLegacy(qualityLevel?: string | null) {
  if (qualityLevel === 'LOW') return 'ESSENTIAL'
  if (qualityLevel === 'MEDIUM') return 'STANDARD'
  if (qualityLevel === 'HIGH') return 'PREMIUM'
  return ''
}

interface Props {
  action: (prevState: PriceItemFormState, formData: FormData) => Promise<PriceItemFormState>
  item?: {
    code?: string | null
    category: string
    description: string
    unit: string
    unitCost: number
    qualityLevel?: string | null
    productTier?: string | null
    notes?: string | null
    links?: string | null
    isActive: boolean
  }
  title: string
}

export function PriceItemForm({ action, item, title }: Props) {
  const [state, formAction] = useActionState(action, null)
  const e = state?.errors ?? {}

  const [category, setCategory] = useState(normalizePriceCategory(item?.category))
  const [code, setCode] = useState(item?.code ?? '')
  const [autoCode, setAutoCode] = useState(!item?.code)
  const [isActive, setIsActive] = useState(item?.isActive ?? true)

  useEffect(() => {
    if (!autoCode || !category) return
    getNextPriceCode(category).then(setCode)
  }, [autoCode, category])

  function regenerateCode() {
    setAutoCode(true)
    getNextPriceCode(category).then(setCode)
  }

  return (
    <form action={formAction}>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-body font-medium text-ink mb-1">
              Categoria <span className="text-negative">*</span>
            </label>
            <select
              name="category"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value)
                setAutoCode(true)
              }}
              className="w-full min-h-11 border border-line-strong rounded-control px-3 py-2 text-body outline-none focus:border-action focus:ring-1 focus:ring-action"
              required
            >
              {PRICE_CATALOG_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {e.category && <p className="text-label text-negative mt-1">{e.category[0]}</p>}
            <p className="text-label text-ink-muted mt-1">Lista chiusa per mantenere ordine e codici coerenti.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-end gap-2">
              <Input
                name="code"
                label="Codice"
                placeholder="es. PAV-GRE-001"
                value={code}
                readOnly
                className="bg-surface-raised font-mono"
                hint="Generato automaticamente dalla categoria"
              />
              <Button type="button" variant="secondary" onClick={regenerateCode}>
                Rigenera
              </Button>
            </div>

            <div>
              <label className="block text-body font-medium text-ink mb-1">
                Unità di misura <span className="text-negative">*</span>
              </label>
              <input
                name="unit"
                list="price-units-list"
                defaultValue={item?.unit ?? 'm²'}
                placeholder="m², pz, ml, h, corpo..."
                className="w-full min-h-11 border border-line-strong rounded-control px-3 py-2 text-body outline-none focus:border-action focus:ring-1 focus:ring-action"
                required
                autoComplete="off"
              />
              <datalist id="price-units-list">
                {UNITS.map((u) => <option key={u} value={u} />)}
              </datalist>
              {e.unit && <p className="text-label text-negative mt-1">{e.unit[0]}</p>}
            </div>
          </div>

          <Input
            name="description"
            label="Descrizione"
            required
            defaultValue={item?.description ?? ''}
            error={e.description?.[0]}
            placeholder="es. Gres 60x60 effetto cemento antracite"
          />

          <div>
            <label className="block text-body font-medium text-ink mb-1">Fascia materiale</label>
            <select
              name="productTier"
              defaultValue={item?.productTier ?? tierFromLegacy(item?.qualityLevel)}
              className="w-full min-h-11 border border-line-strong rounded-control px-3 py-2 text-body outline-none focus:border-action focus:ring-1 focus:ring-action"
            >
              {QUALITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="text-label text-ink-muted mt-1">
              La fascia indica la gamma del materiale. La complessità del lavoro vive nei template.
            </p>
          </div>

          <Input
            name="unitCost"
            label="Costo unitario (CHF)"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={item?.unitCost ?? ''}
            error={e.unitCost?.[0]}
            hint="Costo interno di riferimento; il prezzo al cliente viene calcolato applicando il margine."
          />

          <Textarea
            name="notes"
            label="Note interne"
            defaultValue={item?.notes ?? ''}
            rows={2}
            placeholder="Fornitore, validità del prezzo, riferimento articolo, codice..."
          />

          <div>
            <label className="block text-body font-medium text-ink mb-1">
              Link prodotto / fornitore
            </label>
            <textarea
              name="links"
              rows={3}
              defaultValue={item?.links ?? ''}
              placeholder={'https://www.bauhaus.ch/it/p/...\nhttps://www.hornbach.ch/... (un URL per riga)'}
              className="w-full min-h-11 border border-line-strong rounded-control px-3 py-2 text-body text-action outline-none focus:border-action focus:ring-1 focus:ring-action resize-none"
            />
            <p className="text-label text-ink-muted mt-1">Un URL per riga; saranno cliccabili nella lista del prezzario.</p>
          </div>

          <div className="flex min-h-11 items-center gap-3 rounded-control border border-line bg-surface-raised p-3">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="w-4 h-4 rounded border-line-strong text-action focus:ring-action"
            />
            <div>
              <label htmlFor="isActive" className="text-body font-medium text-ink cursor-pointer">
                Voce attiva
              </label>
              <p className="text-label text-ink-muted">
                {isActive
                  ? 'Disponibile nei preventivi per selezione rapida'
                  : 'Nascosta dai preventivi (storico/archivio)'}
              </p>
            </div>
          </div>
          {!isActive && <input type="hidden" name="isActive" value="false" />}

          {state?.message && <p className="text-body text-negative">{state.message}</p>}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href="/price-catalog"><Button type="button" variant="secondary">Annulla</Button></Link>
          <SubmitButton label={item ? 'Salva modifiche' : 'Aggiungi al catalogo'} />
        </CardFooter>
      </Card>
    </form>
  )
}
