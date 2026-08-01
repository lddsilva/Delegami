'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'
import { Sidebar } from './sidebar'
import { MobileTabBar } from './mobile-tab-bar'
import { GlobalSearch } from './global-search'
import type { SessionUser } from '@/lib/auth'

interface Props {
  user: SessionUser
  children: React.ReactNode
  pendingWorkLogsCount?: number
}

export function AppShell({ user, children, pendingWorkLogsCount = 0 }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isWorker = user.role === 'WORKER'

  // Esc closes the mobile panel. Only 3 of the app's 9 overlays handled this.
  useEffect(() => {
    if (!sidebarOpen) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setSidebarOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [sidebarOpen])

  return (
    <div className="flex h-full print:block">
      {/* Sidebar desktop — sempre visível em telas grandes */}
      <div className="hidden lg:flex lg:shrink-0 print:hidden">
        <Sidebar user={user} pendingWorkLogsCount={pendingWorkLogsCount} />
      </div>

      {/* Sidebar mobile — overlay */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden print:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Sidebar panel. The close button lives here, above the backdrop —
              it used to sit in the header, which has no z-index and was covered
              by the z-40 backdrop, so the tap never reached it. */}
          <div className="fixed inset-y-0 left-0 z-50 flex lg:hidden print:hidden">
            <Sidebar user={user} onNavigate={() => setSidebarOpen(false)} pendingWorkLogsCount={pendingWorkLogsCount} />
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Chiudi il menu"
              className="tap-target m-2 inline-flex items-center justify-center self-start rounded-control text-ink-inverse/80 hover:bg-surface/10 hover:text-ink-inverse transition-colors duration-state"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:block print:overflow-visible">
        {/* Top bar mobile */}
        <header className="lg:hidden print:hidden flex items-center gap-2 px-2 py-2 bg-shell text-ink-inverse shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Apri il menu"
            aria-expanded={sidebarOpen}
            className="inline-flex items-center justify-center tap-target rounded-control hover:bg-shell-raised transition-colors duration-state"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex min-w-0 items-center gap-2">
            <div className="bg-surface rounded-control w-7 h-7 shrink-0 overflow-hidden p-0.5">
              <Image
                src="/logo-mark.svg"
                alt=""
                width={28}
                height={28}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <span className="truncate font-semibold text-body">Delegami</span>
          </div>
          {/* Search is always visible on the phone rather than buried in the
              panel — looking up a record is the most common reason to reach for
              navigation at all. */}
          {!isWorker && (
            <div className="ml-auto shrink-0">
              <GlobalSearch compact />
            </div>
          )}
        </header>

        {/* `overflow-x-clip` is a safety net, not a fix: `overflow-y-auto` forces
            the x axis to `auto` too, so any single element wider than the screen
            turned every page into a sideways scroll. Real overflow is still a
            bug and the layout sweep still fails on it — this just stops one
            stubborn control from breaking the whole screen for the user.
            The tab bar is fixed, so the last row of any list needs the reserve. */}
        <main
          className={`flex-1 overflow-y-auto overflow-x-clip print:overflow-visible ${
            isWorker ? '' : 'pb-14 lg:pb-0 print:pb-0'
          }`}
        >
          {children}
        </main>
      </div>

      {/* The operaio already has a tab bar of their own inside /rapportino. */}
      {!isWorker && <MobileTabBar pendingWorkLogsCount={pendingWorkLogsCount} />}
    </div>
  )
}
