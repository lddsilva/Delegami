import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { QuoteSectionTemplateBuilder } from '@/components/quote-templates/quote-section-template-builder'
import { createTemplate } from '@/modules/quote-templates/actions'
import { getQuoteById } from '@/modules/quotes/queries'
import { getPriceItems } from '@/modules/price-catalog/queries'
import { getSession, canMutate } from '@/lib/auth'
import { ButtonLink } from '@/components/ui/button'
import type { QuoteTemplateRow } from '@/modules/quote-templates/queries'
import type { QuoteItem } from '@/components/quotes/quote-items-editor'

type QuoteWithItems = NonNullable<Awaited<ReturnType<typeof getQuoteById>>>

function inferCategory(items: QuoteItem[], projectName: string) {
  const text = `${projectName} ${items.map((i) => i.description).join(' ')}`.toLowerCase()
  if (text.includes('cucina')) return 'Cucina'
  if (text.includes('bagno') || text.includes('doccia') || text.includes('wc')) return 'Bagno'
  if (text.includes('paviment') || text.includes('piastrell') || text.includes('gres')) return 'Pavimenti'
  if (text.includes('elettric')) return 'Impianti'
  if (text.includes('idraulic')) return 'Idraulica'
  if (text.includes('pittura') || text.includes('tinteggi')) return 'Pittura'
  if (text.includes('muratura') || text.includes('intonac')) return 'Muratura'
  if (text.includes('finestr') || text.includes('infiss')) return 'Infissi'
  return 'Completa'
}

function sanitizeItems(items: QuoteWithItems['items']): QuoteItem[] {
  return items.map((item, idx) => ({
    priceItemId: item.priceItemId ?? undefined,
    itemType: item.itemType,
    section: item.section ?? undefined,
    sortOrder: item.sortOrder ?? idx,
    description: item.description,
    unit: item.unit ?? undefined,
    quantity: item.quantity ?? undefined,
    unitCost: item.unitCost ?? undefined,
    unitPrice: item.unitPrice ?? undefined,
    marginPercent: item.marginPercent ?? undefined,
    directPrice: item.directPrice,
    hiddenFromClient: item.hiddenFromClient,
    sourceUrl: item.sourceUrl ?? undefined,
    sourceNote: item.sourceNote ?? undefined,
  }))
}

export default async function CreateTemplateFromQuotePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [quote, priceItems, session] = await Promise.all([getQuoteById(id), getPriceItems(), getSession()])
  if (!quote) notFound()
  if (!session || !canMutate(session.role)) redirect(`/quotes/${id}`)

  const items = sanitizeItems(quote.items)
  const category = inferCategory(items, quote.project.name)
  const template: QuoteTemplateRow = {
    id: '',
    name: quote.project.name,
    description: `Creato da ${quote.quoteNumber} v${quote.version} - ${quote.project.client.name}`,
    category,
    subcategory: null,
    emoji: '📋',
    sortOrder: 0,
    templateType: 'QUOTE',
    qualityLevel: 'STANDARD',
    scopeLevel: 'STANDARD',
    templateGroupKey: '',
    version: 1,
    sourceQuoteId: id,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    items,
  }

  return (
    <div className="page-wide">
      <div className="flex items-center gap-3 mb-6">
        <ButtonLink href={`/quotes/${id}`} variant="ghost" size="sm" aria-label="Torna indietro"><ArrowLeft className="w-4 h-4" /></ButtonLink>
        <div>
          <h1 className="text-display font-semibold text-ink">Crea template dal preventivo</h1>
          <p className="text-body text-ink-muted mt-1">{quote.quoteNumber} v{quote.version} - {quote.project.name}</p>
        </div>
      </div>
      <QuoteSectionTemplateBuilder
        action={createTemplate}
        baseTemplate={template}
        quoteNumber={quote.quoteNumber}
        quoteVersion={quote.version}
        projectName={quote.project.name}
        sourceQuoteId={id}
        priceItems={priceItems}
        backHref={`/quotes/${id}`}
      />
    </div>
  )
}
