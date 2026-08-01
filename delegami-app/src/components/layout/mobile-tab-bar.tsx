'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building2, Camera, HardHat } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The four screens the day is actually spent in.
 *
 * Everything else — 14 further destinations — stays in the hamburger, which is
 * the right place for a category you visit occasionally. What was wrong was
 * putting *all* eighteen there: reaching Scontrini from a building site took a
 * tap, a scan of a full-height list, and a second tap, for the one screen the
 * phone exists to reach. The operaio's mini-app has had a bottom tab bar since
 * it was built; this gives the same treatment to the person who uses the app
 * every day.
 */
const TABS = [
  { label: 'Home', href: '/', icon: LayoutDashboard },
  { label: 'Opere', href: '/projects', icon: Building2 },
  { label: 'Scontrini', href: '/receipts', icon: Camera },
  { label: 'Rapportini', href: '/rapportini', icon: HardHat },
] as const

export function MobileTabBar({ pendingWorkLogsCount = 0 }: { pendingWorkLogsCount?: number }) {
  const pathname = usePathname()

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }

  return (
    <nav
      aria-label="Navigazione principale"
      /* pb keeps the labels clear of the home indicator on a notched iPhone. */
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden print:hidden"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon
        const active = isActive(tab.href)
        const badge = tab.href === '/rapportini' ? pendingWorkLogsCount : 0
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-label transition-colors duration-state',
              active ? 'text-action' : 'text-ink-muted',
            )}
          >
            <span className="relative">
              <Icon className="h-5 w-5" />
              {badge > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-attention px-1 text-[10px] font-semibold text-ink-inverse">
                  {badge}
                </span>
              )}
            </span>
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
