import Link from 'next/link'
import { Plus, BookOpen } from 'lucide-react'
import { getAllPriceItems } from '@/modules/price-catalog/queries'
import { Button } from '@/components/ui/button'
import { getSession, canMutate, canDelete } from '@/lib/auth'
import { PriceCatalogClient } from '@/components/price-catalog/price-catalog-client'

export default async function PriceCatalogPage() {
  const [items, session] = await Promise.all([getAllPriceItems(), getSession()])
  const canEdit = session ? canMutate(session.role) : false
  const canDel = session ? canDelete(session.role) : false

  return (
    <div className="page-wide">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-display font-semibold text-ink">Prezzario</h1>
          <p className="text-body text-ink-muted mt-1">
            {items.filter((i) => i.isActive).length} voci attive · {items.length} totali
          </p>
        </div>
        {canEdit && (
          <Link href="/price-catalog/new">
            <Button><Plus className="w-4 h-4" /> Aggiungi voce</Button>
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-line rounded-surface">
          <BookOpen className="w-12 h-12 text-ink-subtle mb-4" />
          <h3 className="text-body font-medium text-ink mb-1">Prezzario vuoto</h3>
          <p className="text-body text-ink-muted mb-4">Aggiungi le voci tipiche dei tuoi lavori per velocizzare i preventivi.</p>
          {canEdit && <Link href="/price-catalog/new"><Button><Plus className="w-4 h-4" /> Aggiungi prima voce</Button></Link>}
        </div>
      ) : (
        <PriceCatalogClient items={items} canEdit={canEdit} canDelete={canDel} />
      )}
    </div>
  )
}
