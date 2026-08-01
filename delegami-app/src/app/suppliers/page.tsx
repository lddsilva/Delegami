import Link from 'next/link'
import { Plus, Truck } from 'lucide-react'
import { getSuppliers } from '@/modules/suppliers/queries'
import { Button } from '@/components/ui/button'
import { getSession, canMutate } from '@/lib/auth'
import { SuppliersClient } from '@/components/suppliers/suppliers-client'

export default async function SuppliersPage() {
  const [suppliers, session] = await Promise.all([getSuppliers(), getSession()])
  const canEdit = session ? canMutate(session.role) : false

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-title sm:text-display font-semibold text-ink">Fornitori</h1>
          <p className="text-body text-ink-muted mt-0.5">{suppliers.length} fornitori registrati</p>
        </div>
        {canEdit && (
          <Link href="/suppliers/new">
            <Button aria-label="Nuovo fornitore" size="sm">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Nuovo fornitore</span>
            </Button>
          </Link>
        )}
      </div>

      {suppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-line rounded-surface">
          <Truck className="w-12 h-12 text-ink-subtle mb-4" />
          <h3 className="text-body font-medium text-ink mb-1">Nessun fornitore</h3>
          <p className="text-body text-ink-muted mb-4">Aggiungi i fornitori per associarli alle spese.</p>
          {canEdit && <Link href="/suppliers/new"><Button><Plus className="w-4 h-4" /> Aggiungi fornitore</Button></Link>}
        </div>
      ) : (
        <SuppliersClient suppliers={suppliers} canEdit={canEdit} />
      )}
    </div>
  )
}
