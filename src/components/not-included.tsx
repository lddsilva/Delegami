import { Section } from '@/components/section'

const EXCLUDED = [
  {
    term: 'Dichiarazioni fiscali',
    def: 'La chiusura contabile è il lavoro del tuo fiduciario. Siamo suoi alleati, non concorrenti: gli consegniamo un dossier pulito ogni mese.',
  },
  {
    term: 'Pagamenti a tuo nome',
    def: 'Non tocchiamo il tuo conto bancario e non abbiamo accesso ai tuoi soldi. Prepariamo, tu paghi.',
  },
  {
    term: 'Stipendi e oneri sociali',
    def: 'AVS, LPP e buste paga restano fuori. Se ti serve, ti indichiamo un partner.',
  },
  {
    term: 'Presenza in cantiere',
    def: 'Non veniamo sul posto e non rispondiamo al telefono ai tuoi clienti. Il cantiere resta tuo.',
  },
]

export function NotIncluded() {
  return (
    <Section
      tone="off"
      eyebrow="I limiti"
      title={
        <>
          E cosa <span className="text-mint-deep">non</span> facciamo
        </>
      }
      lead="Lo scriviamo qui perché lo scriviamo anche nel contratto. Sapere cosa non è incluso vale quanto sapere cosa lo è — è così che si evitano i malintesi al terzo mese."
    >
      <ul className="grid gap-5 sm:grid-cols-2">
        {EXCLUDED.map((item) => (
          <li
            key={item.term}
            className="rounded-2xl border border-line bg-white p-7"
          >
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-line text-slate-ink"
              >
                ×
              </span>
              <h3 className="text-[1.05rem]">{item.term}</h3>
            </div>
            <p className="mt-3 text-[0.95rem] text-slate-ink">{item.def}</p>
          </li>
        ))}
      </ul>
    </Section>
  )
}
