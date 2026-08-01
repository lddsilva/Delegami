import Link from 'next/link'
import { Logo } from '@/components/logo'
import { WhatsappGlyph } from '@/components/glyphs'
import { NAV_MAIN, WHATSAPP_GENERIC } from '@/lib/site'

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[4.75rem] max-w-6xl items-center justify-between gap-6 px-6 lg:px-8">
        <Link href="/" aria-label="Delegami — pagina iniziale">
          <Logo />
        </Link>

        <nav
          aria-label="Principale"
          className="hidden items-center gap-7 lg:flex"
        >
          {NAV_MAIN.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[0.92rem] font-medium text-slate-ink transition-colors hover:text-navy"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <a
          href={WHATSAPP_GENERIC}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-[0.9rem] font-semibold text-white transition-colors hover:bg-navy-deep"
        >
          <WhatsappGlyph />
          Scrivici
        </a>
      </div>

      {/* On small screens the primary nav becomes a scrollable rail rather than
          a hamburger: five links, always visible, no JavaScript. */}
      <nav
        aria-label="Sezioni"
        className="flex gap-5 overflow-x-auto border-t border-line px-6 py-2.5 text-[0.85rem] font-medium text-slate-ink lg:hidden"
      >
        {NAV_MAIN.map((item) => (
          <Link key={item.href} href={item.href} className="whitespace-nowrap">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
