import { WhatsappGlyph } from '@/components/glyphs'
import { CASE_STUDY, WHATSAPP_GENERIC } from '@/lib/site'

/** Deterministic so the server and client render the same bars. */
const WAVE = [
  6, 11, 8, 15, 22, 17, 12, 19, 26, 21, 14, 9, 16, 24, 18, 11, 7, 13, 20, 15, 9,
  12, 6, 10,
]

function VoiceNote() {
  return (
    <div className="max-w-[17rem] rounded-[3px] border border-paper-edge bg-paper-deep px-4 py-3.5">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-paper">
          <svg viewBox="0 0 12 12" className="ml-0.5 h-3 w-3" aria-hidden>
            <path fill="currentColor" d="M2 1.5 10 6l-8 4.5Z" />
          </svg>
        </span>
        <span className="flex h-7 items-center gap-[3px]" aria-hidden>
          {WAVE.map((h, i) => (
            <span
              key={i}
              className="w-[2px] rounded-full bg-ink-faint"
              style={{ height: `${h}px` }}
            />
          ))}
        </span>
      </div>
      <p className="mt-2.5 flex items-center justify-between text-[0.7rem] text-ink-faint">
        <span className="tabular">0:47</span>
        <span className="tabular">07:12</span>
      </p>
    </div>
  )
}

export function Hero() {
  return (
    <section id="top" className="mx-auto max-w-[70rem] px-6 lg:px-10">
      <div className="grid items-center gap-14 py-16 sm:py-24 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
        <div>
          <p className="eyebrow text-wine">
            Collaborazione amministrativa · Cantone Ticino
          </p>

          <h1 className="mt-7 text-[clamp(2.6rem,6.4vw,4.6rem)] leading-[1.02]">
            Tu costruisci.
            <br />
            <em className="text-wine">Delegami il resto.</em>
          </h1>

          <p className="mt-8 max-w-[46ch] text-[1.1rem] text-ink-soft">
            Preventivi, fatture, spese, ore degli operai e il report per il
            fiduciario: li scriviamo noi. Tu mandi una foto o un vocale, quando
            ti fa comodo. Il resto sparisce dalla tua testa.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#preventivo-gratis"
              className="inline-flex items-center justify-center gap-3 bg-wine px-7 py-4 font-medium text-paper transition-colors hover:bg-wine-deep"
            >
              Ricevi un preventivo gratis
              <span aria-hidden>→</span>
            </a>
            <a
              href={WHATSAPP_GENERIC}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 self-start px-2 py-4 font-medium text-ink underline decoration-rule decoration-1 underline-offset-[6px] transition-colors hover:decoration-wine hover:text-wine sm:self-auto"
            >
              <WhatsappGlyph />
              Scrivici su WhatsApp
            </a>
          </div>
        </div>

        {/* The product in one glance: a voice note goes in, a quote comes back. */}
        <figure className="lg:justify-self-end">
          <div className="flex flex-col gap-3">
            <VoiceNote />

            <div className="max-w-[19rem] self-end rounded-[3px] bg-wine px-4 py-3.5 text-paper">
              <p className="text-[0.95rem] leading-relaxed">
                Fatto. Preventivo <span className="tabular">PRE-2026-041</span>,
                CHF <span className="tabular">8&apos;420</span> IVA inclusa. Te
                lo allego in PDF, pronto da mandare al cliente.
              </p>
              <div className="mt-3 flex items-center gap-2.5 border-t border-paper/20 pt-3">
                <span className="flex h-7 w-6 shrink-0 items-center justify-center border border-paper/40 text-[0.55rem] font-semibold tracking-wider">
                  PDF
                </span>
                <span className="truncate text-[0.8rem] text-paper/85">
                  PRE-2026-041-Ristrutturazione.pdf
                </span>
              </div>
              <p className="mt-2.5 text-right text-[0.7rem] text-paper/60">
                <span className="tabular">09:31</span>
              </p>
            </div>
          </div>

          <figcaption className="mt-6 max-w-[19rem] border-l-2 border-rule pl-4 text-[0.85rem] italic text-ink-faint sm:ml-auto">
            Un vocale la mattina presto. Il preventivo pronto prima di sera.
          </figcaption>
        </figure>
      </div>

      <dl className="grid gap-6 border-t border-rule py-10 sm:grid-cols-3">
        <div>
          <dt className="eyebrow text-ink-faint">Fatturato gestito</dt>
          <dd className="tabular mt-2 font-display text-3xl">
            {CASE_STUDY.revenue}
          </dd>
          <dd className="mt-1 text-[0.85rem] text-ink-soft">
            in {CASE_STUDY.months} mesi, per un solo cliente
          </dd>
        </div>
        <div>
          <dt className="eyebrow text-ink-faint">Il tuo impegno</dt>
          <dd className="mt-2 font-display text-3xl">Un messaggio</dd>
          <dd className="mt-1 text-[0.85rem] text-ink-soft">
            niente moduli, niente software da imparare
          </dd>
        </div>
        <div>
          <dt className="eyebrow text-ink-faint">Serate in ufficio</dt>
          <dd className="tabular mt-2 font-display text-3xl">0</dd>
          <dd className="mt-1 text-[0.85rem] text-ink-soft">
            la parte noiosa non torna più sul tuo tavolo
          </dd>
        </div>
      </dl>
    </section>
  )
}
