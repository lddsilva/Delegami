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
      index="VIII"
      label="Il metodo"
      title={
        <>
          Come si <em>lavora insieme</em>
        </>
      }
    >
      <div className="grid gap-px bg-rule sm:grid-cols-3">
        {POINTS.map((point) => (
          <div key={point.title} className="bg-paper py-6 sm:px-6 sm:first:pl-0">
            <h3 className="font-display text-[1.2rem]">{point.title}</h3>
            <p className="mt-2.5 text-[0.95rem] text-ink-soft">{point.body}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}
