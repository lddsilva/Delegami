import { Logo } from '@/components/logo'
import { WhatsappGlyph } from '@/components/glyphs'
import { WHATSAPP_GENERIC } from '@/lib/site'

const NAV = [
  { href: '#come-funziona', label: 'Come funziona' },
  { href: '#app', label: "L'app" },
  { href: '#cosa-ricevi', label: 'Cosa ricevi' },
  { href: '#prezzo', label: 'Prezzo' },
]

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[4.75rem] max-w-6xl items-center justify-between gap-6 px-6 lg:px-8">
        <a href="#top" aria-label="Delegami — inizio pagina">
          <Logo />
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[0.92rem] font-medium text-slate-ink transition-colors hover:text-navy"
            >
              {item.label}
            </a>
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
    </header>
  )
}
