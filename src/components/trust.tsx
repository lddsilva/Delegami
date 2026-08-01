import Link from 'next/link'
import { Section } from '@/components/section'
import { SERVICES } from '@/lib/services'
import { PRICING, SLA } from '@/lib/site'

/**
 * Authority without inflation. Every claim here is checkable — a real case, a
 * declared SLA, a written scope, a data-export guarantee. Nothing that says
 * "team of experts", because one honest person who knows your sites beats a
 * vague team for this buyer, and an unverifiable claim dies on the first call.
 */
const REASONS = [
  {
    title: 'Un metodo, non buona volontà',
    body: `Tempi dichiarati — conferma entro ${SLA.replyHours} ore, esecuzione entro ${SLA.executionHours} — e un ritmo settimanale che non dipende dalla tua memoria. Il venerdì gli scontrini te li chiediamo noi.`,
  },
  {
    title: 'Scopo chiuso, messo per iscritto',
    body: 'Sai esattamente cosa comprende il canone e cosa no, prima di firmare. Preferiamo dirti di no in anticipo che deluderti al terzo mese.',
  },
  {
    title: 'Costruito su un caso vero',
    body: 'Non è un servizio pensato a tavolino: è nato lavorando ogni giorno per un’impresa edile ticinese, e il software l’abbiamo scritto perché nessuno di quelli in commercio parlava la lingua del cantiere.',
  },
  {
    title: 'Nessun vincolo, nessun ostaggio',
    body: `Impegno minimo ${PRICING.minimumCommitmentMonths} mesi, poi disdetta con ${PRICING.noticeDays} giorni. I tuoi dati escono quando vuoi, in ${PRICING.exportDays} giorni, gratis.`,
  },
]

export function Trust() {
  return (
    <Section
      eyebrow="Perché noi"
      title={
        <>
          Piccoli, vicini,{' '}
          <span className="text-mint-deep">e con dei limiti scritti.</span>
        </>
      }
      lead="Non siamo un call center e non ti passiamo da un operatore all'altro. Chi risponde ai tuoi messaggi è la stessa persona che scrive i tuoi preventivi e conosce il nome dei tuoi cantieri."
    >
      <ul className="grid gap-6 sm:grid-cols-2">
        {REASONS.map((r) => (
          <li
            key={r.title}
            className="rounded-2xl border border-line bg-white p-7"
          >
            <span aria-hidden className="block h-1 w-10 rounded-full bg-mint" />
            <h3 className="mt-5 text-[1.15rem]">{r.title}</h3>
            <p className="mt-3 text-[0.95rem] text-slate-ink">{r.body}</p>
          </li>
        ))}
      </ul>
    </Section>
  )
}

export function ServicesGrid() {
  return (
    <Section
      tone="off"
      eyebrow="Servizi"
      title={
        <>
          Cinque cose che ti tolgono le serate.{' '}
          <span className="text-mint-deep">Le facciamo noi.</span>
        </>
      }
      lead="Ogni servizio ha la sua pagina, con quello che comprende, quello che non comprende e le domande che ci fanno più spesso."
    >
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((service, i) => (
          <li key={service.slug}>
            <Link
              href={`/servizi/${service.slug}`}
              className="group flex h-full flex-col rounded-2xl border border-line bg-white p-7 transition-colors hover:border-mint"
            >
              <span className="tabular eyebrow text-mint-deep">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-3 text-[1.2rem] transition-colors group-hover:text-mint-deep">
                {service.nav}
              </h3>
              <p className="mt-3 flex-1 text-[0.93rem] text-slate-ink">
                {service.lead.split('. ').slice(0, 1).join('. ')}.
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-[0.88rem] font-bold text-navy">
                Approfondisci
                <span
                  aria-hidden
                  className="transition-transform group-hover:translate-x-1"
                >
                  →
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  )
}
