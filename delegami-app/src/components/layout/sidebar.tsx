'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  Receipt,
  CreditCard,
  Truck,
  Settings,
  BarChart3,
  BookOpen,
  LogOut,
  UserCog,
  Images,
  ScrollText,
  Layers,
  Camera,
  ClipboardList,
  HardHat,
  NotebookPen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SessionUser } from '@/lib/auth'
import { logout } from '@/modules/auth/actions'
import { GlobalSearch } from './global-search'

type NavItem = {
  label: string
  href: string
  icon: typeof LayoutDashboard
  adminOnly?: boolean
}

type NavSection = {
  label?: string  // omit for the unlabeled Dashboard row
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Operativo',
    items: [
      { label: 'Clienti', href: '/clients', icon: Users },
      { label: 'Opere', href: '/projects', icon: Building2 },
      { label: 'Preventivi', href: '/quotes', icon: FileText },
      { label: 'Fatture', href: '/invoices', icon: Receipt },
      { label: 'Rapportini', href: '/rapportini', icon: HardHat },
    ],
  },
  {
    label: 'Finanziario',
    items: [
      { label: 'Spese', href: '/expenses', icon: CreditCard },
      { label: 'Scontrini', href: '/receipts', icon: Camera },
      { label: 'Fornitori', href: '/suppliers', icon: Truck },
    ],
  },
  {
    label: 'Strumenti',
    items: [
      { label: 'Prezzario', href: '/price-catalog', icon: BookOpen },
      { label: 'Template', href: '/settings/templates', icon: Layers },
      { label: 'Media', href: '/media', icon: Images },
      { label: 'Infografico', href: '/infografico', icon: BarChart3 },
      { label: 'Report', href: '/reports', icon: BarChart3 },
      { label: 'Relatori', href: '/relatori', icon: ScrollText },
    ],
  },
]

const systemItems: NavItem[] = [
  { label: 'Impostazioni', href: '/settings', icon: Settings },
  { label: 'Utenti', href: '/settings/users', icon: UserCog, adminOnly: true },
  { label: 'Log attività', href: '/logs', icon: ClipboardList, adminOnly: true },
]

const roleLabel: Record<string, string> = {
  ADMIN: 'Amministratore',
  MANAGER: 'Responsabile',
  VIEWER: 'Visualizzatore',
  WORKER: 'Operaio',
}

interface Props {
  user: SessionUser
  onNavigate?: () => void
  pendingWorkLogsCount?: number
}

export function Sidebar({ user, onNavigate, pendingWorkLogsCount = 0 }: Props) {
  const pathname = usePathname()

  // WORKER (operaio): minimal sidebar — only the rapportino area is reachable.
  if (user.role === 'WORKER') {
    return (
      <aside className="w-64 shrink-0 bg-shell text-shell-ink flex flex-col h-full">
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="bg-surface rounded-control p-0.5 w-9 h-9 shrink-0 overflow-hidden">
              <Image src="/logo-mark.svg" alt="" width={36} height={36} className="w-full h-full object-contain" priority />
            </div>
            <div>
              <p className="font-semibold text-ink-inverse text-body leading-tight">Delegami</p>
              <p className="text-shell-ink-muted text-label">Rapportino</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4">
          <Link
            href="/rapportino"
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 px-3 min-h-11 rounded-control text-body transition-colors duration-state',
              pathname.startsWith('/rapportino')
                ? 'bg-shell-raised text-ink-inverse font-medium'
                : 'text-shell-ink-muted hover:bg-shell-raised/70 hover:text-ink-inverse',
            )}
          >
            <NotebookPen className="w-4 h-4 shrink-0" />
            <span>Il mio rapportino</span>
          </Link>
        </nav>

        <div className="px-3 pb-4 border-t border-white/10 pt-3">
          <div className="px-3 py-2 rounded-control bg-shell-raised/60">
            <p className="text-label font-medium text-ink-inverse truncate">{user.name}</p>
            <p className="text-label text-shell-ink-muted truncate">{roleLabel[user.role] ?? user.role}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="mt-1 w-full flex items-center gap-3 px-3 min-h-11 rounded-control text-body text-shell-ink-muted hover:bg-shell-raised/70 hover:text-ink-inverse transition-colors duration-state"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Esci</span>
            </button>
          </form>
        </div>
      </aside>
    )
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    // Settings link must NOT light up for /settings/templates or /settings/users
    if (href === '/settings') {
      return pathname.startsWith('/settings')
        && !pathname.startsWith('/settings/users')
        && !pathname.startsWith('/settings/templates')
    }
    return pathname.startsWith(href)
  }

  function renderItem(item: NavItem) {
    if (item.adminOnly && user.role !== 'ADMIN') return null
    const Icon = item.icon
    const active = isActive(item.href)
    const badge = item.href === '/rapportini' ? pendingWorkLogsCount : 0
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-3 px-3 min-h-11 rounded-control text-body transition-colors duration-state',
          active
            ? 'bg-shell-raised text-ink-inverse font-medium'
            : 'text-shell-ink-muted hover:bg-shell-raised/70 hover:text-ink-inverse',
        )}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="flex-1">{item.label}</span>
        {badge > 0 && (
          <span className="bg-attention text-ink-inverse text-label font-semibold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">
            {badge}
          </span>
        )}
      </Link>
    )
  }

  return (
    <aside className="w-64 shrink-0 bg-shell text-shell-ink flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="bg-surface rounded-control p-0.5 w-9 h-9 shrink-0 overflow-hidden">
            <Image
              src="/logo-mark.svg"
              alt=""
              width={36}
              height={36}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div>
            <p className="font-semibold text-ink-inverse text-body leading-tight">Delegami</p>
            <p className="text-shell-ink-muted text-label">Ufficio in tasca</p>
          </div>
        </div>
      </div>

      {/* Search sits above the list, not inside it: it is the way to reach a
          named record, while the list is the way to reach a category. */}
      <div className="px-3 pt-3">
        <GlobalSearch />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {navSections.map((section, idx) => (
          <div key={section.label ?? `section-${idx}`} className={idx > 0 ? 'mt-4' : ''}>
            {section.label && (
              <p className="px-3 mb-1 text-label font-semibold uppercase tracking-wider text-shell-ink-muted">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map(renderItem)}
            </div>
          </div>
        ))}
      </nav>

      {/* Sistema section */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3">
        <p className="px-3 mb-1 text-label font-semibold uppercase tracking-wider text-shell-ink-muted">
          Sistema
        </p>
        <div className="space-y-0.5">
          {systemItems.map(renderItem)}
        </div>

        {/* User info + logout */}
        <div className="mt-3 px-3 py-2 rounded-control bg-shell-raised/60">
          <p className="text-label font-medium text-ink-inverse truncate">{user.name}</p>
          <p className="text-label text-shell-ink-muted truncate">{roleLabel[user.role] ?? user.role}</p>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="mt-1 w-full flex items-center gap-3 px-3 min-h-11 rounded-control text-body text-shell-ink-muted hover:bg-shell-raised/70 hover:text-ink-inverse transition-colors duration-state"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Esci</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
