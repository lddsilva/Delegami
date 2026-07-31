import { WhatsappGlyph } from '@/components/glyphs'
import { SLA, WHATSAPP_FREE_QUOTE } from '@/lib/site'

export function FreeOffer() {
  return (
    <section id="preventivo-gratis" className="bg-ink text-paper">
      <div className="mx-auto max-w-[70rem] px-6 py-20 sm:py-24 lg:px-10">
        <div className="grid gap-y-8 lg:grid-cols-[8rem_1fr] lg:gap-x-12">
          <div className="flex items-baseline gap-3 lg:flex-col lg:gap-2">
            <span className="font-display text-2xl leading-none text-wine-bright">
              V
            </span>
            <span className="eyebrow text-paper/40">La prova</span>
          </div>

          <div>
            <h2 className="max-w-[17ch] text-[clamp(2rem,4.6vw,3.5rem)] leading-[1.05] text-paper">
              Mandaci un vocale. Ti restituiamo{' '}
              <em className="text-wine-bright">il preventivo.</em>
            </h2>

            <p className="mt-8 max-w-[56ch] text-[1.05rem] text-paper/75">
              Due minuti di audio su un lavoro che devi preventivare questa
              settimana: cosa c&apos;è da fare, le misure che hai, i materiali
              che hai in mente. Entro {SLA.executionHours} ore lavorative ti
              mandiamo il preventivo in italiano, in PDF, pronto da consegnare
              al tuo cliente.
            </p>

            <p className="mt-6 font-display text-[1.6rem] italic text-paper">
              Gratis, una volta, senza impegno.
            </p>

            <div className="mt-10 flex flex-col gap-5 sm:flex-row sm:items-center">
              <a
                href={WHATSAPP_FREE_QUOTE}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 bg-wine px-8 py-4 font-medium text-paper transition-colors hover:bg-wine-bright hover:text-ink"
              >
                <WhatsappGlyph className="h-[1.15rem] w-[1.15rem]" />
                Manda il vocale
              </a>
              <p className="max-w-[30ch] text-[0.9rem] text-paper/50">
                Se ti piace, parliamo. Se non ti piace, il preventivo resta tuo
                lo stesso.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
