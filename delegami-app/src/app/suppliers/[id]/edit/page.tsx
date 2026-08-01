import { notFound } from 'next/navigation'
import { getSupplierById } from '@/modules/suppliers/queries'
import { updateSupplier } from '@/modules/suppliers/actions'
import { SupplierForm } from '@/components/suppliers/supplier-form'

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supplier = await getSupplierById(id)
  if (!supplier) notFound()

  const action = updateSupplier.bind(null, id)

  return (
    <div className="page-form">
      <div className="mb-6">
        <h1 className="text-display font-semibold text-ink">Modifica fornitore</h1>
        <p className="text-body text-ink-muted mt-1">{supplier.name}</p>
      </div>
      <SupplierForm
        action={action}
        supplier={supplier}
        title="Dati fornitore"
        backHref={`/suppliers/${id}`}
      />
    </div>
  )
}
