import { Logo } from '@/components/logo'
import { WhatsappGlyph } from '@/components/glyphs'
import { CONTACT_EMAIL, SLA, WHATSAPP_GENERIC } from '@/lib/site'

export function Footer() {
  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto max-w-[70rem] px-6 py-16 lg:px-10">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Logo tone="paper" />
            <p className="mt-5 max-w-[34ch] text-[0.95rem] text-paper/60">
              Collaborazione amministrativa per piccole imprese edili.
              Cantone Ticino, si lavora in italiano.
            </p>
            <p className="mt-4 text-[0.85rem] text-paper/40">
              {SLA.days} · {SLA.hours}
            </p>
          </div>

          <div className="flex flex-col items-start gap-4 sm:items-end">
            <a
              href={WHATSAPP_GENERIC}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 bg-wine px-6 py-3.5 font-medium text-paper transition-colors hover:bg-wine-bright hover:text-ink"
            >
              <WhatsappGlyph />
              Scrivici su WhatsApp
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-[0.9rem] text-paper/60 underline decoration-paper/25 underline-offset-4 transition-colors hover:text-paper"
            >
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>

        <p className="mt-14 border-t border-paper/10 pt-6 text-[0.8rem] text-paper/35">
          © {new Date().getFullYear()} Delegami · Tu costruisci, noi il resto.
        </p>
      </div>
    </footer>
  )
}
