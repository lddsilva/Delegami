import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PrintButton } from '@/components/ui/print-button'

export const metadata: Metadata = {
  title: 'PRE-2026-013 - Ballestra - Analisi Finanziaria',
}

const S = {
  h1: { fontSize: '12pt', fontWeight: 700, color: 'var(--doc-brand)', marginBottom: '4px', marginTop: '12px', borderBottom: '2px solid var(--doc-brand)', paddingBottom: '2px' } as React.CSSProperties,
  h2: { fontSize: '9.5pt', fontWeight: 700, color: 'var(--doc-ink-strong)', marginTop: '8px', marginBottom: '3px' } as React.CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '8pt', marginBottom: '8px' },
  th: { background: 'var(--doc-brand)', color: 'var(--doc-paper)', padding: '3px 6px', textAlign: 'left' as const, fontWeight: 600, fontSize: '7.5pt' },
  thR: { background: 'var(--doc-brand)', color: 'var(--doc-paper)', padding: '3px 6px', textAlign: 'right' as const, fontWeight: 600, fontSize: '7.5pt' },
  td: { padding: '3px 6px', borderBottom: '1px solid var(--doc-line)', fontSize: '8pt', verticalAlign: 'top' as const },
  tdR: { padding: '3px 6px', borderBottom: '1px solid var(--doc-line)', textAlign: 'right' as const, fontSize: '8pt' },
  note: { fontSize: '7.5pt', color: 'var(--doc-ink-muted)', fontStyle: 'italic' as const },
}

const fmt = (n: number) => n.toLocaleString('de-CH', { minimumFractionDigits: 2 })
const fmtE = (n: number) => '€' + n.toLocaleString('it-IT', { minimumFractionDigits: 0 })
const Tr = ({ odd, children }: { odd?: boolean; children: React.ReactNode }) => (
  <tr style={{ background: odd ? 'var(--doc-fill)' : 'var(--doc-paper)' }}>{children}</tr>
)

// CHF/EUR rate (May 2026 indicative)
const EUR = 0.98 // 1 CHF = 0.98 EUR, or 1 EUR = ~1.04 CHF

const toChf = (eur: number) => eur / EUR
const save = (chf: number, eurIt: number) => chf - toChf(eurIt)

// Italy comparison data: [item, chCHF, itEUR, itStore, itLink, itNote]
const italyItems: Array<{
  item: string
  qty: string
  chPricePer: number
  chTotal: number
  itPricePer: number
  itTotal: number
  store: string
  link: string
  distance: string
  note: string
}> = [
  {
    item: 'Piastrelle gres 60×60 bagno (25 m²)',
    qty: '25 m²',
    chPricePer: 35, chTotal: 875,
    itPricePer: 18, itTotal: 450,
    store: 'Tecnomat Como',
    link: 'https://www.tecnomat.it/am/it/piastrelle-60x60',
    distance: '~35 min',
    note: 'Gres interno basic: €14-22/m². Qualità comparabile a Bauhaus CH art. 28795195.'
  },
  {
    item: 'Piastrelle gres 60×60 corridoio/cucina (30 m²)',
    qty: '30 m²',
    chPricePer: 29.95, chTotal: 899,
    itPricePer: 15, itTotal: 450,
    store: 'Leroy Merlin Como',
    link: 'https://www.leroymerlin.it/prodotti/pavimenti-e-rivestimenti/pavimenti-e-rivestimenti-per-interni/tutti-pavimenti-e-rivestimenti-in-gres-porcellanato/',
    distance: '~30 min',
    note: 'Active Beige o equivalente: LM Italia offre ampia scelta da €12/m². Ordinare in unico lotto per entrambi i bagni per risparmiare spedizione.'
  },
  {
    item: 'WC sospeso rimless × 2 (+ placca, copriwater)',
    qty: '2 pz',
    chPricePer: 550, chTotal: 1100,
    itPricePer: 140, itTotal: 280,
    store: 'Leroy Merlin Como',
    link: 'https://www.leroymerlin.it/prodotti/bagno-e-arredo-bagno/sanitari/vaso-wc/wc-sospeso/',
    distance: '~30 min',
    note: 'Ideal Standard Tirso sospeso: €57.50; con placca e copriwater ~€140/set. Qualità paragonabile. Telaio Duofix rimane da GC Termo-Idraulica.'
  },
  {
    item: 'Bidet sospeso × 1 (bagno esistente)',
    qty: '1 pz',
    chPricePer: 193, chTotal: 193,
    itPricePer: 75, itTotal: 75,
    store: 'Leroy Merlin Como',
    link: 'https://www.leroymerlin.it/prodotti/bagno-e-arredo-bagno/sanitari/bidet/bidet-sospeso/',
    distance: '~30 min',
    note: 'Bidet sospeso basic: €60-90. Equivalente al Duravit D-Code (CHF 193.50 Sanitas Troesch).'
  },
  {
    item: 'Mobile lavabo con cassetti ÄNGSJÖN × 2',
    qty: '2 pz',
    chPricePer: 517, chTotal: 1034,
    itPricePer: 270, itTotal: 540,
    store: 'IKEA Corsico (Milano)',
    link: 'https://www.ikea.com/it/it/cat/mobili-aengsjoen-con-lavabo-700470/',
    distance: '~55 min',
    note: 'ÄNGSJÖN 80cm + lavabo + rubinetteria: cabinetto €199 IT vs CHF 517 CH (include lavabo+rubinetteria). Combinazione completa stimata €270 IT. ⚠️ IKEA same products, different pricing.'
  },
  {
    item: 'Specchio armadietto LETTAN 80cm × 2',
    qty: '2 pz',
    chPricePer: 259, chTotal: 518,
    itPricePer: 210, itTotal: 420,
    store: 'IKEA Corsico (Milano)',
    link: 'https://www.ikea.com/it/it/p/lettan-mobile-a-specchio-con-ante-effetto-specchio-vetro-a-specchio-80534923/',
    distance: '~55 min',
    note: 'IKEA LETTAN art. 80534923 — stesso prodotto. Prezzo IT ~15% inferiore a CH.'
  },
  {
    item: 'Porta interna 80×210 × 3 (fornitura)',
    qty: '3 pz',
    chPricePer: 500, chTotal: 1500,
    itPricePer: 159, itTotal: 477,
    store: 'Tecnomat (Bricoman) Como',
    link: 'https://www.tecnomat.it/it/porta-filo-muro-reversibile-h210-x-l80-10042219/',
    distance: '~35 min',
    note: 'Porta battente/filo muro 210×80: da €109 (grezza) a €180 (laccata). Modello Contract Effebiquattro. Montaggio +CHF 250/pz rimane a carico Marcos.'
  },
  {
    item: 'IKEA elettrodomestici (piano cottura, cappa, frigo, forno)',
    qty: '4 pz',
    chPricePer: 357, chTotal: 1427,
    itPricePer: 315, itTotal: 1260,
    store: 'IKEA Corsico (Milano)',
    link: 'https://www.ikea.com/it/it/cat/elettrodomestici-per-cucine-metod-50382/',
    distance: '~55 min',
    note: 'MATMÄSSIG 300 NERO, LAGAN cappa/frigo, STENABY forno — stessi prodotti IKEA, prezzi IT 10-15% inferiori a CH. Risparmio contenuto, utile se si va già a IKEA per il resto.'
  },
  {
    item: 'Cucina METOD 307cm Veddinge bianco',
    qty: '1 pz',
    chPricePer: 1990, chTotal: 1990,
    itPricePer: 1690, itTotal: 1690,
    store: 'IKEA Corsico (Milano)',
    link: 'https://www.ikea.com/it/it/cat/metod-cucine-moderne-e-tradizionali-ka005/',
    distance: '~55 min',
    note: 'METOD combinazioni IT ~15% meno costose di CH. IKEA Italy offriva €500 sconto con spesa min. €3.500 (promo scaduta 04/05). Combinazione equivalente ME K16 in IT: ~€1.690.'
  },
]

const totalCH = italyItems.reduce((s, r) => s + r.chTotal, 0)
const totalIT = italyItems.reduce((s, r) => s + toChf(r.itTotal), 0)
const totalSaving = totalCH - totalIT

// Labor summary
const totalLabor = 40179
const totalMaterials = 25826
const totalEletrico = 13312

export default function RelatorioFinanziario() {
  const today = new Date().toLocaleDateString('it-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const TOTAL = 79137.85

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:p-0">
      <style>{`
        @media print {
          @page { margin: 10mm 15mm; size: A4; }
          html, body { height: auto !important; overflow: visible !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          table { page-break-inside: auto; border-collapse: collapse; width: 100%; }
          tr { page-break-inside: avoid; }
          thead { display: table-header-group; }
          .pb { page-break-before: always; }
          a { color: var(--doc-accent) !important; text-decoration: underline !important; }
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

      <div className="doc-sheet bg-white max-w-[210mm] mx-auto shadow-lg print:shadow-none" style={{ padding: '10mm 15mm', fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: '8.5pt', color: 'var(--doc-ink)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5mm', paddingBottom: '3mm', borderBottom: '2px solid var(--doc-brand)' }}>
          <div>
            <div style={{ fontSize: '15pt', fontWeight: 700, color: 'var(--doc-brand)' }}>Zanetti Soluzioni Edili</div>
            <div style={{ fontSize: '7.5pt', color: 'var(--doc-ink-muted)', marginTop: '1px' }}>Via Cantonale, 1 · 6983 Magliaso</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '8.5pt', fontWeight: 700, color: 'var(--doc-brand)' }}>ANALISI FINANZIARIA + OPPORTUNITÀ ITALIA</div>
            <div style={{ fontSize: '7.5pt', color: 'var(--doc-ink-muted)' }}>PRE-2026-013 v7 · {today}</div>
          </div>
        </div>

        <div style={{ background: 'var(--doc-warn-soft)', border: '1px solid var(--doc-warn-line)', borderRadius: '3px', padding: '3px 8px', marginBottom: '6px', fontSize: '7.5pt', color: 'var(--doc-warn)' }}>■ DOCUMENTO INTERNO</div>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '5px', marginBottom: '8px' }}>
          {[
            { label: 'Fatturato al cliente', value: `CHF ${fmt(TOTAL)}`, color: 'var(--doc-brand)', bg: 'var(--doc-accent-soft)' },
            { label: 'Guadagno Marcos (MdO)', value: `CHF ${fmt(totalLabor)}`, color: 'var(--doc-positive)', bg: 'var(--doc-positive-soft)' },
            { label: 'Costo materiali (0% mg.)', value: `CHF ${fmt(totalMaterials)}`, color: 'var(--doc-warn)', bg: 'var(--doc-warn-soft)' },
            { label: 'Risparmio max. Italia', value: `CHF ${fmt(Math.round(totalSaving))}`, color: 'var(--doc-note)', bg: 'var(--doc-note-soft)' },
          ].map((k, i) => (
            <div key={i} style={{ background: k.bg, borderRadius: '5px', padding: '5px 7px', textAlign: 'center' }}>
              <div style={{ fontSize: '6.5pt', color: 'var(--doc-ink-muted)', marginBottom: '1px' }}>{k.label}</div>
              <div style={{ fontSize: '10pt', fontWeight: 700, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* 1. GUADAGNO MARCOS */}
        <div style={S.h1}>1 · Guadagno Marcos (Manodopera Diretta)</div>
        <div style={{ background: 'var(--doc-positive-soft)', border: '1px solid var(--doc-positive-line)', borderRadius: '3px', padding: '4px 8px', marginBottom: '5px', fontSize: '8pt' }}>
          Marcos esegue personalmente tutta la manodopera → il prezzo addebitato al cliente = guadagno netto diretto (nessun dipendente, nessun costo del lavoro da dedurre). Stimato da prezzi unitari del preventivo (manodopera separata dai materiali).
        </div>
        <table style={S.table}>
          <tbody>
            {[
              ['Muratura, demolizioni, aperture (struttura)', 11700],
              ['Posa piastrelle bagni + corridoio/cucina', 4000],
              ['Cartongesso: pareti, contropareti, stabilitura', 5895],
              ['Impianto bagni (impermeabilizzazione, accessori, docce)', 4000],
              ['Muratura bagno nuovo completo (pavimento 3 livelli, intonaco)', 4200],
              ['Nuovo corridoio interno + porte', 5200],
              ['Montaggio cucina + elettrodomestici', 1000],
              ['Pittura appartamento + verniciature', 5140],
              ['Varie (backsplash, battiscopa posa)', 1044],
            ].map(([desc, chf], i) => (
              <Tr key={i} odd={i % 2 === 1}>
                <td style={S.td}>{desc}</td>
                <td style={{ ...S.tdR, color: 'var(--doc-positive)', fontWeight: 500 }}>CHF {(chf as number).toLocaleString('de-CH')}</td>
              </Tr>
            ))}
            <tr style={{ background: 'var(--doc-positive-soft)' }}>
              <td style={{ ...S.td, fontWeight: 700 }}>TOTALE GUADAGNO MARCOS</td>
              <td style={{ ...S.tdR, fontWeight: 700, fontSize: '11pt', color: 'var(--doc-positive)' }}>CHF {fmt(totalLabor)}</td>
            </tr>
          </tbody>
        </table>

        {/* 2. ITALY COMPARISON */}
        <div style={S.h1}>2 · Opportunità Italia — Prezzi Reali Confrontati</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px', marginBottom: '6px' }}>
          {[
            { label: 'Leroy Merlin Como', sub: '~30 min da Lugano · Via Varesina, Como', url: 'https://www.leroymerlin.it' },
            { label: 'Tecnomat (ex Bricoman)', sub: '~35 min · Via Belvedere, Como', url: 'https://www.tecnomat.it' },
            { label: 'IKEA Corsico Milano', sub: '~55 min · Via Jesolo 1, Corsico', url: 'https://www.ikea.com/it/it/stores/milano-corsico/' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'var(--doc-accent-soft)', borderRadius: '4px', padding: '5px 8px', fontSize: '7.5pt' }}>
              <div style={{ fontWeight: 700, color: 'var(--doc-brand)' }}>{s.label}</div>
              <div style={{ color: 'var(--doc-ink-muted)' }}>{s.sub}</div>
              <a href={s.url} style={{ color: 'var(--doc-accent)', fontSize: '7pt' }}>{s.url.replace('https://', '')}</a>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--doc-warn-soft)', border: '1px solid var(--doc-warn-line)', borderRadius: '3px', padding: '4px 8px', marginBottom: '5px', fontSize: '7.5pt', color: 'var(--doc-warn)' }}>
          ⚠️ <strong>ATTENZIONE — Materiale elettrico:</strong> le prese italiane (T11/T16) NON sono compatibili con lo standard svizzero (T13). I materiali elettrici (prese, interruttori) DEVONO essere acquistati in Svizzera. Cavi e accessori non-connettore possono venire dall&apos;Italia. Tasso cambio usato: 1€ = CHF 1,02 (mag. 2026).
        </div>

        <table style={S.table}>
          <thead>
            <tr>
              <th style={{ ...S.th, width: '22%' }}>Materiale</th>
              <th style={S.thR}>Qtà</th>
              <th style={S.thR}>Prezzo CH</th>
              <th style={{ ...S.th, textAlign: 'right' as const, background: 'var(--doc-positive)' }}>Prezzo IT</th>
              <th style={{ ...S.th, textAlign: 'right' as const, background: 'var(--doc-positive)' }}>Risparmio</th>
              <th style={S.th}>Dove / Link</th>
            </tr>
          </thead>
          <tbody>
            {italyItems.map((r, i) => {
              const saving = save(r.chTotal, r.itTotal)
              const savePct = Math.round((saving / r.chTotal) * 100)
              return (
                <Tr key={i} odd={i % 2 === 1}>
                  <td style={S.td}>
                    <div style={{ fontWeight: 500 }}>{r.item}</div>
                    <div style={S.note}>{r.note}</div>
                  </td>
                  <td style={S.tdR}>{r.qty}</td>
                  <td style={S.tdR}>CHF {fmt(r.chTotal)}</td>
                  <td style={{ ...S.tdR, color: 'var(--doc-positive)' }}>
                    {fmtE(r.itTotal)}<br />
                    <span style={{ fontSize: '7pt', color: 'var(--doc-ink-subtle)' }}>≈ CHF {fmt(Math.round(toChf(r.itTotal)))}</span>
                  </td>
                  <td style={{ ...S.tdR, color: 'var(--doc-positive)', fontWeight: 700 }}>
                    CHF {fmt(Math.round(saving))}<br />
                    <span style={{ fontSize: '7pt', color: 'var(--doc-ink-subtle)' }}>−{savePct}%</span>
                  </td>
                  <td style={{ ...S.td, fontSize: '7.5pt' }}>
                    <div style={{ fontWeight: 600, color: 'var(--doc-ink-strong)' }}>{r.store}</div>
                    <div style={{ color: 'var(--doc-ink-muted)', fontSize: '7pt' }}>{r.distance}</div>
                    <a href={r.link} style={{ color: 'var(--doc-accent)', fontSize: '7pt', wordBreak: 'break-all' as const }}>{r.link.replace('https://www.', '').split('/')[0]}</a>
                  </td>
                </Tr>
              )
            })}
            <tr style={{ background: 'var(--doc-positive-soft)' }}>
              <td style={{ ...S.td, fontWeight: 700 }} colSpan={2}>TOTALE SE ACQUISTO IN ITALIA</td>
              <td style={{ ...S.tdR, fontWeight: 700 }}>CHF {fmt(totalCH)}</td>
              <td style={{ ...S.tdR, fontWeight: 700, color: 'var(--doc-positive)' }}>≈ CHF {fmt(Math.round(totalIT))}</td>
              <td style={{ ...S.tdR, fontWeight: 700, fontSize: '11pt', color: 'var(--doc-positive)' }}>CHF {fmt(Math.round(totalSaving))}</td>
              <td style={{ ...S.td, fontSize: '7.5pt', color: 'var(--doc-positive)' }}>= guadagno extra Marcos</td>
            </tr>
          </tbody>
        </table>

        {/* 3. SINTESI */}
        <div className="pb" style={S.h1}>3 · Sintesi Finanziaria — Guadagno Totale Possibile</div>
        <table style={{ ...S.table, fontSize: '9pt' }}>
          <tbody>
            <Tr><td style={{ ...S.td, width: '60%' }}>Totale fatturato a Ballestra</td><td style={{ ...S.tdR, fontWeight: 700, fontSize: '11pt', color: 'var(--doc-brand)' }}>CHF {fmt(TOTAL)}</td></Tr>
            <Tr odd><td style={S.td}>− Costo materiali (acquisto Svizzera)</td><td style={{ ...S.tdR, color: 'var(--doc-negative)' }}>− CHF {fmt(totalMaterials)}</td></Tr>
            <Tr><td style={S.td}>− Costo impianto elettrico (elettricista esterno)</td><td style={{ ...S.tdR, color: 'var(--doc-negative)' }}>− CHF {fmt(totalEletrico)}</td></Tr>
            <tr style={{ background: 'var(--doc-positive-soft)' }}>
              <td style={{ ...S.td, fontWeight: 700, fontSize: '10pt' }}>= Guadagno base Marcos (manodopera)</td>
              <td style={{ ...S.tdR, fontWeight: 700, fontSize: '13pt', color: 'var(--doc-positive)' }}>CHF {fmt(totalLabor)}</td>
            </tr>
            <tr style={{ background: 'var(--doc-positive-soft)' }}>
              <td style={{ ...S.td, color: 'var(--doc-positive)' }}>+ Acquistando materiali in Italia (risparmio extra)</td>
              <td style={{ ...S.tdR, color: 'var(--doc-positive)', fontWeight: 600 }}>+ CHF {fmt(Math.round(totalSaving))}</td>
            </tr>
            <tr style={{ background: 'var(--doc-note-soft)' }}>
              <td style={{ ...S.td, color: 'var(--doc-note)' }}>+ Se Marcos supervisiona lavoro elettrico fisico</td>
              <td style={{ ...S.tdR, color: 'var(--doc-note)', fontWeight: 600 }}>+ CHF 5.000–6.000</td>
            </tr>
            <tr style={{ background: 'var(--doc-brand)', color: 'var(--doc-paper)' }}>
              <td style={{ padding: '5px 6px', fontWeight: 700, fontSize: '11pt' }}>Guadagno massimo realizzabile</td>
              <td style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 700, fontSize: '14pt' }}>
                CHF {fmt(Math.round(totalLabor + totalSaving + 5500))}
              </td>
            </tr>
          </tbody>
        </table>

        {/* 4. LOGISTICS */}
        <div style={S.h1}>4 · Logistica — Come Organizzare l&apos;Acquisto in Italia</div>
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Negozio</th><th style={S.th}>Da comprare</th>
            <th style={S.thR}>Risparmio IT</th><th style={S.th}>Quando</th>
          </tr></thead>
          <tbody>
            {[
              ['Leroy Merlin Como (~30 min)', 'Piastrelle bagno 25m² + corridoio 30m² + bidet', `CHF ${Math.round(save(875,450)+save(899,450)+save(193,75))}`, 'Prima di iniziare fase bagni (Fase 2)'],
              ['Tecnomat Como (~35 min)', 'Porte × 3 (filo muro 210×80)', `CHF ${Math.round(save(1500,477))}`, 'Prima di Fase 3 (corridoio interno)'],
              ['IKEA Corsico Milano (~55 min)', 'WC × 2, mobile lavabo × 2, specchi × 2, cucina METOD, elettrodomestici', `CHF ${Math.round(save(1100,280)+save(1034,540)+save(518,420)+save(1990,1690)+save(1427,1260))}`, 'Unico viaggio — prima di iniziare. Prenotare con IKEA planner.'],
            ].map(([store, buy, saving, when], i) => (
              <Tr key={i} odd={i % 2 === 1}>
                <td style={{ ...S.td, fontWeight: 600 }}>{store}</td>
                <td style={S.td}>{buy}</td>
                <td style={{ ...S.tdR, color: 'var(--doc-positive)', fontWeight: 700 }}>{saving}</td>
                <td style={{ ...S.td, fontSize: '7.5pt', color: 'var(--doc-ink-muted)' }}>{when}</td>
              </Tr>
            ))}
          </tbody>
        </table>
        <div style={{ background: 'var(--doc-accent-soft)', border: '1px solid var(--doc-line-strong)', borderRadius: '3px', padding: '5px 8px', fontSize: '7.5pt', color: 'var(--doc-brand)' }}>
          <strong>Stima costi logistica Italia:</strong> 2-3 viaggi in auto (~90 km andata/ritorno): gasolio ~CHF 25-40/viaggio + eventuale noleggio furgone per materiali pesanti CHF 80-120/giorno. Totale logistica: ~CHF 200-300. Ampiamente coperto dal risparmio di CHF {fmt(Math.round(totalSaving))}.
        </div>

        {/* 5. DOGANALE */}
        <div className="pb" style={S.h1}>5 · Questione Doganale — Come Importare i Materiali dall&apos;Italia</div>

        <div style={{ background: 'var(--doc-accent-soft)', border: '1px solid var(--doc-line-strong)', borderRadius: '3px', padding: '5px 8px', marginBottom: '6px', fontSize: '8pt', color: 'var(--doc-brand)' }}>
          <strong>Contesto:</strong> acquistando ~€4.400 di materiali in Italia (valore stimato), il trattamento doganale dipende da come si dichiara la merce alla frontiera svizzera. Ci sono due scenari principali con impatti finanziari diversi. La dogana principale di riferimento è <strong>Chiasso</strong> (A2, uscita Como Centro) o <strong>Ponte Tresa</strong>, entrambe a ~25-35 min da Lugano.
        </div>

        {/* Scenario A */}
        <div style={{ ...S.h2, color: 'var(--doc-brand)', background: 'var(--doc-accent-soft)', padding: '3px 8px', borderRadius: '3px' }}>
          SCENARIO A — Importazione come uso privato (persona fisica)
        </div>
        <p style={{ fontSize: '8pt', lineHeight: 1.6, marginBottom: '6px' }}>
          Marcos si reca in Italia come privato cittadino. Acquista i materiali a nome proprio, paga il prezzo italiano (IVA italiana inclusa), richiede il rimborso IVA italiana, e dichiara la merce alla dogana svizzera pagando la MWST svizzera.
        </p>

        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Fase</th><th style={S.th}>Cosa fare</th>
            <th style={{ ...S.thR, width: '90px' }}>Costo/Rimborso</th>
          </tr></thead>
          <tbody>
            <Tr>
              <td style={{ ...S.td, fontWeight: 600 }}>1. Acquisto in Italia (con IVA)</td>
              <td style={S.td}>Paghi il prezzo esposto in negozio — include IVA italiana 22% (10% su alcuni materiali edili). Esempio: €4.400 sticker include ~€720 di IVA.</td>
              <td style={{ ...S.tdR, color: 'var(--doc-warn)' }}>€4.400 pagati</td>
            </Tr>
            <Tr odd>
              <td style={{ ...S.td, fontWeight: 600 }}>2. Richiedi rimborso IVA italiana (Tax-Free)</td>
              <td style={S.td}>
                Chiedi il modulo Tax-Free in negozio (solo per acquisti &gt;€155 in un singolo negozio nella stessa giornata). Fai timbrare il modulo alla dogana italiana PRIMA di entrare in Svizzera. Rimborso tramite Global Blue o Planet: ~18% del prezzo (IVA 22/122), meno ~3-5% commissione = netto ~14-15%.
                <br /><strong>⚠️ IKEA non partecipa al Tax-Free.</strong> Leroy Merlin e Tecnomat: sì, ma verificare in cassa.
              </td>
              <td style={{ ...S.tdR, color: 'var(--doc-positive)', fontWeight: 600 }}>−€550 circa<br /><span style={{ fontSize: '7pt' }}>(su €3.650 taxable)</span></td>
            </Tr>
            <Tr>
              <td style={{ ...S.td, fontWeight: 600 }}>3. Dichiarazione alla dogana svizzera</td>
              <td style={S.td}>
                Obbligo di dichiarazione se il valore supera <strong>CHF 300 per persona per giorno</strong>. Con acquisti di questa entità si supera sempre la soglia. Devi compilare il modulo doganale e pagare la MWST svizzera.
                <br />Tariffa doganale (dazio): <strong>0%</strong> per quasi tutti i prodotti industriali/edili (accordi bilaterali CH-UE).
                <br />MWST svizzera: <strong>8.1%</strong> sul valore dichiarato (al netto dell&apos;IVA italiana).
              </td>
              <td style={{ ...S.tdR, color: 'var(--doc-negative)' }}>+CHF 298<br /><span style={{ fontSize: '7pt' }}>(8.1% su ~€3.674 ≈ CHF 3.678)</span></td>
            </Tr>
            <Tr odd>
              <td style={{ ...S.td, fontWeight: 600 }}>4. Rimborso IVA IT ricevuto</td>
              <td style={S.td}>Il rimborso arriva entro 1-3 settimane tramite bonifico o carta (Global Blue). Per importi grandi: possibile rimborso immediato allo sportello Global Blue di Chiasso o Lugano.</td>
              <td style={{ ...S.tdR, color: 'var(--doc-positive)' }}>−€550 ricevuti</td>
            </Tr>
          </tbody>
        </table>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
          <div style={{ background: 'var(--doc-positive-soft)', border: '1px solid var(--doc-positive-line)', borderRadius: '4px', padding: '6px 8px', fontSize: '8pt' }}>
            <div style={{ fontWeight: 700, color: 'var(--doc-positive)', marginBottom: '3px' }}>RIEPILOGO SCENARIO A (su €4.400 acquistati)</div>
            <table style={{ width: '100%', fontSize: '8pt' }}>
              <tbody>
                {[
                  ['Pagato in Italia', '€4.400'],
                  ['IVA italiana rimborsata (netto)', '−€550'],
                  ['MWST svizzera pagata alla dogana', '+CHF 298'],
                  ['Costo netto effettivo', '~CHF 4.158'],
                  ['vs acquisto in Svizzera', 'CHF 7.286'],
                  ['RISPARMIO NETTO FINALE', 'CHF 3.128'],
                ].map(([k, v], i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--doc-positive-line)' }}>
                    <td style={{ padding: '2px 0', color: 'var(--doc-ink-strong)' }}>{k}</td>
                    <td style={{ padding: '2px 0', textAlign: 'right', fontWeight: i === 5 ? 700 : 400, color: i === 5 ? 'var(--doc-positive)' : i === 3 ? 'var(--doc-brand)' : 'var(--doc-ink-strong)' }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background: 'var(--doc-warn-soft)', border: '1px solid var(--doc-warn-line)', borderRadius: '4px', padding: '6px 8px', fontSize: '8pt' }}>
            <div style={{ fontWeight: 700, color: 'var(--doc-warn)', marginBottom: '3px' }}>RISCHI E ATTENZIONI</div>
            <ul style={{ paddingLeft: '12px', margin: 0, lineHeight: 1.7 }}>
              <li>Dichiarare merce commerciale come &quot;personale&quot; è illecito — rischio di sanzioni</li>
              <li>La dogana può chiedere spiegazioni se la quantità è incongruente con uso personale (es. 55m² di piastrelle)</li>
              <li>IKEA non offre Tax-Free: si paga IVA IT senza rimborso</li>
              <li>Acquistare in più viaggi separati (legittimo) riduce i singoli importi dichiarati</li>
              <li>Conservare tutte le ricevute</li>
            </ul>
          </div>
        </div>

        {/* Scenario B */}
        <div style={{ ...S.h2, color: 'var(--doc-brand)', background: 'var(--doc-note-soft)', padding: '3px 8px', borderRadius: '3px' }}>
          SCENARIO B — Importazione commerciale (ditta / uso professionale)
        </div>
        <p style={{ fontSize: '8pt', lineHeight: 1.6, marginBottom: '6px' }}>
          Zanetti Soluzioni Edili importa i materiali come impresa svizzera, per uso commerciale in un cantiere. Processo più regolamentato ma anche più trasparente legalmente.
        </p>
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Fase</th><th style={S.th}>Cosa fare</th>
            <th style={{ ...S.thR, width: '90px' }}>Costo</th>
          </tr></thead>
          <tbody>
            <Tr>
              <td style={{ ...S.td, fontWeight: 600 }}>1. Acquisto con fattura commerciale</td>
              <td style={S.td}>
                Richiedere fattura a nome <strong>Zanetti Soluzioni Edili</strong> con indirizzo CH. I negozi retail (LM, IKEA) emettono scontrino/fattura semplificata — non permettono acquisti B2B tax-exempt al banco. Paghi comunque IVA italiana 22%.
                <br /><strong>Alternativa:</strong> rivenditori edili all&apos;ingrosso (es. Edilgroup CH Manno ha corrispondenti IT) possono emettere fattura con IVA a 0% per esportazione. Richiede account commerciale.
              </td>
              <td style={{ ...S.tdR, color: 'var(--doc-warn)' }}>€4.400 (con IVA)</td>
            </Tr>
            <Tr odd>
              <td style={{ ...S.td, fontWeight: 600 }}>2. Rimborso IVA italiana (via modello TD01)</td>
              <td style={S.td}>
                Per le fatture con IVA italiana: presentare istanza di rimborso IVA all&apos;Agenzia delle Entrate italiana tramite modello IT/ES (per soggetti non-UE). Processo lungo: <strong>6-18 mesi</strong>, praticamente non conveniente per importi piccoli. In alternativa: se si acquista da grossisti che emettono fattura UE, il prezzo è già ex-IVA.
              </td>
              <td style={{ ...S.tdR, color: 'var(--doc-ink-muted)' }}>Rimborso in 6-18 mesi</td>
            </Tr>
            <Tr>
              <td style={{ ...S.td, fontWeight: 600 }}>3. Dichiarazione commerciale alla dogana CH</td>
              <td style={S.td}>
                Compilare <strong>dichiarazione doganale professionale</strong> (modulo e-dec o procedura semplificata per piccole imprese). Presentare fattura commerciale del fornitore IT.
                <br />Tariffa doganale (dazio): <strong>0%</strong> (accordi bilaterali CH-UE per prodotti industriali).
                <br />MWST svizzera: <strong>8.1%</strong> sul valore di fattura.
                <br />Se Zanetti è registrato MWST: recupera l&apos;8.1% nella dichiarazione IVA trimestrale.
                <br />Se <em>non</em> registrato (sotto CHF 100k): MWST è costo diretto non recuperabile.
              </td>
              <td style={{ ...S.tdR, color: 'var(--doc-negative)' }}>+CHF 298<br /><span style={{ fontSize: '7pt' }}>non recuperabile se non reg. MWST</span></td>
            </Tr>
          </tbody>
        </table>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
          <div style={{ background: 'var(--doc-note-soft)', border: '1px solid var(--doc-note)', borderRadius: '4px', padding: '6px 8px', fontSize: '8pt' }}>
            <div style={{ fontWeight: 700, color: 'var(--doc-note)', marginBottom: '3px' }}>RIEPILOGO SCENARIO B (su €4.400)</div>
            <table style={{ width: '100%', fontSize: '8pt' }}>
              <tbody>
                {[
                  ['Pagato in Italia', '€4.400'],
                  ['IVA italiana (non recuperata in tempi utili)', '€720 inclusa'],
                  ['MWST svizzera (non recuperabile, no reg.)', '+CHF 298'],
                  ['Costo netto effettivo', '~CHF 4.786'],
                  ['vs acquisto in Svizzera', 'CHF 7.286'],
                  ['RISPARMIO NETTO', 'CHF 2.500'],
                ].map(([k, v], i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--doc-note-soft)' }}>
                    <td style={{ padding: '2px 0', color: 'var(--doc-ink-strong)' }}>{k}</td>
                    <td style={{ padding: '2px 0', textAlign: 'right', fontWeight: i === 5 ? 700 : 400, color: i === 5 ? 'var(--doc-note)' : 'var(--doc-ink-strong)' }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background: 'var(--doc-positive-soft)', border: '1px solid var(--doc-positive-line)', borderRadius: '4px', padding: '6px 8px', fontSize: '8pt' }}>
            <div style={{ fontWeight: 700, color: 'var(--doc-positive)', marginBottom: '3px' }}>VANTAGGI SCENARIO B</div>
            <ul style={{ paddingLeft: '12px', margin: 0, lineHeight: 1.7 }}>
              <li><strong>Legalmente trasparente</strong> — nessun rischio di contestazione doganale</li>
              <li>Fattura deducibile come costo d&apos;impresa</li>
              <li>Se Zanetti si registra MWST: recupera CHF 298 → risparmio netto = CHF 2.798 (uguale Scenario A)</li>
              <li>Tracciabilità completa per eventuali garanzie prodotti</li>
              <li>Possibile accesso a prezzi grossisti IT (pre-accordo con fornitore)</li>
            </ul>
          </div>
        </div>

        {/* Comparison */}
        <div style={S.h2}>Confronto tra i due scenari</div>
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Aspetto</th>
            <th style={{ ...S.th, background: 'var(--doc-accent)' }}>Scenario A — Privato</th>
            <th style={{ ...S.th, background: 'var(--doc-note)' }}>Scenario B — Commerciale</th>
          </tr></thead>
          <tbody>
            {[
              ['Risparmio netto finale', 'CHF 3.128 ✓', 'CHF 2.500 (senza reg. MWST) / CHF 2.798 (con reg.)'],
              ['Rimborso IVA italiana', 'Sì, in 1-3 settimane (Global Blue)', 'Sì, ma in 6-18 mesi (non pratico)'],
              ['Rischio legale/doganale', 'Medio (se quantità incongruenti con uso personale)', 'Basso — tutto documentato'],
              ['Burocrazia', 'Semplice (modulo Tax-Free)', 'Media (dichiarazione commerciale, fattura)'],
              ['MWST svizzera recuperabile?', 'No', 'Sì, se registrati MWST'],
              ['Consigliato per questo caso', '✓ Per IKEA (no Tax-Free) e piccoli acquisti', '✓ Per acquisti da grossisti/rivenditori edili IT'],
            ].map(([asp, a, b], i) => (
              <Tr key={i} odd={i % 2 === 1}>
                <td style={{ ...S.td, fontWeight: 600 }}>{asp}</td>
                <td style={{ ...S.td, color: 'var(--doc-brand)' }}>{a}</td>
                <td style={{ ...S.td, color: 'var(--doc-note)' }}>{b}</td>
              </Tr>
            ))}
          </tbody>
        </table>

        <div style={{ background: 'var(--doc-brand)', color: 'var(--doc-accent-soft)', borderRadius: '4px', padding: '7px 10px', fontSize: '8pt', marginTop: '4px' }}>
          <strong>Raccomandazione pratica:</strong> per questo progetto, la soluzione ottimale è <strong>ibrida</strong>:
          <ul style={{ paddingLeft: '14px', margin: '4px 0 0', lineHeight: 1.8 }}>
            <li>Leroy Merlin + Tecnomat: <strong>Scenario A</strong> (privato, richiedere Tax-Free) — per piastrelle e porte, dove il risparmio è massimo e la quantità non è sospetta per uso privato</li>
            <li>IKEA: <strong>nessun Tax-Free disponibile</strong> — paghi IVA IT senza rimborso, ma il prezzo IT è già molto inferiore a CH</li>
            <li>Materiali edili sfusi (cartongesso, isolanti): valutare rivenditore italiano con fattura commerciale (Scenario B) per avere prezzi all&apos;ingrosso e fattura deducibile</li>
            <li>Conserva TUTTE le ricevute e dichiara onestamente alla dogana — la differenza tra pagare e non pagare la MWST svizzera (CHF 298) non vale il rischio legale</li>
          </ul>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '8mm', paddingTop: '3mm', borderTop: '1px solid var(--doc-line)', display: 'flex', justifyContent: 'space-between', fontSize: '7pt', color: 'var(--doc-ink-subtle)' }}>
          <span>Zanetti Soluzioni Edili · PRE-2026-013 — Analisi Finanziaria Interna · Tassi cambio indicativi mag. 2026</span>
          <span>Generato il {today}</span>
        </div>
      </div>
    </div>
  )
}
