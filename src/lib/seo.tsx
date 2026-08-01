import type { Metadata } from 'next'
import { AREAS, CONTACT_EMAIL, LEGAL, SITE_URL, WHATSAPP_NUMBER } from '@/lib/site'

/**
 * Every page gets its own title, description and canonical. Without the
 * canonical, Next resolves relative URLs against metadataBase but still lets
 * duplicate paths compete with each other in the index.
 */
export function pageMeta({
  title,
  description,
  path,
  keywords,
}: {
  title: string
  description: string
  path: string
  keywords?: string[]
}): Metadata {
  const url = `${SITE_URL}${path}`
  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'it_CH',
      url,
      siteName: 'Delegami',
      title,
      description,
      images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Delegami — Tu costruisci. Delegami il resto.' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og.png'],
    },
  }
}

/** Rendered once, in the root layout: who we are, where, how to reach us. */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${SITE_URL}/#organizzazione`,
    name: 'Delegami',
    description:
      'Collaborazione amministrativa per piccole imprese edili in Ticino: preventivi, fatture, spese, ore degli operai e report per il fiduciario.',
    url: SITE_URL,
    email: CONTACT_EMAIL,
    telephone: `+${WHATSAPP_NUMBER}`,
    inLanguage: 'it-CH',
    priceRange: 'CHF',
    address: {
      '@type': 'PostalAddress',
      addressRegion: 'Ticino',
      addressCountry: 'CH',
      streetAddress: LEGAL.street,
      postalCode: LEGAL.postalCode,
      addressLocality: LEGAL.city,
    },
    areaServed: AREAS.map((name) => ({ type: 'City', name })).map((a) => ({
      '@type': a.type,
      name: a.name,
    })),
    serviceType: [
      'Redazione preventivi edilizia',
      'Fatturazione e incassi',
      'Registrazione spese e scontrini',
      'Gestione ore operai',
      'Reportistica per fiduciario',
    ],
  }
}

export function serviceJsonLd({
  name,
  description,
  path,
}: {
  name: string
  description: string
  path: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    url: `${SITE_URL}${path}`,
    provider: { '@id': `${SITE_URL}/#organizzazione` },
    areaServed: { '@type': 'AdministrativeArea', name: 'Canton Ticino' },
    inLanguage: 'it-CH',
  }
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }
}

/** Breadcrumbs give Google the site's shape and win the path display in SERPs. */
export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path}`,
    })),
  }
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
