import { notFound } from 'next/navigation'
import { getPriceItemById } from '@/modules/price-catalog/queries'
import { updatePriceItem } from '@/modules/price-catalog/actions'
import { PriceItemForm } from '@/components/price-catalog/price-item-form'

export default async function EditPriceItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = await getPriceItemById(id)
  if (!item) notFound()

  const action = updatePriceItem.bind(null, id)

  return (
    <div className="page-form">
      <div className="mb-6">
        <h1 className="text-display font-semibold text-ink">Modifica voce</h1>
        <p className="text-body text-ink-muted mt-1 font-mono">{item.description}</p>
      </div>
      <PriceItemForm action={action} item={item} title="Dati voce" />
    </div>
  )
}
