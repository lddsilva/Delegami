import { CtaBand, PageHeader } from '@/components/page-parts'
import { JsonLd, breadcrumbJsonLd, pageMeta } from '@/lib/seo'
import { SLA } from '@/lib/site'

export const metadata = pageMeta({
  title: 'Come funziona — dalla prima settimana in poi',
  description:
    'Avvio in due ore, poi qualche minuto al giorno. Come lavoriamo: canale unico WhatsApp, tempi dichiarati, ritmo settimanale e un riassunto mensile in cinque righe.',
  path: '/come-funziona',
  keywords: [
    'come funziona servizio amministrativo',
    'onboarding gestionale impresa edile',
    'assistenza amministrativa WhatsApp',
  ],
})

const ONBOARDING = [
  {
    when: 'Giorno 1',
    title: 'Una chiamata, poi mai più',
    body: 'Un’ora insieme per capire come lavori: i tuoi clienti, i fornitori che usi, i cantieri aperti, i prezzi che applichi. È l’unica volta in cui ti chiediamo di fermarti.',
  },
  {
    when: 'Giorni 2–5',
    title: 'Prepariamo tutto noi',
    body: 'Carichiamo clienti, fornitori e cantieri, costruiamo il tuo prezzario e configuriamo l’app. Tu non fai niente: ti scriviamo solo se manca qualcosa.',
  },
  {
    when: 'Giorno 6',
    title: 'Consegna e prova',
    body: 'Ti mostriamo l’app in venti minuti, creiamo gli accessi per i tuoi operai e facciamo insieme il primo preventivo vero.',
  },
  {
    when: 'Da lì in poi',
    title: 'Mandi e basta',
    body: 'Foto, vocali, messaggi. Nessun modulo, nessuna scadenza da ricordare: il ritmo lo teniamo noi.',
  },
]

const RHYTHM = [
  {
    day: 'Ogni giorno',
    body: 'Svuotiamo la casella entro le 18:00. Quello che ci mandi entro il mattino è pronto in giornata.',
  },
  {
    day: 'Lunedì',
    body: 'Controllo degli incassi: chi deve pagare, chi è in ritardo e da quanto. Se serve un sollecito, te lo scriviamo.',
  },
  {
    day: 'Venerdì',
    body: 'Ti chiediamo noi gli scontrini e le foto della settimana. È l’abitudine che tiene in ordine tutto il resto.',
  },
  {
    day: 'Inizio mese',
    body: 'Fatture del mese, dossier per il fiduciario e il tuo riassunto in cinque righe: fatturato, incassato, da incassare, costi, allarmi.',
  },
]

export default function ComeFunzionaPage() {
  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Come funziona', path: '/come-funziona' },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Come funziona"
        title="Due ore per partire. Poi ci pensiamo noi."
        lead="La paura giusta è: «mi ruberà tempo invece di darmene». Per questo l'avvio è concentrato in una settimana e tocca a noi, non a te. Dopo, il tuo lavoro è mandare un messaggio quando ti fa comodo."
        trail={trail}
      />

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:px-8">
          <h2 className="text-[clamp(1.6rem,3vw,2.2rem)]">La prima settimana</h2>
          <ol className="mt-10 space-y-4">
            {ONBOARDING.map((step) => (
              <li
                key={step.when}
                className="grid gap-3 rounded-2xl border border-line bg-off p-7 sm:grid-cols-[9rem_1fr] sm:gap-8"
              >
                <span className="eyebrow pt-1 text-mint-deep">{step.when}</span>
                <div>
                  <h3 className="text-[1.2rem]">{step.title}</h3>
                  <p className="mt-2 max-w-[58ch] text-slate-ink">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-off">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:px-8">
          <h2 className="text-[clamp(1.6rem,3vw,2.2rem)]">
            Il ritmo, una volta partiti
          </h2>
          <p className="mt-5 max-w-[58ch] text-slate-ink">
            Non devi ricordarti niente di tutto questo. È il nostro calendario,
            non il tuo — lo pubblichiamo solo perché tu sappia cosa aspettarti.
          </p>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {RHYTHM.map((r) => (
              <li
                key={r.day}
                className="rounded-2xl border border-line bg-white p-7"
              >
                <span aria-hidden className="block h-1 w-10 rounded-full bg-mint" />
                <h3 className="mt-5 text-[1.1rem]">{r.day}</h3>
                <p className="mt-2.5 text-[0.93rem] text-slate-ink">{r.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="text-[clamp(1.6rem,3vw,2.2rem)]">
                Perché solo per iscritto
              </h2>
              <p className="mt-5 text-slate-ink">
                Non facciamo telefonate, e non è per scomodità: è perché la
                metà dei problemi amministrativi nasce da una cosa detta a voce
                che nessuno ha scritto. Su WhatsApp ogni istruzione, prezzo e
                conferma resta lì, con data e ora.
              </p>
              <p className="mt-4 text-slate-ink">
                Puoi mandare quando vuoi, anche alle sei del mattino o di
                domenica: la tua richiesta entra in coda e non si perde. Noi
                lavoriamo {SLA.days.toLowerCase()}, {SLA.hours}.
              </p>
            </div>

            <dl className="grid gap-5 sm:grid-cols-2 lg:content-start">
              <div className="rounded-2xl border border-line bg-off p-6">
                <dt className="eyebrow text-slate">Conferma di ricezione</dt>
                <dd className="tabular mt-2 text-3xl font-extrabold">
                  {SLA.replyHours}h
                </dd>
                <dd className="text-[0.88rem] text-slate-ink">lavorative</dd>
              </div>
              <div className="rounded-2xl border border-line bg-off p-6">
                <dt className="eyebrow text-slate">Esecuzione</dt>
                <dd className="tabular mt-2 text-3xl font-extrabold">
                  {SLA.executionHours}h
                </dd>
                <dd className="text-[0.88rem] text-slate-ink">lavorative</dd>
              </div>
              <div className="rounded-2xl border border-line bg-off p-6 sm:col-span-2">
                <dt className="eyebrow text-slate">Riassunto mensile</dt>
                <dd className="mt-2 text-[1.1rem] font-extrabold">
                  Cinque righe, ogni mese
                </dd>
                <dd className="mt-1 text-[0.88rem] text-slate-ink">
                  Fatturato · incassato · da incassare · costi · allarmi
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <CtaBand />
      <JsonLd data={breadcrumbJsonLd(trail)} />
    </>
  )
}
