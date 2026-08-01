import type { NextConfig } from 'next'

/**
 * GITHUB_PAGES=true switches to a fully static export served from the
 * /Delegami sub-path. It exists only for the preview build on GitHub Pages —
 * the Vercel build is untouched and keeps image optimisation.
 */
const isPages = process.env.GITHUB_PAGES === 'true'

const nextConfig: NextConfig = isPages
  ? {
      output: 'export',
      basePath: '/Delegami',
      images: { unoptimized: true },
      trailingSlash: true,
    }
  : {}

export default nextConfig
