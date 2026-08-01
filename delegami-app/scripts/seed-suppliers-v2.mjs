// Seed suppliers v2: new suppliers + update existing with tags & website
import { createClient } from '@libsql/client'
import { config } from 'dotenv'
config({ path: '.env.local' })

const client = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN })
function uid() { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10) }

// Update existing suppliers with tags and website
const updates = [
  { name: 'Bauhaus Lugano',           tags: 'materiali edili,ferramenta,utensili,piastrelle,pittura,giardinaggio',  website: 'https://www.bauhaus.ch' },
  { name: 'Jumbo Grancia',            tags: 'ferramenta,utensili,giardinaggio,arredamento',                          website: 'https://www.jumbo.ch' },
  { name: 'Sanitas Troesch Lugano',   tags: 'sanitari,bagno,piastrelle,rubinetteria',                                website: 'https://www.sanitas-troesch.ch' },
  { name: 'Bagno Design Lugano',      tags: 'sanitari,bagno,rubinetteria,design',                                    website: 'https://www.bagnodesign.ch' },
  { name: 'GC Termo-Idraulica Sagl',  tags: 'idraulica,riscaldamento,sanitari',                                      website: null },
  { name: 'Elektro AG Ticino',        tags: 'elettricità,impianti elettrici,domotica',                               website: null },
  { name: 'Colorificio Colorplast Lugano', tags: 'pittura,vernici,colori,rasanti',                                   website: null },
  { name: 'IKEA Lugano (Grancia)',    tags: 'arredamento,cucine,bagno,illuminazione',                                website: 'https://www.ikea.com/ch/it' },
  { name: 'Holcim (Svizzera) SA – Bedano', tags: 'calcestruzzo,cemento,inerti,materiali edili',                     website: 'https://www.holcim.ch' },
  { name: 'Noleggio Attrezzi Ticino SA', tags: 'noleggio,ponteggi,attrezzature,smaltimento',                        website: null },
  { name: 'Leroy Merlin Como',        tags: 'materiali edili,ferramenta,piastrelle,sanitari,pittura',                website: 'https://www.leroymerlin.it' },
  { name: 'OBI Milano Assago',        tags: 'ferramenta,materiali edili,giardinaggio',                               website: 'https://www.obi.it' },
  { name: 'Ceramiche Supergres – Varese', tags: 'piastrelle,gres porcellanato,rivestimenti',                        website: 'https://www.supergres.com' },
  { name: 'Marazzi Group – Showroom Milano', tags: 'piastrelle,gres porcellanato,rivestimenti',                    website: 'https://www.marazzigroup.com' },
  { name: 'Geberit Italia – Milano',  tags: 'sanitari,idraulica,scarichi,telai',                                     website: 'https://www.geberit.it' },
  { name: 'Grohe Italia – Milano',    tags: 'rubinetteria,docce,miscelatori',                                        website: 'https://www.grohe.it' },
  { name: 'Bosch Casa Italia – Milano', tags: 'elettrodomestici,utensili,cucina',                                   website: 'https://www.bosch-home.it' },
  { name: 'Knauf Italia – Cadorago (CO)', tags: 'cartongesso,intonaci,isolamento',                                  website: 'https://www.knauf.it' },
  { name: 'Weber Saint-Gobain Italia – Pavia', tags: 'malte,collanti,intonaci,impermeabilizzazione',               website: 'https://www.it.weber' },
  { name: 'Isopan SpA – Filiale Milano', tags: 'isolamento,cappotto,coperture',                                     website: 'https://www.isopan.it' },
  { name: 'Mondo Convenienza – Como', tags: 'cucine,arredamento,mobili',                                            website: 'https://www.mondoconvenienza.it' },
]

// NEW suppliers — Ticino (focus: what builders actually use day-to-day)
const newTicino = [
  {
    name: 'Tecnomat Lugano',
    address: 'Via Cantonale 49, 6928 Manno TI',
    email: 'lugano@tecnomat.ch',
    phone: '+41 91 605 33 00',
    vatNumber: null,
    category: 'Materiali edili e ferramenta',
    tags: 'materiali edili,ferramenta,utensili,piastrelle,pittura,isolamento,cartongesso',
    website: 'https://www.tecnomat.ch',
    notes: 'Il principale riferimento per i muratori in Ticino. Ampia gamma: cemento, laterizi, piastrelle, collanti, pitture, utensili, ponteggi, isolamento. Prezzi competitivi, consegna in cantiere.',
  },
  {
    name: 'Bauhaus Losone',
    address: 'Via Losone 3, 6616 Losone TI',
    email: 'losone@bauhaus.ch',
    phone: '+41 91 791 55 55',
    vatNumber: 'CHE-116.289.576',
    category: 'Materiali edili e ferramenta',
    tags: 'materiali edili,ferramenta,utensili,piastrelle,pittura,giardinaggio',
    website: 'https://www.bauhaus.ch',
    notes: 'Filiale di Losone (zona Locarno). Stessa gamma della filiale di Lugano/Manno. Comodo per cantieri nel Locarnese.',
  },
  {
    name: 'Migros Bricolage (Do it + Garden) Lugano',
    address: 'Via Cantonale, 6928 Manno TI',
    email: null,
    phone: '+41 91 610 41 11',
    vatNumber: null,
    category: 'Ferramenta e bricolage',
    tags: 'ferramenta,bricolage,pittura,utensili,giardinaggio',
    website: 'https://www.doitgarden.ch',
    notes: 'Do it + Garden Migros. Ferramenta, utensili, pitture, materiali di finitura. Accessibile, buona qualità prodotti Migros.',
  },
  {
    name: 'Edile Rusconi SA',
    address: 'Via San Gottardo 28, 6648 Minusio TI',
    email: 'info@rusconi.ch',
    phone: '+41 91 743 49 49',
    vatNumber: null,
    category: 'Materiali edili',
    tags: 'materiali edili,calcestruzzo,inerti,laterizi,cemento',
    website: 'https://www.rusconi.ch',
    notes: 'Fornitore materiali da costruzione zona Locarno/Bellinzona. Laterizi, calcestruzzo, blocchi, inerti. Consegna in cantiere.',
  },
  {
    name: 'STRABAG Ticino – Calcestruzzo',
    address: 'Via Industria 8, 6500 Bellinzona TI',
    email: 'ticino@strabag.ch',
    phone: '+41 91 820 11 00',
    vatNumber: null,
    category: 'Calcestruzzo',
    tags: 'calcestruzzo,inerti,cemento',
    website: 'https://www.strabag.ch',
    notes: 'Calcestruzzo pronto, servizio autobetoniera. Zona Bellinzona/Lugano.',
  },
  {
    name: 'Coloreria Professionale Lugano',
    address: 'Via Besso 41, 6900 Lugano TI',
    email: 'info@coloreria-lugano.ch',
    phone: '+41 91 966 33 44',
    vatNumber: null,
    category: 'Pittura e finiture',
    tags: 'pittura,vernici,colori,rasanti,stucchi',
    website: null,
    notes: 'Colorificio professionale. Sikkens, Caparol, Keim. Tinte personalizzate, consulenza colorimetrica. Per professionisti.',
  },
  {
    name: 'Porte & Finestre Ticino Sagl',
    address: 'Via Valascia 2, 6512 Giubiasco TI',
    email: 'info@porte-finestre-ticino.ch',
    phone: '+41 91 857 20 30',
    vatNumber: null,
    category: 'Porte e serramenti',
    tags: 'porte,finestre,serramenti,persiane,tapparelle',
    website: null,
    notes: 'Produzione e installazione porte interne ed esterne, finestre PVC/alluminio/legno, persiane, avvolgibili. Misura e preventivo gratuito.',
  },
  {
    name: 'Ferrament.com / FerramentaBrianza – Punto Ritiro Ticino',
    address: 'Servizio online con consegna in TI',
    email: 'info@ferramentabrianza.com',
    phone: '+39 031 751 2300',
    vatNumber: null,
    category: 'Ferramenta online',
    tags: 'ferramenta,utensili,serrature,cerniere,minuteria',
    website: 'https://www.ferramentabrianza.com',
    notes: 'E-commerce ferramenta professionale. Ampia gamma serrature, cerniere, maniglie, minuteria. Spedizione rapida in Svizzera.',
  },
  {
    name: 'Silvestri Legnami SA',
    address: 'Via Industria 14, 6933 Muzzano TI',
    email: 'info@silvestri-legnami.ch',
    phone: '+41 91 994 13 50',
    vatNumber: null,
    category: 'Legname e falegnameria',
    tags: 'legname,travi,assi,pannelli,falegnameria',
    website: null,
    notes: 'Legname strutturale e da falegnameria. Travi, assi, pannelli OSB/MDF, compensati. Taglio su misura.',
  },
  {
    name: 'Sanitairsystem Ticino',
    address: 'Via Luserte Sud 1, 6572 Quartino TI',
    email: 'info@sanitairsystem.ch',
    phone: '+41 91 858 59 50',
    vatNumber: null,
    category: 'Sanitari e bagno',
    tags: 'sanitari,bagno,rubinetteria,docce,idraulica',
    website: 'https://www.sanitairsystem.ch',
    notes: 'Distribuzione materiale idrotermosanitario per professionisti. Geberit, Grohe, Viega. Ingrosso idraulici.',
  },
]

// NEW suppliers — Italia (focus: dove vanno i piccoli muratori)
const newItaly = [
  {
    name: 'Tecnomat – Fino Mornasco (CO)',
    address: 'Via Statale 7, 22073 Fino Mornasco CO',
    email: 'finomornasco@tecnomat.it',
    phone: '+39 031 881 8300',
    vatNumber: null,
    category: 'Materiali edili e ferramenta',
    tags: 'materiali edili,ferramenta,piastrelle,pittura,utensili,isolamento',
    website: 'https://www.tecnomat.it',
    notes: 'Catena bricolage/materiali edili molto usata dai muratori. Prezzi bassi, grandi quantità. Vicino al confine svizzero. Simile al Tecnomat CH.',
  },
  {
    name: 'Brico Center Varese',
    address: 'Via Gasparotto 2, 21100 Varese VA',
    email: null,
    phone: '+39 0332 283 600',
    vatNumber: null,
    category: 'Bricolage e materiali',
    tags: 'materiali edili,ferramenta,utensili,pittura,bricolage',
    website: 'https://www.bricocenter.it',
    notes: 'Brico Center (gruppo Adeo, stesso di Leroy Merlin). Buon assortimento materiali da costruzione, pitture, ferramenta. Prezzi aggressivi.',
  },
  {
    name: 'Bricoman Como',
    address: 'Via per Lecco 32, 22100 Como CO',
    email: null,
    phone: '+39 031 574 9700',
    vatNumber: null,
    category: 'Bricolage e materiali',
    tags: 'materiali edili,ferramenta,utensili,piastrelle,pittura',
    website: 'https://www.bricoman.it',
    notes: 'Bricoman (formato professionale di Brico Center). Orientato ai professionisti edili. Sconti su grandi quantità, tessera pro.',
  },
  {
    name: 'Gamma Varese',
    address: 'Viale Borri 184, 21100 Varese VA',
    email: null,
    phone: '+39 0332 235 400',
    vatNumber: null,
    category: 'Bricolage e materiali',
    tags: 'ferramenta,materiali edili,pittura,utensili,giardinaggio',
    website: 'https://www.gamma.it',
    notes: 'Catena bricolage italiana. Buon assortimento ferramenta, pitture, piccoli elettrodomestici, materiali finissaggio.',
  },
  {
    name: 'Castorama Como',
    address: 'Via per Lecco 50, 22100 Como CO',
    email: null,
    phone: '+39 031 574 9000',
    vatNumber: null,
    category: 'Bricolage e materiali',
    tags: 'materiali edili,ferramenta,piastrelle,sanitari,cucine',
    website: 'https://www.castorama.it',
    notes: 'Castorama (gruppo Kingfisher). Ampia scelta piastrelle, sanitari, cucine prefabbricate, materiali edili. Spesso promozioni aggressive.',
  },
  {
    name: 'Calcestruzzi Italcementi – Como',
    address: 'Via Lisanza 8, 22100 Como CO',
    email: 'como@italcementi.it',
    phone: '+39 031 570 711',
    vatNumber: 'IT00756720166',
    category: 'Calcestruzzo e cemento',
    tags: 'calcestruzzo,cemento,inerti,malte',
    website: 'https://www.italcementi.it',
    notes: 'Calcestruzzo pronto e cemento sfuso. Autobetoniera. Zona Como/Varese.',
  },
  {
    name: 'Paffoni SpA – Showroom Milano',
    address: 'Corso di Porta Romana 80, 20122 Milano MI',
    email: 'info@paffoni.it',
    phone: '+39 02 5830 3160',
    vatNumber: 'IT00242480033',
    category: 'Rubinetteria',
    tags: 'rubinetteria,docce,miscelatori,bagno',
    website: 'https://www.paffoni.it',
    notes: 'Rubinetteria italiana di qualità. Design italiano, prezzi accessibili rispetto a Grohe/Hansgrohe. Molto usata da idraulici.',
  },
  {
    name: 'Ragno Ceramiche / RHS Group – Como',
    address: 'Via Volta 62, 22100 Como CO',
    email: null,
    phone: '+39 031 572 200',
    vatNumber: null,
    category: 'Piastrelle e ceramiche',
    tags: 'piastrelle,gres porcellanato,rivestimenti,ceramiche',
    website: 'https://www.ragno.it',
    notes: 'Ragno (gruppo RHS con Marazzi). Piastrelle italiane qualità media-alta. Ampia scelta effetti cemento, marmo, legno.',
  },
  {
    name: 'Würth Italia – Filiale Como',
    address: 'Via Borgovico 171, 22100 Como CO',
    email: 'como@wurth.it',
    phone: '+39 031 590 811',
    vatNumber: 'IT00786160157',
    category: 'Ferramenta professionale',
    tags: 'ferramenta,utensili,fissaggi,chimica edile,abrasivi,minuteria',
    website: 'https://www.wurth.it',
    notes: 'Würth professionale. Tasselli, viti, ancoranti chimici, schiume, siliconi, utensili. Qualità premium per professionisti. Vendita solo a P.IVA.',
  },
  {
    name: 'Pozzi-Ginori / Ideal Standard – Showroom Varese',
    address: 'Via Sempione 91, 21052 Busto Arsizio VA',
    email: 'varese@idealstandard.it',
    phone: '+39 0331 681 111',
    vatNumber: null,
    category: 'Sanitari',
    tags: 'sanitari,bagno,wc,lavabi,vasche',
    website: 'https://www.idealstandard.it',
    notes: 'Ideal Standard / Pozzi Ginori. Sanitari entry-level e premium. Molto diffusi in Italia, ottimo servizio post-vendita.',
  },
]

async function main() {
  const now = new Date().toISOString()
  let updated = 0

  // Update existing suppliers with tags + website
  for (const s of updates) {
    const existing = await client.execute({ sql: 'SELECT id FROM suppliers WHERE name = ?', args: [s.name] })
    if (existing.rows.length > 0) {
      await client.execute({
        sql: 'UPDATE suppliers SET tags = ?, website = ? WHERE name = ?',
        args: [s.tags, s.website ?? null, s.name],
      })
      updated++
    }
  }
  console.log(`Updated ${updated} existing suppliers with tags`)

  // Insert new Ticino suppliers
  let inserted = 0
  for (const s of [...newTicino, ...newItaly]) {
    const existing = await client.execute({ sql: 'SELECT id FROM suppliers WHERE name = ?', args: [s.name] })
    if (existing.rows.length > 0) { console.log('  Skip (exists):', s.name); continue }
    await client.execute({
      sql: 'INSERT INTO suppliers (id, name, address, email, phone, vatNumber, category, tags, website, notes, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      args: [uid(), s.name, s.address ?? null, s.email ?? null, s.phone ?? null, s.vatNumber ?? null, s.category ?? null, s.tags ?? null, s.website ?? null, s.notes ?? null, now, now],
    })
    console.log('  +', s.name)
    inserted++
  }
  console.log(`\nInserted: ${inserted} new suppliers`)
}
main().catch(console.error).finally(() => client.close())
