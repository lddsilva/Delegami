import type { MetadataRoute } from 'next'
import { SERVICES } from '@/lib/services'
import { SITE_URL } from '@/lib/site'

/** Both the sitemap and robots are genuinely static; saying so lets them be
 *  emitted as files in a static export as well as on Vercel. */
export const dynamic = 'force-static'


/**
 * Priorities reflect what we actually want ranked: the service pages carry the
 * search intent, the legal pages exist to be found when looked for, not to
 * compete.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const core = [
    { path: '', priority: 1 },
    { path: '/servizi', priority: 0.9 },
    { path: '/come-funziona', priority: 0.8 },
    { path: '/app', priority: 0.8 },
    { path: '/prezzi', priority: 0.9 },
    { path: '/chi-siamo', priority: 0.6 },
    { path: '/domande', priority: 0.7 },
    { path: '/contatti', priority: 0.7 },
  ]

  const legal = ['/note-legali', '/privacy', '/condizioni']

  return [
    ...core.map((p) => ({
      url: `${SITE_URL}${p.path}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: p.priority,
    })),
    ...SERVICES.map((s) => ({
      url: `${SITE_URL}/servizi/${s.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.85,
    })),
    ...legal.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: 'yearly' as const,
      priority: 0.2,
    })),
  ]
}
