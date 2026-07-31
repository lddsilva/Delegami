import {
  FileText,
  ReceiptText,
  Wallet,
  BellRing,
  CalendarClock,
  ShieldAlert,
  HardHat,
  Smartphone,
  FolderOpen,
} from 'lucide-react'

const ITEMS = [
  {
    icon: FileText,
    title: 'Preventivi redatti da noi',
    body: 'Da un vocale o da quattro misure. Italiano professionale, PDF pronto per il cliente — più una versione interna con i tuoi margini.',
  },
  {
    icon: ReceiptText,
    title: 'Fatture e acconti',
    body: 'Collegate al preventivo, con QR svizzero. Fatturazione parziale per avanzamento lavori quando serve.',
  },
  {
    icon: Wallet,
    title: 'Registrazione spese',
    body: 'Fotografi lo scontrino. Lo registriamo, lo categorizziamo e lo colleghiamo al cantiere giusto.',
  },
  {
    icon: CalendarClock,
    title: 'Controllo degli incassi',
    body: 'Chi ti deve, quanto e da quanto tempo. Il sollecito lo scriviamo noi, tu lo mandi.',
  },
  {
    icon: FolderOpen,
    title: 'Report mensile per il fiduciario',
    body: 'Fatture, incassi, scaduti, costi e manodopera. Ordinato, ogni mese, senza la scatola di carta a dicembre.',
  },
  {
    icon: ShieldAlert,
    title: 'Sorveglianza limite IVA',
    body: 'Ti avvisiamo prima che tu superi i CHF 100’000, non dopo. Più gli alert quando un prezzo non copre il costo.',
  },
  {
    icon: HardHat,
    title: 'Ore degli operai',
    body: 'Registrate dal telefono con foto e luogo. Tu approvi. Esce un bollettino firmabile, valido anche per l’agenzia interinale.',
  },
  {
    icon: Smartphone,
    title: 'App per te e per i tuoi operai',
    body: 'Accesso titolare e accesso operai. Documenti, foto e contratti organizzati per cantiere, sempre a portata di mano.',
  },
]

export function Deliverables() {
  return (
    <section id="cosa-ricevi" className="bg-ink-50 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <h2 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          Cosa ricevi, esattamente
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-ink-500">
          Una lista chiusa, non promesse generiche. Quello che c&apos;è qui lo
          facciamo. Quello che non c&apos;è, te lo diciamo prima.
        </p>

        {/* The weekly receipt chase is the one thing nobody else does — it leads. */}
        <div className="mt-12 overflow-hidden rounded-2xl bg-ink-900 p-8 sm:p-10">
          <div className="flex items-start gap-5">
            <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-ink-950 sm:flex">
              <BellRing className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-400">
                Quello che nessun altro fa
              </p>
              <h3 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
                Ogni venerdì gli scontrini te li chiediamo noi
              </h3>
              <p className="mt-4 max-w-2xl leading-relaxed text-ink-300">
                Non devi ricordarti niente. Il venerdì ti arriva un messaggio e
                tu rispondi con le foto della settimana. È il motivo per cui i
                nostri clienti non hanno più buste di scontrini nel furgone.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map(({ icon: Icon, ...item }) => (
            <div
              key={item.title}
              className="rounded-2xl border border-ink-100 bg-white p-7"
            >
              <Icon className="h-6 w-6 text-brand-600" aria-hidden />
              <h3 className="mt-4 text-lg font-bold text-ink-900">
                {item.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-500">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
