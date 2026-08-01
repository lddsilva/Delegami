import { WhatsappGlyph } from '@/components/glyphs'
import { SLA, WHATSAPP_FREE_QUOTE } from '@/lib/site'

export function FreeOffer() {
  return (
    <section id="preventivo-gratis" className="bg-navy">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24 lg:px-8">
        <p className="eyebrow text-mint">La prova</p>

        <h2 className="mt-5 max-w-[18ch] text-[clamp(2rem,4.6vw,3.4rem)] text-white">
          Mandaci un vocale. Ti restituiamo{' '}
          <span className="text-mint">il preventivo.</span>
        </h2>

        <p className="mt-7 max-w-[58ch] text-[1.05rem] text-white/70">
          Due minuti di audio su un lavoro che devi preventivare questa
          settimana: cosa c&apos;è da fare, le misure che hai, i materiali che
          hai in mente. Entro {SLA.executionHours} ore lavorative ti mandiamo il
          preventivo in italiano, in PDF, pronto da consegnare al tuo cliente.
        </p>

        <p className="mt-6 text-[1.4rem] font-extrabold text-white">
          Gratis, una volta, senza impegno.
        </p>

        <div className="mt-10 flex flex-col gap-5 sm:flex-row sm:items-center">
          <a
            href={WHATSAPP_FREE_QUOTE}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 rounded-full bg-mint px-8 py-4 font-bold text-navy transition-colors hover:bg-white"
          >
            <WhatsappGlyph className="h-[1.15rem] w-[1.15rem]" />
            Manda il vocale
          </a>
          <p className="max-w-[32ch] text-[0.9rem] text-white/50">
            Se ti piace, parliamo. Se non ti piace, il preventivo resta tuo lo
            stesso.
          </p>
        </div>
      </div>
    </section>
  )
}
