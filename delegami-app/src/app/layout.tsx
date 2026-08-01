import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import './globals.css'
import { AppShell } from '@/components/layout/app-shell'
import { getSession, canMutate } from '@/lib/auth'
import { getPendingWorkLogsCount } from '@/modules/work-logs/queries'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Delegami',
  description: 'Sistema di gestione Delegami',
}

/**
 * `viewportFit: 'cover'` is what makes env(safe-area-inset-*) return real
 * values on notched iPhones — without it the worker's fixed bottom tab bar
 * sits under the home indicator. `themeColor` matches the app's dark chrome
 * so the browser UI does not clash with the header.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#111827',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''
  const isLoginPage = pathname.startsWith('/login')

  const session = isLoginPage ? null : await getSession()

  // WORKER accounts (operai) are restricted to the rapportino area only.
  // Any other route bounces them back to their daily log.
  if (session?.role === 'WORKER' && !pathname.startsWith('/rapportino')) {
    redirect('/rapportino')
  }

  const pendingWorkLogsCount = session && canMutate(session.role) ? await getPendingWorkLogsCount() : 0

  return (
    <html lang="it" className={`${geist.variable} h-full antialiased`}>
      <body className="h-full bg-surface-raised text-ink font-sans">
        {isLoginPage || !session ? (
          <main className="h-full">{children}</main>
        ) : (
          <AppShell user={session} pendingWorkLogsCount={pendingWorkLogsCount}>{children}</AppShell>
        )}
      </body>
    </html>
  )
}
