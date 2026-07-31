import { ArrowRight, MessageCircle } from 'lucide-react'
import { CASE_STUDY, WHATSAPP_GENERIC } from '@/lib/site'

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-ink-950">
      {/* Warm glow, kept subtle — this audience distrusts anything that looks like a startup. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-0 h-[32rem] w-[32rem] rounded-full bg-brand-500/12 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-5 py-20 sm:py-28">
        <p className="text-[11px] font-semibold uppercase leading-relaxed tracking-[0.11em] text-brand-400 sm:text-xs sm:tracking-[0.18em]">
          Ufficio amministrativo per imprese edili · Ticino
        </p>

        <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl">
          Tu costruisci.
          <br />
          <span className="text-brand-400">Delegami il resto.</span>
        </h1>

        <p className="mt-7 max-w-2xl text-lg leading-relaxed text-ink-300 sm:text-xl">
          Preventivi, fatture, spese, ore degli operai e il report per il
          fiduciario: li facciamo noi. Tu mandi una foto o un vocale su
          WhatsApp. Il resto sparisce dalla tua testa.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href="#preventivo-gratis"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-7 py-4 text-base font-bold text-ink-950 transition-colors hover:bg-brand-400"
          >
            Ricevi un preventivo gratis
            <ArrowRight className="h-5 w-5" aria-hidden />
          </a>
          <a
            href={WHATSAPP_GENERIC}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-7 py-4 text-base font-semibold text-white transition-colors hover:bg-white/5"
          >
            <MessageCircle className="h-5 w-5" aria-hidden />
            Scrivici su WhatsApp
          </a>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:gap-10">
          <div>
            <p className="text-3xl font-bold text-white">{CASE_STUDY.revenue}</p>
            <p className="mt-1 text-sm text-ink-300">
              fatturati in {CASE_STUDY.months} mesi da un nostro cliente
            </p>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-ink-300 sm:border-l sm:border-white/10 sm:pl-10">
            Una ditta individuale in Ticino, un titolare solo in cantiere.
            Nessuna serata passata a fare scartoffie.
          </p>
        </div>
      </div>
    </section>
  )
}
