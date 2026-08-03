/**
 * Twenty planned Instagram posts.
 *
 * Content pillars, roughly in the proportion a service like this needs:
 *   pain (6)  — recognition; the builder must see himself before he listens
 *   useful (5) — real information, given away; proves competence without selling
 *   method (4) — how we work; this is what separates us from a freelancer
 *   objection (3) — answered in public, before it kills a private conversation
 *   proof (2) — the real case, anonymised
 *
 * Nothing here is invented. The only figures used are the real ones from the
 * reference case and the actual Swiss VAT threshold. No fake testimonials.
 */

export const POSTS = [
  {
    n: 1,
    pillar: 'pain',
    layout: 'navy',
    headline: 'Preventivi\nalle 22:00.',
    accent: 'alle 22:00.',
    sub: 'Dopo dieci ore di cantiere, seduto al tavolo di cucina.',
    caption: `Non è disorganizzazione. È che nessuno può costruire di giorno e fare l'ufficio di notte.\n\nIl preventivo è la cosa che ti fa vincere il lavoro, ed è anche l'ultima cosa che riesci a fare bene alle dieci di sera.\n\nDa noi funziona così: ce lo mandi a voce mentre sei ancora in cantiere. Te lo restituiamo scritto, in italiano, pronto da consegnare.`,
  },
  {
    n: 2,
    pillar: 'pain',
    layout: 'light',
    headline: 'Quanti lavori hai perso\nperché il preventivo\nè arrivato tardi?',
    accent: 'è arrivato tardi?',
    sub: null,
    caption: `Il cliente ha chiamato tre imprese. Ha preso quella che ha risposto per prima.\n\nNon quella più brava. Quella più veloce.\n\nSe il preventivo ti porta via una serata, arriverai sempre terzo. Non è un problema di capacità: è un problema di tempo che non hai.`,
  },
  {
    n: 3,
    pillar: 'proof',
    layout: 'stat',
    stat: "CHF 73'800",
    statLabel: 'fatturati in 4 mesi',
    sub: 'Una ditta individuale in Ticino. Il titolare non ha toccato una scartoffia.',
    caption: `Un solo titolare, sempre in cantiere. Quattro mesi. CHF 73'800 di lavori gestiti — preventivi, fatture, spese, ore — senza che lui aprisse un raccoglitore.\n\nCliente reale, numeri reali, nome riservato. Trattiamo i dati dei nostri clienti come vorremmo fossero trattati i nostri.`,
  },
  {
    n: 4,
    pillar: 'useful',
    layout: 'navy',
    headline: 'La busta di scontrini\nnel furgone\nha un costo.',
    accent: 'ha un costo.',
    sub: 'Ogni scontrino che sparisce è una deduzione che non farai.',
    caption: `Uno scontrino da CHF 80 non sembra niente. Trenta scontrini da CHF 80 sono CHF 2'400 di spese che il tuo fiduciario non può dedurre, perché non esistono più.\n\nNon è pigrizia: a fine giornata hai altro per la testa. Per questo non ti chiediamo di ricordartene.`,
  },
  {
    n: 5,
    pillar: 'useful',
    layout: 'stat',
    stat: "CHF 100'000",
    statLabel: 'la soglia IVA in Svizzera',
    sub: 'Superarla senza accorgersene è uno dei modi più cari di crescere.',
    caption: `Sopra CHF 100'000 di fatturato annuo l'assoggettamento all'IVA diventa obbligatorio. Il problema non è l'IVA: è accorgersene a gennaio, quando la soglia l'hai passata a settembre.\n\nSe non sai in tempo reale a quanto sei, non puoi decidere niente — né i prezzi, né quando accettare il prossimo lavoro.`,
  },
  {
    n: 6,
    pillar: 'method',
    layout: 'mint',
    headline: 'Ogni venerdì\ngli scontrini\nte li chiediamo noi.',
    accent: 'te li chiediamo noi.',
    sub: null,
    caption: `Questa è la parte che nessun altro fa.\n\nNon ti diamo un'app e ti auguriamo buona fortuna. Il venerdì ti arriva un messaggio, tu rispondi con le foto della settimana, e noi registriamo tutto collegandolo al cantiere giusto.\n\nÈ l'abitudine che tiene in ordine tutto il resto.`,
  },
  {
    n: 7,
    pillar: 'objection',
    layout: 'light',
    headline: '«Sostituite\nil mio fiduciario?»\nNo.',
    accent: 'No.',
    sub: 'Gli togliamo solo il lavoro di mettere ordine — quello che ti fattura più caro.',
    caption: `Le dichiarazioni fiscali e la chiusura contabile restano sue. È lui la validazione finale dei tuoi numeri, non noi.\n\nQuello che cambia è cosa gli arriva: un dossier ordinato ogni mese, invece di una scatola di carta a dicembre.\n\nDi solito il fiduciario è il primo contento.`,
  },
  {
    n: 8,
    pillar: 'cta',
    layout: 'navy',
    headline: 'Mandaci un vocale.\nTi restituiamo\nil preventivo.',
    accent: 'il preventivo.',
    sub: 'Gratis, una volta, senza impegno.',
    caption: `Due minuti di audio su un lavoro che devi preventivare questa settimana: cosa c'è da fare, le misure che hai, i materiali che hai in mente.\n\nEntro 48 ore lavorative ti mandiamo il preventivo in italiano, in PDF, pronto da consegnare al tuo cliente.\n\nSe ti piace, parliamo. Se non ti piace, il preventivo resta tuo lo stesso.`,
  },
  {
    n: 9,
    pillar: 'pain',
    layout: 'light',
    headline: "Sai quanto ti è costato\ndavvero l'ultimo\ncantiere?",
    accent: "l'ultimo\ncantiere?",
    sub: null,
    caption: `Il fatturato lo sai. Il costo, quasi mai — perché è sparso fra scontrini, ore degli operai e fatture dei fornitori arrivate in tre momenti diversi.\n\nE senza il costo non sai il margine. Senza il margine, il prezzo del prossimo preventivo è un'ipotesi.`,
  },
  {
    n: 10,
    pillar: 'useful',
    layout: 'list',
    headline: 'Un preventivo\nche il cliente firma',
    items: [
      'Voci raggruppate per fase di lavoro',
      'Prezzi unitari, non un totale unico',
      'Cosa è escluso, scritto nero su bianco',
      'Validità e condizioni di pagamento',
    ],
    caption: `Il cliente non firma il preventivo più basso. Firma quello che capisce.\n\nUn totale unico da CHF 40'000 fa paura. Le stesse cifre divise per fasi, con i prezzi unitari e cosa non è compreso, diventano una decisione invece che un salto nel vuoto.\n\nÈ il motivo per cui scriviamo sempre due versioni: una per il cliente, una interna con i tuoi margini.`,
  },
  {
    n: 11,
    pillar: 'objection',
    layout: 'light',
    headline: '«Devo imparare\nun software?»\nNo.',
    accent: 'No.',
    sub: 'Tu mandi un vocale su WhatsApp, come fai già con chiunque.',
    caption: `L'app c'è ed è tua, ma serve per guardare i numeri quando ti va — non è un compito in più.\n\nNoi non vendiamo un programma da imparare. Vendiamo il lavoro fatto. Il software è l'attrezzo con cui lo facciamo, ed è compreso.`,
  },
  {
    n: 12,
    pillar: 'method',
    layout: 'stat',
    stat: '4h / 48h',
    statLabel: 'risposta / esecuzione',
    sub: 'Ore lavorative. Scritto nel contratto, non promesso a voce.',
    caption: `Conferma di ricezione entro 4 ore lavorative. Esecuzione entro 48. Lun–Ven, 8:00–18:00.\n\nFuori orario i messaggi arrivano lo stesso ed entrano in coda: non devi guardare l'orologio prima di scriverci.\n\nLe urgenze si gestiscono, con un supplemento concordato prima. Mai una sorpresa in fattura.`,
  },
  {
    n: 13,
    pillar: 'pain',
    layout: 'navy',
    headline: 'Il cliente ha chiamato\ntre imprese.',
    accent: 'tre imprese.',
    sub: 'Ha preso quella che ha risposto per prima.',
    caption: `Nel nostro mestiere la velocità di risposta vale quanto il prezzo. A volte di più.\n\nChi risponde in giornata sembra organizzato, affidabile, serio. Chi risponde dopo cinque giorni sembra il contrario — anche quando è il migliore dei tre.`,
  },
  {
    n: 14,
    pillar: 'useful',
    layout: 'navy',
    headline: 'Le ore su un foglio\ndi carta non ti\ndifendono.',
    accent: 'non ti\ndifendono.',
    sub: 'Né davanti al committente, né davanti all’agenzia interinale.',
    caption: `Se il committente contesta le ore, cosa mostri?\n\nOre registrate dal telefono, con luogo e foto del lavoro svolto, approvate da te: quella è documentazione. Un foglio scritto a memoria il venerdì sera non lo è.\n\nE se lavori con agenzie interinali, è anche l'unico modo di verificare cosa ti stanno fatturando.`,
  },
  {
    n: 15,
    pillar: 'proof',
    layout: 'stat',
    stat: '0',
    statLabel: 'serate passate a fare scartoffie',
    sub: 'È la metrica che conta davvero.',
    caption: `Puoi misurare un servizio amministrativo in molti modi. Quello onesto è: quante sere alla settimana passi ancora a fare l'ufficio?\n\nSe la risposta non scende a zero nel primo mese, non stiamo facendo il nostro lavoro.`,
  },
  {
    n: 16,
    pillar: 'method',
    layout: 'list',
    bullet: 'cross',
    headline: 'Cosa NON\nfacciamo',
    items: [
      'Dichiarazioni fiscali e chiusura contabile',
      'Pagamenti a tuo nome o accesso al tuo conto',
      'Stipendi, AVS e assicurazioni sociali',
      'Presenza in cantiere',
    ],
    caption: `Lo scriviamo qui perché lo scriviamo anche nel contratto.\n\nUn servizio che promette tutto finisce per fare male tutto. Sapere cosa non è incluso vale quanto sapere cosa lo è — è così che si evitano i malintesi al terzo mese.\n\nPreferiamo dirti di no in anticipo che deluderti dopo.`,
  },
  {
    n: 17,
    pillar: 'pain',
    layout: 'light',
    headline: 'A dicembre il tuo\nfiduciario riceve\nun dossier o una scatola?',
    accent: 'un dossier o una scatola?',
    sub: null,
    caption: `La scatola di carta a dicembre non costa solo tempo tuo. Costa anche le ore che il fiduciario ti fattura per metterla in ordine — le più care che paghi in tutto l'anno.\n\nUn dossier mensile con fatture, incassi, scaduti, costi e manodopera cambia quel conto.`,
  },
  {
    n: 18,
    pillar: 'method',
    layout: 'light',
    headline: 'Un interlocutore.\nSempre lo stesso.',
    accent: 'Sempre lo stesso.',
    sub: 'Non un centralino. Non un ticket. Una persona che conosce i tuoi cantieri.',
    caption: `Siamo piccoli, ed è esattamente il punto.\n\nChi risponde ai tuoi messaggi è la stessa persona che scrive i tuoi preventivi, conosce i tuoi fornitori e sa come si chiamano le tue opere.\n\nNon abbiamo cento clienti e non li vogliamo: oltre un certo numero il servizio smette di essere questo.`,
  },
  {
    n: 19,
    pillar: 'useful',
    layout: 'navy',
    headline: 'Fotografare\nuno scontrino:\n4 secondi.',
    accent: '4 secondi.',
    sub: 'Ritrovarlo a dicembre: impossibile.',
    caption: `Il momento giusto per gestire uno scontrino è mentre sei ancora in cassa. Dopo, entra nella busta del furgone e la busta non si apre più.\n\nQuattro secondi contro un pomeriggio di ricerche a fine anno. È tutta qui la differenza.`,
  },
  {
    n: 20,
    pillar: 'cta',
    layout: 'mint',
    headline: 'Tu costruisci.\nDelegami il resto.',
    accent: 'Delegami il resto.',
    sub: 'Collaborazione amministrativa per piccole imprese edili. Cantone Ticino.',
    caption: `Preventivi, fatture, spese, ore degli operai e il report per il fiduciario: li facciamo noi.\n\nTu mandi una foto o un vocale su WhatsApp, quando ti fa comodo. Il resto sparisce dalla tua testa.\n\nScrivici: la prima consulenza non costa niente e non ti impegna a nulla.`,
  },
]

/** Same set for every post: local intent first, trade second, generic last. */
export const HASHTAGS = [
  '#impresaedile', '#ticino', '#cantoneticino', '#lugano', '#bellinzona',
  '#locarno', '#mendrisio', '#edilizia', '#ristrutturazioni', '#cantiere',
  '#artigiani', '#piccolaimpresa', '#imprenditore', '#svizzera',
  '#amministrazione', '#preventivi', '#delegami',
]
