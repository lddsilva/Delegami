import { createPriceItem } from '@/modules/price-catalog/actions'
import { PriceItemForm } from '@/components/price-catalog/price-item-form'

export default async function NewPriceItemPage() {
  return (
    <div className="page-form">
      <div className="mb-6">
        <h1 className="text-display font-semibold text-ink">Nuova voce prezzario</h1>
        <p className="text-body text-ink-muted mt-1">Aggiungi una voce riutilizzabile nei preventivi</p>
      </div>
      <PriceItemForm action={createPriceItem} title="Dati voce" />
    </div>
  )
}
