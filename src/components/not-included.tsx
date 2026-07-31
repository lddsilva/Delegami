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
      index="IV"
      label="I limiti"
      title={
        <>
          E cosa <em>non</em> facciamo
        </>
      }
      lead="Lo scriviamo qui perché lo scriviamo anche nel contratto. Sapere cosa non è incluso vale quanto sapere cosa lo è — è così che si evitano i malintesi al terzo mese."
    >
      <dl className="border-t border-rule">
        {EXCLUDED.map((item) => (
          <div
            key={item.term}
            className="grid gap-x-8 gap-y-1 border-b border-rule py-5 sm:grid-cols-[15rem_1fr]"
          >
            <dt className="flex items-baseline gap-3 font-display text-[1.15rem] leading-snug text-ink-faint">
              <span aria-hidden className="text-wine">
                ×
              </span>
              <span className="line-through decoration-rule">{item.term}</span>
            </dt>
            <dd className="max-w-[56ch] text-ink-soft">{item.def}</dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}
