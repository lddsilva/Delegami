import { Logo } from '@/components/logo'
import { WhatsappGlyph } from '@/components/glyphs'
import { CONTACT_EMAIL, SLA, WHATSAPP_GENERIC } from '@/lib/site'

export function Footer() {
  return (
    <footer className="bg-navy-deep">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Logo tone="light" />
            <p className="mt-6 max-w-[34ch] text-[0.95rem] text-white/60">
              Collaborazione amministrativa per piccole imprese edili.
              Cantone Ticino, si lavora in italiano.
            </p>
            <p className="mt-4 text-[0.85rem] text-white/40">
              {SLA.days} · {SLA.hours}
            </p>
          </div>

          <div className="flex flex-col items-start gap-4 sm:items-end">
            <a
              href={WHATSAPP_GENERIC}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-full bg-mint px-6 py-3.5 font-bold text-navy transition-colors hover:bg-white"
            >
              <WhatsappGlyph />
              Scrivici su WhatsApp
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-[0.9rem] text-white/60 underline decoration-white/25 underline-offset-4 transition-colors hover:text-white"
            >
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>

        <p className="mt-14 border-t border-white/10 pt-6 text-[0.8rem] text-white/35">
          © {new Date().getFullYear()} Delegami · Tu costruisci, noi il resto.
        </p>
      </div>
    </footer>
  )
}
