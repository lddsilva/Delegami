/**
 * Delegami — Database Seed
 * Dados de mercado: Ticino/Svizzera 2024-2025
 * Riferimenti prezzi: NPK (Norme di Posizione Catalogo CH), tariffe SSIC TI, AITI
 */

import { PrismaClient } from '../src/generated/prisma/client'
// @ts-ignore — adapter types vary by version
import { PrismaLibSql } from '@prisma/adapter-libsql'
import bcrypt from 'bcryptjs'

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? 'file:./dev.db',
  authToken: process.env.DATABASE_AUTH_TOKEN,
})
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  console.log('🌱 Seeding Delegami...\n')

  // ─── Users ───────────────────────────────────────────────────────────────────
  // Clear and recreate seed users cleanly
  await prisma.user.deleteMany({ where: { id: { in: ['usr-1', 'usr-2', 'usr-3'] } } })
  const users = [
    { id: 'usr-1', name: 'Leandro', email: 'leandro@impresademo.ch', password: 'leandro123', role: 'ADMIN' as const },
    { id: 'usr-2', name: 'Marcos', email: 'marcos@impresademo.ch', password: 'marcos123', role: 'MANAGER' as const },
  ]
  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 12)
    await prisma.user.create({ data: { id: u.id, name: u.name, email: u.email, passwordHash, role: u.role } })
  }
  console.log(`✓ ${users.length} utenti`)
  console.log('  Admin:   leandro@impresademo.ch / leandro123')
  console.log('  Manager: marcos@impresademo.ch  / marcos123')

  // ─── Company Settings ────────────────────────────────────────────────────────
  await prisma.companySettings.upsert({
    where: { id: 'company-1' },
    update: {},
    create: {
      id: 'company-1',
      name: 'Impresa Demo Sagl',
      address: 'Via Lugano 14',
      city: 'Lugano',
      postalCode: '6900',
      country: 'CH',
      phone: '+41 91 123 45 67',
      email: 'info@impresademo.ch',
      vatNumber: 'CHE-123.456.789 MWST',
      iban: 'CH56 0483 5012 3456 7800 9',
      paymentTerms: 'Pagamento entro 30 giorni dalla data fattura. In caso di ritardo si applicano interessi di mora del 5% annuo.',
      quoteFooterText: 'Il presente preventivo ha validità 30 giorni dalla data di emissione. I prezzi si intendono IVA esclusa.',
      invoiceFooterText: 'Grazie per la fiducia accordataci. Per qualsiasi informazione non esitate a contattarci.',
    },
  })
  console.log('✓ Company settings')

  // ─── Price Catalog ───────────────────────────────────────────────────────────
  // Fonte prezzi:
  //   NPK = Norme di Posizione Catalogo (CRB Svizzera) — prezzi costo
  //   SSIC TI = Tariffa oraria Società Svizzera Impresari Costruttori, sezione Ticino
  //   AITI = Associazione Imprese Tecniche d'Installazione Ticino

  const priceItems = [
    // DEMOLIZIONE
    { code: 'D.01', category: 'Demolizione', description: 'Demolizione tramezzi in muratura piena', unit: 'm²', unitCost: 38, notes: 'Incl. carico macerie. Rif. NPK 171.11' },
    { code: 'D.02', category: 'Demolizione', description: 'Demolizione tramezzi in cartongesso', unit: 'm²', unitCost: 22, notes: 'Incl. smontaggio telaio. Rif. NPK 172.01' },
    { code: 'D.03', category: 'Demolizione', description: 'Rimozione pavimento ceramico / gres', unit: 'm²', unitCost: 24, notes: 'Incl. raschiatura colla. Rif. NPK 171.21' },
    { code: 'D.04', category: 'Demolizione', description: 'Rimozione pavimento in parquet (doppio strato)', unit: 'm²', unitCost: 18, notes: 'Rif. NPK 171.22' },
    { code: 'D.05', category: 'Demolizione', description: 'Smontaggio sanitari bagno completo (WC, lavabo, doccia)', unit: 'set', unitCost: 320, notes: 'Per bagno standard. Rif. NPK 231' },
    { code: 'D.06', category: 'Demolizione', description: 'Smontaggio cucina componibile', unit: 'corpo', unitCost: 280, notes: 'Incl. disconnessione allacciamenti. Rif. NPK 232' },
    { code: 'D.07', category: 'Demolizione', description: 'Smontaggio porta interna con telaio', unit: 'pz', unitCost: 85, notes: 'Rif. NPK 173' },
    { code: 'D.08', category: 'Demolizione', description: 'Trasporto e smaltimento macerie in discarica autorizzata', unit: 't', unitCost: 290, notes: 'Incl. tassa discarica Ticino 2024. Rif. CADMEF' },

    // MURATURA
    { code: 'M.01', category: 'Muratura', description: 'Parete divisoria in cartongesso singolo (1×12.5mm)', unit: 'm²', unitCost: 72, notes: 'Telaio 75mm, incl. materiali. Rif. NPK 672.11' },
    { code: 'M.02', category: 'Muratura', description: 'Parete divisoria in cartongesso doppio con lana di roccia', unit: 'm²', unitCost: 105, notes: 'Isolamento acustico 50mm. Rif. NPK 672.21' },
    { code: 'M.03', category: 'Muratura', description: 'Rivestimento parete in cartongesso su muro esistente', unit: 'm²', unitCost: 58, notes: 'Rif. NPK 672.31' },
    { code: 'M.04', category: 'Muratura', description: 'Chiusura traccia impiantistica con gesso', unit: 'ml', unitCost: 18, notes: 'Rif. NPK 651' },
    { code: 'M.05', category: 'Muratura', description: 'Fornitura e posa porta scorrevole tipo Scrigno (solo struttura)', unit: 'pz', unitCost: 420, notes: 'Esclusa porta. Rif. listino Eclisse 2024' },
    { code: 'M.06', category: 'Muratura', description: 'Rinforzo strutturale con putrella HEA 120', unit: 'ml', unitCost: 380, notes: 'Incl. posa e protezione antincendio. Rif. NPK 511' },

    // INTONACI
    { code: 'I.01', category: 'Intonaci', description: 'Rasatura parete con gesso (strato di finitura 3-5mm)', unit: 'm²', unitCost: 26, notes: 'Rif. NPK 651.31' },
    { code: 'I.02', category: 'Intonaci', description: 'Intonaco civile su parete (12-15mm)', unit: 'm²', unitCost: 44, notes: 'Intonaco premiscelato. Rif. NPK 651.11' },
    { code: 'I.03', category: 'Intonaci', description: 'Rasatura soffitto con gesso', unit: 'm²', unitCost: 32, notes: 'Maggiorazione +20% per quota. Rif. NPK 651.32' },
    { code: 'I.04', category: 'Intonaci', description: 'Impermeabilizzazione zona doccia con membrana liquida', unit: 'm²', unitCost: 58, notes: '2 mani + armatura angoli. Rif. NPK 661.11' },
    { code: 'I.05', category: 'Intonaci', description: 'Trattamento fessure con rete e rasatura', unit: 'ml', unitCost: 22, notes: 'Rif. NPK 651.41' },

    // PAVIMENTI E RIVESTIMENTI
    { code: 'P.01', category: 'Pavimenti e rivestimenti', description: 'Preparazione sottofondo autolivellante', unit: 'm²', unitCost: 28, notes: 'Sp. 5-10mm. Rif. NPK 611.11' },
    { code: 'P.02', category: 'Pavimenti e rivestimenti', description: 'Posa piastrelle pavimento (formato fino a 60×60)', unit: 'm²', unitCost: 58, notes: 'Solo posa. Rif. NPK 612.11' },
    { code: 'P.03', category: 'Pavimenti e rivestimenti', description: 'Posa rivestimento parete (formato fino a 30×90)', unit: 'm²', unitCost: 68, notes: 'Solo posa. Rif. NPK 612.21' },
    { code: 'P.04', category: 'Pavimenti e rivestimenti', description: 'Fornitura piastrelle gres porcellanato standard (fino a 40€/m²)', unit: 'm²', unitCost: 42, notes: 'Prezzo medio mercato TI 2024' },
    { code: 'P.05', category: 'Pavimenti e rivestimenti', description: 'Fornitura piastrelle gres porcellanato premium (fino a 80€/m²)', unit: 'm²', unitCost: 85, notes: 'Grandi formati, effetto marmo' },
    { code: 'P.06', category: 'Pavimenti e rivestimenti', description: 'Fornitura e posa battiscopa in ceramica', unit: 'ml', unitCost: 22, notes: 'H 7-10cm. Rif. NPK 612.31' },

    // PARQUET
    { code: 'Q.01', category: 'Parquet', description: 'Fornitura parquet prefinito rovere 14mm (3 strati)', unit: 'm²', unitCost: 68, notes: 'Classe AC4, larghezza 140mm. Listino Bauwerk 2024' },
    { code: 'Q.02', category: 'Parquet', description: 'Fornitura parquet massiccio rovere 20mm', unit: 'm²', unitCost: 95, notes: 'Larghezza 120mm. Listino Barlinek/Kährs 2024' },
    { code: 'Q.03', category: 'Parquet', description: 'Posa parquet prefinito incollato su sottofondo', unit: 'm²', unitCost: 48, notes: 'Incl. colla MS-polymer. Rif. NPK 621.11' },
    { code: 'Q.04', category: 'Parquet', description: 'Posa parquet flottante con sottofondi', unit: 'm²', unitCost: 38, notes: 'Incl. telo PE e sottopavimento. Rif. NPK 621.21' },
    { code: 'Q.05', category: 'Parquet', description: 'Levigatura e trattamento parquet esistente', unit: 'm²', unitCost: 22, notes: 'Levigatura + 2 mani olio/vernice. Rif. NPK 625' },

    // PITTURA
    { code: 'T.01', category: 'Pittura', description: 'Tinteggiatura parete (primer + 2 mani colore)', unit: 'm²', unitCost: 14, notes: 'Pittura lavabile Sigma/Sikkens. Rif. NPK 671.11' },
    { code: 'T.02', category: 'Pittura', description: 'Tinteggiatura soffitto (primer + 2 mani bianco)', unit: 'm²', unitCost: 17, notes: 'Maggiorazione quota. Rif. NPK 671.12' },
    { code: 'T.03', category: 'Pittura', description: 'Applicazione sigillante acrilico pareti nuove', unit: 'm²', unitCost: 6, notes: 'Prima dell\'applicazione pittura. Rif. NPK 671.01' },
    { code: 'T.04', category: 'Pittura', description: 'Tinteggiatura porta + telaio (2 mani smalto)', unit: 'pz', unitCost: 95, notes: 'Smalto satinato. Rif. NPK 671.21' },

    // IMPIANTI IDRAULICI
    { code: 'H.01', category: 'Impianti idraulici', description: 'Ora idraulico qualificato', unit: 'h', unitCost: 112, notes: 'Tariffa oraria SSIC TI 2024 + oneri sociali' },
    { code: 'H.02', category: 'Impianti idraulici', description: 'Punto acqua calda/fredda a parete (traccia + allacciamento)', unit: 'pz', unitCost: 310, notes: 'Tubi multicouche. Rif. NPK 221' },
    { code: 'H.03', category: 'Impianti idraulici', description: 'Punto di scarico a pavimento (sifone + tubo)', unit: 'pz', unitCost: 280, notes: 'Incl. traccia. Rif. NPK 222' },
    { code: 'H.04', category: 'Impianti idraulici', description: 'Predisposizione piatto doccia incassato', unit: 'pz', unitCost: 480, notes: 'Sifone ultra-piatto + scarico. Rif. NPK 223' },
    { code: 'H.05', category: 'Impianti idraulici', description: 'Impianto riscaldamento a pavimento (solo circuiti)', unit: 'm²', unitCost: 48, notes: 'Tubi PEX, incl. massetto. Rif. NPK 224' },

    // IMPIANTI ELETTRICI
    { code: 'E.01', category: 'Impianti elettrici', description: 'Ora elettricista qualificato', unit: 'h', unitCost: 108, notes: 'Tariffa AITI TI 2024 + oneri sociali' },
    { code: 'E.02', category: 'Impianti elettrici', description: 'Punto presa (traccia + tubo + presa)', unit: 'pz', unitCost: 185, notes: 'Presa 10/16A. Rif. NIBT 2020 / NPK 331' },
    { code: 'E.03', category: 'Impianti elettrici', description: 'Punto luce a soffitto (traccia + tubo + rosone)', unit: 'pz', unitCost: 165, notes: 'Rif. NIBT 2020 / NPK 332' },
    { code: 'E.04', category: 'Impianti elettrici', description: 'Punto interruttore/dimmer', unit: 'pz', unitCost: 145, notes: 'Incl. placca. Rif. NPK 333' },
    { code: 'E.05', category: 'Impianti elettrici', description: 'Predisposizione TV/dati/citofono', unit: 'pz', unitCost: 155, notes: 'Cavidotto + presa. Rif. NPK 341' },

    // FALEGNAMERIA
    { code: 'F.01', category: 'Falegnameria', description: 'Fornitura e posa porta interna laminata (80×210)', unit: 'pz', unitCost: 380, notes: 'Incl. telaio e maniglia. Listino Garofoli/Bertolotto 2024' },
    { code: 'F.02', category: 'Falegnameria', description: 'Fornitura e posa porta interna laminata (70×210)', unit: 'pz', unitCost: 355, notes: 'Incl. telaio e maniglia. Listino 2024' },
    { code: 'F.03', category: 'Falegnameria', description: 'Fornitura e posa battiscopa in legno H80mm', unit: 'ml', unitCost: 28, notes: 'MDF laccato bianco. Rif. NPK 631' },
    { code: 'F.04', category: 'Falegnameria', description: 'Fornitura e posa soglia in alluminio tra ambienti', unit: 'ml', unitCost: 45, notes: 'Profilo di raccordo parquet/ceramica' },

    // MANO D'OPERA GENERICA
    { code: 'O.01', category: 'Mano d\'opera', description: 'Ora operaio edile qualificato (muratore)', unit: 'h', unitCost: 82, notes: 'Tariffa SSIC TI 2024 contratto collettivo' },
    { code: 'O.02', category: 'Mano d\'opera', description: 'Ora capo cantiere / tecnico', unit: 'h', unitCost: 96, notes: 'Tariffa SSIC TI 2024 + responsabilità cantiere' },
    { code: 'O.03', category: 'Mano d\'opera', description: 'Ora operaio generico (aiuto)', unit: 'h', unitCost: 65, notes: 'Tariffa SSIC TI 2024 livello base' },

    // TRASPORTO E NOLEGGIO
    { code: 'X.01', category: 'Trasporto e smaltimento', description: 'Noleggio cassone scarrabile 5m³ (trasporto + smaltimento)', unit: 'pz', unitCost: 420, notes: 'Prezzi 2024 Inerti Sigirino / Maggia' },
    { code: 'X.02', category: 'Trasporto e smaltimento', description: 'Trasporto materiali in cantiere (furgone)', unit: 'giorno', unitCost: 180, notes: 'Tariffa giornaliera incl. conducente' },
    { code: 'X.03', category: 'Trasporto e smaltimento', description: 'Pulizia finale cantiere', unit: 'm²', unitCost: 8, notes: 'Pulizia professionale post-lavori. Rif. NPK 931' },

    // SERRAMENTI E INFISSI
    { code: 'S.01', category: 'Serramenti', description: 'Fornitura e posa finestra PVC doppio vetro 100×120', unit: 'pz', unitCost: 850, notes: 'Profilo 70mm, vetro 4/16/4 basso emissivo. Rif. NPK 521' },
    { code: 'S.02', category: 'Serramenti', description: 'Fornitura e posa finestra PVC doppio vetro 80×100', unit: 'pz', unitCost: 720, notes: 'Rif. NPK 521' },
    { code: 'S.03', category: 'Serramenti', description: 'Fornitura e posa porta finestra PVC 90×210', unit: 'pz', unitCost: 1450, notes: 'Con maniglia antieffrazione. Rif. NPK 522' },
    { code: 'S.04', category: 'Serramenti', description: 'Smontaggio finestra esistente e smaltimento', unit: 'pz', unitCost: 180, notes: 'Rif. NPK 521.01' },
    { code: 'S.05', category: 'Serramenti', description: 'Porta blindata REI 30 con telaio', unit: 'pz', unitCost: 2200, notes: 'Omologata UNI EN 1634. Listino Dierre 2024' },
    { code: 'S.06', category: 'Serramenti', description: 'Vetrata fissa in cartongesso (lastra)', unit: 'pz', unitCost: 380, notes: 'Telaio alluminio + vetro temperato 10mm' },

    // OPERE ESTERNE
    { code: 'R.01', category: 'Opere esterne', description: 'Rivestimento facciata con intonaco monococcio', unit: 'm²', unitCost: 88, notes: 'Incl. primer e finitura acrilica. Rif. NPK 682' },
    { code: 'R.02', category: 'Opere esterne', description: 'Tinteggiatura facciata (2 mani pittura silossanica)', unit: 'm²', unitCost: 24, notes: 'Rif. NPK 671.41' },
    { code: 'R.03', category: 'Opere esterne', description: 'Impermeabilizzazione terrazza/tetto piano', unit: 'm²', unitCost: 95, notes: 'Guaina bituminosa 4+4mm armata. Rif. NPK 571' },
    { code: 'R.04', category: 'Opere esterne', description: 'Posa rivestimento esterno in cotto/gres', unit: 'm²', unitCost: 78, notes: 'Incl. colla idonea esterni. Rif. NPK 613' },
    { code: 'R.05', category: 'Opere esterne', description: 'Installazione grondaia PVC Ø 100mm', unit: 'ml', unitCost: 42, notes: 'Incl. pluviale. Rif. NPK 461' },
    { code: 'R.06', category: 'Opere esterne', description: 'Ponteggio a telai (montaggio + noleggio 4 settimane)', unit: 'm²', unitCost: 28, notes: 'Tariffa TI 2024 incl. telo protezione' },

    // IMPIANTI TERMICI
    { code: 'K.01', category: 'Impianti termici', description: 'Ora tecnico termoidraulico', unit: 'h', unitCost: 118, notes: 'Tariffa SSIC TI 2024 + oneri sociali' },
    { code: 'K.02', category: 'Impianti termici', description: 'Sostituzione caldaia murale a condensazione (fornitura + posa)', unit: 'pz', unitCost: 3800, notes: 'Potenza 24kW. Rif. NPK 231. Listino Vaillant/Viessmann 2024' },
    { code: 'K.03', category: 'Impianti termici', description: 'Fornitura e posa radiatore in alluminio 700mm (6 elementi)', unit: 'pz', unitCost: 320, notes: 'Incl. valvola termostatica. Rif. NPK 231' },
    { code: 'K.04', category: 'Impianti termici', description: 'Pompa di calore aria-acqua (fornitura + installazione)', unit: 'pz', unitCost: 12500, notes: 'COP 4.0, classe A+++. Rif. NPK 231.41' },
    { code: 'K.05', category: 'Impianti termici', description: 'Boiler elettrico 120L (fornitura + posa)', unit: 'pz', unitCost: 780, notes: 'Listino Vaillant/Stiebel 2024' },

    // IMPIANTI ELETTRICI — AGGIUNTIVI
    { code: 'E.06', category: 'Impianti elettrici', description: 'Punto carica auto (wallbox 11kW)', unit: 'pz', unitCost: 1200, notes: 'Incl. protezioni e cablaggio 5m. Rif. NIBT 2020' },
    { code: 'E.07', category: 'Impianti elettrici', description: 'Impianto fotovoltaico 3kWp (incl. inverter)', unit: 'kWp', unitCost: 2200, notes: 'Pannelli monocristallini. Rif. SIA 2024' },
    { code: 'E.08', category: 'Impianti elettrici', description: 'Quadro elettrico appartamento (ricambio completo)', unit: 'pz', unitCost: 680, notes: 'Differenziali + magnetotermici. Rif. NIBT 2020' },
    { code: 'E.09', category: 'Impianti elettrici', description: 'Impianto citofono video IP', unit: 'pz', unitCost: 850, notes: 'Incl. posto esterno + monitor interno' },

    // SANITARI
    { code: 'B.01', category: 'Sanitari', description: 'Fornitura sanitari bagno standard (WC sospeso + lavabo + doccia)', unit: 'set', unitCost: 1650, notes: 'Qualità media. Rif. Keramag/Duravit entry level' },
    { code: 'B.02', category: 'Sanitari', description: 'Fornitura sanitari bagno premium', unit: 'set', unitCost: 3200, notes: 'Qualità alta. Rif. Duravit/Hansgrohe' },
    { code: 'B.03', category: 'Sanitari', description: 'Posa completa sanitari (WC sospeso + lavabo + doccia)', unit: 'set', unitCost: 980, notes: 'Solo posa, esclusa fornitura. Rif. NPK 231' },
    { code: 'B.04', category: 'Sanitari', description: 'Struttura WC sospeso tipo Geberit Duofix', unit: 'pz', unitCost: 420, notes: 'Con placca cromo. Rif. listino Geberit 2024' },
    { code: 'B.05', category: 'Sanitari', description: 'Box doccia 80×80 vetro temperato 8mm', unit: 'pz', unitCost: 680, notes: 'Profilo alluminio anodizzato. Listino Samo/Novellini 2024' },
    { code: 'B.06', category: 'Sanitari', description: 'Vasca da bagno freestanding', unit: 'pz', unitCost: 1800, notes: 'Acrilico rinforzato. Rif. listino Kaldewei/Bette 2024' },
    { code: 'B.07', category: 'Sanitari', description: 'Colonna doccia termostatica', unit: 'pz', unitCost: 520, notes: 'Rif. listino Hansgrohe/Grohe 2024' },

    // CUCINA
    { code: 'C.01', category: 'Cucina', description: 'Cucina componibile standard (fornitura + montaggio, 2m lineari)', unit: 'corpo', unitCost: 4500, notes: 'Piano cottura, cappa, lavello inclusi. Listino IKEA/Veneta Cucine entry' },
    { code: 'C.02', category: 'Cucina', description: 'Cucina componibile premium (fornitura + montaggio, 3m lineari)', unit: 'corpo', unitCost: 12000, notes: 'Elettrodomestici Bosch/Miele. Listino SieMatic/Veneta 2024' },
    { code: 'C.03', category: 'Cucina', description: 'Piano cottura a induzione 60cm (fornitura + installazione)', unit: 'pz', unitCost: 680, notes: 'Listino Bosch/Siemens 2024' },
    { code: 'C.04', category: 'Cucina', description: 'Cappa aspirante 60cm (fornitura + installazione)', unit: 'pz', unitCost: 420, notes: 'Con canalizzazione esterna. Listino Elica 2024' },
    { code: 'C.05', category: 'Cucina', description: 'Piano lavello in acciaio inox con miscelatore', unit: 'pz', unitCost: 380, notes: 'Rif. listino Franke/Blanco 2024' },
  ]

  for (const item of priceItems) {
    await prisma.priceItem.upsert({
      where: { id: `pi-${item.code}` },
      update: item,
      create: { id: `pi-${item.code}`, ...item },
    })
  }
  console.log(`✓ ${priceItems.length} voci prezzario`)

  // ─── Suppliers ───────────────────────────────────────────────────────────────
  const suppliers = [
    { id: 'sup-1', name: 'Sanitec Ticino SA', category: 'Idraulico', email: 'info@sanitec-ti.ch', phone: '+41 91 610 22 33', address: 'Via Industria 8, 6512 Giubiasco', vatNumber: 'CHE-234.567.890 MWST', notes: 'Fornitore principale impianti idraulici e sanitari. Prezzi convenzionati.' },
    { id: 'sup-2', name: 'Elettro Lugano Sagl', category: 'Elettricista', email: 'ufficio@elettrolugano.ch', phone: '+41 91 922 11 44', address: 'Via Soldino 12, 6900 Lugano', vatNumber: 'CHE-345.678.901 MWST', notes: 'Impianti elettrici civili e industriali. Certificazioni NIBT.' },
    { id: 'sup-3', name: 'Ceramiche Menotti & Figli', category: 'Pavimenti e rivestimenti', email: 'vendite@ceramichemenotti.ch', phone: '+41 91 647 88 00', address: 'Via Cantonale 45, 6948 Porza', notes: 'Fornitore piastrelle, rivestimenti e materiali per bagno. Sconti volume 10%.' },
    { id: 'sup-4', name: 'Parquet Tessaro', category: 'Parquet', email: 'info@parquettessaro.ch', phone: '+41 91 606 33 55', address: 'Via alla Stampa 3, 6933 Muzzano', notes: 'Specialista parquet prefinito e massiccio. Posa e levigatura.' },
    { id: 'sup-5', name: 'Hornbach Lugano', category: 'Materiali edili', email: '', phone: '+41 848 000 350', address: 'Centro Commerciale Vedeggio, 6928 Manno', notes: 'Materiali edili, utensili, vernici. Account aziendale attivo (5% sconto).' },
    { id: 'sup-6', name: 'Inerti Sigirino SA', category: 'Trasporto e smaltimento', email: 'info@inertisigirino.ch', phone: '+41 91 605 11 22', address: 'Via Cantonale, 6997 Sessa', notes: 'Smaltimento macerie, inerti, terra. Prezzi 2024 concordati.' },
  ]

  for (const s of suppliers) {
    await prisma.supplier.upsert({ where: { id: s.id }, update: s, create: s })
  }
  console.log(`✓ ${suppliers.length} fornitori`)

  // ─── Clients ─────────────────────────────────────────────────────────────────
  const clients = [
    { id: 'cli-1', name: 'Famiglia Rossi-Bernasconi', email: 'marco.rossi@gmail.com', phone: '+41 79 234 56 78', address: 'Via Monte San Salvatore 22', city: 'Lugano', postalCode: '6900', notes: 'Cliente storico. Appartamento in Via Nassa acquistato 2023.' },
    { id: 'cli-2', name: 'Condominio Residenza Collina', email: 'amministratore@residenzacollina.ch', phone: '+41 91 921 44 00', address: 'Via Collina 8', city: 'Paradiso', postalCode: '6900', notes: 'Amministrazione Morinini & Partners. Contatto: Sig. Ferrari.' },
    { id: 'cli-3', name: 'Studio Legale Manzoni SA', email: 'segreteria@manzonilaw.ch', phone: '+41 91 910 33 22', address: 'Piazza Riforma 5', city: 'Lugano', postalCode: '6900', vatNumber: 'CHE-456.789.012 MWST', notes: 'Lavori di finitura uffici. Fatturazione a fine mese.' },
    { id: 'cli-4', name: 'Gianfranco Ferretti', email: 'g.ferretti@bluewin.ch', phone: '+41 78 456 78 90', address: 'Via Cantonale 117', city: 'Mendrisio', postalCode: '6850', notes: 'Villa unifamiliare. Lavori in più fasi.' },
    { id: 'cli-5', name: 'Immobiliare Lombardi SA', email: 'lavori@immobiliarelombardi.ch', phone: '+41 91 640 55 60', address: 'Via Bossi 3', city: 'Lugano', postalCode: '6900', vatNumber: 'CHE-567.890.123 MWST', notes: 'Società immobiliare. Gestisce 12 immobili TI. Mandati multipli annui.' },
  ]

  for (const c of clients) {
    await prisma.client.upsert({ where: { id: c.id }, update: c, create: c })
  }
  console.log(`✓ ${clients.length} clienti`)

  // ─── Projects ────────────────────────────────────────────────────────────────
  const projects = [
    {
      id: 'prj-1',
      clientId: 'cli-1',
      name: 'Ristrutturazione completa appartamento Via Nassa',
      referenceCode: 'ZSE-2025-001',
      address: 'Via Nassa 38, 6900 Lugano',
      description: 'Ristrutturazione completa unità abitativa 5 locali, 120m². Demolizioni, rifacimento impianti, opere murarie, finiture complete.',
      status: 'IN_PROGRESS' as const,
      estimatedValue: 125000,
      billingNotes: 'SAL (Stati Avanzamento Lavori): 30% inizio cantiere, 40% completamento grezzo, 30% fine lavori.',
      startDate: new Date('2025-03-10'),
    },
    {
      id: 'prj-2',
      clientId: 'cli-2',
      name: 'Rifacimento facciate Residenza Collina',
      referenceCode: 'ZSE-2025-002',
      address: 'Via Collina 8, 6900 Paradiso',
      description: 'Risanamento e tinteggiatura facciate esterne condominio 8 piani. Ponteggio, intonaco, verniciatura.',
      status: 'APPROVED' as const,
      estimatedValue: 85000,
      billingNotes: 'Fatturazione mensile a misura.',
      startDate: new Date('2025-05-01'),
    },
    {
      id: 'prj-3',
      clientId: 'cli-3',
      name: 'Rifinitura uffici Studio Manzoni — Piano 3',
      referenceCode: 'ZSE-2025-003',
      address: 'Piazza Riforma 5, 6900 Lugano',
      description: 'Cartongesso, pavimento in parquet, tinteggiatura e illuminazione uffici piano terzo. Totale 280m².',
      status: 'COMPLETED' as const,
      estimatedValue: 42000,
      billingNotes: 'Fatturazione a corpo a fine lavori.',
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-02-28'),
    },
    {
      id: 'prj-4',
      clientId: 'cli-4',
      name: 'Rifacimento bagni villa Ferretti',
      referenceCode: 'ZSE-2025-004',
      address: 'Via Cantonale 117, 6850 Mendrisio',
      description: 'Rifacimento completo 3 bagni. Nuova doccia walk-in, sanitari sospesi, rivestimenti gres effetto pietra.',
      status: 'QUOTING' as const,
      estimatedValue: 38000,
    },
    {
      id: 'prj-5',
      clientId: 'cli-5',
      name: 'Appartamento Via Pretorio — Riqualifica',
      referenceCode: 'ZSE-2024-012',
      address: 'Via Pretorio 12, 6900 Lugano',
      description: 'Riqualifica appartamento 3 locali per messa a reddito. Tinteggiatura, parquet, cucina, bagno.',
      status: 'COMPLETED' as const,
      estimatedValue: 28000,
      startDate: new Date('2024-09-01'),
      endDate: new Date('2024-11-30'),
    },
  ]

  for (const p of projects) {
    await prisma.project.upsert({ where: { id: p.id }, update: p, create: p })
  }
  console.log(`✓ ${projects.length} progetti`)

  // ─── Quotes ──────────────────────────────────────────────────────────────────

  // PRE-2025-001 — Preventivo principale dal PDF (APPROVED)
  await prisma.quote.upsert({
    where: { id: 'quo-1' },
    update: {},
    create: {
      id: 'quo-1',
      quoteNumber: 'PRE-2025-001',
      version: 2,
      projectId: 'prj-1',
      type: 'PRELIMINARY',
      status: 'APPROVED',
      marginPercent: 28,
      taxRate: 8.1,
      subtotalCost: 68450,
      subtotalClient: 94680,
      taxAmount: 7669.0,
      total: 102349.0,
      validUntil: new Date('2025-04-30'),
      approvedAt: new Date('2025-02-18'),
      sentAt: new Date('2025-02-05'),
      clientNotes: 'Il presente preventivo preliminare è basato sul capitolato fornito dal committente. I prezzi definitivi potranno variare a seguito di verifica delle condizioni in opera. Non sono inclusi: fornitura sanitari, cucina, serramenti, eventuali rinforzi strutturali imprevisti. IVA 8.1% esclusa.',
      internalNotes: 'Cantiere complesso: 2 bagni, cucina, 5 locali. Rischio amianto nelle mattonelle esistenti da verificare. Prevedere 5% imprevisti.',
      items: {
        create: [
          // Sezione 1: Opere Preliminari
          { sortOrder: 0, itemType: 'SECTION', description: '1 — OPERE PRELIMINARI E SMONTAGGI' },
          { sortOrder: 1, itemType: 'ITEM', description: 'Smontaggio completo 2 bagni (sanitari, rubinetterie, accessori)', unit: 'set', quantity: 2, unitCost: 320, unitPrice: 450, totalCost: 640, totalPrice: 900 },
          { sortOrder: 2, itemType: 'ITEM', description: 'Smontaggio cucina componibile completa', unit: 'corpo', quantity: 1, unitCost: 280, unitPrice: 395, totalCost: 280, totalPrice: 395 },
          { sortOrder: 3, itemType: 'ITEM', description: 'Smontaggio porte interne con telaio', unit: 'pz', quantity: 8, unitCost: 85, unitPrice: 120, totalCost: 680, totalPrice: 960 },
          { sortOrder: 4, itemType: 'ITEM', description: 'Protezione pavimenti e superfici esistenti durante lavori', unit: 'corpo', quantity: 1, unitCost: 350, unitPrice: 490, totalCost: 350, totalPrice: 490 },
          { sortOrder: 5, itemType: 'ITEM', description: 'Noleggio cassone scarrabile 5m³ (2 rotazioni)', unit: 'pz', quantity: 2, unitCost: 420, unitPrice: 590, totalCost: 840, totalPrice: 1180 },

          // Sezione 2: Demolizioni
          { sortOrder: 10, itemType: 'SECTION', description: '2 — DEMOLIZIONI' },
          { sortOrder: 11, itemType: 'ITEM', description: 'Demolizione tramezzi esistenti secondo elaborati (muratura piena)', unit: 'm²', quantity: 18, unitCost: 38, unitPrice: 53, totalCost: 684, totalPrice: 954 },
          { sortOrder: 12, itemType: 'ITEM', description: 'Rimozione pavimento ceramico bagni e cucina', unit: 'm²', quantity: 35, unitCost: 24, unitPrice: 34, totalCost: 840, totalPrice: 1190 },
          { sortOrder: 13, itemType: 'ITEM', description: 'Rimozione pavimento in parquet (doppio strato)', unit: 'm²', quantity: 28, unitCost: 18, unitPrice: 26, totalCost: 504, totalPrice: 728 },
          { sortOrder: 14, itemType: 'ITEM', description: 'Trasporto e smaltimento macerie in discarica autorizzata', unit: 't', quantity: 12, unitCost: 290, unitPrice: 405, totalCost: 3480, totalPrice: 4860 },
          { sortOrder: 15, itemType: 'NOTE', description: 'NOTA: Alta probabilità di rinforzo strutturale (putrella) alla parete centrale. Se necessario, preventivo separato.' },

          // Sezione 3: Impianti
          { sortOrder: 20, itemType: 'SECTION', description: '3 — IMPIANTI (IDRAULICO + ELETTRICO)' },
          { sortOrder: 21, itemType: 'ITEM', description: 'Rifacimento completo impianto idraulico (rete distribuzione AC/AF)', unit: 'corpo', quantity: 1, unitCost: 8500, unitPrice: 11900, totalCost: 8500, totalPrice: 11900 },
          { sortOrder: 22, itemType: 'ITEM', description: 'Adeguamento rete scarichi e colonne', unit: 'corpo', quantity: 1, unitCost: 2200, unitPrice: 3080, totalCost: 2200, totalPrice: 3080 },
          { sortOrder: 23, itemType: 'ITEM', description: 'Predisposizione piatto doccia incassato (2 bagni)', unit: 'pz', quantity: 2, unitCost: 480, unitPrice: 670, totalCost: 960, totalPrice: 1340 },
          { sortOrder: 24, itemType: 'ITEM', description: 'Rifacimento completo impianto riscaldamento (da colonna distribuzione)', unit: 'corpo', quantity: 1, unitCost: 9800, unitPrice: 13720, totalCost: 9800, totalPrice: 13720 },
          { sortOrder: 25, itemType: 'ITEM', description: 'Rifacimento impianto elettrico conforme NIBT 2020', unit: 'corpo', quantity: 1, unitCost: 7200, unitPrice: 10080, totalCost: 7200, totalPrice: 10080 },
          { sortOrder: 26, itemType: 'ITEM', description: 'Predisposizione TV/dati/Wi-Fi/citofono/tapparelle', unit: 'corpo', quantity: 1, unitCost: 1800, unitPrice: 2520, totalCost: 1800, totalPrice: 2520 },

          // Sezione 4: Opere murarie
          { sortOrder: 30, itemType: 'SECTION', description: '4 — OPERE MURARIE E CARTONGESSO' },
          { sortOrder: 31, itemType: 'ITEM', description: 'Nuove pareti divisorie in cartongesso doppio + lana di roccia', unit: 'm²', quantity: 42, unitCost: 105, unitPrice: 147, totalCost: 4410, totalPrice: 6174 },
          { sortOrder: 32, itemType: 'ITEM', description: 'Fornitura e posa 2 porte scorrevoli tipo Scrigno', unit: 'pz', quantity: 2, unitCost: 420, unitPrice: 588, totalCost: 840, totalPrice: 1176 },
          { sortOrder: 33, itemType: 'ITEM', description: 'Chiusura tracce impiantistiche con gesso', unit: 'ml', quantity: 85, unitCost: 18, unitPrice: 25, totalCost: 1530, totalPrice: 2125 },

          // Sezione 5: Preparazione superfici
          { sortOrder: 40, itemType: 'SECTION', description: '5 — PREPARAZIONE SUPERFICI' },
          { sortOrder: 41, itemType: 'ITEM', description: 'Rasatura completa pareti bagni, cucina e corridoi', unit: 'm²', quantity: 210, unitCost: 26, unitPrice: 37, totalCost: 5460, totalPrice: 7770 },
          { sortOrder: 42, itemType: 'ITEM', description: 'Impermeabilizzazione zone doccia con membrana liquida', unit: 'm²', quantity: 18, unitCost: 58, unitPrice: 81, totalCost: 1044, totalPrice: 1458 },
          { sortOrder: 43, itemType: 'ITEM', description: 'Trattamento fessure e ripristini vari', unit: 'corpo', quantity: 1, unitCost: 580, unitPrice: 812, totalCost: 580, totalPrice: 812 },

          // Sezione 6: Pavimenti
          { sortOrder: 50, itemType: 'SECTION', description: '6 — PAVIMENTI E RIVESTIMENTI CERAMICI' },
          { sortOrder: 51, itemType: 'ITEM', description: 'Preparazione sottofondo autolivellante', unit: 'm²', quantity: 42, unitCost: 28, unitPrice: 39, totalCost: 1176, totalPrice: 1638 },
          { sortOrder: 52, itemType: 'ITEM', description: 'Fornitura piastrelle gres porcellanato bagni (cliente sceglie)', unit: 'm²', quantity: 42, unitCost: 52, unitPrice: 73, totalCost: 2184, totalPrice: 3066 },
          { sortOrder: 53, itemType: 'ITEM', description: 'Posa piastrelle pavimento bagni + cucina', unit: 'm²', quantity: 42, unitCost: 58, unitPrice: 81, totalCost: 2436, totalPrice: 3402 },
          { sortOrder: 54, itemType: 'ITEM', description: 'Posa rivestimento ceramico pareti bagni (h=200cm)', unit: 'm²', quantity: 58, unitCost: 68, unitPrice: 95, totalCost: 3944, totalPrice: 5510 },

          // Sezione 7: Parquet
          { sortOrder: 60, itemType: 'SECTION', description: '7 — POSA PARQUET' },
          { sortOrder: 61, itemType: 'ITEM', description: 'Levigatura e trattamento pavimento legno/granito esistente (preparazione)', unit: 'm²', quantity: 65, unitCost: 22, unitPrice: 31, totalCost: 1430, totalPrice: 2015 },
          { sortOrder: 62, itemType: 'ITEM', description: 'Fornitura parquet prefinito rovere 14mm', unit: 'm²', quantity: 75, unitCost: 68, unitPrice: 95, totalCost: 5100, totalPrice: 7125 },
          { sortOrder: 63, itemType: 'ITEM', description: 'Posa parquet prefinito incollato', unit: 'm²', quantity: 75, unitCost: 48, unitPrice: 67, totalCost: 3600, totalPrice: 5025 },

          // Sezione 8: Tinteggiatura
          { sortOrder: 70, itemType: 'SECTION', description: '8 — TINTEGGIATURA' },
          { sortOrder: 71, itemType: 'ITEM', description: 'Applicazione sigillante su pareti nuove/rasate', unit: 'm²', quantity: 380, unitCost: 6, unitPrice: 8, totalCost: 2280, totalPrice: 3040 },
          { sortOrder: 72, itemType: 'ITEM', description: 'Tinteggiatura pareti (primer + 2 mani colore a scelta)', unit: 'm²', quantity: 380, unitCost: 14, unitPrice: 20, totalCost: 5320, totalPrice: 7600 },
          { sortOrder: 73, itemType: 'ITEM', description: 'Tinteggiatura soffitti (2 mani bianco)', unit: 'm²', quantity: 125, unitCost: 17, unitPrice: 24, totalCost: 2125, totalPrice: 3000 },

          // Sezione 9: Pulizia
          { sortOrder: 80, itemType: 'SECTION', description: '9 — PULIZIA FINALE E CONSEGNA' },
          { sortOrder: 81, itemType: 'ITEM', description: 'Pulizia professionale fine cantiere', unit: 'm²', quantity: 125, unitCost: 8, unitPrice: 11, totalCost: 1000, totalPrice: 1375 },
          { sortOrder: 82, itemType: 'NOTE', description: 'NOTA: Fornitura sanitari, cucina, serramenti e corpi illuminanti ESCLUSI dal presente preventivo. Preventivo separato su richiesta.' },
        ],
      },
    },
  })

  // PRE-2025-002 — Preventivo facciate (SENT)
  await prisma.quote.upsert({
    where: { id: 'quo-2' },
    update: {},
    create: {
      id: 'quo-2',
      quoteNumber: 'PRE-2025-002',
      version: 1,
      projectId: 'prj-2',
      type: 'DETAILED',
      status: 'SENT',
      marginPercent: 25,
      taxRate: 8.1,
      subtotalCost: 52800,
      subtotalClient: 70400,
      taxAmount: 5702.4,
      total: 76102.4,
      validUntil: new Date('2025-05-15'),
      sentAt: new Date('2025-03-20'),
      clientNotes: 'Lavori da eseguirsi con ponteggio omologato. Traffico limitato: orario 07:00-18:00 lun-ven. Materiali certificati SIA 271.',
      items: {
        create: [
          { sortOrder: 0, itemType: 'SECTION', description: 'PONTEGGIO' },
          { sortOrder: 1, itemType: 'ITEM', description: 'Montaggio e smontaggio ponteggio façade', unit: 'm²', quantity: 420, unitCost: 28, unitPrice: 37, totalCost: 11760, totalPrice: 15540 },
          { sortOrder: 10, itemType: 'SECTION', description: 'INTONACO' },
          { sortOrder: 11, itemType: 'ITEM', description: 'Risanamento intonaco esterno (rimozione + nuovo strato)', unit: 'm²', quantity: 380, unitCost: 65, unitPrice: 87, totalCost: 24700, totalPrice: 33060 },
          { sortOrder: 20, itemType: 'SECTION', description: 'TINTEGGIATURA' },
          { sortOrder: 21, itemType: 'ITEM', description: 'Tinteggiatura facciata esterna (2 mani pittura silossanica)', unit: 'm²', quantity: 420, unitCost: 18, unitPrice: 24, totalCost: 7560, totalPrice: 10080 },
          { sortOrder: 22, itemType: 'ITEM', description: 'Trattamento balconi con idrorepellente', unit: 'm²', quantity: 85, unitCost: 22, unitPrice: 29, totalCost: 1870, totalPrice: 2465 },
          { sortOrder: 30, itemType: 'SECTION', description: 'FINITURE' },
          { sortOrder: 31, itemType: 'ITEM', description: 'Ripristino davanzali e cornici', unit: 'corpo', quantity: 1, unitCost: 4200, unitPrice: 5600, totalCost: 4200, totalPrice: 5600 },
          { sortOrder: 32, itemType: 'ITEM', description: 'Smontaggio e rimontaggio gronde e pluviali', unit: 'corpo', quantity: 1, unitCost: 2710, unitPrice: 3612, totalCost: 2710, totalPrice: 3612 },
        ],
      },
    },
  })

  // PRE-2024-008 — Uffici Studio Manzoni (INVOICED)
  await prisma.quote.upsert({
    where: { id: 'quo-3' },
    update: {},
    create: {
      id: 'quo-3',
      quoteNumber: 'PRE-2024-008',
      version: 1,
      projectId: 'prj-3',
      type: 'DETAILED',
      status: 'INVOICED',
      marginPercent: 30,
      taxRate: 8.1,
      subtotalCost: 28500,
      subtotalClient: 40150,
      taxAmount: 3252.15,
      total: 43402.15,
      approvedAt: new Date('2024-12-10'),
      sentAt: new Date('2024-12-01'),
      items: {
        create: [
          { sortOrder: 0, itemType: 'ITEM', description: 'Pareti divisorie cartongesso doppio', unit: 'm²', quantity: 65, unitCost: 105, unitPrice: 148, totalCost: 6825, totalPrice: 9620 },
          { sortOrder: 1, itemType: 'ITEM', description: 'Fornitura e posa parquet prefinito uffici', unit: 'm²', quantity: 148, unitCost: 88, unitPrice: 124, totalCost: 13024, totalPrice: 18352 },
          { sortOrder: 2, itemType: 'ITEM', description: 'Tinteggiatura completa pareti e soffitti', unit: 'm²', quantity: 480, unitCost: 18, unitPrice: 25, totalCost: 8640, totalPrice: 12000 },
        ],
      },
    },
  })

  // PRE-2025-003 — Bagni Ferretti (DRAFT)
  await prisma.quote.upsert({
    where: { id: 'quo-4' },
    update: {},
    create: {
      id: 'quo-4',
      quoteNumber: 'PRE-2025-003',
      version: 1,
      projectId: 'prj-4',
      type: 'DETAILED',
      status: 'DRAFT',
      marginPercent: 30,
      taxRate: 8.1,
      subtotalCost: 22800,
      subtotalClient: 32570,
      taxAmount: 2638.17,
      total: 35208.17,
      validUntil: new Date('2025-06-30'),
      internalNotes: 'Cliente esigente. Preventivare 5% imprevisti per bagni più vecchi (1972).',
      items: {
        create: [
          { sortOrder: 0, itemType: 'SECTION', description: 'DEMOLIZIONI' },
          { sortOrder: 1, itemType: 'ITEM', description: 'Smontaggio sanitari esistenti (3 bagni)', unit: 'set', quantity: 3, unitCost: 320, unitPrice: 455, totalCost: 960, totalPrice: 1365 },
          { sortOrder: 2, itemType: 'ITEM', description: 'Rimozione rivestimenti ceramici pareti e pavimenti', unit: 'm²', quantity: 85, unitCost: 24, unitPrice: 34, totalCost: 2040, totalPrice: 2890 },
          { sortOrder: 10, itemType: 'SECTION', description: 'IMPIANTI' },
          { sortOrder: 11, itemType: 'ITEM', description: 'Rifacimento impianto idraulico 3 bagni', unit: 'corpo', quantity: 1, unitCost: 9200, unitPrice: 13120, totalCost: 9200, totalPrice: 13120 },
          { sortOrder: 20, itemType: 'SECTION', description: 'FINITURE' },
          { sortOrder: 21, itemType: 'ITEM', description: 'Impermeabilizzazione docce', unit: 'm²', quantity: 24, unitCost: 58, unitPrice: 83, totalCost: 1392, totalPrice: 1992 },
          { sortOrder: 22, itemType: 'ITEM', description: 'Fornitura e posa piastrelle premium', unit: 'm²', quantity: 85, unitCost: 110, unitPrice: 157, totalCost: 9350, totalPrice: 13345 },
          { sortOrder: 23, itemType: 'ITEM', description: '3 predisposizioni doccia walk-in incassata', unit: 'pz', quantity: 3, unitCost: 480, unitPrice: 685, totalCost: 1440, totalPrice: 2055 },
          { sortOrder: 24, itemType: 'NOTE', description: 'NOTA: Fornitura sanitari e mobili bagno esclusa. Budget cliente: CHF 2.500/bagno.' },
        ],
      },
    },
  })
  console.log('✓ 4 preventivi')

  // ─── Invoices ────────────────────────────────────────────────────────────────

  // INV-2024-008 — Studio Manzoni (PAID)
  await prisma.invoice.upsert({
    where: { id: 'inv-1' },
    update: {},
    create: {
      id: 'inv-1',
      invoiceNumber: 'INV-2024-008',
      projectId: 'prj-3',
      quoteId: 'quo-3',
      status: 'PAID',
      issueDate: new Date('2025-03-05'),
      dueDate: new Date('2025-04-05'),
      paidAt: new Date('2025-03-28'),
      subtotal: 40150,
      taxRate: 8.1,
      taxAmount: 3252.15,
      total: 43402.15,
      notes: 'Saldo lavori uffici piano terzo secondo preventivo PRE-2024-008.',
      items: {
        create: [
          { description: 'Pareti divisorie cartongesso doppio', unit: 'm²', quantity: 65, unitPrice: 148, total: 9620 },
          { description: 'Fornitura e posa parquet prefinito uffici', unit: 'm²', quantity: 148, unitPrice: 124, total: 18352 },
          { description: 'Tinteggiatura completa pareti e soffitti', unit: 'm²', quantity: 480, unitPrice: 25, total: 12000 },
          { description: 'Pulizia finale cantiere', unit: 'm²', quantity: 280, unitPrice: 0.635, total: 178 },
        ],
      },
    },
  })

  // INV-2024-012 — Appartamento Via Pretorio (PAID)
  await prisma.invoice.upsert({
    where: { id: 'inv-2' },
    update: {},
    create: {
      id: 'inv-2',
      invoiceNumber: 'INV-2024-012',
      projectId: 'prj-5',
      status: 'PAID',
      issueDate: new Date('2024-12-02'),
      dueDate: new Date('2025-01-02'),
      paidAt: new Date('2024-12-20'),
      subtotal: 24800,
      taxRate: 8.1,
      taxAmount: 2008.8,
      total: 26808.8,
      items: {
        create: [
          { description: 'Tinteggiatura completa 3 locali', unit: 'm²', quantity: 280, unitPrice: 22, total: 6160 },
          { description: 'Fornitura e posa parquet prefinito', unit: 'm²', quantity: 68, unitPrice: 118, total: 8024 },
          { description: 'Rifacimento bagno completo', unit: 'corpo', quantity: 1, unitPrice: 8200, total: 8200 },
          { description: 'Cucina — nuovi frontalini e piano lavoro', unit: 'corpo', quantity: 1, unitPrice: 2200, total: 2200 },
          { description: 'Pulizia finale', unit: 'corpo', quantity: 1, unitPrice: 416, total: 416 },
        ],
      },
    },
  })

  // INV-2025-001 — SAL 1 Via Nassa (SENT)
  await prisma.invoice.upsert({
    where: { id: 'inv-3' },
    update: {},
    create: {
      id: 'inv-3',
      invoiceNumber: 'INV-2025-001',
      projectId: 'prj-1',
      quoteId: 'quo-1',
      status: 'SENT',
      issueDate: new Date('2025-03-15'),
      dueDate: new Date('2025-04-15'),
      subtotal: 28400,
      taxRate: 8.1,
      taxAmount: 2300.4,
      total: 30700.4,
      notes: 'SAL N.1 — Stato Avanzamento Lavori 30%. Opere preliminari, demolizioni e impianti completati.',
      items: {
        create: [
          { description: 'Opere preliminari e smontaggi', unit: 'corpo', quantity: 1, unitPrice: 3925, total: 3925 },
          { description: 'Demolizioni complete', unit: 'corpo', quantity: 1, unitPrice: 7732, total: 7732 },
          { description: 'Impianto idraulico (rifacimento completo)', unit: 'corpo', quantity: 1, unitPrice: 11900, total: 11900 },
          { description: 'Impianto elettrico (rifacimento completo)', unit: 'corpo', quantity: 1, unitPrice: 4843, total: 4843 },
        ],
      },
    },
  })
  console.log('✓ 3 fatture')

  // ─── Expenses ────────────────────────────────────────────────────────────────
  const expenses = [
    // Progetto 1 (Via Nassa)
    { id: 'exp-1', projectId: 'prj-1', supplierId: 'sup-1', expenseType: 'MATERIAL' as const, paymentStatus: 'PAID' as const, description: 'Materiali idraulici — tubi multicouche, raccordi, valvole', amount: 3840, date: new Date('2025-03-12'), supplierInvoiceNumber: 'SAN-2025-0342', category: 'Impianti idraulici' },
    { id: 'exp-2', projectId: 'prj-1', supplierId: 'sup-2', expenseType: 'MATERIAL' as const, paymentStatus: 'PAID' as const, description: 'Materiali elettrici — cavi, tubi corrugati, scatole', amount: 2150, date: new Date('2025-03-14'), supplierInvoiceNumber: 'EL-2025-0128', category: 'Impianti elettrici' },
    { id: 'exp-3', projectId: 'prj-1', supplierId: 'sup-6', expenseType: 'TRANSPORT' as const, paymentStatus: 'PAID' as const, description: 'Smaltimento macerie demolizioni — 12 tonnellate', amount: 3480, date: new Date('2025-03-22'), supplierInvoiceNumber: 'INS-2025-0089', category: 'Trasporto e smaltimento' },
    { id: 'exp-4', projectId: 'prj-1', supplierId: 'sup-5', expenseType: 'MATERIAL' as const, paymentStatus: 'PAID' as const, description: 'Cartongesso, lana di roccia, viti, stucco', amount: 1680, date: new Date('2025-04-02'), supplierInvoiceNumber: 'HB-2025-12841', category: 'Muratura' },
    { id: 'exp-5', projectId: 'prj-1', supplierId: 'sup-3', expenseType: 'MATERIAL' as const, paymentStatus: 'PENDING' as const, description: 'Piastrelle gres porcellanato bagni + cucina (42m²)', amount: 2184, date: new Date('2025-04-10'), supplierInvoiceNumber: 'CM-2025-0456', category: 'Pavimenti e rivestimenti' },
    { id: 'exp-6', projectId: 'prj-1', supplierId: 'sup-4', expenseType: 'MATERIAL' as const, paymentStatus: 'PENDING' as const, description: 'Parquet prefinito rovere 14mm (80m² + 7% sfrido)', amount: 5780, date: new Date('2025-04-12'), supplierInvoiceNumber: 'PT-2025-0234', category: 'Parquet' },

    // Progetto 2 (Facciate)
    { id: 'exp-7', projectId: 'prj-2', supplierId: 'sup-5', expenseType: 'MATERIAL' as const, paymentStatus: 'PENDING' as const, description: 'Pittura silossanica facciata + primer — 420m²', amount: 3780, date: new Date('2025-04-08'), category: 'Pittura' },
    { id: 'exp-8', projectId: 'prj-2', expenseType: 'EQUIPMENT' as const, paymentStatus: 'PENDING' as const, description: 'Noleggio ponteggio façade (4 settimane)', amount: 8400, date: new Date('2025-04-15'), category: 'Noleggio attrezzature' },

    // Progetto 3 (Uffici — completato)
    { id: 'exp-9', projectId: 'prj-3', supplierId: 'sup-4', expenseType: 'MATERIAL' as const, paymentStatus: 'PAID' as const, description: 'Parquet prefinito uffici — 158m²', amount: 10456, date: new Date('2025-01-20'), supplierInvoiceNumber: 'PT-2025-0015', category: 'Parquet' },
    { id: 'exp-10', projectId: 'prj-3', supplierId: 'sup-5', expenseType: 'MATERIAL' as const, paymentStatus: 'PAID' as const, description: 'Cartongesso, materiali pittura uffici', amount: 3840, date: new Date('2025-01-22'), supplierInvoiceNumber: 'HB-2025-01124', category: 'Muratura' },

    // Progetto 5 (Appartamento Via Pretorio — completato)
    { id: 'exp-11', projectId: 'prj-5', supplierId: 'sup-3', expenseType: 'MATERIAL' as const, paymentStatus: 'PAID' as const, description: 'Piastrelle bagno gres porcellanato', amount: 820, date: new Date('2024-10-05'), supplierInvoiceNumber: 'CM-2024-1122', category: 'Pavimenti e rivestimenti' },
    { id: 'exp-12', projectId: 'prj-5', supplierId: 'sup-4', expenseType: 'MATERIAL' as const, paymentStatus: 'PAID' as const, description: 'Parquet prefinito 3 locali — 72m²', amount: 4896, date: new Date('2024-10-12'), supplierInvoiceNumber: 'PT-2024-0312', category: 'Parquet' },
  ]

  for (const e of expenses) {
    await prisma.expense.upsert({ where: { id: e.id }, update: e, create: e })
  }
  console.log(`✓ ${expenses.length} spese`)

  // ─── Document Sequences ──────────────────────────────────────────────────────
  await prisma.documentSequence.upsert({
    where: { type_year: { type: 'QUOTE', year: 2025 } },
    update: { lastNumber: 3 },
    create: { type: 'QUOTE', year: 2025, lastNumber: 3 },
  })
  await prisma.documentSequence.upsert({
    where: { type_year: { type: 'QUOTE', year: 2024 } },
    update: { lastNumber: 12 },
    create: { type: 'QUOTE', year: 2024, lastNumber: 12 },
  })
  await prisma.documentSequence.upsert({
    where: { type_year: { type: 'INVOICE', year: 2025 } },
    update: { lastNumber: 1 },
    create: { type: 'INVOICE', year: 2025, lastNumber: 1 },
  })
  await prisma.documentSequence.upsert({
    where: { type_year: { type: 'INVOICE', year: 2024 } },
    update: { lastNumber: 12 },
    create: { type: 'INVOICE', year: 2024, lastNumber: 12 },
  })
  console.log('✓ Sequenze numerazione aggiornate')

  console.log('\n✅ Seed completato con successo!')
  console.log('   - 1 company settings')
  console.log(`   - ${priceItems.length} voci prezzario`)
  console.log(`   - ${suppliers.length} fornitori`)
  console.log(`   - ${clients.length} clienti`)
  console.log(`   - ${projects.length} progetti`)
  console.log('   - 4 preventivi')
  console.log('   - 3 fatture')
  console.log(`   - ${expenses.length} spese`)
}

main()
  .catch((e) => { console.error('❌ Seed error:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
