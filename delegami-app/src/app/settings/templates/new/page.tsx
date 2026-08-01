import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { TemplateForm } from '@/components/quote-templates/template-form'
import { createTemplate } from '@/modules/quote-templates/actions'
import { getPriceItems } from '@/modules/price-catalog/queries'
import { getSession, canMutate } from '@/lib/auth'
import { ButtonLink } from '@/components/ui/button'

export default async function NewTemplatePage() {
  const [priceItems, session] = await Promise.all([getPriceItems(), getSession()])
  if (!session || !canMutate(session.role)) redirect('/settings/templates')

  return (
    <div className="page-wide">
      <div className="flex items-center gap-3 mb-6">
        <ButtonLink href="/settings/templates" variant="ghost" size="sm" aria-label="Torna indietro"><ArrowLeft className="w-4 h-4" /></ButtonLink>
        <div>
          <h1 className="text-display font-semibold text-ink">Nuovo template</h1>
          <p className="text-body text-ink-muted mt-1">Compila i dati e aggiungi almeno una voce.</p>
        </div>
      </div>
      <TemplateForm
        action={createTemplate}
        priceItems={priceItems}
        helperText="Stai creando un template da zero. Aggiungi le sezioni e le voci usando l'editor sotto."
        title="Dati template"
        backHref="/settings/templates"
      />
    </div>
  )
}
