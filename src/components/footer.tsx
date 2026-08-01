import Link from 'next/link'
import { Logo } from '@/components/logo'
import { WhatsappGlyph } from '@/components/glyphs'
import { SERVICES } from '@/lib/services'
import {
  AREAS,
  CONTACT_EMAIL,
  NAV_LEGAL,
  NAV_MAIN,
  SLA,
  WHATSAPP_GENERIC,
} from '@/lib/site'

export function Footer() {
  return (
    <footer className="bg-navy-deep">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <Logo tone="light" />
            <p className="mt-6 max-w-[32ch] text-[0.95rem] text-white/60">
              Collaborazione amministrativa per piccole imprese edili.
              Cantone Ticino, si lavora in italiano.
            </p>
            <a
              href={WHATSAPP_GENERIC}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2.5 rounded-full bg-mint px-5 py-3 text-[0.9rem] font-bold text-navy transition-colors hover:bg-white"
            >
              <WhatsappGlyph />
              Scrivici su WhatsApp
            </a>
          </div>

          <FooterCol title="Servizi">
            {SERVICES.map((s) => (
              <FooterLink key={s.slug} href={`/servizi/${s.slug}`}>
                {s.nav}
              </FooterLink>
            ))}
          </FooterCol>

          <FooterCol title="Delegami">
            {NAV_MAIN.map((item) => (
              <FooterLink key={item.href} href={item.href}>
                {item.label}
              </FooterLink>
            ))}
            <FooterLink href="/domande">Domande frequenti</FooterLink>
            <FooterLink href="/contatti">Contatti</FooterLink>
          </FooterCol>

          <FooterCol title="Legale">
            {NAV_LEGAL.map((item) => (
              <FooterLink key={item.href} href={item.href}>
                {item.label}
              </FooterLink>
            ))}
            <li className="pt-3 text-[0.85rem] text-white/40">
              {SLA.days} · {SLA.hours}
            </li>
            <li>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-[0.85rem] text-white/60 underline decoration-white/25 underline-offset-4 hover:text-white"
              >
                {CONTACT_EMAIL}
              </a>
            </li>
          </FooterCol>
        </div>

        <p className="mt-14 border-t border-white/10 pt-7 text-[0.82rem] leading-relaxed text-white/40">
          Serviamo imprese edili in tutto il Cantone Ticino: {AREAS.join(' · ')}.
        </p>
        <p className="mt-3 text-[0.8rem] text-white/35">
          © {new Date().getFullYear()} Delegami · Tu costruisci, noi il resto.
        </p>
      </div>
    </footer>
  )
}

function FooterCol({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h2 className="eyebrow text-mint">{title}</h2>
      <ul className="mt-5 space-y-2.5">{children}</ul>
    </div>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-[0.9rem] text-white/60 transition-colors hover:text-white"
      >
        {children}
      </Link>
    </li>
  )
}
