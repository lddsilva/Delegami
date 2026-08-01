import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/_next', '/favicon.ico']

// Next serves file-based metadata (src/app/icon.tsx, apple-icon, manifest, robots…)
// from extensionless URLs like `/icon?<hash>`, so the matcher's file-extension rule
// below never sees them. The browser also requests these with no session — on the
// login page there isn't one yet — so they must stay public or the tab icon 307s.
const PUBLIC_EXACT_PATHS = new Set([
  '/icon',
  '/apple-icon',
  '/opengraph-image',
  '/manifest.webmanifest',
  '/robots.txt',
  '/sitemap.xml',
])

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always set the x-pathname header so the layout can read it.
  const response = NextResponse.next()
  response.headers.set('x-pathname', pathname)

  if (PUBLIC_EXACT_PATHS.has(pathname) || PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return response
  }

  const session = request.cookies.get('zs_session')
  if (!session?.value) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  // Static files under public/ must stay outside the session check. Next's image
  // optimizer fetches the source URL server-side WITHOUT the user's cookie, so any
  // asset behind this proxy gets redirected to /login and comes back as HTML —
  // the optimizer then answers 400 and the <img> renders broken for everyone.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|txt|xml|webmanifest)$).*)',
  ],
}
