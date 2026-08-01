import Image from 'next/image'
import { WhatsappGlyph } from '@/components/glyphs'
import { CASE_STUDY, WHATSAPP_GENERIC } from '@/lib/site'
import dashboard from '../../public/screens/dashboard.webp'

const KEYWORDS = [
  'Preventivi',
  'Fatture',
  'Spese',
  'Rapportini',
  'Prezzario',
  'Report per il fiduciario',
]

export function Hero() {
  return (
    <section id="top" className="bg-white">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="grid items-center gap-14 py-14 sm:py-20 lg:grid-cols-[1.12fr_1fr] lg:gap-14">
          <div>
            <p className="eyebrow text-mint-deep">
              Cantone Ticino · si lavora in italiano
            </p>

            <h1 className="mt-6 text-[clamp(2.4rem,4.6vw,3.5rem)]">
              Tu costruisci.
              <br />
              <span className="text-mint-deep">Delegami il resto.</span>
            </h1>

            <p className="mt-7 max-w-[46ch] text-[1.08rem] text-slate-ink">
              Preventivi, fatture, spese, ore degli operai e il report per il
              fiduciario: li facciamo noi. Tu mandi una foto o un vocale su
              WhatsApp, quando ti fa comodo.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href="#preventivo-gratis"
                className="inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-mint px-7 py-4 font-bold text-navy transition-colors hover:bg-mint-deep hover:text-white"
              >
                Ricevi un preventivo gratis
                <span aria-hidden>→</span>
              </a>
              <a
                href={WHATSAPP_GENERIC}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 self-start px-2 py-3 font-semibold text-navy underline decoration-line decoration-2 underline-offset-[6px] transition-colors hover:decoration-mint sm:self-auto"
              >
                <WhatsappGlyph />
                Scrivici su WhatsApp
              </a>
            </div>

            <div className="mt-10 flex items-center gap-3.5 border-t border-line pt-7">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy text-[0.8rem] font-bold text-white">
                DL
              </span>
              <div>
                <p className="text-[0.9rem] font-semibold">
                  Rispondiamo entro 4 ore lavorative
                </p>
                <p className="text-[0.85rem] text-slate-ink">
                  Lun–Ven, 8:00–18:00 · solo per iscritto
                </p>
              </div>
            </div>
          </div>

          {/* The app itself is the proof — a real screen, not an illustration. */}
          <figure className="relative">
            <div className="overflow-hidden rounded-2xl border border-line shadow-[0_24px_60px_-24px_rgba(20,58,86,0.35)]">
              <Image
                src={dashboard}
                alt="La dashboard dell'app Delegami: incassi da ricevere, fatture aperte e opere in corso"
                priority
                sizes="(min-width: 1024px) 42rem, 100vw"
                className="h-auto w-full"
              />
            </div>

            <div className="absolute -left-5 top-10 hidden rounded-xl border border-line bg-white px-4 py-3 shadow-[0_12px_30px_-12px_rgba(20,58,86,0.3)] lg:block">
              <p className="eyebrow text-slate">Sempre aggiornato</p>
              <p className="mt-1 text-[0.9rem] font-bold">
                Quanto hai fatturato
              </p>
            </div>

            <div className="absolute -bottom-6 -right-4 hidden items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 shadow-[0_12px_30px_-12px_rgba(20,58,86,0.3)] lg:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mint-soft text-mint-deep">
                <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
                  <path
                    d="M4 10.5 8 14.5 16 5.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div>
                <p className="tabular text-[0.95rem] font-bold">
                  {CASE_STUDY.revenue}
                </p>
                <p className="text-[0.78rem] text-slate-ink">
                  gestiti in {CASE_STUDY.months} mesi
                </p>
              </div>
            </div>
          </figure>
        </div>

        <ul className="flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-line py-7 text-[0.9rem] font-semibold text-slate-ink">
          {KEYWORDS.map((k) => (
            <li key={k} className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full bg-mint"
              />
              {k}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
