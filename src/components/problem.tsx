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
    <section className="border-b border-ink-100 bg-ink-50 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          Ti riconosci in almeno una di queste?
        </h2>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {PAINS.map((pain) => (
            <div
              key={pain.title}
              className="rounded-2xl border border-ink-100 bg-white p-7"
            >
              <h3 className="text-lg font-bold text-ink-900">{pain.title}</h3>
              <p className="mt-2.5 leading-relaxed text-ink-500">{pain.body}</p>
            </div>
          ))}
        </div>

        <p className="mt-12 max-w-3xl border-l-4 border-brand-500 pl-6 text-xl font-medium leading-relaxed text-ink-800">
          Non è disorganizzazione. È che nessuno può costruire di giorno e fare
          l&apos;ufficio di notte.
        </p>
      </div>
    </section>
  )
}
