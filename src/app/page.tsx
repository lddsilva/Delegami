import { Hero } from '@/components/hero'
import { Problem } from '@/components/problem'
import { HowItWorks } from '@/components/how-it-works'
import { ServicesGrid, Trust } from '@/components/trust'
import { AppScreens } from '@/components/app-screens'
import { NotIncluded } from '@/components/not-included'
import { Pricing } from '@/components/pricing'
import { CaseStudy } from '@/components/case-study'
import { Faq } from '@/components/faq'
import { CtaBand } from '@/components/page-parts'
import { JsonLd, pageMeta } from '@/lib/seo'
import { PRICING } from '@/lib/site'

export const metadata = pageMeta({
  title: 'Delegami — l’ufficio della tua impresa edile, fatto da noi',
  description: `Preventivi, fatture, spese e ore degli operai: li facciamo noi. Tu mandi un vocale su WhatsApp. Da CHF ${PRICING.from}/mese, app compresa. Ticino.`,
  path: '/',
  keywords: [
    'servizio amministrativo imprese edili Ticino',
    'chi mi fa i preventivi edili',
    'gestione amministrativa impresa edile',
    'segretaria esterna impresa edile',
    'preventivi e fatture edilizia Lugano',
  ],
})

export default function HomePage() {
  return (
    <>
      <Hero />
      <Problem />
      <ServicesGrid />
      <HowItWorks />
      <AppScreens />
      <Trust />
      <CaseStudy />
      <NotIncluded />
      <Pricing />
      <Faq />
      <CtaBand />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Delegami',
          url: 'https://delegami.ch',
          inLanguage: 'it-CH',
          publisher: { '@id': 'https://delegami.ch/#organizzazione' },
        }}
      />
    </>
  )
}
