import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PrintButton } from '@/components/ui/print-button'

export const metadata: Metadata = {
  title: 'PRE-2026-013 - Ballestra - Lista Acquisti Completa',
}

const S = {
  h1: { fontSize: '11pt', fontWeight: 700, color: 'var(--doc-brand)', marginBottom: '3px', marginTop: '10px', borderBottom: '2px solid var(--doc-brand)', paddingBottom: '2px' } as React.CSSProperties,
  h2: { fontSize: '9pt', fontWeight: 700, color: 'var(--doc-paper)', padding: '2px 7px', borderRadius: '3px', marginTop: '6px', marginBottom: '3px' } as React.CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '7.5pt', marginBottom: '5px' },
  th: { background: 'var(--doc-ink-strong)', color: 'var(--doc-paper)', padding: '2.5px 5px', textAlign: 'left' as const, fontWeight: 600, fontSize: '7pt' },
  thR: { background: 'var(--doc-ink-strong)', color: 'var(--doc-paper)', padding: '2.5px 5px', textAlign: 'right' as const, fontWeight: 600, fontSize: '7pt' },
  td: { padding: '2.5px 5px', borderBottom: '1px solid var(--doc-line)', fontSize: '7.5pt', verticalAlign: 'top' as const },
  tdR: { padding: '2.5px 5px', borderBottom: '1px solid var(--doc-line)', textAlign: 'right' as const, fontSize: '7.5pt' },
  note: { fontSize: '6.5pt', color: 'var(--doc-ink-subtle)' } as React.CSSProperties,
}

const Tr = ({ odd, ch, children }: { odd?: boolean; ch?: boolean; children: React.ReactNode }) => (
  <tr style={{ background: ch ? 'var(--doc-warn-soft)' : odd ? 'var(--doc-fill)' : 'var(--doc-paper)' }}>{children}</tr>
)

const CHF = (n: number) => `CHF ${n.toLocaleString('de-CH', { minimumFractionDigits: 0 })}`
const EUR = (n: number) => `€${n.toLocaleString('it-IT', { minimumFractionDigits: 0 })}`

type Item = {
  name: string
  qty: string
  chPrice: number
  chWhere: string
  chLink: string
  itPrice?: number
  itWhere?: string
  itLink?: string
  note?: string
  phase: number
  urgent?: boolean
}

// ─── ITEMS BY TRIP/SUPPLIER ───────────────────────────────────────────────────

const TRIPS: Array<{
  id: string
  label: string
  color: string
  bg: string
  store: string
  distance: string
  url: string
  when: string
  items: Item[]
}> = [
  {
    id: 'debrunner',
    label: 'VIAGGIO 1 — Debrunner Acifer Mendrisio / Edilgroup Manno',
    color: 'var(--doc-brand)', bg: 'var(--doc-accent-soft)',
    store: 'Debrunner Acifer Mendrisio · Via Franscini 29 · +41 91 646 36 36',
    distance: '~20 min da Lugano',
    url: 'https://shop.d-a.ch/it/putrella-ipe-acciaio-s355j2-laminazione-a-caldo/p/M100519',
    when: 'Prima di iniziare la Fase 1 (Struttura)',
    items: [
      { name: 'Putrella metallica IPE 100/120 — apertura corridoio-soggiorno', qty: '1 pz (2,7m)', chPrice: 150, chWhere: 'Debrunner Acifer Mendrisio', chLink: 'https://shop.d-a.ch/it/putrella-ipe-acciaio-s355j2-laminazione-a-caldo/p/M100519', note: 'IPE 100 o 120 a seconda del calcolo strutturale. Lunghezza ~2,7m. Chiedere preventivo a Debrunner o Edilgroup CH Manno (+41 91 610 02 02).', phase: 1, urgent: true },
      { name: 'Tasselli chimici + piastre di ancoraggio putrella', qty: '1 kit (4 pz)', chPrice: 45, chWhere: 'Bauhaus Lugano', chLink: 'https://www.bauhaus.ch/it/fissaggi/', note: 'Tasselli Hilti HY-200 o Fischer FIS. Misura in base allo spessore parete. Verificare con muratore.', phase: 1, urgent: true },
    ]
  },
  {
    id: 'ikea',
    label: 'VIAGGIO 2 — IKEA Corsico Milano (unico viaggio)',
    color: 'var(--doc-accent)', bg: 'var(--doc-accent-soft)',
    store: 'IKEA Corsico · Via Jesolo 1, 20094 Corsico MI · +39 02 9110 0820',
    distance: '~55 min da Lugano · Autostrada A9 Como · Parcheggio gratuito',
    url: 'https://www.ikea.com/it/it/stores/milano-corsico/',
    when: 'Prima di iniziare — ordinare cucina con planner IKEA 2-3 settimane prima',
    items: [
      { name: 'Cucina METOD 307cm Veddinge bianco (ME K16)', qty: '1 combinaz.', chPrice: 1990, chWhere: 'IKEA CH (CHF 1.990)', chLink: 'https://www.ikea.com/ch/it/p/metod-cucina-bianco-veddinge-bianco-s89614920/', itPrice: 1690, itWhere: 'IKEA Corsico', itLink: 'https://www.ikea.com/it/it/cat/combinazioni-di-cucina-metod-50005/', note: 'Art. 896.149.20 CH. Prenotare appuntamento con IKEA Kitchen Planner. Portare misure reali dell\'appartamento. Risparmio ~CHF 310.', phase: 5 },
      { name: 'Piano cottura induzione MATMÄSSIG 300 NERO', qty: '1 pz', chPrice: 449, chWhere: 'IKEA CH', chLink: 'https://www.ikea.com/ch/it/p/matmaessig-piano-cottura-a-induzione-ikea-300-nero-10467093/', itPrice: 379, itWhere: 'IKEA Corsico', itLink: 'https://www.ikea.com/it/it/p/matmaessig-piano-cottura-a-induzione-ikea-300-nero-10467093/', note: 'Art. 10467093. Richiede circuito dedicato 5G6mm².', phase: 5 },
      { name: 'Cappa aspirante LAGAN 60cm', qty: '1 pz', chPrice: 50, chWhere: 'IKEA CH', chLink: 'https://www.ikea.com/ch/it/p/lagan-cappa-da-fissare-alla-parete-bianco-50401397/', itPrice: 42, itWhere: 'IKEA Corsico', itLink: 'https://www.ikea.com/it/it/p/lagan-cappa-da-fissare-alla-parete-bianco-50401397/', note: 'Art. 503.013.97.', phase: 5 },
      { name: 'Frigorifero LAGAN 262L freestanding', qty: '1 pz', chPrice: 479, chWhere: 'IKEA CH', chLink: 'https://www.ikea.com/ch/it/p/lagan-frigorifero-congelatore-freestanding-bianco-80571294/', itPrice: 409, itWhere: 'IKEA Corsico', itLink: 'https://www.ikea.com/it/it/p/lagan-frigorifero-congelatore-freestanding-bianco-80571294/', note: 'Art. 805.712.94.', phase: 5 },
      { name: 'Forno ventilato STENABY', qty: '1 pz', chPrice: 429, chWhere: 'IKEA CH', chLink: 'https://www.ikea.com/ch/it/p/stenaby-forno-ventilato-funzione-grill-bianco-ikea-300-40613941/', itPrice: 369, itWhere: 'IKEA Corsico', itLink: 'https://www.ikea.com/it/it/p/stenaby-forno-ventilato-funzione-grill-bianco-ikea-300-40613941/', note: 'Art. 406.139.41. Circuito dedicato 16A.', phase: 5 },
      { name: 'Lavello FYNDIG inox 1 vasca', qty: '1 pz', chPrice: 25, chWhere: 'IKEA CH', chLink: 'https://www.ikea.com/ch/it/p/fyndig-lavello-da-incasso-a-1-vasca-inox-90202126/', itPrice: 21, itWhere: 'IKEA Corsico', itLink: 'https://www.ikea.com/it/it/p/fyndig-lavello-da-incasso-a-1-vasca-inox-90202126/', note: 'Art. 902.021.26.', phase: 5 },
      { name: 'Miscelatore EDSVIK cucina', qty: '1 pz', chPrice: 60, chWhere: 'IKEA CH', chLink: 'https://www.ikea.com/ch/it/p/edsvik-miscelatore-lavello-doppio-comando-cromato-50507209/', itPrice: 52, itWhere: 'IKEA Corsico', itLink: 'https://www.ikea.com/it/it/p/edsvik-miscelatore-lavello-doppio-comando-cromato-50507209/', note: 'Art. 505.072.09.', phase: 5 },
      { name: 'Mobile lavabo ÄNGSJÖN + BACKSJÖN (fornitura completa) × 2', qty: '2 set', chPrice: 1034, chWhere: 'IKEA CH (CHF 517/set)', chLink: 'https://www.ikea.com/ch/it/p/aengsjoen-backsjoen-mobile-lavabo-cassetti-lavabo-misc-s19521123/', itPrice: 540, itWhere: 'IKEA Corsico (~€270/set)', itLink: 'https://www.ikea.com/it/it/cat/mobili-aengsjoen-con-lavabo-700470/', note: 'Art. 195.211.23. Cabinetto + lavabo + rubinetteria. 2 bagni.', phase: 3 },
      { name: 'Specchio armadietto LETTAN 80cm × 2', qty: '2 pz', chPrice: 518, chWhere: 'IKEA CH (CHF 259/pz)', chLink: 'https://www.ikea.com/ch/it/p/lettan-mobile-a-specchio-con-ante-effetto-specchio-vetro-a-specchio-80534923/', itPrice: 420, itWhere: 'IKEA Corsico (~€210/pz)', itLink: 'https://www.ikea.com/it/it/p/lettan-mobile-a-specchio-con-ante-effetto-specchio-vetro-a-specchio-80534923/', note: 'Art. 805.349.23. 2 bagni.', phase: 3 },
      { name: 'Piano di lavoro laminato EKBACKEN 186cm × 2', qty: '2 pz', chPrice: 118, chWhere: 'IKEA CH (CHF 59/pz)', chLink: 'https://www.ikea.com/ch/it/cat/piani-di-lavoro-24264/', itPrice: 98, itWhere: 'IKEA Corsico', itLink: 'https://www.ikea.com/it/it/cat/piani-di-lavoro-24264/', note: '×2 = 186cm totali.', phase: 5 },
    ]
  },
  {
    id: 'sanitari',
    label: 'VIAGGIO 3 — Sanitas Troesch Mendrisio + Leroy Merlin Como (sanitari)',
    color: 'var(--doc-positive)', bg: 'var(--doc-positive-soft)',
    store: 'Sanitas Troesch Mendrisio · Via Borromini 4 · +41 91 646 38 44 | Leroy Merlin Como · Via Tomaso Grossi 5 · ~30 min',
    distance: 'Sanitas ~15 min · Leroy Merlin ~30 min — stesso viaggio',
    url: 'https://shop.sanitastroesch.ch',
    when: 'Prima della Fase 2 (Bagno Esistente) e Fase 4 (Bagno Nuovo)',
    items: [
      { name: 'WC sospeso rimless + placca Sigma + copriwater × 2', qty: '2 set', chPrice: 1100, chWhere: 'Sanitas Troesch (CHF 550/set)', chLink: 'https://shop.sanitastroesch.ch', itPrice: 280, itWhere: 'Leroy Merlin Como (~€140/set)', itLink: 'https://www.leroymerlin.it/prodotti/bagno-e-arredo-bagno/sanitari/vaso-wc/wc-sospeso/', note: 'IT: Ideal Standard Tirso sospeso ~€57.50 + placca ~€45 + copriwater ~€38. Qualità paragonabile. ⚠️ Telaio Duofix fornito da GC Termo-Idraulica — verificare compatibilità.', phase: 3 },
      { name: 'Bidet sospeso × 1 (bagno esistente)', qty: '1 pz', chPrice: 193, chWhere: 'Sanitas Troesch (art. 2143 192.100.000)', chLink: 'https://shop.sanitastroesch.ch/it/bagno/ceramiche-bagno/bidet/bidet-sospeso-duravit-d-code/2143+192.100.000.html', itPrice: 75, itWhere: 'Leroy Merlin Como', itLink: 'https://www.leroymerlin.it/prodotti/bagno-e-arredo-bagno/sanitari/bidet/bidet-sospeso/', note: 'Duravit D-Code IT ~€65-90. Qualità equivalente.', phase: 3 },
      { name: 'Sistema doccia completo × 2 (colonna, soffione, doccetta, miscel.)', qty: '2 set', chPrice: 900, chWhere: 'Sanitas Troesch (~CHF 450/set)', chLink: 'https://shop.sanitastroesch.ch', note: 'Stima Grohe/Hansgrohe qualità media. Acquistare in CH per garanzia.', phase: 3 },
      { name: 'Piletta e scarico doccia × 2', qty: '2 pz', chPrice: 240, chWhere: 'Sanitas Troesch (~CHF 120/pz)', chLink: 'https://shop.sanitastroesch.ch', note: 'Incl. sifone e raccordi.', phase: 3 },
      { name: 'Accessori bagno std × 2 (porta asciugamani, carta, ganci)', qty: '2 set', chPrice: 300, chWhere: 'Bauhaus / Jumbo CH', chLink: 'https://www.bauhaus.ch/it/badezimmer/', note: 'Kit standard: porta asciugamani, porta carta igienica, 2-3 ganci.', phase: 3 },
      { name: 'Box doccia rettangolare 120×80cm (bagno esistente)', qty: '1 pz', chPrice: 500, chWhere: 'Sanitas Troesch o Bagno Design Contone', chLink: 'https://shop.sanitastroesch.ch', note: 'Stima CHF 400-600. Verificare dimensioni effettive in opera prima dell\'ordine.', phase: 3 },
      { name: 'Box doccia 70×110cm (bagno nuovo)', qty: '1 pz', chPrice: 500, chWhere: 'Sanitas Troesch o Bagno Design Contone', chLink: 'https://shop.sanitastroesch.ch', note: 'Bagno Design Contone: +41 91 290 81 01. Verificare dimensioni reali prima di ordinare.', phase: 4 },
    ]
  },
  {
    id: 'leroymerlin',
    label: 'VIAGGIO 4 — Leroy Merlin Como + Tecnomat Como (piastrelle, consumabili)',
    color: 'var(--doc-positive)', bg: 'var(--doc-positive-soft)',
    store: 'Leroy Merlin Como · Via Tomaso Grossi 5 · ~30 min | Tecnomat Como · Via Belvedere · ~35 min',
    distance: '~30-35 min da Lugano · Stessa uscita autostrada A9',
    url: 'https://www.leroymerlin.it',
    when: 'Prima di Fase 2 (Bagno Esistente) — portare tutte le misure reali',
    items: [
      { name: 'Piastrelle gres 60×60 bagno esistente (25 m² + 10% sfrido)', qty: '28 m²', chPrice: 980, chWhere: 'Bauhaus CH (art. 28795195, CHF 35/m²)', chLink: 'https://www.bauhaus.ch/it/p/piastrella-in-gres-porcellanato-tribeca-28795195', itPrice: 504, itWhere: 'LM Como o Tecnomat (~€18/m²)', itLink: 'https://www.leroymerlin.it/prodotti/pavimenti-e-rivestimenti/pavimenti-e-rivestimenti-per-interni/tutti-pavimenti-e-rivestimenti-in-gres-porcellanato/', note: '+ 10% sfrido su 25.04m² → acquistare 28m². Verificare disponibilità lotto unico. Ordinare insieme a corridoio/cucina.', phase: 2 },
      { name: 'Piastrelle gres 60×60 corridoio e cucina (30 m² + 10%)', qty: '33 m²', chPrice: 988, chWhere: 'Bauhaus CH (art. 31365295, CHF 29.95/m²)', chLink: 'https://www.bauhaus.ch/it/p/gres-porcellanato-active-beige-31365295', itPrice: 495, itWhere: 'LM Como o Tecnomat (~€15/m²)', itLink: 'https://www.tecnomat.it/am/it/piastrelle-60x60', note: 'Active Beige o equivalente. Ordinare stesso giorno delle piastrelle bagno per ridurre viaggi.', phase: 2 },
      { name: 'Piastrelle gres 60×60 bagno nuovo (floor ~8m² + pareti ~25m² = ~33m² + 10%)', qty: '36 m²', chPrice: 1260, chWhere: 'Bauhaus CH (~CHF 35/m²)', chLink: 'https://www.bauhaus.ch', itPrice: 648, itWhere: 'LM Como (~€18/m²)', itLink: 'https://www.leroymerlin.it/prodotti/pavimenti-e-rivestimenti/pavimenti-e-rivestimenti-per-interni/tutti-pavimenti-e-rivestimenti-in-gres-porcellanato/', note: '+ 10% sfrido. Acquistare stesso lotto degli altri bagni per uniformità.', phase: 4 },
      { name: 'Cola per piastrelle C2TES1 25kg × 10 sacchi (tutti i bagni + corridoio)', qty: '10 sacchi', chPrice: 340, chWhere: 'Bauhaus CH (CHF 34/sacco)', chLink: 'https://www.bauhaus.ch', itPrice: 180, itWhere: 'LM Como — Kerakoll Flex S1 (~€18/sacco)', itLink: 'https://www.leroymerlin.it/prodotti/colla-per-piastrelle-in-polvere-kerakoll-flex-s1-25-kg-grigio-c2tes1-93822890.html', note: 'Consumo: ~4kg/m² per gres grande formato. 97m² totali → ~390kg → 16 sacchi. Acquistare 10 sacchi in IT + 6 in CH per gestire peso nel furgone.', phase: 2 },
      { name: 'Stucco per fughe gres Mapei Ultracolor Plus 5kg × 12 sacchi', qty: '12 sacchi', chPrice: 300, chWhere: 'Bauhaus CH (CHF 25/sacco)', chLink: 'https://www.bauhaus.ch', itPrice: 83, itWhere: 'LM Como — Mapei (€6.90/sacco)', itLink: 'https://www.leroymerlin.it/catalogo/stucco-per-fughe-in-polvere-ultracolor-plus-grigio-scuro-5-kg-36142344-p', note: 'Consumo: ~0.7kg/m² fuga 3mm. 97m² → ~68kg → 14 sacchi. Colore: grigio/beige in base a scelta piastrella.', phase: 2 },
      { name: 'Impermeabilizzante Mapei Aquadefense 7.5kg × 5 buckets', qty: '5 secchi', chPrice: 310, chWhere: 'Bauhaus CH (CHF 62/secchio)', chLink: 'https://www.bauhaus.ch', itPrice: 175, itWhere: 'LM Como — Mapei (~€35/7.5kg)', itLink: 'https://www.leroymerlin.it/prodotti/impermeabilizzante-mapei-acqua-defense-blu-7-5kg-36634675.html', note: 'Consumo: ~1.2kg/m² × 2 mani. Bagno exist.: ~15m² + bagno nuovo: ~35m² = 50m² totali → 60kg → 8 secchi. Acquistare 5 IT + 3 CH.', phase: 2, urgent: true },
      { name: 'Nastro di armatura per impermeabilizzazione angoli — 25ml × 3 rotoli', qty: '3 rotoli', chPrice: 45, chWhere: 'Bauhaus CH (CHF 15/rotolo)', chLink: 'https://www.bauhaus.ch', itPrice: 18, itWhere: 'LM Como (~€6/rotolo)', itLink: 'https://www.leroymerlin.it', note: 'Indispensabile negli angoli pavimento-parete del box doccia.', phase: 2 },
      { name: 'Silicone MS neutro bagno × 15 cartucce', qty: '15 cart.', chPrice: 150, chWhere: 'Bauhaus CH (CHF 10/cart.)', chLink: 'https://www.bauhaus.ch', itPrice: 60, itWhere: 'LM Como (~€4/cart.)', itLink: 'https://www.leroymerlin.it', note: 'Per angoli doccia, perimetro sanitari, giunti top cucina-parete. Colore bianco e grigio.', phase: 2 },
      { name: 'Profili alluminio bordo/transizione piastrelle — 30ml totali', qty: '30 ml', chPrice: 120, chWhere: 'Bauhaus CH (~CHF 4/ml)', chLink: 'https://www.bauhaus.ch', itPrice: 60, itWhere: 'LM Como (~€2/ml)', itLink: 'https://www.leroymerlin.it', note: 'Profili T e L per bordi e transizioni tra materiali diversi.', phase: 2 },
      { name: 'Distanziatori piastrelle 3mm × 4 buste (500 pcs/busta)', qty: '4 buste', chPrice: 48, chWhere: 'Bauhaus CH (CHF 12/busta)', chLink: 'https://www.bauhaus.ch', itPrice: 16, itWhere: 'LM Como (~€4/busta)', itLink: 'https://www.leroymerlin.it', note: '500 pcs per busta. Per ~100m² di gres 60×60.', phase: 2 },
      { name: 'Pittura lavabile pareti + soffitti — LUXENS 14L × 3 tin', qty: '3 × 14L', chPrice: 195, chWhere: 'Hornbach/Bauhaus CH (~CHF 65/14L)', chLink: 'https://www.bauhaus.ch', itPrice: 105, itWhere: 'LM Como — LUXENS (~€35/14L)', itLink: 'https://www.leroymerlin.it/prodotti/pittura-per-interni-per-parete-e-soffitto-lavabile-luxens-tutti-gli-ambienti-bianco-opaco-14-l-81990262.html', note: 'Superficie stimata 280m², 2 mani, resa 12m²/L → 47L. Con 3×14L = 42L (integrare con tin CH se serve). Qualità: LUXENS IT equivale a Luxol CH.', phase: 8 },
      { name: 'Vernice per persiane (esterno/legno) — 10L', qty: '1 × 10L', chPrice: 75, chWhere: 'Bauhaus CH (~CHF 75)', chLink: 'https://www.bauhaus.ch', itPrice: 40, itWhere: 'LM Como (~€40)', itLink: 'https://www.leroymerlin.it', note: '6 persiane. Vernice opaca per esterni, colore bianco o neutro. +2L smalto per porte interne.', phase: 8 },
    ]
  },
  {
    id: 'tecnomat',
    label: 'VIAGGIO 5 — Tecnomat Como (porte interne)',
    color: 'var(--doc-warn)', bg: 'var(--doc-warn-soft)',
    store: 'Tecnomat · ex Bricoman · Via Belvedere, Como · ~35 min',
    distance: '~35 min da Lugano',
    url: 'https://www.tecnomat.it',
    when: 'Prima di Fase 3 (Nuovo Corridoio Interno) — ordinare e verificare misure reali',
    items: [
      { name: 'Porta interna battente 80×210cm filo muro × 3', qty: '3 pz', chPrice: 1500, chWhere: 'Serramentista CH (~CHF 500/pz)', chLink: '', itPrice: 477, itWhere: 'Tecnomat Como — Contract Effebiquattro (~€159/pz)', itLink: 'https://www.tecnomat.it/it/porta-filo-muro-reversibile-h210-x-l80-10042219/', note: 'Modello filo muro reversibile 210×80cm. Verificare dimensioni vani reali prima di ordinare. Include cornici?', phase: 3, urgent: false },
      { name: 'Cerniere per porte × 3 set (3 cerniere/porta)', qty: '9 pz', chPrice: 90, chWhere: 'Bauhaus CH (~CHF 10/pz)', chLink: 'https://www.bauhaus.ch', itPrice: 36, itWhere: 'Tecnomat (~€4/pz)', itLink: 'https://www.tecnomat.it', note: 'Cerniere regolabili 3D in acciaio. 3 per porta = 9 totali.', phase: 3 },
      { name: 'Maniglie per porte × 3 set', qty: '3 set', chPrice: 120, chWhere: 'Bauhaus CH (~CHF 40/set)', chLink: 'https://www.bauhaus.ch', itPrice: 48, itWhere: 'Tecnomat (~€16/set)', itLink: 'https://www.tecnomat.it', note: 'Maniglia + rosette + serratura o nottolino.', phase: 3 },
    ]
  },
  {
    id: 'bauhaus',
    label: 'ACQUISTI IN SVIZZERA — Bauhaus Lugano / Hornbach / Edilgroup',
    color: 'var(--doc-ink-strong)', bg: 'var(--doc-fill)',
    store: 'Bauhaus Lugano · Via Serafino Balestra 17 · Edilgroup Manno · +41 91 610 02 02',
    distance: 'Bauhaus: centro Lugano · Edilgroup: ~10 min',
    url: 'https://www.bauhaus.ch/it',
    when: 'Acquisti continui durante tutta l\'opera — riordini settimanali',
    items: [
      { name: 'Lastre cartongesso idrofugo 12.5mm 1.2×2.6m × 30 pz', qty: '30 lastre', chPrice: 480, chWhere: 'Bauhaus CH (art. gesso idrofugo ~CHF 16/pz)', chLink: 'https://www.bauhaus.ch', note: 'Per: bagno exist. 10m², corridoio ingresso 15m², NCI 12m², bagno nuovo 12m². Doppio strato ovunque. Totale ~100m² → 33 lastre. Rigips o Knauf.', phase: 2 },
      { name: 'Lastre cartongesso standard 12.5mm × 20 pz', qty: '20 lastre', chPrice: 280, chWhere: 'Bauhaus CH (~CHF 14/pz)', chLink: 'https://www.bauhaus.ch', note: 'Per cucina (11m²), rasatura soffitti. Standard (non idrofugo).', phase: 2 },
      { name: 'Profili metallici C/U per cartongesso — 200 ml totali', qty: '200 ml', chPrice: 180, chWhere: 'Bauhaus CH (~CHF 2.50/ml profilo 3m)', chLink: 'https://www.bauhaus.ch', note: 'Profili CW + UW (o C + U) per tutte le pareti cartongesso. Calcolo preciso da fare in base ai disegni.', phase: 2 },
      { name: 'Isolazione lana di roccia 5cm (60×100cm) × 50 pz', qty: '50 pannelli', chPrice: 350, chWhere: 'Bauhaus CH — Swisspor ROC (~CHF 7/pz)', chLink: 'https://www.bauhaus.ch', note: 'Per tutte le contropareti. 50 pannelli 60×100cm = 30m². Adatto per umidità (bagni).', phase: 2 },
      { name: 'Viti per cartongesso 3.5×35mm × 5 box (500pcs/box)', qty: '5 box', chPrice: 60, chWhere: 'Bauhaus CH (~CHF 12/box)', chLink: 'https://www.bauhaus.ch', note: 'Per fissaggio lastre ai profili. ~15 viti/m².', phase: 2 },
      { name: 'Nastro carta per giunti cartongesso × 5 rotoli (50m)', qty: '5 rotoli', chPrice: 50, chWhere: 'Bauhaus CH (~CHF 10/rotolo)', chLink: 'https://www.bauhaus.ch', note: 'Per tutti i giunti tra lastre. Indispensabile.', phase: 2 },
      { name: 'Stucco per giunti cartongesso (Uniflott Knauf) 25kg × 4 sacchi', qty: '4 sacchi', chPrice: 100, chWhere: 'Bauhaus CH (~CHF 25/sacco)', chLink: 'https://www.bauhaus.ch', note: 'Per stuccatura giunti e teste viti di tutte le pareti in cartongesso.', phase: 2 },
      { name: 'LEKA (massetto leggero) per rialzo pavimento bagno nuovo — 8 sacchi', qty: '8 sacchi', chPrice: 240, chWhere: 'Bauhaus CH / Edilgroup (~CHF 30/sacco)', chLink: 'https://lehmag.ch/en/materialien/leka/', note: '⚠️ VOCE MANCANTE NEL PREVENTIVO. Rialzo pavimento bagno nuovo su 3 livelli. Necessario per creare pendenze scarico doccia. ~8m² × 8cm rialzo medio → ~0.64m³ → 8 sacchi. Prodotto leggero per soletta in legno.', phase: 4, urgent: true },
      { name: 'Massetto autolivellante 25kg × 6 sacchi (livellamento finale)', qty: '6 sacchi', chPrice: 150, chWhere: 'Bauhaus CH (~CHF 25/sacco)', chLink: 'https://www.bauhaus.ch', note: '⚠️ VOCE MANCANTE. Per livellamento finale bagno nuovo prima di posa piastrelle. ~8m² × 5mm → ~40kg → 2 sacchi; + corridoio → tot 6 sacchi.', phase: 4, urgent: true },
      { name: 'Rete di armatura in fibra 5m² × 4 (per rasature parete demolita)', qty: '20 m²', chPrice: 80, chWhere: 'Bauhaus CH (~CHF 4/m²)', chLink: 'https://www.bauhaus.ch', note: 'Per rinforzo rasatura sulla parete dove è stata demolita e ricostruita. Apertura corridoio-soggiorno.', phase: 1 },
      { name: 'Malta M5 per muratura e stucchi vari — 25kg × 8 sacchi', qty: '8 sacchi', chPrice: 120, chWhere: 'Bauhaus / Edilgroup (~CHF 15/sacco)', chLink: 'https://www.bauhaus.ch', note: 'Per chiusura porta esistente padronale, rasature varie, chiusure.', phase: 1 },
      { name: 'Vernice aggrappante (primer) 5L × 4 secchi', qty: '4 × 5L', chPrice: 120, chWhere: 'Bauhaus CH (~CHF 30/5L)', chLink: 'https://www.bauhaus.ch', note: 'Primer su tutte le superfici prima di pittura e su piastrelle esistenti (bagno). Tiefengrund o equivalente.', phase: 8 },
      { name: 'Kit pittura (rulli, pennelli, vassoi, teli, nastro) — completo', qty: '1 kit', chPrice: 80, chWhere: 'Bauhaus / Hornbach', chLink: 'https://www.bauhaus.ch', note: '3 rulli velluto 18cm, 2 rulli pelo corto, 3 pennelli piatti, 3 vassoi, 10 teli di protezione, 5 rotoli nastro da carrozziere.', phase: 8 },
      { name: 'Battiscopa Logoclic Rovere Firenze 2600×58×18mm — 42 pezzi (110ml)', qty: '42 pz', chPrice: 546, chWhere: 'Bauhaus CH (art. 31158811, CHF 4.96/ml)', chLink: 'https://www.bauhaus.ch/it/p/logoclic-battiscopa-rovere-firenze-31158811', note: '110ml + 10% = 121ml → 47 pezzi (ogni pezzo = 2.6m). Art. 31158811.', phase: 9 },
      { name: 'Posa battiscopa: colla/chiodi/accessori', qty: '1 kit', chPrice: 30, chWhere: 'Bauhaus CH', chLink: 'https://www.bauhaus.ch', note: 'Colla per battiscopa + giunti angolari + terminali.', phase: 9 },
    ]
  },
  {
    id: 'elettrico',
    label: 'ACQUISTI ELETTRICO — Elettromercato Bronz + OBI / Jumbo CH',
    color: 'var(--doc-warn)', bg: 'var(--doc-warn-soft)',
    store: 'Elettromercato Bronz Ticino · OBI Lugano · Jumbo Lugano',
    distance: 'Lugano area',
    url: 'https://www.elettromercato.ch',
    when: 'Prima di Fase 6 (Impianto Elettrico) — ordinare quadro con anticipo',
    items: [
      { name: 'Quadro Hager VOLTA VA48A 48 moduli IP30', qty: '1 pz', chPrice: 173, chWhere: 'Elettromercato Bronz (art. 20334, CHF 172.95)', chLink: 'https://www.elettromercato.ch/it/prodotti/id/20334/quadro-hager-4-file-volta-ap-bianco', note: '⚠️ Quadro INTERNO da installare nell\'appartamento. Attualmente esiste solo contatore esterno.', phase: 6, urgent: true },
      { name: 'MCBs 1P-10A × 8 (luce) + 1P-16A × 10 (prese) + 1P-32A × 1 (cottura)', qty: '19 pz', chPrice: 250, chWhere: 'Elettromercato Bronz (Hager MCB)', chLink: 'https://www.elettromercato.ch', note: 'Hager o ABB: 1P-10A (CHF 12/pz), 1P-16A (CHF 13/pz), 1P-32A (CHF 25/pz). +MCBs forno, lavatrice, boiler.', phase: 6 },
      { name: 'Differenziali 2P-25A/30mA tipo A × 4 (zone)', qty: '4 pz', chPrice: 260, chWhere: 'Bauhaus CH — Hager (CHF 65/pz)', chLink: 'https://www.bauhaus.ch/it/hager-interruttore-differenziale-e-magnetotermico-c-16a/p/30946077', note: 'Zone: luce, prese, cucina, bagni. Tipo A obbligatorio per bagni.', phase: 6, urgent: true },
      { name: 'Interruttore generale 2P-40A', qty: '1 pz', chPrice: 35, chWhere: 'Elettromercato Bronz', chLink: 'https://www.elettromercato.ch', phase: 6 },
      { name: 'Cavi TT 3×1.5mm² LNPE bianco — 270ml', qty: '270 ml', chPrice: 473, chWhere: 'Elettromercato Bronz (art. 42625, CHF 1.75/m)', chLink: 'https://www.elettromercato.ch/en/browse/id/42625', note: '8 circuiti illuminazione. Acquistare bobina da 300m per avere riserva.', phase: 6 },
      { name: 'Cavi TT 3×2.5mm² LNPE bianco — 360ml', qty: '360 ml', chPrice: 1224, chWhere: 'Elettromercato Bronz (art. 42564, CHF 3.40/m)', chLink: 'https://www.elettromercato.ch/en/browse/id/42564', note: '10 circuiti prese. Bobina da 400m.', phase: 6 },
      { name: 'Cavo 5G6mm² per piano cottura — 20ml', qty: '20 ml', chPrice: 160, chWhere: 'Elettromercato Bronz (~CHF 8/m)', chLink: 'https://www.elettromercato.ch', note: 'Circuito dedicato piano cottura induzione 32A. Terminale fisso.', phase: 6, urgent: true },
      { name: 'Cavi 3×2.5mm² dedicati (lavatrice, lavastoviglie, boiler, forno) — 90ml', qty: '90 ml', chPrice: 306, chWhere: 'Elettromercato Bronz (CHF 3.40/m)', chLink: 'https://www.elettromercato.ch', phase: 6 },
      { name: 'Prese T13 ABB Basic55 × 28 pz', qty: '28 pz', chPrice: 616, chWhere: 'OBI / Jumbo CH (~CHF 22/pz)', chLink: 'https://www.obi.ch/it/search/ABB%20presa%20tipo%2013/', note: '⚠️ Prese italiane T11/T16 NON compatibili con standard CH T13. Acquistare SOLO in Svizzera.', phase: 7 },
      { name: 'Prese IP44 T13 × 4 pz (bagni)', qty: '4 pz', chPrice: 340, chWhere: 'Elettromercato Bronz / OBI (~CHF 85/pz)', chLink: 'https://www.elettromercato.ch', note: 'Zona 2 bagni. Obbligatorio IP44 per NIN 2020. Tipo A differenziale.', phase: 7, urgent: true },
      { name: 'Interruttori + deviatori Feller EDIZIOdue × 22 pz', qty: '22 pz', chPrice: 594, chWhere: 'OBI CH (CHF 8.95-49.95/pz)', chLink: 'https://www.obi.ch/it/interruttori-e-pulsanti/feller-interruttore-a-pressione-da-incasso-ediziodue-luce-ventilatore-bianco/p/6021422', note: '15 interruttori + 7 deviatori. Prezzi medi ~CHF 27/pz.', phase: 7 },
      { name: 'Cassette da incasso φ68mm × 70 pz', qty: '70 pz', chPrice: 175, chWhere: 'Elettromercato Bronz (~CHF 2.50/pz)', chLink: 'https://www.elettromercato.ch', phase: 6 },
      { name: 'Cassette derivazione IP40 × 10 pz + Wago 2-5 poli', qty: '1 kit', chPrice: 80, chWhere: 'Elettromercato Bronz', chLink: 'https://www.elettromercato.ch', note: 'Morsetti Wago 221 (universali): confezione da 50 pz × 2 modelli.', phase: 6 },
      { name: 'Tubi corrugati M20 flessibili × 100m (protezione cavi in muratura)', qty: '100 m', chPrice: 60, chWhere: 'Elettromercato / OBI (~CHF 0.60/m)', chLink: 'https://www.elettromercato.ch', phase: 6 },
      { name: 'Etichette per circuiti quadro + pennarello permanente', qty: '1 kit', chPrice: 15, chWhere: 'Bauhaus / Cancelleria', chLink: 'https://www.bauhaus.ch', phase: 6 },
    ]
  },
]

// Totals
const totalCH = TRIPS.flatMap(t => t.items).reduce((s, i) => s + i.chPrice, 0)
const totalIT = TRIPS.flatMap(t => t.items).reduce((s, i) => s + (i.itPrice ? i.itPrice * 1.02 : i.chPrice), 0) // 1.02 = EUR→CHF
const totalSaving = totalCH - totalIT

export default function ListaAcquisti() {
  const today = new Date().toLocaleDateString('it-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const urgenti = TRIPS.flatMap(t => t.items).filter(i => i.urgent)

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:p-0">
      <style>{`
        @media print {
          @page { margin: 8mm 12mm; size: A4; }
          html, body { height: auto !important; overflow: visible !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; }
          .no-print { display: none !important; }
          table { page-break-inside: auto; border-collapse: collapse; width: 100%; }
          tr { page-break-inside: avoid; }
          thead { display: table-header-group; }
          .pb { page-break-before: always; }
          a { color: var(--doc-accent) !important; }
        }
      `}</style>

      <div className="no-print max-w-[210mm] mx-auto mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/relatori" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" />Relatori
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/quotes/cmobzgzsh0003y0ukbly36k3q" className="text-sm text-blue-600">PRE-2026-013</Link>
        </div>
        <PrintButton />
      </div>

      <div className="doc-sheet bg-white max-w-[210mm] mx-auto shadow-lg print:shadow-none" style={{ padding: '8mm 12mm', fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: '8pt', color: 'var(--doc-ink)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4mm', paddingBottom: '3mm', borderBottom: '2px solid var(--doc-brand)' }}>
          <div>
            <div style={{ fontSize: '14pt', fontWeight: 700, color: 'var(--doc-brand)' }}>Zanetti Soluzioni Edili</div>
            <div style={{ fontSize: '7pt', color: 'var(--doc-ink-muted)' }}>Lista Acquisti Completa — PRE-2026-013 v7 · {today}</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '7.5pt' }}>
            <div style={{ fontWeight: 700, color: 'var(--doc-brand)' }}>LISTA ACQUISTI — DOCUMENTO INTERNO</div>
            <div style={{ color: 'var(--doc-ink-muted)' }}>Via Bernardino Stazio 2 · 3° piano · 6815 Massagno</div>
          </div>
        </div>

        <div style={{ background: 'var(--doc-warn-soft)', borderRadius: '3px', padding: '3px 7px', marginBottom: '5px', fontSize: '7pt', color: 'var(--doc-warn)' }}>■ DOCUMENTO INTERNO — Prezzi indicativi soggetti a variazioni. Verificare disponibilità prima dell&apos;acquisto.</div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px', marginBottom: '7px' }}>
          {[
            { label: 'Totale acquisti se tutto in CH', value: CHF(totalCH), color: 'var(--doc-brand)', bg: 'var(--doc-accent-soft)' },
            { label: 'Totale se ottimizzato con IT', value: CHF(Math.round(totalIT)), color: 'var(--doc-positive)', bg: 'var(--doc-positive-soft)' },
            { label: 'Risparmio totale acquistando IT', value: CHF(Math.round(totalSaving)), color: 'var(--doc-note)', bg: 'var(--doc-note-soft)' },
            { label: 'Voci urgenti (⚠️)', value: urgenti.length + ' articoli', color: 'var(--doc-negative)', bg: 'var(--doc-negative-soft)' },
          ].map((k, i) => (
            <div key={i} style={{ background: k.bg, borderRadius: '4px', padding: '4px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: '6pt', color: 'var(--doc-ink-muted)', marginBottom: '1px' }}>{k.label}</div>
              <div style={{ fontSize: '9pt', fontWeight: 700, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* URGENTI */}
        <div style={{ background: 'var(--doc-negative-soft)', border: '1px solid var(--doc-negative-line)', borderRadius: '4px', padding: '5px 8px', marginBottom: '7px' }}>
          <div style={{ fontWeight: 700, color: 'var(--doc-negative)', fontSize: '8pt', marginBottom: '3px' }}>⚠️ VOCI URGENTI — Ordinare PRIMA di iniziare i lavori</div>
          {urgenti.map((it, i) => (
            <div key={i} style={{ fontSize: '7.5pt', color: 'var(--doc-negative)', paddingLeft: '8px' }}>• {it.name} — {CHF(it.chPrice)}</div>
          ))}
        </div>

        {/* TRIPS */}
        {TRIPS.map((trip, ti) => (
          <div key={trip.id} className={ti > 0 ? 'pb' : ''}>
            <div style={{ background: trip.color, color: 'var(--doc-paper)', padding: '4px 8px', borderRadius: '4px', marginTop: '8px', marginBottom: '3px' }}>
              <div style={{ fontWeight: 700, fontSize: '8.5pt' }}>{trip.label}</div>
              <div style={{ fontSize: '7pt', opacity: 0.85 }}>{trip.store} · {trip.distance}</div>
              <div style={{ fontSize: '7pt', opacity: 0.75 }}>🕐 Quando: {trip.when}</div>
            </div>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={{ ...S.th, width: '28%' }}>Articolo</th>
                  <th style={S.thR}>Qtà</th>
                  <th style={S.thR}>Prezzo CH</th>
                  <th style={{ ...S.th, background: 'var(--doc-positive)', textAlign: 'right' as const }}>Prezzo IT</th>
                  <th style={{ ...S.th, background: 'var(--doc-positive)', textAlign: 'right' as const }}>Risparmio</th>
                  <th style={S.th}>Dove / Link</th>
                  <th style={S.th}>Note</th>
                </tr>
              </thead>
              <tbody>
                {trip.items.map((item, ii) => {
                  const sav = item.itPrice ? item.chPrice - item.itPrice * 1.02 : 0
                  return (
                    <Tr key={ii} odd={ii % 2 === 1} ch={item.urgent}>
                      <td style={{ ...S.td, fontWeight: item.urgent ? 700 : 400, color: item.urgent ? 'var(--doc-negative)' : 'inherit' }}>
                        {item.urgent && '⚠️ '}{item.name}
                      </td>
                      <td style={S.tdR}>{item.qty}</td>
                      <td style={S.tdR}>
                        <a href={item.chLink || '#'} style={{ color: 'var(--doc-brand)', textDecoration: 'underline' }}>{CHF(item.chPrice)}</a>
                      </td>
                      <td style={{ ...S.tdR, color: 'var(--doc-positive)' }}>
                        {item.itPrice ? (
                          <a href={item.itLink || '#'} style={{ color: 'var(--doc-positive)', textDecoration: 'underline' }}>{EUR(item.itPrice)}<br /><span style={{ fontSize: '6.5pt', color: 'var(--doc-ink-subtle)' }}>≈{CHF(Math.round(item.itPrice * 1.02))}</span></a>
                        ) : <span style={{ color: 'var(--doc-ink-subtle)' }}>Solo CH</span>}
                      </td>
                      <td style={{ ...S.tdR, fontWeight: sav > 50 ? 700 : 400, color: sav > 0 ? 'var(--doc-positive)' : 'var(--doc-ink-subtle)' }}>
                        {sav > 0 ? `CHF ${Math.round(sav)}` : '—'}
                      </td>
                      <td style={{ ...S.td, fontSize: '7pt' }}>
                        {item.itWhere || item.chWhere}
                      </td>
                      <td style={{ ...S.td, fontSize: '7pt', color: 'var(--doc-ink-muted)', maxWidth: '60mm' }}>{item.note || '—'}</td>
                    </Tr>
                  )
                })}
                <tr style={{ background: trip.color + '22' }}>
                  <td colSpan={2} style={{ ...S.td, fontWeight: 700 }}>Subtotale {trip.label.split('—')[0].trim()}</td>
                  <td style={{ ...S.tdR, fontWeight: 700 }}>{CHF(trip.items.reduce((s, i) => s + i.chPrice, 0))}</td>
                  <td style={{ ...S.tdR, fontWeight: 700, color: 'var(--doc-positive)' }}>
                    ≈{CHF(Math.round(trip.items.reduce((s, i) => s + (i.itPrice ? i.itPrice * 1.02 : i.chPrice), 0)))}
                  </td>
                  <td style={{ ...S.tdR, fontWeight: 700, color: 'var(--doc-positive)' }}>
                    CHF {Math.round(trip.items.reduce((s, i) => s + (i.itPrice ? i.chPrice - i.itPrice * 1.02 : 0), 0))}
                  </td>
                  <td colSpan={2} style={S.td} />
                </tr>
              </tbody>
            </table>
          </div>
        ))}

        {/* GRAND TOTAL */}
        <div className="pb">
          <div style={S.h1}>Riepilogo Totale Acquisti</div>
          <table style={{ ...S.table, fontSize: '8.5pt' }}>
            <tbody>
              {TRIPS.map((trip, i) => {
                const tCH = trip.items.reduce((s, it) => s + it.chPrice, 0)
                const tIT = Math.round(trip.items.reduce((s, it) => s + (it.itPrice ? it.itPrice * 1.02 : it.chPrice), 0))
                return (
                  <Tr key={i} odd={i % 2 === 1}>
                    <td style={{ ...S.td, width: '50%' }}>{trip.label.split('—').pop()?.trim()}</td>
                    <td style={S.tdR}>{CHF(tCH)}</td>
                    <td style={{ ...S.tdR, color: 'var(--doc-positive)' }}>≈{CHF(tIT)}</td>
                    <td style={{ ...S.tdR, color: 'var(--doc-positive)' }}>CHF {Math.round(tCH - tIT)}</td>
                  </Tr>
                )
              })}
              <tr style={{ background: 'var(--doc-brand)', color: 'var(--doc-paper)' }}>
                <td style={{ padding: '4px 5px', fontWeight: 700 }}>TOTALE MATERIALI DA ACQUISTARE</td>
                <td style={{ padding: '4px 5px', textAlign: 'right', fontWeight: 700 }}>{CHF(totalCH)}</td>
                <td style={{ padding: '4px 5px', textAlign: 'right', fontWeight: 700, color: 'var(--doc-positive-line)' }}>≈{CHF(Math.round(totalIT))}</td>
                <td style={{ padding: '4px 5px', textAlign: 'right', fontWeight: 700, color: 'var(--doc-positive-line)' }}>CHF {Math.round(totalSaving)}</td>
              </tr>
            </tbody>
          </table>
          <div style={{ background: 'var(--doc-brand)', color: 'var(--doc-accent-soft)', borderRadius: '4px', padding: '6px 10px', fontSize: '7.5pt', marginTop: '5px' }}>
            <strong>Nota:</strong> I prezzi in questa lista NON sono già inclusi nel preventivo PRE-2026-013 (il preventivo include già il costo dei materiali al prezzo svizzero). Questa lista serve a Marcos per pianificare gli acquisti ottimali e massimizzare il guadagno acquistando in Italia dove conveniente.
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '6mm', paddingTop: '3mm', borderTop: '1px solid var(--doc-line)', display: 'flex', justifyContent: 'space-between', fontSize: '6.5pt', color: 'var(--doc-ink-subtle)' }}>
          <span>Zanetti Soluzioni Edili · PRE-2026-013 — Lista Acquisti Interna · Prezzi indicativi mag. 2026 · 1€ ≈ CHF 1,02</span>
          <span>Generato il {today}</span>
        </div>
      </div>
    </div>
  )
}
