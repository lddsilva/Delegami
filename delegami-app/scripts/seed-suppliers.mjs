import { createClient } from '@libsql/client'
import { config } from 'dotenv'
config({ path: '.env.local' })

const client = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN })

function uid() { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10) }

const suppliers = [
  // ─── TICINO ─────────────────────────────────────────────────────────────────
  {
    name: 'Bauhaus Lugano',
    address: 'Via Cantonale 48, 6928 Manno TI',
    email: 'lugano@bauhaus.ch',
    phone: '+41 91 605 11 11',
    vatNumber: 'CHE-116.289.576',
    category: 'Materiali edili e ferramenta',
    notes: 'Grande magazzino DIY e materiali edili. Ottimo per piastrelle, battiscopa, vernici, utensili, gres porcellanato. Sito: https://www.bauhaus.ch',
  },
  {
    name: 'Jumbo Grancia',
    address: 'Strada Cantonale, 6916 Grancia TI',
    email: 'grancia@jumbo.ch',
    phone: '+41 91 994 42 00',
    vatNumber: null,
    category: 'Materiali edili e ferramenta',
    notes: 'Ferramenta, materiali per la casa e il giardino, utensili. Sito: https://www.jumbo.ch',
  },
  {
    name: 'Sanitas Troesch Lugano',
    address: 'Via della Pace 1A, 6900 Lugano TI',
    email: 'lugano@sanitas-troesch.ch',
    phone: '+41 91 921 93 93',
    vatNumber: 'CHE-105.818.092',
    category: 'Sanitari e bagno',
    notes: 'Specialista sanitari, rubinetteria, docce, vasche, box doccia, piastrelle. Showroom a Lugano. Sito: https://www.sanitas-troesch.ch',
  },
  {
    name: 'Bagno Design Lugano',
    address: 'Corso Pestalozzi 9, 6900 Lugano TI',
    email: 'info@bagnodesign.ch',
    phone: '+41 91 922 62 02',
    vatNumber: null,
    category: 'Sanitari e bagno',
    notes: 'Showroom sanitari di design, marchi Grohe, Hansgrohe, Duravit, Villeroy & Boch. Sito: https://www.bagnodesign.ch',
  },
  {
    name: 'GC Termo-Idraulica Sagl',
    address: 'Via Lugano 10, 6710 Biasca TI',
    email: 'info@gc-termoidraulica.ch',
    phone: '+41 91 862 11 55',
    vatNumber: null,
    category: 'Idraulica e riscaldamento',
    notes: 'Impianti idraulici, riscaldamento, sanitari. Subappaltatore abituale per lavori idraulici. Offerta N. 2026.05.002 in archivio.',
  },
  {
    name: 'Elektro AG Ticino',
    address: 'Via Industria 3, 6933 Muzzano TI',
    email: 'info@elektroag-ticino.ch',
    phone: '+41 91 994 20 30',
    vatNumber: null,
    category: 'Elettricità',
    notes: 'Impianti elettrici civili e industriali, domotica, fotovoltaico. Partner per subappalto impianti elettrici Ticino.',
  },
  {
    name: 'Colorificio Colorplast Lugano',
    address: 'Via Nassa 20, 6900 Lugano TI',
    email: 'info@colorplast.ch',
    phone: '+41 91 923 45 67',
    vatNumber: null,
    category: 'Colori e pittura',
    notes: 'Pitture Sikkens, Caparol, Sigma, vernici, stucchi, prodotti impermeabilizzanti. Consulenza tecnica e colori.',
  },
  {
    name: 'IKEA Lugano (Grancia)',
    address: 'Via Industria 1, 6916 Grancia TI',
    email: null,
    phone: '+41 848 801 700',
    vatNumber: 'CHE-116.296.453',
    category: 'Arredamento e complementi',
    notes: 'Mobili bagno (ANGSJÖN, GODMORGON), cucine (METOD), armadi (PAX), illuminazione, complementi. Sito: https://www.ikea.com/ch/it',
  },
  {
    name: 'Holcim (Svizzera) SA – Bedano',
    address: 'Viale Officine 13, 6930 Bedano TI',
    email: 'ticino@holcim.ch',
    phone: '+41 91 935 43 00',
    vatNumber: 'CHE-101.808.508',
    category: 'Calcestruzzo e inerti',
    notes: 'Fornitura calcestruzzo pronto, cemento, aggregati, inerti. Servizio autoclave Ticino. Sito: https://www.holcim.ch',
  },
  {
    name: 'Noleggio Attrezzi Ticino SA',
    address: 'Via al Piano 8, 6963 Pregassona TI',
    email: 'info@noleggio-ticino.ch',
    phone: '+41 91 940 10 20',
    vatNumber: null,
    category: 'Noleggio attrezzature edili',
    notes: 'Noleggio ponteggi, casseforme, utensili cantiere, compressori, generatori, smaltimento macerie.',
  },

  // ─── NORD ITALIA ────────────────────────────────────────────────────────────
  {
    name: 'Leroy Merlin Como',
    address: 'Via per Lecco 50, 22100 Como CO',
    email: 'como@leroymerlin.it',
    phone: '+39 031 571 4000',
    vatNumber: 'IT02595180244',
    category: 'Materiali edili e ferramenta',
    notes: 'Grande distribuzione materiali edili, piastrelle, sanitari, pitture. Prezzi competitivi per acquisti bulk. Sito: https://www.leroymerlin.it',
  },
  {
    name: 'OBI Milano Assago',
    address: 'Via Milanofiori, 20057 Assago MI',
    email: 'assago@obi.it',
    phone: '+39 02 4577 2700',
    vatNumber: 'IT03649710152',
    category: 'Materiali edili e ferramenta',
    notes: 'Ferramenta, materiali da costruzione, giardinaggio, finiture. Sito: https://www.obi.it',
  },
  {
    name: 'Ceramiche Supergres – Varese',
    address: 'Viale Belforte 271, 21100 Varese VA',
    email: 'varese@supergres.com',
    phone: '+39 0332 231 800',
    vatNumber: 'IT01642640361',
    category: 'Piastrelle e ceramiche',
    notes: 'Gres porcellanato, piastrelle grande formato 60x120, rivestimenti effetto marmo e cemento. Ottimo rapporto q/p. Sito: https://www.supergres.com',
  },
  {
    name: 'Marazzi Group – Showroom Milano',
    address: 'Via dei Missaglia 97, 20142 Milano MI',
    email: 'showroom.milano@marazzigroup.com',
    phone: '+39 02 8464 1900',
    vatNumber: 'IT01249570368',
    category: 'Piastrelle e ceramiche',
    notes: 'Leader mondiale piastrelle. Gres porcellanato, cotto, effetto legno, marmo. Premium. Sito: https://www.marazzigroup.com',
  },
  {
    name: 'Geberit Italia – Milano',
    address: 'Via Canova 4, 20145 Milano MI',
    email: 'info.it@geberit.com',
    phone: '+39 02 46 78 321',
    vatNumber: 'IT12879690155',
    category: 'Sanitari e sistemi idraulici',
    notes: 'Sistemi di scarico, cassette incasso Duofix, WC sospesi, Aquaclean. Standard Svizzera. Sito: https://www.geberit.it',
  },
  {
    name: 'Grohe Italia – Milano',
    address: 'Piazza Filippo Meda 4, 20121 Milano MI',
    email: 'info.it@grohe.com',
    phone: '+39 02 629 701',
    vatNumber: 'IT03560380963',
    category: 'Rubinetteria e docce',
    notes: 'Rubinetteria premium, sistemi doccia Rainshower, miscelatori Eurosmart. Marchio di riferimento per cantieri di qualita. Sito: https://www.grohe.it',
  },
  {
    name: 'Bosch Casa Italia – Milano',
    address: 'Via GB Pirelli 10, 20124 Milano MI',
    email: 'customer.service@bosch.it',
    phone: '+39 02 3669 1',
    vatNumber: 'IT05291860015',
    category: 'Elettrodomestici',
    notes: 'Elettrodomestici da incasso (forno, piano cottura, lavastoviglie, frigorifero), utensili elettrici per cantiere. Sito: https://www.bosch-home.it',
  },
  {
    name: 'Knauf Italia – Cadorago (CO)',
    address: 'Via Provinciale 14, 22070 Cadorago CO',
    email: 'info@knauf.it',
    phone: '+39 031 900 1',
    vatNumber: 'IT01042730136',
    category: 'Cartongesso e intonaci',
    notes: 'Lastre cartongesso, profili metallici, intonaci, massetti, isolanti. Standard europeo per contropareti e soffitti. Sito: https://www.knauf.it',
  },
  {
    name: 'Weber Saint-Gobain Italia – Pavia',
    address: 'Via Vigentina 81, 27100 Pavia PV',
    email: 'info.italia@weber.com',
    phone: '+39 0382 422 11',
    vatNumber: 'IT01535970188',
    category: 'Malte e collanti',
    notes: 'Malte, intonaci, collanti per piastrelle (webercol), impermeabilizzanti, rasanti, massetti autolivellanti. Sito: https://www.it.weber',
  },
  {
    name: 'Isopan SpA – Filiale Milano',
    address: 'Via Gaudenzio Ferrari 1, 20123 Milano MI',
    email: 'info@isopan.it',
    phone: '+39 02 4694 1',
    vatNumber: 'IT00534830228',
    category: 'Isolamento e cappotto',
    notes: 'Pannelli isolanti, sistemi cappotto (ETICS), coperture sandwich, isolamento termico e acustico. Sito: https://www.isopan.it',
  },
]

async function main() {
  const now = new Date().toISOString()
  let inserted = 0
  for (const s of suppliers) {
    const id = uid()
    await client.execute({
      sql: 'INSERT INTO suppliers (id, name, address, email, phone, vatNumber, category, notes, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?)',
      args: [id, s.name, s.address ?? null, s.email ?? null, s.phone ?? null, s.vatNumber ?? null, s.category ?? null, s.notes ?? null, now, now],
    })
    inserted++
    console.log('  ', s.name)
  }
  console.log(`\nInseriti: ${inserted} fornitori`)
}

main().catch(console.error).finally(() => client.close())
