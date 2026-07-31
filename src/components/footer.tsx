import { MessageCircle, Mail } from 'lucide-react'
import { CONTACT_EMAIL, WHATSAPP_GENERIC } from '@/lib/site'

export function Footer() {
  return (
    <footer className="bg-ink-950 py-16">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-col gap-10 border-b border-white/10 pb-12 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-2xl font-bold tracking-tight text-white">
              Delegami
            </p>
            <p className="mt-3 max-w-md leading-relaxed text-ink-300">
              Collaborazione amministrativa per piccole imprese edili.
              Cantone Ticino.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:items-end">
            <a
              href={WHATSAPP_GENERIC}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 font-bold text-ink-950 transition-colors hover:bg-brand-400"
            >
              <MessageCircle className="h-5 w-5" aria-hidden />
              Scrivici su WhatsApp
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-2 text-sm text-ink-300 transition-colors hover:text-white"
            >
              <Mail className="h-4 w-4" aria-hidden />
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>

        <p className="mt-8 text-sm text-ink-500">
          © {new Date().getFullYear()} Delegami · Tu costruisci, noi il resto.
        </p>
      </div>
    </footer>
  )
}
