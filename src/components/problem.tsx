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
      eyebrow="Il problema"
      title={
        <>
          Ti riconosci in almeno una{' '}
          <span className="text-mint-deep">di queste?</span>
        </>
      }
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {PAINS.map((pain) => (
          <div
            key={pain.title}
            className="rounded-2xl border border-line bg-off p-7"
          >
            <h3 className="text-[1.15rem]">{pain.title}</h3>
            <p className="mt-2.5 text-slate-ink">{pain.body}</p>
          </div>
        ))}
      </div>

      <p className="mt-12 max-w-[36ch] text-[clamp(1.4rem,2.6vw,2rem)] font-extrabold leading-tight">
        Non è disorganizzazione. È che nessuno può costruire di giorno e fare
        l&apos;ufficio di notte.
      </p>
    </Section>
  )
}
