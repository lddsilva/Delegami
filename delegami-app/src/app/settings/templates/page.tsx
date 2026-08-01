import Link from 'next/link'
import { Pencil, Layers, FileText } from 'lucide-react'
import { getTemplateManagerRows, getQuotesForTemplatePicker } from '@/modules/quote-templates/queries'
import { toggleTemplateActive } from '@/modules/quote-templates/actions'
import { getSession, canMutate, canDelete } from '@/lib/auth'
import { cn, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TemplateArchiveToggle } from '@/components/quote-templates/template-archive-toggle'
import { DeleteTemplateButton } from '@/components/quote-templates/delete-template-button'
import { ClearTemplateSourceButton } from '@/components/quote-templates/clear-template-source-button'
import { CreateTemplateMenu } from '@/components/quote-templates/create-template-menu'

type TemplateRow = Awaited<ReturnType<typeof getTemplateManagerRows>>[number]

const scopeLabel: Record<string, string> = {
  LIGHT: 'Leggero',
  STANDARD: 'Standard',
  COMPLETE: 'Completo',
  SERVICE: 'Servizio',
}

const scopeVariant: Record<string, 'gray' | 'blue' | 'green' | 'amber'> = {
  LIGHT: 'amber',
  STANDARD: 'blue',
  COMPLETE: 'green',
  SERVICE: 'gray',
}

function scopeFor(template: { scopeLevel?: string | null; qualityLevel: string }) {
  if (template.scopeLevel) return template.scopeLevel
  if (template.qualityLevel === 'LOW') return 'LIGHT'
  if (template.qualityLevel === 'HIGH') return 'COMPLETE'
  if (template.qualityLevel === 'MEDIUM') return 'STANDARD'
  return 'SERVICE'
}

function groupByCategory(templates: TemplateRow[]) {
  return Array.from(
    templates.reduce((map, template) => {
      const key = template.category || 'Senza categoria'
      const rows = map.get(key) ?? []
      rows.push(template)
      map.set(key, rows)
      return map
    }, new Map<string, TemplateRow[]>()),
  ).sort(([a], [b]) => a.localeCompare(b, 'it'))
}

function SourceQuoteLink({ template }: { template: TemplateRow }) {
  if (!template.sourceQuoteId) return null
  if (template.sourceQuoteExists) {
    return (
      <Link href={`/quotes/${template.sourceQuoteId}`} aria-label="Preventivo origine">
        <Button variant="ghost" size="sm"><FileText className="h-3.5 w-3.5" /></Button>
      </Link>
    )
  }
  return (
    <div className="flex items-center gap-0.5">
      <Button variant="ghost" size="sm" disabled aria-label="Preventivo origine eliminato">
        <FileText className="h-3.5 w-3.5 text-ink-subtle" />
      </Button>
      <ClearTemplateSourceButton id={template.id} />
    </div>
  )
}

function TemplateActions({
  template,
  canEdit,
  canDeleteTemplate,
}: {
  template: TemplateRow
  canEdit: boolean
  canDeleteTemplate: boolean
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <SourceQuoteLink template={template} />
      {canEdit && (
        <>
          <Link href={`/settings/templates/${template.id}/edit`}>
            <Button variant="ghost" size="sm"><Pencil className="h-3.5 w-3.5" /></Button>
          </Link>
          <form action={toggleTemplateActive.bind(null, template.id)}>
            <Button type="submit" variant="secondary" size="sm">
              {template.isActive ? 'Disattiva' : 'Attiva'}
            </Button>
          </form>
          {canDeleteTemplate && (
            <DeleteTemplateButton id={template.id} name={template.name} />
          )}
        </>
      )}
    </div>
  )
}

function TemplateMobileGroups({
  groups,
  canEdit,
  canDeleteTemplate,
  archived = false,
}: {
  groups: [string, TemplateRow[]][]
  canEdit: boolean
  canDeleteTemplate: boolean
  archived?: boolean
}) {
  return (
    <div className="sm:hidden divide-y divide-line">
      {groups.map(([category, rows]) => (
        <div key={category} className="p-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-label font-semibold uppercase tracking-wide text-ink-muted">{category}</h2>
            <Badge variant="gray">{rows.length}</Badge>
          </div>
          <div className="space-y-2">
            {rows.map((template) => {
              const itemCount = template.items.filter((i) => i.itemType === 'ITEM').length
              const sectionCount = template.items.filter((i) => i.itemType === 'SECTION').length
              return (
                <div key={template.id} className={cn(archived ? 'bg-surface-raised opacity-80' : 'bg-surface', 'rounded-control border border-line p-3')}>
                  <div className="flex items-start gap-2">
                    <span className="text-title">{template.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-body font-medium text-ink leading-snug">{template.name}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Badge variant={template.templateType === 'QUOTE' ? 'blue' : 'emerald'}>
                          {template.templateType === 'QUOTE' ? 'Preventivo' : 'Fattura'}
                        </Badge>
                        <Badge variant={scopeVariant[scopeFor(template)] ?? 'gray'}>
                          {scopeLabel[scopeFor(template)] ?? scopeFor(template)}
                        </Badge>
                        {template.subcategory && <Badge variant="gray">{template.subcategory}</Badge>}
                        {archived && <Badge variant="gray">Archiviato</Badge>}
                      </div>
                      <p className="mt-1 text-label text-ink-muted">
                        {sectionCount} sezioni - {itemCount} articoli - {formatDate(template.updatedAt)}
                      </p>
                    </div>
                  </div>
                  {(canEdit || template.sourceQuoteId) && (
                    <div className="mt-3">
                      <TemplateActions
                        template={template}
                        canEdit={canEdit}
                        canDeleteTemplate={canDeleteTemplate}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function TemplateDesktopGroups({
  groups,
  canEdit,
  canDeleteTemplate,
  archived = false,
}: {
  groups: [string, TemplateRow[]][]
  canEdit: boolean
  canDeleteTemplate: boolean
  archived?: boolean
}) {
  return (
    <div className="hidden sm:block">
      {groups.map(([category, rows], index) => (
        <div key={category} className={cn(index > 0 && 'border-t border-line')}>
          <div className="flex items-center justify-between gap-3 bg-surface-raised/70 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2">
              <h2 className="text-label font-semibold uppercase tracking-wide text-ink-muted">{category}</h2>
              <Badge variant="gray">{rows.length}</Badge>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-line">
                  <th className="px-4 py-2.5 text-left text-label font-medium uppercase tracking-wide text-ink-muted sm:px-6">Template</th>
                  <th className="px-3 py-2.5 text-left text-label font-medium uppercase tracking-wide text-ink-muted">Tipo</th>
                  <th className="hidden px-3 py-2.5 text-left text-label font-medium uppercase tracking-wide text-ink-muted md:table-cell">Sottocategoria</th>
                  <th className="hidden px-3 py-2.5 text-left text-label font-medium uppercase tracking-wide text-ink-muted lg:table-cell">Complessita</th>
                  <th className="hidden px-3 py-2.5 text-left text-label font-medium uppercase tracking-wide text-ink-muted lg:table-cell">Voci</th>
                  <th className="hidden px-3 py-2.5 text-left text-label font-medium uppercase tracking-wide text-ink-muted sm:table-cell">Aggiornato</th>
                  <th className="px-4 py-2.5 text-right text-label font-medium uppercase tracking-wide text-ink-muted sm:px-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((template) => {
                  const itemCount = template.items.filter((i) => i.itemType === 'ITEM').length
                  const sectionCount = template.items.filter((i) => i.itemType === 'SECTION').length
                  return (
                    <tr key={template.id} className={archived ? 'bg-surface-raised text-ink-muted' : 'hover:bg-surface-raised'}>
                      <td className="px-4 py-3 sm:px-6">
                        <div className="flex items-center gap-2">
                          <span className="text-title">{template.emoji}</span>
                          <div className="min-w-0">
                            <p className="truncate text-body font-medium text-ink">{template.name}</p>
                            <p className="truncate text-label text-ink-muted">
                              {template.templateGroupKey || 'nessun gruppo'}
                              {archived && ' - archiviato'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant={template.templateType === 'QUOTE' ? 'blue' : 'emerald'}>
                          {template.templateType === 'QUOTE' ? 'Preventivo' : 'Fattura'}
                        </Badge>
                      </td>
                      <td className="hidden px-3 py-3 text-body text-ink-muted md:table-cell">
                        {template.subcategory || '-'}
                      </td>
                      <td className="hidden px-3 py-3 lg:table-cell">
                        <Badge variant={scopeVariant[scopeFor(template)] ?? 'gray'}>
                          {scopeLabel[scopeFor(template)] ?? scopeFor(template)}
                        </Badge>
                      </td>
                      <td className="hidden px-3 py-3 text-body text-ink-muted lg:table-cell">
                        {sectionCount} sezioni - {itemCount} articoli
                      </td>
                      <td className="hidden px-3 py-3 text-body text-ink-muted sm:table-cell">{formatDate(template.updatedAt)}</td>
                      <td className="px-4 py-3 sm:px-6">
                        <TemplateActions
                          template={template}
                          canEdit={canEdit}
                          canDeleteTemplate={canDeleteTemplate}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

function TemplateGroups({
  groups,
  canEdit,
  canDeleteTemplate,
  archived = false,
}: {
  groups: [string, TemplateRow[]][]
  canEdit: boolean
  canDeleteTemplate: boolean
  archived?: boolean
}) {
  return (
    <>
      <TemplateMobileGroups groups={groups} canEdit={canEdit} canDeleteTemplate={canDeleteTemplate} archived={archived} />
      <TemplateDesktopGroups groups={groups} canEdit={canEdit} canDeleteTemplate={canDeleteTemplate} archived={archived} />
    </>
  )
}

function EmptyTemplates({ archived = false }: { archived?: boolean }) {
  return (
    <div className="py-16 text-center">
      <Layers className="mx-auto mb-4 h-12 w-12 text-ink-subtle" />
      <h3 className="text-body font-medium text-ink">
        {archived ? 'Nessun template archiviato' : 'Nessun template attivo'}
      </h3>
      <p className="mt-1 text-body text-ink-muted">
        {archived ? 'I template disattivati appariranno qui.' : 'Crea un template da un preventivo o partendo da zero.'}
      </p>
    </div>
  )
}

export default async function TemplatesPage() {
  const [templates, session, quotes] = await Promise.all([
    getTemplateManagerRows(),
    getSession(),
    getQuotesForTemplatePicker(),
  ])
  const canEdit = session ? canMutate(session.role) : false
  const canDeleteTemplate = session ? canDelete(session.role) : false

  const activeTemplates = templates.filter((template) => template.isActive)
  const archivedTemplates = templates.filter((template) => !template.isActive)
  const quoteCount = templates.filter((t) => t.templateType === 'QUOTE').length
  const invoiceCount = templates.filter((t) => t.templateType === 'INVOICE').length

  const activeGroups = groupByCategory(activeTemplates)
  const archivedGroups = groupByCategory(archivedTemplates)

  return (
    <div className="page-content">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-display font-semibold text-ink">Template</h1>
          <p className="mt-1 text-body text-ink-muted">
            {activeTemplates.length} attivi - {archivedTemplates.length} archiviati - {quoteCount} preventivi - {invoiceCount} fatture
          </p>
        </div>
        {canEdit && <CreateTemplateMenu quotes={quotes} />}
      </div>

      {templates.length === 0 ? (
        <Card>
          <div className="py-16 text-center">
            <Layers className="mx-auto mb-4 h-12 w-12 text-ink-subtle" />
            <h3 className="text-body font-medium text-ink">Nessun template</h3>
            <p className="mt-1 text-body text-ink-muted">Crea un template da un preventivo o partendo da zero.</p>
          </div>
        </Card>
      ) : (
        <>
          <Card>
            {activeGroups.length === 0 ? (
              <EmptyTemplates />
            ) : (
              <TemplateGroups groups={activeGroups} canEdit={canEdit} canDeleteTemplate={canDeleteTemplate} />
            )}
          </Card>

          {archivedTemplates.length > 0 && (
            <TemplateArchiveToggle count={archivedTemplates.length}>
              <Card>
                {archivedGroups.length === 0 ? (
                  <EmptyTemplates archived />
                ) : (
                  <TemplateGroups groups={archivedGroups} canEdit={canEdit} canDeleteTemplate={canDeleteTemplate} archived />
                )}
              </Card>
            </TemplateArchiveToggle>
          )}
        </>
      )}
    </div>
  )
}
