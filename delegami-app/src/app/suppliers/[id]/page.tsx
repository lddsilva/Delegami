import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import { getSupplierById } from '@/modules/suppliers/queries'
import { Button, ButtonLink } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DeleteSupplierButton } from '@/components/suppliers/delete-supplier-button'
import { expenseAmountChf, formatCurrency, formatDate, mapsUrl } from '@/lib/utils'
import { getSession, canMutate, canDelete } from '@/lib/auth'

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [supplier, session] = await Promise.all([getSupplierById(id), getSession()])
  if (!supplier) notFound()
  const canEdit = session ? canMutate(session.role) : false
  const canDel = session ? canDelete(session.role) : false

  const totalSpent = supplier.expenses.reduce((s, e) => s + expenseAmountChf(e), 0)

  return (
    <div className="page-content">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <ButtonLink href="/suppliers" variant="ghost" size="sm" aria-label="Torna indietro"><ArrowLeft className="w-4 h-4" /></ButtonLink>
          <div>
            <h1 className="text-title sm:text-display font-semibold text-ink">{supplier.name}</h1>
            {supplier.category && <p className="text-body text-ink-muted mt-0.5">{supplier.category}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canDel && <DeleteSupplierButton id={id} />}
          {canEdit && (
            <Link href={`/suppliers/${id}/edit`}><Button variant="secondary" size="sm"><Pencil className="w-4 h-4" /> Modifica</Button></Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Contatti</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-body">
              {supplier.address && <div className="flex justify-between"><span className="text-ink-muted">Indirizzo</span><a href={mapsUrl(supplier.address)} target="_blank" rel="noopener noreferrer" className="text-action hover:underline text-right">{supplier.address}</a></div>}
              {supplier.email && <div className="flex justify-between"><span className="text-ink-muted">Email</span><a href={`mailto:${supplier.email}`} className="text-action hover:underline">{supplier.email}</a></div>}
              {supplier.phone && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-ink-muted">Telefono</span>
                  <a href={`tel:${supplier.phone.replace(/\s/g, '')}`} className="text-action hover:underline numeric">
                    {supplier.phone}
                  </a>
                </div>
              )}
              {supplier.vatNumber && <div className="flex justify-between"><span className="text-ink-muted">UID / P.IVA</span><span className="font-mono">{supplier.vatNumber}</span></div>}
              {supplier.website && <div className="flex justify-between"><span className="text-ink-muted">Sito web</span><a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-action hover:underline truncate max-w-[200px]">{supplier.website.replace(/^https?:\/\//, '')}</a></div>}
              {supplier.tags && (
                <div className="flex justify-between items-start gap-2">
                  <span className="text-ink-muted shrink-0">Tag</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {supplier.tags.split(',').map((t) => t.trim()).filter(Boolean).map((tag) => (
                      <span key={tag} className="px-1.5 py-0.5 rounded text-label bg-action-surface text-action border border-action-border">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span className="text-ink-muted">Totale speso</span>
                <span className="text-action">{formatCurrency(totalSpent)}</span>
              </div>
            </CardContent>
          </Card>
          {supplier.notes && (
            <Card>
              <CardHeader><CardTitle>Note</CardTitle></CardHeader>
              <CardContent><p className="text-body text-ink-muted whitespace-pre-wrap">{supplier.notes}</p></CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Spese ({supplier.expenses.length})</CardTitle></CardHeader>
            {supplier.expenses.length === 0 ? (
              <div className="px-6 py-8 text-body text-ink-muted text-center">Nessuna spesa registrata</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-body">
                  <thead>
                    <tr className="border-b border-line text-label text-ink-muted uppercase">
                      <th className="text-left px-4 sm:px-6 py-2">Descrizione</th>
                      <th className="hidden sm:table-cell text-left px-3 py-2">Progetto</th>
                      <th className="hidden sm:table-cell text-right px-3 py-2">Data</th>
                      <th className="text-right px-4 sm:px-6 py-2">Importo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {supplier.expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-surface-raised">
                        <td className="px-4 sm:px-6 py-2.5">
                          <Link href={`/expenses/${exp.id}`} className="text-action hover:underline">{exp.description}</Link>
                          <p className="text-label text-ink-muted sm:hidden">{exp.project?.name ?? 'Spesa aziendale'} · {formatDate(exp.date)}</p>
                        </td>
                        <td className="hidden sm:table-cell px-3 py-2.5 text-ink-muted">
                          {exp.project ? (
                            <Link href={`/projects/${exp.project.id}`} className="hover:text-action">{exp.project.name}</Link>
                          ) : (
                            <span className="text-ink-muted italic">Spesa aziendale</span>
                          )}
                        </td>
                        <td className="hidden sm:table-cell px-3 py-2.5 text-right text-ink-muted">{formatDate(exp.date)}</td>
                        <td className="px-4 sm:px-6 py-2.5 text-right font-medium">
                          {formatCurrency(expenseAmountChf(exp))}
                          {exp.currency !== 'CHF' && (
                            <p className="text-label font-normal text-ink-muted">{exp.amount.toFixed(2)} {exp.currency}</p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
