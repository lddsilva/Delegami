import Link from 'next/link'
import { PageHeader, Prose } from '@/components/page-parts'
import { JsonLd, breadcrumbJsonLd, pageMeta } from '@/lib/seo'
import { CONTACT_EMAIL, LEGAL, SITE_URL } from '@/lib/site'

export const metadata = pageMeta({
  title: 'Note legali',
  description:
    'Identità dell’operatore del sito, contatti, esclusione di responsabilità e diritti d’autore. Delegami, Cantone Ticino.',
  path: '/note-legali',
})

export default function NoteLegaliPage() {
  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Note legali', path: '/note-legali' },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Note legali"
        title="Note legali"
        lead={`Ultimo aggiornamento: ${LEGAL.lastUpdated}`}
        trail={trail}
      />

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
          <Prose>
            <h2>Responsabile del sito</h2>
            <p>
              <strong>{LEGAL.entityName}</strong>
              <br />
              {LEGAL.street}
              <br />
              {LEGAL.postalCode} {LEGAL.city}, {LEGAL.country}
              <br />
              Numero d’identificazione delle imprese (IDI): {LEGAL.ideNumber}
              <br />
              Persona responsabile: {LEGAL.responsible}
            </p>
            <p>
              Contatto: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
              Per le richieste di servizio il canale è WhatsApp, come indicato
              nella pagina <Link href="/contatti">Contatti</Link>.
            </p>

            <h2>Oggetto dell’attività</h2>
            <p>
              Delegami fornisce servizi di supporto amministrativo a imprese —
              redazione di preventivi e fatture, registrazione di spese,
              gestione delle ore del personale e reportistica — insieme a un
              software di supporto. Delegami{' '}
              <strong>
                non svolge attività di consulenza fiscale, contabile o legale
              </strong>{' '}
              e non redige dichiarazioni fiscali o chiusure contabili: queste
              restano di competenza del fiduciario del cliente.
            </p>

            <h2>Esclusione di responsabilità</h2>
            <p>
              I contenuti di questo sito hanno finalità informativa. Pur
              curandone l’accuratezza, non possiamo garantire che siano
              completi, aggiornati o esenti da errori, e ci riserviamo di
              modificarli in qualsiasi momento senza preavviso.
            </p>
            <p>
              Le indicazioni di prezzo pubblicate sono indicative e non
              costituiscono un’offerta vincolante ai sensi dell’art. 7 CO. Le
              condizioni applicabili a un rapporto di servizio sono
              esclusivamente quelle del contratto sottoscritto tra le parti.
            </p>
            <p>
              Le cifre riportate come caso reale si riferiscono a un cliente
              effettivo e sono pubblicate in forma anonima con il suo consenso.
              Non costituiscono una promessa di risultato: ogni impresa ha
              volumi e condizioni proprie.
            </p>

            <h2>Collegamenti a siti terzi</h2>
            <p>
              Il sito può contenere collegamenti a siti gestiti da terzi. Non
              abbiamo alcun controllo sui loro contenuti e decliniamo ogni
              responsabilità in merito. L’accesso avviene a rischio dell’utente.
            </p>

            <h2>Proprietà intellettuale</h2>
            <p>
              Tutti i contenuti di <a href={SITE_URL}>{SITE_URL}</a> — testi,
              grafica, marchio, logo e immagini dell’applicazione — sono
              protetti dal diritto d’autore e appartengono a {LEGAL.entityName},
              salvo dove diversamente indicato. Ogni riproduzione, anche
              parziale, richiede autorizzazione scritta.
            </p>
            <p>
              I caratteri tipografici impiegati sono distribuiti con licenza SIL
              Open Font License.
            </p>

            <h2>Diritto applicabile e foro</h2>
            <p>
              Il presente sito è soggetto al diritto svizzero. Per ogni
              controversia relativa al sito è competente il foro ordinario del
              Cantone Ticino, con riserva di eventuali fori imperativi.
            </p>
          </Prose>
        </div>
      </section>

      <JsonLd data={breadcrumbJsonLd(trail)} />
    </>
  )
}
