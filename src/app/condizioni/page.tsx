import Link from 'next/link'
import { PageHeader, Prose } from '@/components/page-parts'
import { JsonLd, breadcrumbJsonLd, pageMeta } from '@/lib/seo'
import { LEGAL, PRICING, SLA } from '@/lib/site'

export const metadata = pageMeta({
  title: 'Condizioni generali di servizio',
  description:
    'Oggetto e limiti del servizio, tempi di risposta, prezzi e fatturazione, durata e disdetta, riservatezza e portabilità dei dati.',
  path: '/condizioni',
})

export default function CondizioniPage() {
  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Condizioni', path: '/condizioni' },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Condizioni"
        title="Condizioni generali di servizio"
        lead={`Valgono per tutti i rapporti di servizio, salvo diverso accordo scritto. Ultimo aggiornamento: ${LEGAL.lastUpdated}`}
        trail={trail}
      />

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
          <Prose>
            <h2>1. Parti e oggetto</h2>
            <p>
              Le presenti condizioni disciplinano il rapporto fra{' '}
              {LEGAL.entityName} («Delegami») e l’impresa cliente. Delegami
              fornisce servizi di supporto amministrativo — redazione di
              preventivi e fatture, registrazione delle spese, gestione delle
              ore del personale, reportistica periodica — unitamente
              all’accesso a un’applicazione software.
            </p>
            <p>
              Il rapporto è un mandato ai sensi degli art. 394 segg. CO.
              Delegami esegue con diligenza le prestazioni concordate; non
              assume obbligazioni di risultato commerciale.
            </p>

            <h2>2. Cosa il servizio non comprende</h2>
            <p>Sono espressamente esclusi:</p>
            <ul>
              <li>
                consulenza fiscale, contabile e legale, dichiarazioni fiscali,
                dichiarazione IVA e chiusura contabile, che restano di
                competenza del fiduciario del cliente;
              </li>
              <li>
                esecuzione di pagamenti in nome del cliente e ogni accesso ai
                suoi conti bancari;
              </li>
              <li>
                elaborazione di stipendi, assicurazioni sociali e adempimenti
                connessi;
              </li>
              <li>rapporti diretti con i clienti finali dell’impresa;</li>
              <li>presenza in cantiere, sopralluoghi e rilievi;</li>
              <li>
                prestazioni che richiedano un’abilitazione professionale
                riservata.
              </li>
            </ul>
            <p>
              Le prestazioni non comprese possono essere concordate a parte, per
              iscritto e con prezzo indicato prima dell’esecuzione.
            </p>

            <h2>3. Collaborazione del cliente</h2>
            <p>
              Il servizio dipende dalle informazioni fornite dal cliente. Il
              cliente si impegna a trasmettere documenti e istruzioni in modo
              tempestivo e veritiero, a verificare i documenti sottoposti alla
              sua approvazione prima dell’invio a terzi e a segnalare senza
              indugio eventuali errori.
            </p>
            <p>
              Ogni documento destinato a terzi — preventivo, fattura, sollecito
              — è sottoposto al cliente e inviato solo dopo la sua approvazione.
              La responsabilità finale del contenuto resta del cliente.
            </p>

            <h2>4. Canale e tempi</h2>
            <p>
              Il canale ordinario è la messaggistica scritta (WhatsApp), scelta
              per garantire la tracciabilità delle istruzioni. Orario di
              servizio: {SLA.days}, {SLA.hours}. Conferma di ricezione entro{' '}
              {SLA.replyHours} ore lavorative; esecuzione entro{' '}
              {SLA.executionHours} ore lavorative, salvo prestazioni concordate
              come urgenti. I messaggi ricevuti fuori orario sono presi in
              carico il giorno lavorativo successivo.
            </p>

            <h2>5. Prezzi e fatturazione</h2>
            <p>
              Il servizio è remunerato con un canone periodico concordato, la
              cui fascia dipende dal volume di attività del cliente. Il canone è
              fatturato anticipatamente. Le prestazioni supplementari sono
              fatturate secondo quanto concordato di volta in volta.
            </p>
            <p>
              È dovuto un contributo di attivazione una tantum all’avvio del
              rapporto. L’eventuale recupero di documentazione arretrata è
              preventivato separatamente prima dell’esecuzione.
            </p>
            <p>
              In caso di ritardo nel pagamento superiore a trenta giorni,
              Delegami può sospendere il servizio previo avviso scritto, senza
              che ciò pregiudichi il credito.
            </p>

            <h2>6. Durata e disdetta</h2>
            <p>
              Il contratto ha una durata minima di{' '}
              {PRICING.minimumCommitmentMonths} mesi. Trascorso tale termine,
              ciascuna parte può disdire con {PRICING.noticeDays} giorni di
              preavviso scritto, senza penali. Resta salvo il diritto di
              disdetta immediata per motivi gravi.
            </p>

            <h2>7. Riservatezza</h2>
            <p>
              Delegami tratta come riservata ogni informazione relativa
              all’impresa cliente, ai suoi clienti, ai suoi prezzi e ai suoi
              margini, e non la comunica a terzi salvo obbligo di legge o
              istruzione del cliente. L’obbligo permane anche dopo la fine del
              rapporto.
            </p>
            <p>
              Delegami può citare il rapporto come referenza soltanto in forma
              anonima, salvo autorizzazione scritta all’uso del nome.
            </p>

            <h2>8. Protezione e portabilità dei dati</h2>
            <p>
              I dati caricati nell’applicazione restano di proprietà del
              cliente. Delegami li tratta quale responsabile del trattamento
              secondo le istruzioni del cliente e secondo l’
              <Link href="/privacy">informativa sulla protezione dei dati</Link>.
            </p>
            <p>
              Alla cessazione del rapporto, e su semplice richiesta durante lo
              stesso, Delegami consegna al cliente l’esportazione completa dei
              dati in formato riutilizzabile (CSV, JSON e PDF) entro{' '}
              {PRICING.exportDays} giorni lavorativi, senza costi aggiuntivi.
            </p>

            <h2>9. Responsabilità</h2>
            <p>
              Delegami risponde dei danni causati per dolo o negligenza grave.
              Per la negligenza lieve la responsabilità è esclusa nei limiti
              consentiti dalla legge. È in ogni caso esclusa la responsabilità
              per danni indiretti, mancato guadagno e pretese di terzi.
            </p>
            <p>
              Delegami non risponde delle conseguenze di informazioni errate o
              incomplete fornite dal cliente, né dei documenti che il cliente ha
              approvato prima dell’invio.
            </p>

            <h2>10. Modifiche</h2>
            <p>
              Delegami può modificare le presenti condizioni comunicandolo con
              almeno sessanta giorni di preavviso. Se il cliente non accetta, può
              disdire il contratto entro tale termine con effetto alla data di
              entrata in vigore della modifica.
            </p>

            <h2>11. Diritto applicabile e foro</h2>
            <p>
              Si applica il diritto svizzero, con esclusione delle norme di
              conflitto. Foro competente: Cantone Ticino, con riserva dei fori
              imperativi.
            </p>

            <p className="rounded-2xl border border-line bg-off p-6 text-[0.9rem]">
              Queste condizioni sono il testo pubblicato sul sito. Il rapporto
              con ciascun cliente è retto dal contratto sottoscritto, che
              prevale in caso di divergenza.
            </p>
          </Prose>
        </div>
      </section>

      <JsonLd data={breadcrumbJsonLd(trail)} />
    </>
  )
}
