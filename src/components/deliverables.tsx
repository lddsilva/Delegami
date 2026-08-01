import { Section } from '@/components/section'

const ITEMS = [
  {
    term: 'Preventivi',
    def: 'Redatti da noi, da un vocale o da quattro misure. PDF pronto per il cliente, più una versione interna con i tuoi margini.',
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
    def: 'Accesso titolare e accesso operai. Documenti, foto e contratti organizzati per cantiere.',
  },
]

export function Deliverables() {
  return (
    <Section
      id="cosa-ricevi"
      eyebrow="Cosa ricevi"
      title={
        <>
          Una lista chiusa,{' '}
          <span className="text-mint-deep">non promesse generiche.</span>
        </>
      }
      lead="Quello che è scritto qui lo facciamo, con tempi concordati. Quello che non c'è, te lo diciamo prima di cominciare."
    >
      {/* The weekly receipt chase is the one thing nobody else in this market
          does — it leads the list instead of hiding in the middle of it. */}
      <div className="rounded-2xl bg-navy px-7 py-9 sm:px-10 sm:py-11">
        <p className="eyebrow text-mint">Quello che nessun altro fa</p>
        <h3 className="mt-4 max-w-[24ch] text-[clamp(1.5rem,3vw,2.15rem)] text-white">
          Ogni venerdì gli scontrini{' '}
          <span className="text-mint">te li chiediamo noi.</span>
        </h3>
        <p className="mt-4 max-w-[56ch] text-white/70">
          Non devi ricordarti niente. Il venerdì ti arriva un messaggio e tu
          rispondi con le foto della settimana. È il motivo per cui i nostri
          clienti non hanno più buste di scontrini nel furgone.
        </p>
      </div>

      <dl className="mt-8 grid gap-x-10 gap-y-px sm:grid-cols-2">
        {ITEMS.map((item) => (
          <div key={item.term} className="border-b border-line py-5">
            <dt className="text-[1.05rem] font-extrabold">{item.term}</dt>
            <dd className="mt-1.5 text-[0.95rem] text-slate-ink">{item.def}</dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}
