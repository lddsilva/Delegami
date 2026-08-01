import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileJson, ListChecks, Printer, Sparkles, Trash2 } from 'lucide-react'
import { getProjectById } from '@/modules/projects/queries'
import { getShoppingListByProjectId } from '@/modules/shopping-lists/queries'
import { getSuppliers } from '@/modules/suppliers/queries'
import { getQuoteFamilies } from '@/modules/quotes/queries'
import { getSession, canMutate, canDelete } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { ShoppingListClient } from '@/components/shopping-lists/shopping-list-client'
import { ShoppingListViewer } from '@/components/shopping-lists/shopping-list-viewer'
import { GenerateShoppingListForm } from '@/components/shopping-lists/generate-form'
import { DeleteShoppingListButton } from '@/components/shopping-lists/delete-list-button'
import { ExportShoppingAiButton } from '@/components/shopping-lists/export-shopping-ai-button'

export default async function ShoppingListPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ edit?: string }>
}) {
  const { id } = await params
  const { edit } = await searchParams
  const [project, list, suppliers, session, quoteFamilies] = await Promise.all([
    getProjectById(id),
    getShoppingListByProjectId(id),
    getSuppliers(),
    getSession(),
    getQuoteFamilies(id),
  ])
  if (!project) notFound()
  if (!session) redirect('/login')

  const canEdit = canMutate(session.role)
  const canDel = canDelete(session.role)

  const approvedQuotes = quoteFamilies.filter((q) => q.status === 'APPROVED' || q.status === 'INVOICED')
  const supplierOptions = suppliers.map((s) => ({ id: s.id, name: s.name, website: s.website }))
  const isEditMode = Boolean(list && canEdit && edit === '1')

  return (
    <div className="page-content">
      <div className="mb-5">
        <Link href={`/projects/${id}`} className="mb-3 flex items-center gap-1.5 text-body text-ink-muted hover:text-ink transition-colors">
          <ArrowLeft className="h-4 w-4" />
          {project.name}
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-title sm:text-display font-semibold text-ink flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-action" />
              Lista acquisti
            </h1>
            <p className="text-body text-ink-muted mt-0.5">{project.client.name} · {project.name}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canEdit && (
              <>
                <ExportShoppingAiButton projectId={id} label={project.name} />
                <Link href={`/projects/${id}/shopping-list/import`}>
                  <Button variant="secondary" size="sm"><FileJson className="w-4 h-4" /> Importa da IA</Button>
                </Link>
                {list && (
                  <Link href={isEditMode ? `/projects/${id}/shopping-list` : `/projects/${id}/shopping-list?edit=1`}>
                    <Button variant={isEditMode ? 'ghost' : 'primary'} size="sm">
                      {isEditMode ? 'Visualizza' : 'Modifica'}
                    </Button>
                  </Link>
                )}
              </>
            )}
            {list && (
              <>
              <Link href={`/projects/${id}/shopping-list/print`} target="_blank">
                <Button variant="secondary" size="sm"><Printer className="w-4 h-4" /> Stampa PDF</Button>
              </Link>
              {canDel && <DeleteShoppingListButton listId={list.id} />}
              </>
            )}
          </div>
        </div>
      </div>

      {!list ? (
        <div className="rounded-surface border border-dashed border-line bg-surface p-8 sm:p-12 text-center">
          <ListChecks className="w-10 h-10 text-ink-subtle mx-auto mb-3" />
          <h2 className="text-body font-medium text-ink mb-1">Nessuna lista per questa opera</h2>
          <p className="text-body text-ink-muted mb-5 max-w-md mx-auto">
            {approvedQuotes.length > 0
              ? 'Genera automaticamente dalla preventivo approvato, oppure crea una lista vuota e aggiungi articoli manualmente.'
              : 'Approva prima un preventivo per poter generare automaticamente la lista, oppure crea una lista vuota qui sotto.'}
          </p>
          {canEdit && (
            <GenerateShoppingListForm
              projectId={id}
              approvedQuotes={approvedQuotes.map((q) => ({
                id: q.id,
                quoteNumber: q.quoteNumber,
                version: q.version,
                total: q.total,
              }))}
              allowBlank
            />
          )}
        </div>
      ) : (
        <>
          {list.sourceQuoteId && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-control border border-action-border bg-action-surface px-3 py-1.5 text-label text-action">
              <Sparkles className="w-3.5 h-3.5" />
              Lista generata dal preventivo
              <Link href={`/quotes/${list.sourceQuoteId}`} className="font-medium underline">
                vedi origine
              </Link>
            </div>
          )}

          {isEditMode ? (
            <ShoppingListClient
              projectId={id}
              listId={list.id}
              listNotes={list.notes}
              items={list.items.map((item, index) => ({
                id: item.id,
                description: item.description,
                unit: item.unit,
                qtyPlanned: item.qtyPlanned,
                qtyPurchased: item.qtyPurchased,
                unitPriceEstimated: item.unitPriceEstimated,
                unitPricePaid: item.unitPricePaid,
                supplierId: item.supplierId,
                supplier: item.supplier
                  ? { id: item.supplier.id, name: item.supplier.name, website: item.supplier.website }
                  : null,
                status: item.status,
                sourceUrl: item.sourceUrl,
                notes: item.notes,
                expenseId: item.expenseId,
                sortOrder: item.sortOrder ?? index,
                sourceQuoteItemId: item.sourceQuoteItemId,
              }))}
              suppliers={supplierOptions}
              canEdit={canEdit}
            />
          ) : (
            <ShoppingListViewer
              projectId={id}
              notes={list.notes}
              items={list.items.map((item) => ({
                id: item.id,
                description: item.description,
                unit: item.unit,
                qtyPlanned: item.qtyPlanned,
                qtyPurchased: item.qtyPurchased,
                unitPriceEstimated: item.unitPriceEstimated,
                unitPricePaid: item.unitPricePaid,
                supplierId: item.supplierId,
                supplier: item.supplier
                  ? { id: item.supplier.id, name: item.supplier.name, website: item.supplier.website }
                  : null,
                status: item.status,
                sourceUrl: item.sourceUrl,
                notes: item.notes,
                expenseId: item.expenseId,
              }))}
              canEdit={canEdit}
            />
          )}

          {isEditMode && canEdit && approvedQuotes.length > 0 && (
            <div className="mt-8 rounded-control border border-attention-border bg-attention-surface/50 p-3 text-label text-attention flex flex-col sm:flex-row sm:items-center gap-2">
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span className="flex-1">Rigenerare dalla preventivo sostituirà la lista corrente. Le modifiche manuali verranno perse.</span>
              <GenerateShoppingListForm
                projectId={id}
                approvedQuotes={approvedQuotes.map((q) => ({
                  id: q.id,
                  quoteNumber: q.quoteNumber,
                  version: q.version,
                  total: q.total,
                }))}
                buttonLabel="Rigenera"
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
