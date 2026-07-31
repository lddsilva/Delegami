import { Section } from '@/components/section'

const PAINS = [
  {
    title: 'Preventivi alle 22:00',
    body: 'Dopo dieci ore di cantiere, seduto al tavolo di cucina, a scrivere un preventivo sul telefono.',
  },
  {
    title: 'Scontrini nel furgone',
    body: 'Una busta nel cruscotto con tre mesi di scontrini. Metà sono già illeggibili.',
  },
  {
    title: 'Il fiduciario che aspetta',
    body: 'Ti chiede documenti che non trovi più, e ogni anno la stessa scena a dicembre.',
  },
  {
    title: 'Lavori persi per lentezza',
    body: 'Il cliente ha chiamato tre imprese. Ha preso quella che ha risposto per prima.',
  },
]

export function Problem() {
  return (
    <Section
      index="I"
      label="Il problema"
      title={
        <>
          Ti riconosci in almeno una <em>di queste?</em>
        </>
      }
    >
      <ul className="border-t border-rule">
        {PAINS.map((pain) => (
          <li
            key={pain.title}
            className="grid gap-x-8 gap-y-1.5 border-b border-rule py-6 sm:grid-cols-[16rem_1fr]"
          >
            <h3 className="text-[1.15rem] leading-snug">{pain.title}</h3>
            <p className="max-w-[52ch] text-ink-soft">{pain.body}</p>
          </li>
        ))}
      </ul>

      <p className="mt-12 max-w-[34ch] font-display text-[clamp(1.5rem,2.6vw,2.1rem)] italic leading-[1.25]">
        Non è disorganizzazione. È che nessuno può costruire di giorno e fare
        l&apos;ufficio di notte.
      </p>
    </Section>
  )
}
