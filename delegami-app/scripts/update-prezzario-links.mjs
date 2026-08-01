// Update prezzario items with product/category links
// Links based on: Bauhaus CH, IKEA CH, Grohe IT, Geberit IT, Bosch IT, Knauf IT, Weber IT, Marazzi IT, Leroy Merlin IT
import { createClient } from '@libsql/client'
import { config } from 'dotenv'
config({ path: '.env.local' })

const client = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN })

// Category-level links (apply to all items in a category when no specific link available)
const CATEGORY_LINKS = {
  'Pavimenti – Gres Porcellanato':    'https://www.bauhaus.ch/it/piastrelle-in-gres-porcellanato/c/10002587\nhttps://www.marazzigroup.com/collections/',
  'Pavimenti – Piastrelle Speciali':  'https://www.bauhaus.ch/it/c/piastrelle\nhttps://www.marazzigroup.com/collections/',
  'Pavimenti – Parquet e Laminato':   'https://www.bauhaus.ch/it/c/pavimenti-laminati\nhttps://www.bauhaus.ch/it/pavimentazione/battiscopa-profili-terminali',
  'Pavimenti – Battiscopa e Profili': 'https://www.bauhaus.ch/it/pavimentazione/battiscopa-profili-terminali',
  'Pavimenti – Posa e Collanti':      'https://www.bauhaus.ch/it/piastrelle-in-gres-porcellanato/c/10002587\nhttps://www.leroymerlin.it/prodotti/pavimenti-e-rivestimenti/posa-pavimenti-e-piastrelle/colle-per-piastrelle/',
  'Pavimenti – Esterni':              'https://www.bauhaus.ch/it/piastrelle-per-pavimenti/c/10000500',
  'Bagno – WC':                       'https://www.geberit.it/sistemi-sanitari-e-tubazioni/sistemi-di-installazione-e-di-risciacquo/geberit-duofix/\nhttps://www.sanitas-troesch.ch',
  'Bagno – Lavabi e Bidet':           'https://www.sanitas-troesch.ch\nhttps://www.ikea.com/ch/it/cat/combinazioni-di-mobili-per-lavabo-16673/',
  'Bagno – Docce e Box':              'https://www.sanitas-troesch.ch\nhttps://www.geberit.it/sistemi-sanitari-e-tubazioni/sistemi-di-installazione-e-di-risciacquo/',
  'Bagno – Rubinetteria':             'https://www.grohe.it/it_it/eurosmart-miscelatore-monocomando-per-lavabo-taglia-m-23322001.html\nhttps://www.sanitas-troesch.ch',
  'Bagno – Mobili':                   'https://www.ikea.com/ch/it/cat/godmorgon-serie-15287/\nhttps://www.sanitas-troesch.ch',
  'Bagno – Accessori':                'https://www.bauhaus.ch/it/c/accessori-per-il-bagno\nhttps://www.sanitas-troesch.ch',
  'Bagno – Ventilazione':             'https://www.bauhaus.ch/it/c/ventilatori',
  'Bagno – Impianto Idraulico':       'https://www.geberit.it/sistemi-sanitari-e-tubazioni/',
  'Bagno – Riscaldamento':            'https://www.bauhaus.ch/it/c/riscaldamento',
  'Cucina – Mobili e Piani':          'https://www.ikea.com/ch/it/cat/basi-cucina-19218/\nhttps://www.ikea.com/ch/it/cat/pensili-cucina-19220/',
  'Cucina – Lavello e Rubinetteria':  'https://www.bauhaus.ch/it/c/lavelli\nhttps://www.grohe.it/it_it/eurosmart-miscelatore-monocomando-per-lavabo-taglia-m-23322001.html',
  'Cucina – Cottura':                 'https://www.bosch-home.com/it/prodotti/cottura\nhttps://www.bosch-home.com/it/prodotti/cappe',
  'Cucina – Elettrodomestici':        'https://www.bosch-home.com/it/prodotti/lavaggio/lavastoviglie\nhttps://www.bosch-home.com/it/prodotti/refrigerazione',
  'Cucina – Accessori e Illuminazione': 'https://www.ikea.com/ch/it/cat/illuminazione-cucina-10730/',
  'Strutture – Muratura':             'https://www.bauhaus.ch/it/c/legno-e-materiali-edilizi\nhttps://www.holcim.ch',
  'Strutture – Cartongesso':          'https://tools.knauf.it/\nhttps://www.bauhaus.ch/it/c/cartongesso',
  'Strutture – Isolamento':           'https://www.rockwool.com/it/prodotti/\nhttps://www.bauhaus.ch/it/c/isolamento',
  'Strutture – Impermeabilizzazione': 'https://www.it.weber/search-content/content_type/product/activities/malte-impermeabilizzanti-1526',
  'Strutture – Porte e Finestre':     'https://www.bauhaus.ch/it/c/porte\nhttps://www.bauhaus.ch/it/c/finestre',
  'Strutture – Finiture Edili':       'https://www.bauhaus.ch/it/c/cornici-e-modanature',
  'Strutture – Scale':                'https://www.bauhaus.ch/it/c/scale-e-gradini',
  'Finiture – Intonaci e Rasanti':    'https://www.it.weber/search-content/content_type/product/activities/malte-e-intonaci-56\nhttps://www.knauf.it',
  'Finiture – Pittura':               'https://www.bauhaus.ch/it/c/colori\nhttps://www.bauhaus.ch/it/c/vernici',
  'Finiture – Fondi e Primer':        'https://www.bauhaus.ch/it/c/colori',
  'Impianti – Elettrica':             'https://www.bauhaus.ch/it/c/materiale-elettrico',
  'Impianti – Idraulica':             'https://www.geberit.it/sistemi-sanitari-e-tubazioni/\nhttps://www.bauhaus.ch/it/c/idraulica',
  'Impianti – Riscaldamento':         'https://www.bauhaus.ch/it/c/riscaldamento',
  'Impianti – Gas':                   'https://www.bauhaus.ch/it/c/gas',
  'Manodopera – Muratura':            'https://www.tecnomat.ch',
  'Manodopera – Idraulica':           'https://www.geberit.it',
  'Manodopera – Elettrica':           'https://www.feller.ch',
  'Manodopera – Demolizioni':         'https://www.tecnomat.ch',
  'Manodopera – Generale':            'https://www.tecnomat.ch',
  'Logistica – Trasporto e Smaltimento': 'https://www.tecnomat.ch',
  'Logistica – Ponteggi e Noleggio':  'https://www.tecnomat.ch',
  'Logistica – Pulizia':              'https://www.bauhaus.ch/it/c/prodotti-per-la-pulizia',
  'Utensili – Accessori e Strumenti': 'https://www.bauhaus.ch/it/c/utensili',
  'Varie – Generale':                 'https://www.bauhaus.ch/it',
}

// Specific item overrides — matched by description keyword (case-insensitive)
// Format: { match: 'keyword', links: 'url1\nurl2' }
const SPECIFIC_LINKS = [
  // Gres specifici con codice Bauhaus
  { match: 'active beige', links: 'https://www.bauhaus.ch/it/p/gres-porcellanato-active-beige-31365295' },
  { match: 'tribeca', links: 'https://www.bauhaus.ch/it/p/piastrella-in-gres-porcellanato-tribeca-28795195' },
  { match: 'logoclic', links: 'https://www.bauhaus.ch/it/pavimentazione/battiscopa-profili-terminali\nhttps://www.bauhaus.ch/it/p/logoclic-battiscopa-rovere-firenze-31158811' },
  { match: 'rovere firenze', links: 'https://www.bauhaus.ch/it/p/logoclic-battiscopa-rovere-firenze-31158811' },
  { match: '31158811', links: 'https://www.bauhaus.ch/it/p/logoclic-battiscopa-rovere-firenze-31158811' },
  { match: '31365295', links: 'https://www.bauhaus.ch/it/p/gres-porcellanato-active-beige-31365295' },
  { match: '28795195', links: 'https://www.bauhaus.ch/it/p/piastrella-in-gres-porcellanato-tribeca-28795195' },
  { match: 'one grey', links: 'https://www.bauhaus.ch/it/p/gres-porcellanato-one-grigio-28378541' },

  // Parquet e laminato
  { match: 'parquet prefinito', links: 'https://www.bauhaus.ch/it/c/parquet' },
  { match: 'laminato ac5', links: 'https://www.bauhaus.ch/it/c/pavimenti-laminati' },
  { match: 'laminato ac4', links: 'https://www.bauhaus.ch/it/c/pavimenti-laminati' },
  { match: 'lvt', links: 'https://www.bauhaus.ch/it/c/pavimenti-in-vinile' },
  { match: 'luxury vinyl', links: 'https://www.bauhaus.ch/it/c/pavimenti-in-vinile' },
  { match: 'vinilico', links: 'https://www.bauhaus.ch/it/c/pavimenti-in-vinile' },

  // Battiscopa
  { match: 'battiscopa mdf', links: 'https://www.bauhaus.ch/it/pavimentazione/battiscopa-profili-terminali' },
  { match: 'battiscopa pvc', links: 'https://www.bauhaus.ch/it/pavimentazione/battiscopa-profili-terminali' },
  { match: 'profilo transizione', links: 'https://www.bauhaus.ch/it/pavimentazione/battiscopa-profili-terminali' },
  { match: 'profilo riduzione', links: 'https://www.bauhaus.ch/it/pavimentazione/battiscopa-profili-terminali' },

  // Collanti Weber
  { match: 'webercol', links: 'https://www.it.weber/search-content/content_type/product/activities/colle-cementizie-42' },
  { match: 'colla c2', links: 'https://www.leroymerlin.it/prodotti/pavimenti-e-rivestimenti/posa-pavimenti-e-piastrelle/colle-per-piastrelle/\nhttps://www.it.weber/search-content/content_type/product/activities/colle-cementizie-42' },
  { match: 'colla c1', links: 'https://www.leroymerlin.it/prodotti/pavimenti-e-rivestimenti/posa-pavimenti-e-piastrelle/colle-per-piastrelle/' },
  { match: 'colla flessibile', links: 'https://www.leroymerlin.it/prodotti/pavimenti-e-rivestimenti/posa-pavimenti-e-piastrelle/colle-per-piastrelle/' },
  { match: 'mapei adesilex', links: 'https://www.leroymerlin.it/prodotti/pavimenti-e-rivestimenti/posa-pavimenti-e-piastrelle/colle-per-piastrelle/' },
  { match: 'massetto autolivellante', links: 'https://www.it.weber/search-content/content_type/product/activities/malte-e-intonaci-56' },
  { match: 'massetto fibrorinforzato', links: 'https://www.it.weber/search-content/content_type/product/activities/malte-e-intonaci-56' },
  { match: 'stucco fughe', links: 'https://www.bauhaus.ch/it/c/stucco-per-fughe\nhttps://www.leroymerlin.it/prodotti/pavimenti-e-rivestimenti/posa-pavimenti-e-piastrelle/colle-per-piastrelle/' },
  { match: 'stucco epossidico', links: 'https://www.leroymerlin.it/prodotti/pavimenti-e-rivestimenti/posa-pavimenti-e-piastrelle/colle-per-piastrelle/' },
  { match: 'primer consolidante', links: 'https://www.it.weber/search-content/content_type/product/activities/malte-e-intonaci-56' },
  { match: 'prim 801', links: 'https://www.it.weber/search-content/content_type/product/activities/malte-e-intonaci-56' },

  // Impermeabilizzazione
  { match: 'mapelastic', links: 'https://www.leroymerlin.it/prodotti/idraulica-termoidraulica-e-ventilazione/impermeabilizzanti/' },
  { match: 'guaina impermeabilizzante', links: 'https://www.bauhaus.ch/it/c/impermeabilizzazione' },
  { match: 'guaina bituminosa', links: 'https://www.bauhaus.ch/it/c/impermeabilizzazione' },
  { match: 'guaina liquida', links: 'https://www.bauhaus.ch/it/c/impermeabilizzazione' },
  { match: 'kerdi', links: 'https://www.schluter.com/it-it/products/schluter-kerdi' },
  { match: 'nastro impermeabilizzante', links: 'https://www.bauhaus.ch/it/c/impermeabilizzazione' },

  // Pitture Caparol
  { match: 'caparol', links: 'https://www.bauhaus.ch/it/c/colori\nhttps://www.caparol.ch/it' },
  { match: 'tex color', links: 'https://www.bauhaus.ch/it/c/colori' },
  { match: 'disbopaint', links: 'https://www.bauhaus.ch/it/c/colori' },
  { match: 'indeko', links: 'https://www.bauhaus.ch/it/c/colori' },
  { match: 'tiefgrund', links: 'https://www.bauhaus.ch/it/c/colori' },
  { match: 'amphisilan', links: 'https://www.bauhaus.ch/it/c/colori' },
  { match: 'capacryl', links: 'https://www.bauhaus.ch/it/c/vernici' },
  { match: 'haftgrund', links: 'https://www.bauhaus.ch/it/c/colori' },
  { match: 'sikkens', links: 'https://www.bauhaus.ch/it/c/vernici' },
  { match: 'pittura lavabile', links: 'https://www.bauhaus.ch/it/c/colori' },
  { match: 'smalto satinato', links: 'https://www.bauhaus.ch/it/c/vernici' },
  { match: 'pittura soffitto', links: 'https://www.bauhaus.ch/it/c/colori' },
  { match: 'pittura per esterni', links: 'https://www.bauhaus.ch/it/c/colori' },

  // Intonaci Weber
  { match: 'intonaco di fondo', links: 'https://www.it.weber/search-content/content_type/product/activities/malte-e-intonaci-56' },
  { match: 'intonaco di finitura', links: 'https://www.it.weber/search-content/content_type/product/activities/malte-e-intonaci-56' },
  { match: 'rasante cementizio', links: 'https://www.it.weber/search-content/content_type/product/activities/malte-e-intonaci-56' },
  { match: 'rasante in pasta', links: 'https://www.it.weber/search-content/content_type/product/activities/malte-e-intonaci-56' },
  { match: 'intonaco al gesso', links: 'https://www.it.weber/search-content/content_type/product/activities/malte-e-intonaci-56\nhttps://tools.knauf.it/' },
  { match: 'intonaco esterno', links: 'https://www.it.weber/search-content/content_type/product/activities/malte-e-intonaci-56' },
  { match: 'weber therm', links: 'https://www.it.weber/search-content/content_type/product/activities/malte-e-intonaci-56' },

  // Geberit
  { match: 'duofix', links: 'https://www.geberit.it/sistemi-sanitari-e-tubazioni/sistemi-di-installazione-e-di-risciacquo/geberit-duofix/' },
  { match: 'sigma', links: 'https://www.geberit.it/sistemi-sanitari-e-tubazioni/sistemi-di-installazione-e-di-risciacquo/cassette-da-incasso/' },
  { match: 'geberit silent', links: 'https://www.geberit.it/sistemi-sanitari-e-tubazioni/sistemi-di-evacuazione/geberit-silent-pp/' },
  { match: 'geberit aquaclean', links: 'https://www.geberit.it/prodotti/sanitari/wc-e-wc-con-funzione-doccia/aquaclean/' },
  { match: 'piletta scarico', links: 'https://www.geberit.it/sistemi-sanitari-e-tubazioni/sistemi-di-scarico/' },
  { match: 'scarico lineare', links: 'https://www.geberit.it/sistemi-sanitari-e-tubazioni/sistemi-di-scarico/' },
  { match: 'viega', links: 'https://www.viega.it/it/prodotti.html' },

  // Sanitari
  { match: 'wc sospeso', links: 'https://www.geberit.it/prodotti-per-l-arredobagno/wc/wc-sospeso-acanto/\nhttps://www.sanitas-troesch.ch' },
  { match: 'wc a pavimento', links: 'https://www.sanitas-troesch.ch\nhttps://www.idealstandard.it/prodotti/wc/' },
  { match: 'copriwater', links: 'https://www.bauhaus.ch/it/c/wc-copriwater' },
  { match: 'duravit', links: 'https://www.duravit.it/products/all_series/d_neo.de.html' },
  { match: 'villeroy', links: 'https://www.villeroy-boch.it/bagno/wc.html' },
  { match: 'ideal standard', links: 'https://www.idealstandard.it/prodotti/' },
  { match: 'laufen', links: 'https://www.laufen.com/it-it.html' },

  // Box doccia e vasche
  { match: 'box doccia', links: 'https://www.sanitas-troesch.ch\nhttps://www.bauhaus.ch/it/c/box-doccia' },
  { match: 'piatto doccia', links: 'https://www.sanitas-troesch.ch\nhttps://www.bauhaus.ch/it/c/piatti-doccia' },
  { match: 'walk-in', links: 'https://www.sanitas-troesch.ch\nhttps://www.bauhaus.ch/it/c/box-doccia' },
  { match: 'vasca da bagno', links: 'https://www.sanitas-troesch.ch\nhttps://www.kaldewei.com/it/' },
  { match: 'kaldewei', links: 'https://www.kaldewei.com/it/prodotti/vasche-da-bagno/' },

  // Rubinetteria Grohe
  { match: 'grohe eurosmart', links: 'https://www.grohe.it/it_it/eurosmart-miscelatore-monocomando-per-lavabo-taglia-m-23322001.html' },
  { match: 'grohe minta', links: 'https://www.grohe.it/it_it/prodotti/cucina/rubinetteria-cucina/grohe-minta/' },
  { match: 'grohe rainshower', links: 'https://www.grohe.it/it_it/prodotti/doccia/colonne-doccia/grohe-rainshower-system-400/' },
  { match: 'grohe vitalio', links: 'https://www.grohe.it/it_it/prodotti/doccia/set-doccia/' },
  { match: 'hansgrohe', links: 'https://www.hansgrohe.com/it' },
  { match: 'paffoni', links: 'https://www.paffoni.it/prodotti/' },
  { match: 'colonna doccia', links: 'https://www.grohe.it/it_it/prodotti/doccia/colonne-doccia/' },
  { match: 'soffione', links: 'https://www.grohe.it/it_it/prodotti/doccia/soffioni/' },

  // Mobili bagno IKEA
  { match: 'godmorgon', links: 'https://www.ikea.com/ch/it/cat/godmorgon-serie-15287/' },
  { match: 'godmorgen', links: 'https://www.ikea.com/ch/it/cat/godmorgon-serie-15287/' },
  { match: 'lettan', links: 'https://www.ikea.com/ch/it/p/lettan-mobile-a-specchio-con-ante-effetto-specchio-vetro-a-specchio-80534923/' },
  { match: 'angsjön', links: 'https://www.ikea.com/ch/it/p/aengsjoen-backsjoen-mobile-lavabo-cassetti-lavabo-misc-s19521123/' },
  { match: 'angsjön', links: 'https://www.ikea.com/ch/it/p/aengsjoen-backsjoen-mobile-lavabo-cassetti-lavabo-misc-s19521123/' },
  { match: '195.211.23', links: 'https://www.ikea.com/ch/it/p/aengsjoen-backsjoen-mobile-lavabo-cassetti-lavabo-misc-s19521123/' },

  // Cucina IKEA
  { match: 'metod', links: 'https://www.ikea.com/ch/it/cat/cucine-20164/' },
  { match: 'voxtorp', links: 'https://www.ikea.com/ch/it/cat/voxtorp-20169/' },
  { match: 'maximera', links: 'https://www.ikea.com/ch/it/cat/cassetti-18699/' },

  // Elettrodomestici Bosch
  { match: 'bosch pvs', links: 'https://www.bosch-home.com/it/prodotti/cottura/piani-cottura/piani-a-induzione' },
  { match: 'bosch dwb', links: 'https://www.bosch-home.com/it/prodotti/cappe' },
  { match: 'bosch hbg', links: 'https://www.bosch-home.com/it/prodotti/cottura/forni' },
  { match: 'bosch sms', links: 'https://www.bosch-home.com/it/prodotti/lavaggio/lavastoviglie' },
  { match: 'bosch kin', links: 'https://www.bosch-home.com/it/prodotti/refrigerazione/frigoriferi-combinati' },
  { match: 'piano cottura a induzione', links: 'https://www.bosch-home.com/it/prodotti/cottura/piani-cottura/piani-a-induzione\nhttps://www.bauhaus.ch/it/c/piani-cottura' },
  { match: 'piano cottura gas', links: 'https://www.bosch-home.com/it/prodotti/cottura/piani-cottura/piani-gas\nhttps://www.bauhaus.ch/it/c/piani-cottura' },
  { match: 'vitroceramica', links: 'https://www.bosch-home.com/it/prodotti/cottura/piani-cottura/piani-in-vetroceramica\nhttps://www.bauhaus.ch/it/c/piani-cottura' },
  { match: 'forno elettrico', links: 'https://www.bosch-home.com/it/prodotti/cottura/forni\nhttps://www.bauhaus.ch/it/c/forni-da-incasso' },
  { match: 'forno a vapore', links: 'https://www.miele.it/freestanding/aspirapolvere-senza-sacco/c/MaschinenartDampfgarer' },
  { match: 'cappa aspirante', links: 'https://www.bosch-home.com/it/prodotti/cappe\nhttps://www.bauhaus.ch/it/c/cappe' },
  { match: 'lavastoviglie', links: 'https://www.bosch-home.com/it/prodotti/lavaggio/lavastoviglie\nhttps://www.bauhaus.ch/it/c/lavastoviglie' },
  { match: 'frigorifero', links: 'https://www.bosch-home.com/it/prodotti/refrigerazione\nhttps://www.bauhaus.ch/it/c/frigoriferi' },
  { match: 'lavatrice', links: 'https://www.bosch-home.com/it/prodotti/lavaggio/lavatrici\nhttps://www.bauhaus.ch/it/c/lavatrici' },
  { match: 'asciugatrice', links: 'https://www.bosch-home.com/it/prodotti/lavaggio/asciugatrici\nhttps://www.bauhaus.ch/it/c/asciugatrici' },
  { match: 'lavasciuga', links: 'https://www.bauhaus.ch/it/c/lavasciugatrici' },
  { match: 'microonde', links: 'https://www.bosch-home.com/it/prodotti/cottura/microonde\nhttps://www.bauhaus.ch/it/c/microonde' },
  { match: 'nespresso', links: 'https://www.nespresso.com/ch/it/' },
  { match: 'cantinetta', links: 'https://www.bauhaus.ch/it/c/cantinette-vini' },
  { match: 'quooker', links: 'https://www.quooker.it' },

  // Lavello
  { match: 'lavello inox', links: 'https://www.bauhaus.ch/it/c/lavelli\nhttps://www.franke.com/it/it/hp/cucina.html' },
  { match: 'lavello silgranit', links: 'https://www.blanco.com/it-it/prodotti/lavello' },
  { match: 'blanco', links: 'https://www.blanco.com/it-it/prodotti/lavello' },
  { match: 'franke', links: 'https://www.franke.com/it/it/hp/cucina.html' },

  // Cartongesso Knauf
  { match: 'gkb', links: 'https://tools.knauf.it/\nhttps://magazine.knauf.it/prodotti/lastre/' },
  { match: 'gkbi', links: 'https://tools.knauf.it/\nhttps://magazine.knauf.it/prodotti/lastre/lastre-gkf/' },
  { match: 'gkf', links: 'https://tools.knauf.it/\nhttps://magazine.knauf.it/prodotti/lastre/lastre-gkf/' },
  { match: 'knauf', links: 'https://tools.knauf.it/' },
  { match: 'profilo c 75', links: 'https://tools.knauf.it/\nhttps://www.leroymerlin.it/prodotti/costruzione/cartongesso/' },
  { match: 'profilo u 75', links: 'https://tools.knauf.it/\nhttps://www.leroymerlin.it/prodotti/costruzione/cartongesso/' },
  { match: 'profilo cd', links: 'https://tools.knauf.it/' },
  { match: 'lastra cartongesso', links: 'https://tools.knauf.it/\nhttps://www.bauhaus.ch/it/c/cartongesso' },
  { match: 'fugenfüller', links: 'https://tools.knauf.it/' },

  // Isolamento
  { match: 'rockwool', links: 'https://www.rockwool.com/it/prodotti/' },
  { match: 'lana di roccia', links: 'https://www.rockwool.com/it/prodotti/\nhttps://www.bauhaus.ch/it/c/isolamento' },
  { match: 'eps ', links: 'https://www.bauhaus.ch/it/c/isolamento\nhttps://www.isopan.it' },
  { match: 'xps ', links: 'https://www.bauhaus.ch/it/c/isolamento' },
  { match: 'isopan', links: 'https://www.isopan.it' },

  // Porte
  { match: 'porta interna tamburata', links: 'https://www.bauhaus.ch/it/c/porte-interne' },
  { match: 'porta a scorrimento', links: 'https://www.bauhaus.ch/it/c/porte-scorrevoli' },
  { match: 'porta blindata', links: 'https://www.dierre.it/it/porte-blindate/' },
  { match: 'maniglia porta', links: 'https://www.bauhaus.ch/it/c/maniglie' },

  // Finestre
  { match: 'finestra pvc', links: 'https://www.bauhaus.ch/it/c/finestre\nhttps://www.leroymerlin.it/prodotti/costruzione/finestre-e-portefinestre/' },
  { match: 'finestra alluminio', links: 'https://www.bauhaus.ch/it/c/finestre' },
  { match: 'velux', links: 'https://www.velux.ch/it' },
  { match: 'tapparella', links: 'https://www.bauhaus.ch/it/c/tapparelle' },
  { match: 'zanzariera', links: 'https://www.bauhaus.ch/it/c/zanzariere' },

  // Materiali elettrici
  { match: 'feller', links: 'https://www.feller.ch/it/prodotti' },
  { match: 'interruttore semplice', links: 'https://www.bauhaus.ch/it/c/interruttori\nhttps://www.feller.ch/it/prodotti' },
  { match: 'presa bipasso', links: 'https://www.bauhaus.ch/it/c/prese-elettriche\nhttps://www.feller.ch/it/prodotti' },
  { match: 'cavo ny-m', links: 'https://www.bauhaus.ch/it/c/cavi-elettrici' },
  { match: 'tubo corrugato', links: 'https://www.bauhaus.ch/it/c/tubi-e-raccordi' },
  { match: 'cassetta da incasso', links: 'https://www.bauhaus.ch/it/c/cassette-elettriche' },
  { match: 'faretto led', links: 'https://www.bauhaus.ch/it/c/faretti' },
  { match: 'dimmer led', links: 'https://www.bauhaus.ch/it/c/interruttori' },
  { match: 'strip led', links: 'https://www.bauhaus.ch/it/c/strisce-led\nhttps://www.ikea.com/ch/it/cat/illuminazione-led-20623/' },
  { match: 'sensore presenza', links: 'https://www.bauhaus.ch/it/c/sensori-di-movimento' },

  // Riscaldamento
  { match: 'radiatore in acciaio', links: 'https://www.bauhaus.ch/it/c/radiatori\nhttps://www.purmo.com/it' },
  { match: 'valvola termostatica', links: 'https://www.bauhaus.ch/it/c/valvole-termostatiche\nhttps://www.danfoss.com/it-it/products/hvr/household/heat/thermostatic-radiator-valves/' },
  { match: 'testa termostatica', links: 'https://www.bauhaus.ch/it/c/valvole-termostatiche' },
  { match: 'termostato ambiente', links: 'https://www.bauhaus.ch/it/c/termostati' },
  { match: 'termostato smart', links: 'https://www.bauhaus.ch/it/c/termostati\nhttps://www.tado.com/it' },
  { match: 'riscaldamento a pavimento', links: 'https://www.bauhaus.ch/it/c/riscaldamento-a-pavimento' },
  { match: 'scaldasalviette', links: 'https://www.bauhaus.ch/it/c/scaldasalviette' },

  // Varie
  { match: 'silicone', links: 'https://www.bauhaus.ch/it/c/silicone' },
  { match: 'schiuma poliuretanica', links: 'https://www.bauhaus.ch/it/c/schiume-poliuretaniche' },
  { match: 'nastro carta', links: 'https://www.bauhaus.ch/it/c/nastri-adesivi' },
  { match: 'telo protezione', links: 'https://www.bauhaus.ch/it/c/teli-protettivi' },
  { match: 'rete fibra', links: 'https://www.bauhaus.ch/it/c/reti-di-armatura' },
  { match: 'würth', links: 'https://www.wurth.it/c/fissaggio' },
  { match: 'tassello chimico', links: 'https://www.bauhaus.ch/it/c/tasselli\nhttps://www.wurth.it/c/fissaggio' },
  { match: 'ventilatore bagno', links: 'https://www.bauhaus.ch/it/c/ventilatori-da-bagno' },
]

async function main() {
  const rows = await client.execute('SELECT id, category, description, notes FROM price_items ORDER BY category')
  console.log(`Processing ${rows.rows.length} items...\n`)

  let updated = 0
  let skipped = 0

  for (const row of rows.rows) {
    const id = row.id
    const category = String(row.category ?? '')
    const description = String(row.description ?? '').toLowerCase()
    const notes = String(row.notes ?? '').toLowerCase()

    // 1. Check specific item overrides first
    let links = null
    for (const rule of SPECIFIC_LINKS) {
      if (description.includes(rule.match.toLowerCase()) || notes.includes(rule.match.toLowerCase())) {
        links = rule.links
        break
      }
    }

    // 2. Fall back to category links
    if (!links && CATEGORY_LINKS[category]) {
      links = CATEGORY_LINKS[category]
    }

    if (!links) { skipped++; continue }

    await client.execute({
      sql: 'UPDATE price_items SET links = ? WHERE id = ?',
      args: [links, id],
    })
    updated++
  }

  console.log(`✅  Aggiornati: ${updated}`)
  console.log(`⏭   Senza link: ${skipped}`)
  console.log(`\n📊 Copertura: ${Math.round(updated / rows.rows.length * 100)}%`)
}

main().catch(console.error).finally(() => client.close())
