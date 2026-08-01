import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { TemplateForm } from '@/components/quote-templates/template-form'
import { updateTemplate } from '@/modules/quote-templates/actions'
import { getTemplateForEdit } from '@/modules/quote-templates/queries'
import { getPriceItems } from '@/modules/price-catalog/queries'
import { getSession, canMutate } from '@/lib/auth'
import { ButtonLink } from '@/components/ui/button'

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [template, priceItems, session] = await Promise.all([
    getTemplateForEdit(id),
    getPriceItems(),
    getSession(),
  ])
  if (!template) notFound()
  if (!session || !canMutate(session.role)) redirect('/settings/templates')

  return (
    <div className="page-wide">
      <div className="flex items-center gap-3 mb-6">
        <ButtonLink href="/settings/templates" variant="ghost" size="sm" aria-label="Torna indietro"><ArrowLeft className="w-4 h-4" /></ButtonLink>
        <div>
          <h1 className="text-display font-semibold text-ink">Modifica template</h1>
          <p className="text-body text-ink-muted mt-1">{template.name}</p>
        </div>
      </div>
      <TemplateForm
        action={updateTemplate.bind(null, id)}
        template={template}
        priceItems={priceItems}
        title="Dati template"
        backHref="/settings/templates"
      />
    </div>
  )
}
