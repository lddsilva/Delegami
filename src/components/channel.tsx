import { Section } from '@/components/section'
import { SLA } from '@/lib/site'

const POINTS = [
  {
    title: 'Un canale solo',
    body: 'WhatsApp. Testo, vocale, foto, allegati — quando vuoi. Anche fuori orario: la tua richiesta entra in coda e non si perde.',
  },
  {
    title: 'Per iscritto',
    body: 'Niente telefonate. Ogni istruzione, prezzo e conferma resta documentata, e nessuno deve ricordarsi cosa era stato detto.',
  },
  {
    title: 'Tempi dichiarati',
    body: `Risposta entro ${SLA.replyHours} ore lavorative, esecuzione entro ${SLA.executionHours}. ${SLA.days}, ${SLA.hours}.`,
  },
]

export function Channel() {
  return (
    <Section
      eyebrow="Il metodo"
      title={
        <>
          Come si <span className="text-mint-deep">lavora insieme</span>
        </>
      }
    >
      <div className="grid gap-6 md:grid-cols-3">
        {POINTS.map((point) => (
          <div key={point.title}>
            <span aria-hidden className="block h-1 w-10 rounded-full bg-mint" />
            <h3 className="mt-5 text-[1.15rem]">{point.title}</h3>
            <p className="mt-2.5 text-[0.95rem] text-slate-ink">{point.body}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}
