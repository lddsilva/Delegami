// Fase 3 — Cucina e Elettrodomestici (~100 items)
import { createClient } from '@libsql/client'
import { config } from 'dotenv'
config({ path: '.env.local' })

const client = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN })
function uid() { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10) }

const items = [
  // ─── ELEMENTI CUCINA (MOBILI) ─────────────────────────────────────────────────
  { category: 'Cucina – Mobili', description: 'Base cucina 60cm 2 ante – IKEA METOD bianco', unit: 'pz', unitCost: 75.00, code: 'IK-MET-B60', notes: 'IKEA METOD base 60×37×80. Solo struttura. Link: https://www.ikea.com/ch/it/cat/basi-cucina-19218/' },
  { category: 'Cucina – Mobili', description: 'Base cucina 80cm 2 ante – IKEA METOD bianco', unit: 'pz', unitCost: 95.00, code: 'IK-MET-B80', notes: 'IKEA METOD base 80cm.' },
  { category: 'Cucina – Mobili', description: 'Base cucina angolo 88×88cm – IKEA METOD', unit: 'pz', unitCost: 145.00, code: 'IK-MET-BANG', notes: 'Modulo angolo per cucine a L.' },
  { category: 'Cucina – Mobili', description: 'Pensile cucina 60×40cm – IKEA METOD bianco', unit: 'pz', unitCost: 55.00, code: 'IK-MET-P60', notes: 'Pensile standard 60cm.' },
  { category: 'Cucina – Mobili', description: 'Pensile cucina 80×40cm – IKEA METOD bianco', unit: 'pz', unitCost: 65.00, code: 'IK-MET-P80', notes: 'Pensile 80cm.' },
  { category: 'Cucina – Mobili', description: 'Cassettiera cucina 60cm 2 cassetti – IKEA METOD', unit: 'pz', unitCost: 185.00, code: 'IK-MET-CAS60', notes: 'Con cassetti MAXIMERA.' },
  { category: 'Cucina – Mobili', description: 'Frontale cucina 60×70 – IKEA VOXTORP bianco mat', unit: 'pz', unitCost: 65.00, code: 'IK-VOX-60', notes: 'Frontale per base 60cm. IKEA VOXTORP.' },
  { category: 'Cucina – Mobili', description: 'Frontale cucina 60×40 pensile – IKEA VOXTORP', unit: 'pz', unitCost: 45.00, code: 'IK-VOX-P60', notes: 'Frontale per pensile 60cm.' },
  { category: 'Cucina – Mobili', description: 'Maniglia cucina inox 128mm – serie standard', unit: 'pz', unitCost: 6.50, code: 'MAN-INO-128', notes: 'Bauhaus/IKEA. Per basi e pensili.' },
  { category: 'Cucina – Mobili', description: 'Piano cucina laminato 240×60×3.8cm – bianco/grigio', unit: 'pz', unitCost: 95.00, code: 'PIA-LAM-240', notes: 'Top cucina melaminato. Bauhaus.' },
  { category: 'Cucina – Mobili', description: 'Piano cucina quarzo bianco Calacatta 3cm – ml', unit: 'ml', unitCost: 280.00, code: 'PIA-QUA-ML', notes: 'Top in quarzo Silestone/Caesarstone. Include lavorazione bordi.' },
  { category: 'Cucina – Mobili', description: 'Piano cucina granito nero 3cm – ml', unit: 'ml', unitCost: 320.00, code: 'PIA-GRA-ML', notes: 'Granito Nero Assoluto. Resistente al calore.' },
  { category: 'Cucina – Mobili', description: 'Paraschizzi cucina vetro temperato 80×40cm', unit: 'pz', unitCost: 95.00, code: 'PAR-VET-80', notes: 'Vetro laccato bianco o colorato. Bauhaus area.' },
  { category: 'Cucina – Mobili', description: 'Paraschizzi cucina piastrella metro 1ml', unit: 'ml', unitCost: 35.00, code: 'PAR-PIA-ML', notes: 'Piastrelle metro bianche 10×20, posa su 30cm altezza.' },
  { category: 'Cucina – Mobili', description: 'Montaggio cucina completa (manodopera – fino 3m lineare)', unit: 'corpo', unitCost: 850.00, code: 'POS-CUC-3M', notes: 'Montaggio basi + pensili + piano + frontali + maniglie. Esclude elettrodomestici.' },
  { category: 'Cucina – Mobili', description: 'Montaggio cucina completa (manodopera – fino 5m lineare)', unit: 'corpo', unitCost: 1200.00, code: 'POS-CUC-5M', notes: 'Cucina grande L o U.' },

  // ─── LAVELLO E MISCELATORI CUCINA ─────────────────────────────────────────────
  { category: 'Cucina – Lavello', description: 'Lavello inox 1 vasca 60×50cm – da incasso', unit: 'pz', unitCost: 120.00, code: 'LAV-INO-60', notes: 'Franke/Blanco/Bauhaus entry. Standard cucina.' },
  { category: 'Cucina – Lavello', description: 'Lavello inox 1.5 vasche 80×50cm – da incasso', unit: 'pz', unitCost: 180.00, code: 'LAV-INO-80', notes: 'Con vasca piccola per scolapiatti.' },
  { category: 'Cucina – Lavello', description: 'Lavello sottopiano in silgranit nero 80×50cm – Blanco', unit: 'pz', unitCost: 380.00, code: 'LAV-SIL-80', notes: 'Silgranit antigraffio/antibatterico. Blanco Legra. Link: https://www.blanco.com' },
  { category: 'Cucina – Lavello', description: 'Lavello a filo top in acciaio 86×50cm', unit: 'pz', unitCost: 320.00, code: 'LAV-FIL-86', notes: 'Integrato nel piano, look moderno. Franke.' },
  { category: 'Cucina – Lavello', description: 'Miscelatore cucina monocomando – cromato alto (Grohe Minta)', unit: 'pz', unitCost: 195.00, code: 'MIS-CUC-GRO', notes: 'Grohe Minta. Bocca alta, estraibile. Link: https://www.grohe.it' },
  { category: 'Cucina – Lavello', description: 'Miscelatore cucina entry – cromato', unit: 'pz', unitCost: 75.00, code: 'MIS-CUC-ENT', notes: 'Hansgrohe Logis/Ideal Standard basic.' },
  { category: 'Cucina – Lavello', description: 'Miscelatore cucina con doccetta estraibile – cromato', unit: 'pz', unitCost: 145.00, code: 'MIS-CUC-DOC', notes: 'Doccetta estraibile, 2 getti. Grohe/Hansgrohe.' },
  { category: 'Cucina – Lavello', description: 'Montaggio lavello + miscelatore cucina', unit: 'pz', unitCost: 150.00, code: 'POS-LAV-CUC', notes: 'Idraulico: posa lavello, allacciamento acqua, silicone.' },

  // ─── PIANO COTTURA ────────────────────────────────────────────────────────────
  { category: 'Cucina – Piano Cottura', description: 'Piano cottura gas 60cm 4 fuochi – inox (Bosch)', unit: 'pz', unitCost: 320.00, code: 'PCO-GAS-60', notes: 'Bosch PGP6B5B60. 4 fuochi. Link: https://www.bosch-home.it' },
  { category: 'Cucina – Piano Cottura', description: 'Piano cottura gas 60cm 4 fuochi – vetro nero', unit: 'pz', unitCost: 280.00, code: 'PCO-GAS-VET', notes: 'Piano vetro temperato nero, più facile da pulire. Bauhaus/Leroy Merlin.' },
  { category: 'Cucina – Piano Cottura', description: 'Piano cottura a induzione 60cm 4 zone – Bosch', unit: 'pz', unitCost: 490.00, code: 'PCO-IND-60', notes: 'Bosch PVS651FB1E. Silenzioso, preciso. Link: https://www.bosch-home.it' },
  { category: 'Cucina – Piano Cottura', description: 'Piano cottura a induzione 80cm 4 zone – Siemens', unit: 'pz', unitCost: 680.00, code: 'PCO-IND-80', notes: 'Siemens EX879LYC1E. Formato cucina professionale.' },
  { category: 'Cucina – Piano Cottura', description: 'Piano cottura vitroceramica 60cm 4 zone', unit: 'pz', unitCost: 220.00, code: 'PCO-VIT-60', notes: 'Meno efficiente dell\'induzione, ma più economico.' },
  { category: 'Cucina – Piano Cottura', description: 'Allacciamento gas piano cottura (manodopera + collaudo)', unit: 'pz', unitCost: 180.00, code: 'ALL-GAS-PCO', notes: 'Idraulico abilitato gas. Include collaudo tenuta.' },
  { category: 'Cucina – Piano Cottura', description: 'Allacciamento elettrico piano cottura induzione (manodopera)', unit: 'pz', unitCost: 95.00, code: 'ALL-ELE-IND', notes: 'Elettricista. Linea dedicata 32A necessaria.' },

  // ─── FORNI ────────────────────────────────────────────────────────────────────
  { category: 'Cucina – Forno', description: 'Forno elettrico da incasso 60cm – pirolisi (Bosch HBG5780)', unit: 'pz', unitCost: 680.00, code: 'FOR-PIR-60', notes: 'Bosch HBG5780S0. Pirolisi, autopulizia. Link: https://www.bosch-home.it' },
  { category: 'Cucina – Forno', description: 'Forno elettrico da incasso 60cm – ventilato multifunzione', unit: 'pz', unitCost: 380.00, code: 'FOR-MUL-60', notes: 'AEG/Electrolux/Bosch entry. 70L, 8 funzioni.' },
  { category: 'Cucina – Forno', description: 'Forno a vapore da incasso 60cm – Miele', unit: 'pz', unitCost: 1200.00, code: 'FOR-VAP-MIE', notes: 'Miele DGC6700. Vapore + convezione. Premium. Link: https://www.miele.it' },
  { category: 'Cucina – Forno', description: 'Microonde da incasso 45cm – Siemens', unit: 'pz', unitCost: 380.00, code: 'MCR-INC-45', notes: 'Siemens BF523LMS0. Da incasso sotto piano o in colonna.' },
  { category: 'Cucina – Forno', description: 'Forno + microonde combinato da incasso 60cm', unit: 'pz', unitCost: 950.00, code: 'FOR-MCR-60', notes: 'Bosch CMG633BS1. Forno + microonde nello stesso vano.' },
  { category: 'Cucina – Forno', description: 'Cassetto scaldavivande da incasso 14cm – Bosch', unit: 'pz', unitCost: 380.00, code: 'CAS-SCA-14', notes: 'Bosch BIC630NS1. Scaldapiatti integrato.' },
  { category: 'Cucina – Forno', description: 'Allacciamento forno da incasso (manodopera)', unit: 'pz', unitCost: 85.00, code: 'ALL-ELE-FOR', notes: 'Elettricista. Connessione presa dedicata 16A.' },

  // ─── CAPPE ────────────────────────────────────────────────────────────────────
  { category: 'Cucina – Cappa', description: 'Cappa aspirante da incasso 60cm – inox (Bosch)', unit: 'pz', unitCost: 320.00, code: 'CAP-INC-60', notes: 'Bosch DWB96DM50. 660m³/h. Silenziosa.' },
  { category: 'Cucina – Cappa', description: 'Cappa a parete 60cm piramide – inox', unit: 'pz', unitCost: 280.00, code: 'CAP-PAR-60', notes: 'Pirex/Elica. Standard cucine murali.' },
  { category: 'Cucina – Cappa', description: 'Cappa isola 90cm – design inox (Elica)', unit: 'pz', unitCost: 680.00, code: 'CAP-ISO-90', notes: 'Elica/Faber. Per cucine a isola con soffitto alto.' },
  { category: 'Cucina – Cappa', description: 'Cappa piano cottura integrata 80cm – flat', unit: 'pz', unitCost: 420.00, code: 'CAP-FLA-80', notes: 'Integrata sotto pensile, design piatto. AEG/Siemens.' },
  { category: 'Cucina – Cappa', description: 'Tubo aerazione cappa Ø150mm – metro', unit: 'ml', unitCost: 12.00, code: 'TUB-CAP-150', notes: 'Tubo rigido alluminio. Per evacuazione esterna.' },
  { category: 'Cucina – Cappa', description: 'Installazione cappa + aerazione esterna', unit: 'pz', unitCost: 220.00, code: 'POS-CAP-AER', notes: 'Elettricista + muratore. Foratura muro esterno, condotto, elettrico.' },

  // ─── LAVASTOVIGLIE ────────────────────────────────────────────────────────────
  { category: 'Cucina – Lavastoviglie', description: 'Lavastoviglie da incasso 60cm 14 coperti – Bosch SMS4HCB48E', unit: 'pz', unitCost: 520.00, code: 'LAV-BOI-60', notes: 'Bosch SMS4HCB48E. Classe A. 42dB. Link: https://www.bosch-home.it' },
  { category: 'Cucina – Lavastoviglie', description: 'Lavastoviglie da incasso 60cm 14 coperti – entry', unit: 'pz', unitCost: 380.00, code: 'LAV-INC-ENT', notes: 'Electrolux/Bauknecht. Classe D/E. Funzionale.' },
  { category: 'Cucina – Lavastoviglie', description: 'Lavastoviglie da incasso 45cm (spazio ridotto)', unit: 'pz', unitCost: 420.00, code: 'LAV-INC-45', notes: '9 coperti. Per cucine piccole. Bosch SPU2HKS57E.' },
  { category: 'Cucina – Lavastoviglie', description: 'Allacciamento lavastoviglie (manodopera idraulica + elettrica)', unit: 'pz', unitCost: 120.00, code: 'ALL-LAV-PLU', notes: 'Carico, scarico, presa elettrica. Include tubi in dotazione.' },

  // ─── FRIGORIFERI ─────────────────────────────────────────────────────────────
  { category: 'Cucina – Frigorifero', description: 'Frigorifero combinato da incasso 177cm – Bosch KIN86ADD0', unit: 'pz', unitCost: 980.00, code: 'FRI-INC-177', notes: 'Bosch KIN86ADD0. Incasso con cerniere SoftClose. NoFrost. Link: https://www.bosch-home.it' },
  { category: 'Cucina – Frigorifero', description: 'Frigorifero da incasso 122cm – solo frigo (Bosch)', unit: 'pz', unitCost: 720.00, code: 'FRI-INC-122', notes: 'Bosch KIR41ADD0. 177L. Classe D.' },
  { category: 'Cucina – Frigorifero', description: 'Congelatore a cassetti da incasso 82cm (Bosch)', unit: 'pz', unitCost: 580.00, code: 'CON-INC-82', notes: 'Bosch GID18ADD0. 97L. 4 cassetti. NoFrost.' },
  { category: 'Cucina – Frigorifero', description: 'Frigorifero side-by-side esterno 90cm – Samsung', unit: 'pz', unitCost: 1350.00, code: 'FRI-SID-90', notes: 'Samsung RS68A8531S9. Doppio frontale. No incasso.' },
  { category: 'Cucina – Frigorifero', description: 'Cassettiera congelatore sotto piano da incasso 82cm', unit: 'pz', unitCost: 480.00, code: 'CON-INC-BAS', notes: 'Sotto piano cucina. Classe E/F.' },

  // ─── ALTRI ELETTRODOMESTICI ───────────────────────────────────────────────────
  { category: 'Cucina – Elettrodomestici', description: 'Macchina da caffè da incasso 45cm – De\'Longhi/Siemens', unit: 'pz', unitCost: 820.00, code: 'CAF-INC-45', notes: 'Siemens TQ503R01. Macinatore integrato, da incasso.' },
  { category: 'Cucina – Elettrodomestici', description: 'Macchina da caffè a capsule da piano – Nespresso Vertuo', unit: 'pz', unitCost: 180.00, code: 'CAF-CAP-NES', notes: 'Nespresso Vertuo Pop. Qualità tazza superiore.' },
  { category: 'Cucina – Elettrodomestici', description: 'Lavatrice da incasso 60cm 8kg – Bosch', unit: 'pz', unitCost: 680.00, code: 'LAT-INC-8', notes: 'Bosch WAX32EH0CH. 8kg, 1600rpm, Classe A. Lavanderia.' },
  { category: 'Cucina – Elettrodomestici', description: 'Asciugatrice a calore da incasso 8kg – Bosch', unit: 'pz', unitCost: 780.00, code: 'ASC-INC-8', notes: 'Bosch WTH85VL0CH. Pompa di calore. Classe A++.' },
  { category: 'Cucina – Elettrodomestici', description: 'Lavasciuga combinata 60cm 8/5kg – AEG', unit: 'pz', unitCost: 1050.00, code: 'LAS-COM-8', notes: 'AEG L9WBAFLN. Per monolocale/lavanderia compatta.' },
  { category: 'Cucina – Elettrodomestici', description: 'Allacciamento lavatrice/asciugatrice (manodopera)', unit: 'pz', unitCost: 150.00, code: 'ALL-LAT-ASC', notes: 'Idraulico + elettricista. Carico, scarico, presa 16A.' },

  // ─── ILLUMINAZIONE CUCINA ─────────────────────────────────────────────────────
  { category: 'Illuminazione Cucina', description: 'Faretto LED da incasso 5W – bianco/cromato', unit: 'pz', unitCost: 18.00, code: 'FAR-LED-5W', notes: 'Diametro foro 70mm. 3000K. Bauhaus.' },
  { category: 'Illuminazione Cucina', description: 'Strip LED per sottopensile cucina – ml', unit: 'ml', unitCost: 22.00, code: 'STR-LED-ML', notes: 'LED bianco 4000K, adesivo, dimmerabile. Bauhaus/IKEA OMLOPP.' },
  { category: 'Illuminazione Cucina', description: 'Alimentatore strip LED 24V 60W – da incasso', unit: 'pz', unitCost: 38.00, code: 'ALI-LED-60', notes: 'Alimentatore per strip cucina.' },
  { category: 'Illuminazione Cucina', description: 'Lampada sospensione isola cucina – design industriale', unit: 'pz', unitCost: 185.00, code: 'LAM-SOS-IND', notes: 'Pendant in metallo nero/rame. IKEA RANARP area.' },
  { category: 'Illuminazione Cucina', description: 'Faretti cucina 3× LED da incasso – kit completo', unit: 'kit', unitCost: 85.00, code: 'FAR-KIT-3', notes: '3 faretti LED 5W con cablaggio. Bauhaus.' },

  // ─── ACCESSORI CUCINA ─────────────────────────────────────────────────────────
  { category: 'Accessori Cucina', description: 'Cerniera cucina ammortizzata Blum – pz', unit: 'pz', unitCost: 12.00, code: 'CER-BLU-AMM', notes: 'Blum Clip Top. Autochiudente silenziosa. Standard qualità.' },
  { category: 'Accessori Cucina', description: 'Guida cassetto a estrazione totale Blum Legrabox', unit: 'pz', unitCost: 45.00, code: 'GUI-LEG-TOT', notes: 'Blum Legrabox. Estrazione totale, autochiusura.' },
  { category: 'Accessori Cucina', description: 'Organizer cassetto cucina – 60cm', unit: 'pz', unitCost: 35.00, code: 'ORG-CAS-60', notes: 'Separatori interni cassetto. IKEA UPPDATERA area.' },
  { category: 'Accessori Cucina', description: 'Portalattine girevole interno angolo cucina', unit: 'pz', unitCost: 95.00, code: 'POR-LAT-ANG', notes: 'Girevole per armadio angolo 90°. Ottimizza spazio.' },
  { category: 'Accessori Cucina', description: 'Cestino pattumiera differenziata 2 scomparti – 60cm', unit: 'pz', unitCost: 75.00, code: 'CES-PAT-60', notes: 'Integrato sotto lavello o in base 60cm. IKEA HÅLLBAR.' },
  { category: 'Accessori Cucina', description: 'Sottolavello base doppio 60cm – IKEA', unit: 'pz', unitCost: 55.00, code: 'SOT-LAV-60', notes: 'Struttura doppia per ottimizzare spazio sotto lavello.' },
  { category: 'Accessori Cucina', description: 'Alzatina parete – ml', unit: 'ml', unitCost: 25.00, code: 'ALZ-PAR-ML', notes: 'Profilo di chiusura tra piano e parete. Inox o PVC.' },
  { category: 'Accessori Cucina', description: 'Copricolonna frigo da incasso – pannello', unit: 'pz', unitCost: 45.00, code: 'COC-FRI-PAN', notes: 'Pannello decorativo su lato frigorifero a incasso.' },

  // ─── CANTINA/DISPENSA ─────────────────────────────────────────────────────────
  { category: 'Cantina e Dispensa', description: 'Cantinetta vini da incasso 30cm – Liebherr', unit: 'pz', unitCost: 680.00, code: 'CAN-VIN-30', notes: 'Liebherr WKb1812. 18 bottiglie. 7-18°C. Silenzioso.' },
  { category: 'Cantina e Dispensa', description: 'Dispenser acqua frizzante integrato – Quooker', unit: 'pz', unitCost: 1200.00, code: 'DIS-ACQ-QUO', notes: 'Quooker Combi. Acqua bollente+frizzante da rubinetto. Link: https://www.quooker.it' },

  // ─── CAPPA ISOLA + PANNELLI DECORATIVI ───────────────────────────────────────
  { category: 'Cucina – Finiture', description: 'Pannello decorativo per parete cucina (rovere/laminato) – m²', unit: 'm²', unitCost: 85.00, code: 'PAN-DEC-CUC', notes: 'Rivestimento parete cucina in rovere impiallacciato o laminato.' },
  { category: 'Cucina – Finiture', description: 'Rete antinsetto finestra cucina con telaio – 100×120', unit: 'pz', unitCost: 65.00, code: 'RET-ANT-100', notes: 'Zanzariera a rullo o plissé. Bauhaus/Jumbo.' },
  { category: 'Cucina – Finiture', description: 'Tapparella PVC 100×120cm – motorizzata', unit: 'pz', unitCost: 280.00, code: 'TAP-PVC-MOT', notes: 'Avvolgibile motorizzato. Telecomando radio.' },
]

async function main() {
  const now = new Date().toISOString()
  let inserted = 0
  for (const item of items) {
    const id = uid()
    await client.execute({
      sql: 'INSERT INTO price_items (id, code, category, description, unit, unitCost, notes, isActive, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,1,?,?)',
      args: [id, item.code ?? null, item.category, item.description, item.unit, item.unitCost, item.notes ?? null, now, now],
    })
    inserted++
  }
  console.log(`Fase 3 — inseriti: ${inserted} articoli`)
}
main().catch(console.error).finally(() => client.close())
