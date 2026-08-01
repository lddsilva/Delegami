import Link from 'next/link'
import { PageHeader, Prose } from '@/components/page-parts'
import { JsonLd, breadcrumbJsonLd, pageMeta } from '@/lib/seo'
import { CONTACT_EMAIL, LEGAL, PRICING } from '@/lib/site'

export const metadata = pageMeta({
  title: 'Informativa sulla protezione dei dati',
  description:
    'Come trattiamo i dati personali ai sensi della Legge federale sulla protezione dei dati (nLPD): quali dati, per quali scopi, per quanto tempo e quali sono i tuoi diritti.',
  path: '/privacy',
})

export default function PrivacyPage() {
  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Privacy', path: '/privacy' },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Protezione dei dati"
        title="Informativa sulla protezione dei dati"
        lead={`Ai sensi della Legge federale sulla protezione dei dati (nLPD). Ultimo aggiornamento: ${LEGAL.lastUpdated}`}
        trail={trail}
      />

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
          <Prose>
            <h2>1. Titolare del trattamento</h2>
            <p>
              {LEGAL.entityName}, {LEGAL.street}, {LEGAL.postalCode}{' '}
              {LEGAL.city}, {LEGAL.country}. Referente per le questioni di
              protezione dei dati: {LEGAL.responsible},{' '}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>

            <h2>2. Questo sito non usa cookie né statistiche</h2>
            <p>
              Il sito è composto da pagine statiche. Non impieghiamo cookie di
              profilazione, strumenti di analisi del traffico, pixel
              pubblicitari né moduli di contatto che raccolgano dati. Per questo
              motivo non trovi un banner di consenso: non c’è nulla da
              acconsentire.
            </p>
            <p>
              Il nostro fornitore di hosting registra, per ragioni tecniche e di
              sicurezza, dati di connessione (indirizzo IP, data e ora, pagina
              richiesta, tipo di browser). Questi dati servono a far funzionare
              il servizio e a difenderlo da abusi, non vengono usati per
              profilare le persone e sono conservati per un periodo limitato dal
              fornitore stesso.
            </p>

            <h2>3. Dati che trattiamo quando ci contatti</h2>
            <p>
              Se ci scrivi su WhatsApp o via email trattiamo il tuo nome, il
              numero di telefono o l’indirizzo email e il contenuto dei
              messaggi, allegati compresi. Lo scopo è rispondere alla tua
              richiesta e, se diventi cliente, eseguire il contratto.
            </p>
            <p>
              WhatsApp è un servizio di WhatsApp Ireland Ltd. Utilizzandolo per
              contattarci, i tuoi dati sono trattati anche secondo le condizioni
              di quel fornitore, sulle quali non abbiamo controllo. Se preferisci
              non usarlo, puoi scriverci via email.
            </p>

            <h2>4. Dati che trattiamo per i clienti</h2>
            <p>
              Nell’esecuzione del servizio trattiamo, per conto del cliente,
              dati relativi alla sua impresa: anagrafiche di clienti e
              fornitori, preventivi, fatture, pagamenti, spese, documenti e —
              dove il servizio lo prevede — dati del personale (nome, ore
              lavorate, luogo del rapportino, fotografie del lavoro svolto,
              retribuzione oraria concordata).
            </p>
            <p>
              Rispetto a questi dati agiamo come <strong>responsabile del
              trattamento</strong> per conto del cliente, che ne resta titolare.
              Li trattiamo solo per fornire il servizio concordato, secondo le
              sue istruzioni. Non li utilizziamo per finalità proprie, non li
              vendiamo e non li impieghiamo per addestrare sistemi automatici.
            </p>
            <p>
              I dati del personale sono raccolti a scopo di documentazione del
              lavoro svolto e di calcolo dei costi.{' '}
              <strong>
                Non effettuiamo sorveglianza del comportamento dei lavoratori né
                localizzazione continua
              </strong>
              , in conformità all’art. 26 OLL 3.
            </p>

            <h2>5. Destinatari e trasferimenti all’estero</h2>
            <p>
              Non comunichiamo dati a terzi salvo quando è necessario per
              fornire il servizio o quando la legge lo impone. I fornitori di
              cui ci avvaliamo sono vincolati contrattualmente alla
              riservatezza:
            </p>
            <ul>
              <li>
                fornitore di hosting e infrastruttura applicativa, con server
                situati in Svizzera o nello Spazio economico europeo;
              </li>
              <li>fornitore del servizio di messaggistica (WhatsApp);</li>
              <li>
                su indicazione del cliente, il suo fiduciario, al quale
                trasmettiamo il dossier mensile.
              </li>
            </ul>
            <p>
              Eventuali trasferimenti verso Paesi privi di una legislazione
              adeguata avvengono solo sulla base delle garanzie previste dalla
              nLPD.
            </p>

            <h2>6. Conservazione</h2>
            <p>
              Conserviamo i dati per la durata del rapporto e successivamente
              per il tempo imposto dagli obblighi legali svizzeri di
              conservazione dei documenti commerciali (di regola dieci anni). Le
              richieste che non danno luogo a un contratto sono cancellate entro
              dodici mesi.
            </p>
            <p>
              Alla cessazione del rapporto esportiamo su richiesta tutti i dati
              del cliente in formato riutilizzabile entro{' '}
              {PRICING.exportDays} giorni lavorativi, senza costi.
            </p>

            <h2>7. Sicurezza</h2>
            <p>
              Adottiamo misure tecniche e organizzative adeguate: connessioni
              cifrate, accessi individuali e protetti da password, separazione
              dei dati fra clienti diversi e registro delle operazioni svolte
              all’interno dell’applicazione. Nessuna misura può escludere ogni
              rischio, ma nessuno dei nostri collaboratori accede a dati che non
              siano necessari al proprio lavoro.
            </p>

            <h2>8. I tuoi diritti</h2>
            <p>
              Hai diritto di accedere ai tuoi dati, di farli rettificare o
              cancellare, di opporti a un trattamento e di riceverli in formato
              elettronico. Per esercitarli scrivi a{' '}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>: potremmo
              chiederti di identificarti, per evitare di consegnare dati alla
              persona sbagliata.
            </p>
            <p>
              Se ritieni che il trattamento violi la legge, puoi rivolgerti
              all’Incaricato federale della protezione dei dati e della
              trasparenza (IFPDT), Berna.
            </p>

            <h2>9. Modifiche</h2>
            <p>
              Possiamo aggiornare questa informativa quando cambiano i servizi o
              gli obblighi di legge. La versione applicabile è quella pubblicata
              qui, con la data indicata in cima alla pagina. Le condizioni
              contrattuali sono nella pagina{' '}
              <Link href="/condizioni">Condizioni</Link>.
            </p>
          </Prose>
        </div>
      </section>

      <JsonLd data={breadcrumbJsonLd(trail)} />
    </>
  )
}
