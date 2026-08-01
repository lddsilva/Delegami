import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getSession, canMutate } from '@/lib/auth'
import { getProjects } from '@/modules/projects/queries'
import { getSuppliers } from '@/modules/suppliers/queries'
import { getReceiptImportBatches } from '@/modules/receipt-imports/queries'
import { ReceiptImportClient } from '@/components/receipt-inbox/receipt-import-client'

export default async function ReceiptImportPage() {
  const session = await getSession()
  if (!session || !canMutate(session.role)) redirect('/receipts')

  const [projects, suppliers, batches] = await Promise.all([
    getProjects(),
    getSuppliers(),
    getReceiptImportBatches(),
  ])

  return (
    <div className="page-form">
      <div className="mb-6">
        <Link href="/receipts" className="mb-3 flex items-center gap-1.5 text-body text-ink-muted transition-colors hover:text-ink">
          <ArrowLeft className="h-4 w-4" />
          Scontrini
        </Link>
        <h1 className="text-title font-semibold text-ink sm:text-display">Importa scontrini da IA</h1>
        <p className="mt-0.5 text-body text-ink-muted">
          Analizza le foto fuori dal gestionale, rivedi i dati qui e crea le spese con allegati.
        </p>
      </div>

      <ReceiptImportClient
        projects={projects.map((project) => ({
          id: project.id,
          name: project.name,
          clientName: project.client.name,
          referenceCode: project.referenceCode,
        }))}
        suppliers={suppliers.map((supplier) => ({
          id: supplier.id,
          name: supplier.name,
          category: supplier.category,
        }))}
        batches={batches}
      />
    </div>
  )
}
