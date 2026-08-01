import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

/** Both the sitemap and robots are genuinely static; saying so lets them be
 *  emitted as files in a static export as well as on Vercel. */
export const dynamic = 'force-static'


export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
