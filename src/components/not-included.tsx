import { X } from 'lucide-react'

const EXCLUDED = [
  {
    title: 'Dichiarazioni fiscali e chiusura contabile',
    body: 'È il lavoro del tuo fiduciario. Siamo suoi alleati, non concorrenti: gli consegniamo un dossier pulito ogni mese.',
  },
  {
    title: 'Pagamenti a tuo nome',
    body: 'Non tocchiamo il tuo conto bancario e non abbiamo accesso ai tuoi soldi. Prepariamo, tu paghi.',
  },
  {
    title: 'Stipendi e assicurazioni sociali',
    body: 'AVS, LPP e buste paga restano fuori. Se ti serve, ti indichiamo un partner.',
  },
  {
    title: 'Presenza in cantiere',
    body: 'Non veniamo sul posto e non rispondiamo al telefono ai tuoi clienti. Il cantiere resta tuo.',
  },
]

export function NotIncluded() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              E cosa <span className="text-brand-600">non</span> facciamo
            </h2>
            <p className="mt-5 leading-relaxed text-ink-500">
              Lo scriviamo qui perché lo scriviamo anche nel contratto. Sapere
              cosa non è incluso vale quanto sapere cosa lo è — è così che si
              evitano i malintesi al terzo mese.
            </p>
          </div>

          <ul className="space-y-6">
            {EXCLUDED.map((item) => (
              <li key={item.title} className="flex gap-4">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-100">
                  <X className="h-3.5 w-3.5 text-ink-500" aria-hidden />
                </span>
                <div>
                  <h3 className="font-bold text-ink-900">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
