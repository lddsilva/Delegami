import { createSupplier } from '@/modules/suppliers/actions'
import { SupplierForm } from '@/components/suppliers/supplier-form'

export default function NewSupplierPage() {
  return (
    <div className="page-form">
      <div className="mb-6">
        <h1 className="text-display font-semibold text-ink">Nuovo fornitore</h1>
        <p className="text-body text-ink-muted mt-1">Aggiungi un fornitore per associarlo alle spese di progetto</p>
      </div>
      <SupplierForm action={createSupplier} title="Dati fornitore" backHref="/suppliers" />
    </div>
  )
}
