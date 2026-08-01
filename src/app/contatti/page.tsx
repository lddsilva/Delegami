import { WhatsappGlyph } from '@/components/glyphs'
import { PageHeader } from '@/components/page-parts'
import { JsonLd, breadcrumbJsonLd, pageMeta } from '@/lib/seo'
import {
  AREAS,
  CONTACT_EMAIL,
  SLA,
  WHATSAPP_FREE_QUOTE,
  WHATSAPP_GENERIC,
} from '@/lib/site'

export const metadata = pageMeta({
  title: 'Contatti — scrivici su WhatsApp',
  description:
    'Un canale solo: WhatsApp. Testo, vocale, foto o allegati, quando ti fa comodo. Rispondiamo entro 4 ore lavorative, Lun–Ven 8:00–18:00, in tutto il Ticino.',
  path: '/contatti',
  keywords: ['contatti Delegami', 'servizio amministrativo Ticino contatti'],
})

export default function ContattiPage() {
  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Contatti', path: '/contatti' },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Contatti"
        title="Scrivici. Anche solo per capire se ha senso."
        lead="Non abbiamo moduli da compilare né un centralino. Un messaggio su WhatsApp basta — e se preferisci l'email, va bene lo stesso."
        trail={trail}
      />

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-navy p-9">
              <h2 className="text-[1.5rem] text-white">
                Prova il preventivo gratuito
              </h2>
              <p className="mt-4 text-white/70">
                Mandaci un vocale di due minuti su un lavoro che devi
                preventivare questa settimana. Entro {SLA.executionHours} ore
                lavorative ti restituiamo il preventivo in italiano, in PDF,
                pronto da consegnare al tuo cliente. Gratis, una volta, senza
                impegno.
              </p>
              <a
                href={WHATSAPP_FREE_QUOTE}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-mint px-7 py-4 font-bold text-navy transition-colors hover:bg-white"
              >
                <WhatsappGlyph className="h-[1.1rem] w-[1.1rem]" />
                Manda il vocale
              </a>
            </div>

            <div className="rounded-2xl border border-line bg-off p-9">
              <h2 className="text-[1.5rem]">Oppure, semplicemente, chiedi</h2>
              <dl className="mt-7 space-y-6">
                <div>
                  <dt className="eyebrow text-slate">WhatsApp</dt>
                  <dd className="mt-2">
                    <a
                      href={WHATSAPP_GENERIC}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[1.05rem] font-bold text-navy underline decoration-mint decoration-2 underline-offset-4"
                    >
                      Scrivici su WhatsApp
                    </a>
                  </dd>
                  <dd className="mt-1 text-[0.9rem] text-slate-ink">
                    Testo, vocale, foto o allegati. Niente chiamate: lavoriamo
                    per iscritto perché tutto resti documentato.
                  </dd>
                </div>

                <div>
                  <dt className="eyebrow text-slate">Email</dt>
                  <dd className="mt-2">
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="text-[1.05rem] font-bold text-navy underline decoration-mint decoration-2 underline-offset-4"
                    >
                      {CONTACT_EMAIL}
                    </a>
                  </dd>
                </div>

                <div>
                  <dt className="eyebrow text-slate">Orari e tempi</dt>
                  <dd className="mt-2 text-[0.95rem] text-slate-ink">
                    {SLA.days}, {SLA.hours}. Conferma entro {SLA.replyHours} ore
                    lavorative, esecuzione entro {SLA.executionHours}. Fuori
                    orario i messaggi arrivano lo stesso ed entrano in coda.
                  </dd>
                </div>

                <div>
                  <dt className="eyebrow text-slate">Dove lavoriamo</dt>
                  <dd className="mt-2 text-[0.95rem] text-slate-ink">
                    Tutto il Cantone Ticino — {AREAS.join(', ')} e dintorni. Il
                    servizio è a distanza: non veniamo in cantiere.
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <JsonLd data={breadcrumbJsonLd(trail)} />
    </>
  )
}
