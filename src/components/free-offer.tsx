import { Mic, ArrowRight } from 'lucide-react'
import { SLA, WHATSAPP_FREE_QUOTE } from '@/lib/site'

export function FreeOffer() {
  return (
    <section id="preventivo-gratis" className="bg-ink-950 py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-5 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-brand-400">
          <Mic className="h-3.5 w-3.5" aria-hidden />
          Provalo senza pagare
        </span>

        <h2 className="mt-8 text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
          Mandaci un vocale.
          <br />
          Ti restituiamo il preventivo.
        </h2>

        <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-ink-300">
          Due minuti di audio su un lavoro che devi preventivare questa
          settimana: cosa c&apos;è da fare, le misure che hai, i materiali che
          hai in mente. Entro {SLA.executionHours} ore lavorative ti mandiamo il
          preventivo in italiano, in PDF, pronto da consegnare al tuo cliente.
        </p>

        <p className="mt-5 text-lg font-semibold text-brand-400">
          Gratis, una volta, senza impegno.
        </p>

        <a
          href={WHATSAPP_FREE_QUOTE}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-8 py-4 text-base font-bold text-ink-950 transition-colors hover:bg-brand-400"
        >
          Manda il vocale su WhatsApp
          <ArrowRight className="h-5 w-5" aria-hidden />
        </a>

        <p className="mt-6 text-sm text-ink-500">
          Se ti piace, parliamo. Se non ti piace, il preventivo resta tuo lo
          stesso.
        </p>
      </div>
    </section>
  )
}
