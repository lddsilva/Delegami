import { PRICING, SLA } from '@/lib/site'

/**
 * One entry per service page. These carry most of the site's search intent:
 * the buyer does not look for "back office", they look for the problem —
 * "chi mi fa i preventivi", "gestione fatture impresa edile".
 */
export type Service = {
  slug: string
  nav: string
  title: string
  metaTitle: string
  metaDescription: string
  keywords: string[]
  lead: string
  screen?: 'preventivi' | 'fatture' | 'spese' | 'rapportini' | 'prezzario'
  pains: string[]
  steps: { title: string; body: string }[]
  included: string[]
  excluded: string[]
  faq: { q: string; a: string }[]
}

export const SERVICES: Service[] = [
  {
    slug: 'preventivi',
    nav: 'Preventivi',
    title: 'Preventivi scritti da noi, in italiano professionale',
    metaTitle: 'Preventivi per imprese edili in Ticino — li scriviamo noi',
    metaDescription:
      'Mandaci un vocale o quattro misure: ti restituiamo il preventivo in italiano, in PDF, pronto da consegnare al cliente. Per imprese edili in Ticino.',
    keywords: [
      'preventivi edilizia Ticino',
      'come fare un preventivo edile',
      'preventivo ristrutturazione Lugano',
      'chi mi scrive i preventivi',
      'modello preventivo impresa edile',
    ],
    screen: 'preventivi',
    lead: "Il preventivo è la cosa che ti fa vincere o perdere il lavoro, ed è anche quella che finisci per scrivere alle dieci di sera. Da oggi la scrivi parlando: ce la mandi a voce, noi la trasformiamo in un documento che il cliente prende sul serio.",
    pains: [
      'Il cliente ha chiamato tre imprese e prende quella che risponde per prima.',
      'Scrivere un preventivo decente ti porta via una serata intera.',
      'I prezzi te li ricordi a memoria e cambiano da un cantiere all’altro.',
      'Il documento che consegni non rispecchia la qualità del lavoro che fai.',
    ],
    steps: [
      {
        title: 'Ci racconti il lavoro',
        body: 'Un vocale su WhatsApp mentre sei ancora in cantiere, qualche foto, le misure scritte dietro uno scontrino. Va bene tutto: non serve che sia ordinato.',
      },
      {
        title: 'Cerchiamo i prezzi',
        body: 'Materiali verificati sui fornitori che usi davvero, e le voci di manodopera dal tuo prezzario. Se un prezzo non copre il costo, te lo diciamo prima di mandarlo.',
      },
      {
        title: 'Ricevi due PDF',
        body: 'Uno per il cliente, pulito e senza margini. Uno interno per te, con costi e margine per riga, così sai esattamente cosa stai guadagnando.',
      },
    ],
    included: [
      'Redazione completa in italiano, con voci raggruppate per fase di lavoro',
      'Ricerca prezzi presso i fornitori (Hornbach, Edilgroup, HGC e simili)',
      'PDF cliente + PDF interno con margini',
      'Revisioni e nuove versioni quando il cliente chiede modifiche',
      'Archivio di tutte le versioni, con lo storico di cosa è cambiato',
    ],
    excluded: [
      'Sopralluoghi e rilievi in cantiere',
      'Calcoli strutturali o pratiche edilizie firmate',
      'Trattativa con il tuo cliente finale',
    ],
    faq: [
      {
        q: 'Quanto tempo ci vuole per avere un preventivo?',
        a: `Entro ${SLA.executionHours} ore lavorative dal momento in cui riceviamo le informazioni. Se ti serve in giornata si può fare, con un supplemento concordato prima.`,
      },
      {
        q: 'Come fate a sapere i prezzi del mio mestiere?',
        a: 'Partiamo dal tuo prezzario: le prime settimane lo costruiamo insieme con i prezzi che usi davvero. Per i materiali controlliamo i fornitori. Tu confermi sempre prima che il preventivo esca.',
      },
      {
        q: 'E se il cliente chiede modifiche?',
        a: 'Ci mandi cosa cambia e facciamo una nuova versione, numerata. Lo storico resta: sai sempre quale versione hai consegnato e quando.',
      },
    ],
  },

  {
    slug: 'fatture',
    nav: 'Fatture e incassi',
    title: 'Fatture, acconti e la parte peggiore: farsi pagare',
    metaTitle: 'Gestione fatture e incassi per imprese edili — Ticino',
    metaDescription:
      'Fatture con QR svizzero collegate al preventivo, acconti, fatturazione per avanzamento lavori e solleciti scritti da noi. Per piccole imprese edili in Ticino.',
    keywords: [
      'fatture impresa edile Ticino',
      'fattura QR svizzera',
      'acconto lavori edili',
      'sollecito pagamento cliente',
      'fatturazione avanzamento lavori',
    ],
    screen: 'fatture',
    lead: 'Emettere la fattura è metà del lavoro. L’altra metà è ricordarsi chi non ha ancora pagato, e avere il fegato di scrivergli. Quella parte la facciamo noi.',
    pains: [
      'Hai finito il lavoro tre mesi fa e la fattura è ancora da fare.',
      'Non sai con precisione quanto ti devono in questo momento.',
      'Chiedere i soldi a un cliente che conosci ti mette a disagio.',
      'Gli acconti li concordi a voce e poi nessuno si ricorda le cifre.',
    ],
    steps: [
      {
        title: 'Ci dici che è ora',
        body: 'Un messaggio: "il lavoro dai Rossi è finito" oppure "chiedi il 30% di acconto". Basta questo.',
      },
      {
        title: 'Emettiamo la fattura',
        body: 'Collegata al preventivo approvato, con QR svizzero e le condizioni di pagamento concordate. Anche parziale, se fatturi per avanzamento lavori.',
      },
      {
        title: 'Teniamo il conto degli incassi',
        body: 'Chi ha pagato, chi no e da quanti giorni. Il sollecito lo scriviamo noi in italiano corretto: tu lo leggi e lo mandi.',
      },
    ],
    included: [
      'Fatture collegate al preventivo, con QR di pagamento svizzero',
      'Acconti e fatturazione parziale per avanzamento lavori',
      'Registrazione dei pagamenti ricevuti, anche parziali',
      'Elenco aggiornato dei crediti aperti e degli scaduti',
      'Testi di sollecito redatti da noi, pronti da mandare',
    ],
    excluded: [
      'Incasso in nostro nome o accesso al tuo conto bancario',
      'Recupero crediti legale e procedure di esecuzione',
      'Telefonate ai tuoi clienti',
    ],
    faq: [
      {
        q: 'Le fatture sono valide in Svizzera?',
        a: 'Sì. Includono QR svizzero, i tuoi dati, l’IVA quando dovuta e le condizioni di pagamento. Il tuo fiduciario le riceve ogni mese già ordinate.',
      },
      {
        q: 'Gestite anche l’IVA?',
        a: `Teniamo d'occhio il limite di CHF ${PRICING.vatThreshold.toLocaleString('de-CH')} e ti avvisiamo prima che tu lo superi. La dichiarazione la fa il tuo fiduciario: quella non è roba nostra.`,
      },
      {
        q: 'Potete sollecitare voi i clienti che non pagano?',
        a: 'Scriviamo noi il testo, ma il messaggio parte da te. Il rapporto con il tuo cliente resta tuo — e un sollecito che arriva dal titolare pesa di più.',
      },
    ],
  },

  {
    slug: 'spese-e-scontrini',
    nav: 'Spese e scontrini',
    title: 'Gli scontrini te li chiediamo noi, ogni venerdì',
    metaTitle: 'Gestione spese e scontrini per imprese edili — Ticino',
    metaDescription:
      'Fotografi lo scontrino, noi lo registriamo e lo colleghiamo al cantiere giusto. Ogni venerdì te li chiediamo noi: niente più buste nel furgone.',
    keywords: [
      'gestione scontrini impresa edile',
      'registrazione spese cantiere',
      'costi per cantiere',
      'contabilità spese edilizia Ticino',
    ],
    screen: 'spese',
    lead: 'Nessuno perde gli scontrini per pigrizia: li perde perché a fine giornata ha altro per la testa. Per questo non ti chiediamo di ricordartene — ci pensiamo noi, ogni settimana.',
    pains: [
      'Una busta di scontrini nel cruscotto, metà già illeggibili.',
      'Non sai quanto è costato davvero il cantiere finito il mese scorso.',
      'A dicembre il fiduciario chiede documenti che non esistono più.',
      'Compri in Italia e non sai a che cambio registrare la spesa.',
    ],
    steps: [
      {
        title: 'Fotografi e mandi',
        body: 'Anche solo la foto storta fatta in cassa. Se sai già per quale cantiere è, dillo; altrimenti ci pensiamo dopo.',
      },
      {
        title: 'Registriamo e colleghiamo',
        body: 'Fornitore, importo, tipo di spesa e cantiere. Gli acquisti in euro li convertiamo al cambio del giorno, e la ricevuta resta allegata.',
      },
      {
        title: 'Il venerdì ti scriviamo noi',
        body: 'Un messaggio che chiede gli scontrini della settimana. È l’abitudine che tiene in ordine tutto il resto.',
      },
    ],
    included: [
      'Registrazione illimitata degli scontrini che ci mandi',
      'Collegamento di ogni spesa al cantiere giusto',
      'Conversione EUR→CHF per gli acquisti in Italia',
      'Ricevuta fotografica archiviata e sempre ritrovabile',
      'Recupero attivo settimanale via WhatsApp',
    ],
    excluded: [
      'Pagamento dei fornitori in tuo nome',
      'Contestazioni e resi presso i fornitori',
      'Chiusura contabile e dichiarazione fiscale',
    ],
    faq: [
      {
        q: 'Quanti scontrini posso mandare?',
        a: 'Quanti ne hai. Il volume rientra nel canone: se la tua impresa produce molto più della media te lo diciamo prima, non a sorpresa in fattura.',
      },
      {
        q: 'E gli scontrini vecchi, di mesi fa?',
        a: 'Si recuperano. Il lavoro arretrato lo preventiviamo a parte prima di cominciare, così sai in anticipo quanto costa mettersi in pari.',
      },
    ],
  },

  {
    slug: 'rapportini-operai',
    nav: 'Ore degli operai',
    title: 'Le ore degli operai, registrate e firmabili',
    metaTitle: 'Rapportini e ore degli operai per imprese edili — Ticino',
    metaDescription:
      'Gli operai registrano ore, luogo e foto dal telefono. Tu approvi con un tocco. Alla fine esce un bollettino firmabile, valido anche per l’agenzia interinale.',
    keywords: [
      'rapportino operai edilizia',
      'registro ore cantiere',
      'bollettino ore agenzia interinale',
      'gestione operai piccola impresa',
    ],
    screen: 'rapportini',
    lead: 'Le ore sono la voce di costo più grande che hai e quella documentata peggio. Un foglio di carta non ti difende se il committente contesta, e nemmeno se l’agenzia ti fattura più del previsto.',
    pains: [
      'Le ore te le dicono a voce e le scrivi a fine settimana, a memoria.',
      'Non sai quanto è costata la manodopera su un cantiere specifico.',
      'L’agenzia interinale fattura e tu non hai come verificare.',
      'Se il cliente contesta le ore, non hai niente da mostrare.',
    ],
    steps: [
      {
        title: 'L’operaio registra dal telefono',
        body: 'Ore, luogo di lavoro, descrizione e foto di quello che ha fatto. Dal suo telefono, in due minuti, senza chiamarti.',
      },
      {
        title: 'Tu approvi',
        body: 'Vedi tutto in un elenco e approvi con un tocco. Solo le ore approvate contano come costo e come compenso maturato.',
      },
      {
        title: 'Esce il bollettino',
        body: 'Un PDF con date, luoghi, ore e spazio per due firme. Vale come giustificativo verso l’agenzia interinale e verso il committente.',
      },
    ],
    included: [
      'Accesso app dedicato per ogni operaio (fino a 5 compresi)',
      'Registrazione di ore, luogo, descrizione e foto',
      'Approvazione e correzione da parte tua',
      'Costo manodopera calcolato per cantiere',
      'Bollettino ore in PDF, firmabile',
    ],
    excluded: [
      'Buste paga, AVS e assicurazioni sociali',
      'Sorveglianza continua o localizzazione in tempo reale',
      'Gestione del contratto di lavoro',
    ],
    faq: [
      {
        q: 'È un sistema per controllare i miei operai?',
        a: 'No, ed è una scelta precisa. È documentazione del lavoro svolto — ore, luogo del rapportino, foto — che protegge te in caso di contestazione. La sorveglianza continua del comportamento dei dipendenti è vietata dalla legge svizzera e non la facciamo.',
      },
      {
        q: 'Funziona anche con operai da agenzia interinale?',
        a: 'Sì, ed è proprio lì che rende di più: confrontiamo le ore registrate con quanto ti fattura l’agenzia e ti segnaliamo la differenza.',
      },
      {
        q: 'E se un operaio non è pratico col telefono?',
        a: 'L’app ha una schermata sola e tre campi. Se proprio non se la sente, le ore le registri tu per lui — cambia poco.',
      },
    ],
  },

  {
    slug: 'report-fiduciario',
    nav: 'Report per il fiduciario',
    title: 'Il dossier che il tuo fiduciario vorrebbe ricevere',
    metaTitle: 'Report mensile per il fiduciario — imprese edili Ticino',
    metaDescription:
      'Fatture, incassi, scaduti, costi e manodopera in un dossier ordinato, ogni mese. Il tuo fiduciario smette di rincorrerti e tu smetti di temere dicembre.',
    keywords: [
      'report fiduciario impresa edile',
      'contabilità impresa edile Ticino',
      'documenti per fiduciario',
      'chiusura contabile piccola impresa',
    ],
    lead: 'Il tuo fiduciario non è il problema: il problema è la scatola di carta che gli arrivi a portare a dicembre. Noi gliela sostituiamo con un dossier ordinato, ogni mese.',
    pains: [
      'A dicembre passi giorni a cercare documenti di dieci mesi fa.',
      'Il fiduciario ti fattura ore che servono solo a mettere ordine.',
      'Non sai come sta andando l’anno finché non è finito.',
      'Ti accorgi di aver superato il limite IVA quando è troppo tardi.',
    ],
    steps: [
      {
        title: 'Raccogliamo durante il mese',
        body: 'Fatture emesse, incassi, spese e ore: tutto entra man mano, non in blocco a fine anno.',
      },
      {
        title: 'Chiudiamo il mese',
        body: 'Nei primi giorni prepariamo il dossier: documenti, riepiloghi e un export CSV che il fiduciario può caricare.',
      },
      {
        title: 'Ricevi il riassunto in cinque righe',
        body: 'Fatturato, incassato, da incassare, costi e un eventuale allarme. Su WhatsApp, in trenta secondi di lettura.',
      },
    ],
    included: [
      'Dossier mensile con fatture, incassi, scaduti, costi e manodopera',
      'Export CSV per il fiduciario',
      'Sorveglianza del limite IVA con avviso anticipato',
      'Riassunto mensile in cinque righe per te',
      'Segnalazione delle opere approvate ma non ancora fatturate',
    ],
    excluded: [
      'Dichiarazione IVA e dichiarazione d’imposta',
      'Chiusura contabile e bilancio',
      'Consulenza fiscale',
    ],
    faq: [
      {
        q: 'Sostituite il mio fiduciario?',
        a: 'No, e non vogliamo. Le dichiarazioni e la chiusura restano sue: è lui la validazione finale, non noi. Gli togliamo solo il lavoro di mettere ordine, che è quello che ti fattura più caro.',
      },
      {
        q: 'Il mio fiduciario deve cambiare programma?',
        a: 'No. Riceve PDF e un CSV standard. Se preferisce un formato diverso, ce lo dice e ci adattiamo.',
      },
    ],
  },
]

export function getService(slug: string) {
  return SERVICES.find((s) => s.slug === slug)
}
