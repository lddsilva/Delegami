import { Section } from '@/components/section'

const ITEMS = [
  {
    term: 'Preventivi',
    def: 'Redatti da noi, da un vocale o da quattro misure. Italiano professionale, PDF pronto per il cliente — più una versione interna con i tuoi margini.',
  },
  {
    term: 'Fatture e acconti',
    def: 'Collegate al preventivo, con QR svizzero. Fatturazione parziale per avanzamento lavori quando serve.',
  },
  {
    term: 'Spese',
    def: 'Fotografi lo scontrino. Lo registriamo, lo categorizziamo e lo colleghiamo al cantiere giusto.',
  },
  {
    term: 'Incassi',
    def: 'Chi ti deve, quanto e da quanto tempo. Il sollecito lo scriviamo noi, tu lo mandi.',
  },
  {
    term: 'Report per il fiduciario',
    def: 'Fatture, incassi, scaduti, costi e manodopera. Ordinato, ogni mese, senza la scatola di carta a dicembre.',
  },
  {
    term: 'Limite IVA',
    def: 'Ti avvisiamo prima che tu superi i CHF 100’000, non dopo. Più un alert quando un prezzo non copre il costo.',
  },
  {
    term: 'Ore degli operai',
    def: 'Registrate dal telefono con foto e luogo. Tu approvi. Esce un bollettino firmabile, valido anche per l’agenzia interinale.',
  },
  {
    term: 'App e archivio',
    def: 'Accesso titolare e accesso operai. Documenti, foto e contratti organizzati per cantiere, sempre a portata di mano.',
  },
]

export function Deliverables() {
  return (
    <Section
      id="cosa-ricevi"
      index="III"
      label="Cosa ricevi"
      title={
        <>
          Una lista chiusa, <em>non promesse generiche.</em>
        </>
      }
      lead="Quello che è scritto qui lo facciamo, con tempi concordati. Quello che non c'è, te lo diciamo prima di cominciare."
    >
      {/* The weekly receipt chase is the one thing nobody else in this market
          does — it leads the list instead of hiding in the middle of it. */}
      <div className="bg-wine px-7 py-8 text-paper sm:px-10 sm:py-10">
        <p className="eyebrow text-wine-bright">Quello che nessun altro fa</p>
        <h3 className="mt-4 max-w-[24ch] text-[clamp(1.5rem,3vw,2.15rem)] leading-[1.15] text-paper">
          Ogni venerdì gli scontrini <em>te li chiediamo noi.</em>
        </h3>
        <p className="mt-4 max-w-[54ch] text-paper/80">
          Non devi ricordarti niente. Il venerdì ti arriva un messaggio e tu
          rispondi con le foto della settimana. È il motivo per cui i nostri
          clienti non hanno più buste di scontrini nel furgone.
        </p>
      </div>

      <dl className="mt-10 border-t border-rule">
        {ITEMS.map((item) => (
          <div
            key={item.term}
            className="grid gap-x-8 gap-y-1 border-b border-rule py-5 sm:grid-cols-[15rem_1fr]"
          >
            <dt className="font-display text-[1.15rem] leading-snug">
              {item.term}
            </dt>
            <dd className="max-w-[56ch] text-ink-soft">{item.def}</dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}
