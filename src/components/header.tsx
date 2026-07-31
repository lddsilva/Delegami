import { Logo } from '@/components/logo'
import { WhatsappGlyph } from '@/components/glyphs'
import { WHATSAPP_GENERIC } from '@/lib/site'

const NAV = [
  { href: '#come-funziona', label: 'Come funziona' },
  { href: '#cosa-ricevi', label: 'Cosa ricevi' },
  { href: '#prezzo', label: 'Prezzo' },
  { href: '#domande', label: 'Domande' },
]

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-[4.5rem] max-w-[70rem] items-center justify-between px-6 lg:px-10">
        <a href="#top" aria-label="Delegami — inizio pagina">
          <Logo />
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[0.9rem] text-ink-soft underline-offset-[6px] transition-colors hover:text-wine hover:underline"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <a
          href={WHATSAPP_GENERIC}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 border border-wine px-4 py-2 text-[0.9rem] font-medium text-wine transition-colors hover:bg-wine hover:text-paper"
        >
          <WhatsappGlyph />
          Scrivici
        </a>
      </div>
    </header>
  )
}
