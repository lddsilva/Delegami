import { MessageCircle } from 'lucide-react'
import { WHATSAPP_GENERIC } from '@/lib/site'

const NAV = [
  { href: '#come-funziona', label: 'Come funziona' },
  { href: '#cosa-ricevi', label: 'Cosa ricevi' },
  { href: '#prezzo', label: 'Prezzo' },
  { href: '#domande', label: 'Domande' },
]

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <a href="#top" className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900 text-sm font-bold text-brand-400"
          >
            D
          </span>
          <span className="text-lg font-bold tracking-tight text-ink-900">
            Delegami
          </span>
        </a>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <a
          href={WHATSAPP_GENERIC}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-800"
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Scrivici</span>
          <span className="sm:hidden">WhatsApp</span>
        </a>
      </div>
    </header>
  )
}
