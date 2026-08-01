import { CtaBand, PageHeader } from '@/components/page-parts'
import { JsonLd, breadcrumbJsonLd, pageMeta } from '@/lib/seo'
import { CASE_STUDY, FOUNDER } from '@/lib/site'

export const metadata = pageMeta({
  title: 'Chi siamo — una persona, non un call center',
  description:
    'Delegami nasce da un caso reale: un’impresa edile ticinese che non riusciva più a stare dietro alla papelada. Un interlocutore unico, che conosce i tuoi cantieri.',
  path: '/chi-siamo',
  keywords: [
    'chi siamo Delegami',
    'servizio amministrativo Ticino',
    'assistenza imprese edili',
  ],
})

const PRINCIPLES = [
  {
    title: 'Un interlocutore, sempre lo stesso',
    body: 'Non passi da un centralino e non apri ticket. Parli con la persona che conosce i tuoi cantieri, i tuoi fornitori e i tuoi prezzi. Quando l’impresa cresce assumiamo, ma il tuo referente non cambia.',
  },
  {
    title: 'Scopo chiuso, scritto',
    body: 'Sappiamo esattamente cosa facciamo e cosa no, ed è nel contratto. Un servizio che promette tutto finisce per fare male tutto: preferiamo dirti di no in anticipo che deluderti al terzo mese.',
  },
  {
    title: 'Alleati del tuo fiduciario',
    body: 'Non facciamo dichiarazioni fiscali e non vogliamo farle. Il fiduciario resta la validazione finale dei tuoi numeri: noi gli togliamo solo il lavoro di mettere ordine.',
  },
  {
    title: 'Nessun vincolo',
    body: 'I tuoi dati sono tuoi ed escono quando vuoi. Se il servizio non vale il canone è giusto che tu vada, e non ti terremo con un contratto.',
  },
]

export default function ChiSiamoPage() {
  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Chi siamo', path: '/chi-siamo' },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Chi siamo"
        title="Siamo piccoli. È esattamente il punto."
        lead="Delegami non è un call center e non è una fiduciaria. È una struttura piccola e deliberatamente tale: chi risponde ai tuoi messaggi è la stessa persona che scrive i tuoi preventivi e conosce il nome dei tuoi cantieri."
        trail={trail}
      />

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
            <div>
              <div className="flex items-center gap-4">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-navy text-lg font-extrabold text-white">
                  {FOUNDER.initials}
                </span>
                <div>
                  <p className="text-[1.15rem] font-extrabold">
                    {FOUNDER.name}
                  </p>
                  <p className="text-[0.9rem] text-slate-ink">{FOUNDER.role}</p>
                </div>
              </div>
            </div>

            <div className="space-y-5 text-slate-ink">
              <h2 className="text-[clamp(1.5rem,3vw,2rem)] text-navy">
                Come è nata
              </h2>
              <p>
                Delegami nasce da un caso concreto, non da un piano di
                marketing: un’impresa edile ticinese, un titolare solo in
                cantiere, e una montagna di lavoro amministrativo che si
                accumulava ogni sera.
              </p>
              <p>
                Abbiamo cominciato a scrivere i suoi preventivi, poi le fatture,
                poi a registrare gli scontrini, poi le ore degli operai. Per
                farlo bene abbiamo costruito il software che serviva, perché
                nessuno di quelli in commercio parlava la lingua del cantiere.
              </p>
              <p className="rounded-2xl border border-line bg-off p-6 text-navy">
                In quattro mesi quell’impresa ha gestito{' '}
                <strong className="font-extrabold">{CASE_STUDY.revenue}</strong>{' '}
                di lavori senza che il titolare toccasse la papelada. Quel
                metodo, e quel software, sono quello che offriamo oggi ad altre
                imprese come la sua.
              </p>
              <p>
                Non abbiamo cento clienti e non li vogliamo: oltre un certo
                numero il servizio smette di essere quello che stiamo
                descrivendo. Cresciamo lentamente e di proposito.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-off">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:px-8">
          <h2 className="text-[clamp(1.6rem,3vw,2.2rem)]">
            Quattro regole che non cambiamo
          </h2>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2">
            {PRINCIPLES.map((p) => (
              <li
                key={p.title}
                className="rounded-2xl border border-line bg-white p-7"
              >
                <span aria-hidden className="block h-1 w-10 rounded-full bg-mint" />
                <h3 className="mt-5 text-[1.15rem]">{p.title}</h3>
                <p className="mt-3 text-[0.95rem] text-slate-ink">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand
        title="Parliamone, senza impegno"
        body="Raccontaci come lavori oggi. Ti diciamo con franchezza se possiamo esserti utili — e se non possiamo, te lo diciamo lo stesso."
      />
      <JsonLd data={breadcrumbJsonLd(trail)} />
    </>
  )
}
