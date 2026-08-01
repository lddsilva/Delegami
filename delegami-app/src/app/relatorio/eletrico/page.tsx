import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PrintButton } from '@/components/ui/print-button'

export const metadata: Metadata = {
  title: 'PRE-2026-013 - Ballestra - Impianto Elettrico',
}

const S = {
  h1: { fontSize: '14pt', fontWeight: 700, color: 'var(--doc-brand)', marginBottom: '6px', marginTop: '14px', borderBottom: '1px solid var(--doc-brand)', paddingBottom: '3px' } as React.CSSProperties,
  h2: { fontSize: '10pt', fontWeight: 700, color: 'var(--doc-brand)', marginTop: '10px', marginBottom: '4px' } as React.CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '8.5pt', marginBottom: '10px' },
  th: { background: 'var(--doc-brand)', color: 'var(--doc-paper)', padding: '4px 6px', textAlign: 'left' as const, fontWeight: 600, fontSize: '8pt' },
  thR: { background: 'var(--doc-brand)', color: 'var(--doc-paper)', padding: '4px 6px', textAlign: 'right' as const, fontWeight: 600, fontSize: '8pt' },
  td: { padding: '3px 6px', borderBottom: '1px solid var(--doc-line)', verticalAlign: 'top' as const },
  tdR: { padding: '3px 6px', borderBottom: '1px solid var(--doc-line)', textAlign: 'right' as const, verticalAlign: 'top' as const },
  tdB: { padding: '3px 6px', borderBottom: '1px solid var(--doc-line)', fontWeight: 600 },
  warn: { background: 'var(--doc-warn-soft)', border: '1px solid var(--doc-warn-line)', borderRadius: '4px', padding: '4px 10px', fontSize: '8pt', color: 'var(--doc-warn)', marginBottom: '8px' } as React.CSSProperties,
  info: { background: 'var(--doc-accent-soft)', border: '1px solid var(--doc-accent)', borderRadius: '4px', padding: '6px 10px', fontSize: '8pt', color: 'var(--doc-brand)', marginBottom: '8px' } as React.CSSProperties,
  note: { background: 'var(--doc-fill)', border: '1px solid var(--doc-line-strong)', borderRadius: '4px', padding: '4px 8px', fontSize: '7.5pt', color: 'var(--doc-ink-strong)', marginTop: '4px' } as React.CSSProperties,
  excl: { background: 'var(--doc-negative-soft)', border: '1px solid var(--doc-negative-line)', borderRadius: '4px', padding: '4px 8px', fontSize: '8pt', color: 'var(--doc-negative)', marginBottom: '4px' } as React.CSSProperties,
  mono: { fontFamily: 'monospace', background: 'var(--doc-fill)', padding: '2px 4px', borderRadius: '2px', fontSize: '8pt' } as React.CSSProperties,
}

const Tr = ({ odd, children }: { odd?: boolean; children: React.ReactNode }) => (
  <tr style={{ background: odd ? 'var(--doc-fill)' : 'var(--doc-paper)' }}>{children}</tr>
)

export default function RelatorioEletrico() {
  const today = new Date().toLocaleDateString('it-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:p-0 print:min-h-0">
      <style>{`
        @media print {
          @page { margin: 15mm 20mm; size: A4; }
          html, body { height: auto !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .pdf-outer { padding: 0 !important; min-height: auto !important; background: white !important; }
          .pdf-doc { max-width: none !important; padding: 0 !important; margin: 0 !important; box-shadow: none !important; overflow: visible !important; }
          table { page-break-inside: auto; border-collapse: collapse; width: 100%; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          .no-print { display: none !important; }
          .pb { page-break-before: always; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print max-w-[210mm] mx-auto mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/relatori" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Relatori
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/quotes/cmobzgzsh0003y0ukbly36k3q" className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
            PRE-2026-013
          </Link>
          <span className="text-gray-300">·</span>
          <Link href="/projects/cmobzgzlk0001y0ukb3hkjyih" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Ristrutturazione Appartamento
          </Link>
        </div>
        <PrintButton />
      </div>

      {/* Document */}
      <div
        className="pdf-doc doc-sheet bg-white max-w-[210mm] mx-auto shadow-lg print:shadow-none"
        style={{ padding: '15mm 20mm', fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: '9pt', color: 'var(--doc-ink)' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8mm', paddingBottom: '5mm', borderBottom: '2px solid var(--doc-brand)' }}>
          <div>
            <div style={{ fontSize: '17pt', fontWeight: 700, color: 'var(--doc-brand)' }}>Zanetti Soluzioni Edili</div>
            <div style={{ fontSize: '8pt', color: 'var(--doc-ink-muted)', marginTop: '3px', lineHeight: 1.5 }}>
              Via Cantonale, 1 · 6983 Magliaso<br />
              Tel: +41 76 545 40 07 · zanettisoluzioniedili@gmail.com
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '9pt', fontWeight: 700, color: 'var(--doc-brand)' }}>ANALISI TECNICA INTERNA</div>
            <div style={{ fontSize: '8pt', color: 'var(--doc-ink-muted)', marginTop: '2px', lineHeight: 1.5 }}>
              Rif. preventivo: <strong>PRE-2026-013 v3</strong><br />
              Data: {today}
            </div>
          </div>
        </div>

        <div style={S.warn}>■ DOCUMENTO INTERNO — Non condividere con il cliente. Contiene dettagli tecnici di progettazione.</div>

        <div style={{ background: 'var(--doc-accent-soft)', borderRadius: '4px', padding: '6px 10px', marginBottom: '10px', fontSize: '8.5pt' }}>
          <strong>Oggetto:</strong> Impianto Elettrico — Ristrutturazione Appartamento<br />
          <strong>Indirizzo opera:</strong> Via Bernardino Stazio 2, 3° piano, 6815 Massagno<br />
          <strong>Cliente:</strong> Comunione eredi fu Alda Martini · c/o Dr. Aldo Ballestra · Rif. PRE-2026-013 v7<br />
          <strong>Locali:</strong> Cucina · Soggiorno · Corridoio d&apos;ingresso · 3 Camere · Nuovo Corridoio Interno · Stanza padronale · 2 Bagni
        </div>

        {/* ── 1. CALCOLO POTENZA ── */}
        <div style={S.h1}>1 · Calcolo Potenza di Ingresso</div>

        <div style={S.h2}>1.1 Carichi installati</div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Apparecchio</th>
              <th style={S.th}>Modello</th>
              <th style={S.thR}>Potenza (W)</th>
              <th style={S.th}>Note</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Piano cottura induzione', 'IKEA MATMÄSSIG 300 NERO', '7.200', '4 zone: 2×1.800W + 2.300W + 1.400W'],
              ['Forno ventilato', 'IKEA STENABY', '2.200', 'Ciclo termostático (~50% duty cycle)'],
              ['Lavastoviglie', 'Da incasso (TBD)', '2.000', 'Solo durante ciclo di riscaldamento'],
              ['Lavatrice', 'Standard domestica', '2.200', 'Solo durante ciclo di riscaldamento'],
              ['Boiler', 'Esistente', '2.000', 'Ciclo termostático (~30% duty cycle)'],
              ['Frigorifero', 'IKEA LAGAN 262L', '150', 'Compressore in marcia'],
              ['Cappa aspirante', 'IKEA LAGAN 60cm', '65', 'Motore semplice'],
              ['Illuminazione totale', 'LED, tutti i locali', '400', '~20 punti luce × 20W medio'],
              ['Prese in uso simultaneo', 'TV, laptop, caricatori', '1.500', 'Stima uso residenziale tipico'],
            ].map(([app, mod, w, note], i) => (
              <Tr key={i} odd={i % 2 === 1}>
                <td style={S.td}>{app}</td>
                <td style={S.td}><span style={S.mono}>{mod}</span></td>
                <td style={S.tdR}>{w}</td>
                <td style={S.td}>{note}</td>
              </Tr>
            ))}
            <tr style={{ background: 'var(--doc-accent-soft)' }}>
              <td style={S.tdB} colSpan={2}><strong>Totale carico installato</strong></td>
              <td style={{ ...S.tdR, fontWeight: 700 }}>17.715</td>
              <td style={S.td}>—</td>
            </tr>
          </tbody>
        </table>

        <div style={S.h2}>1.2 Demanda di picco (fattori di contemporaneità)</div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Apparecchio</th>
              <th style={S.thR}>Potenza (W)</th>
              <th style={S.thR}>Fattore</th>
              <th style={S.thR}>Demanda eff. (W)</th>
              <th style={S.th}>Giustificazione</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Piano cottura', '7.200', '0,70', '5.040', 'Raramente 4 zone al max simultaneamente'],
              ['Forno', '2.200', '0,50', '1.100', 'Ciclo termostático — non continuo'],
              ['Lavastoviglie', '2.000', '0,50', '1.000', 'Solo fase riscaldamento dell\'acqua'],
              ['Boiler', '2.000', '0,30', '600', 'Termostato — 30% del tempo acceso'],
              ['Lavatrice', '2.200', '0,30', '660', 'Ciclo riscaldamento ~30% del programma'],
              ['Frigorifero', '150', '1,00', '150', 'Sempre in marcia'],
              ['Cappa', '65', '0,80', '52', 'In uso durante cottura'],
              ['Illuminazione', '400', '0,80', '320', 'Non tutti i locali accesi insieme'],
              ['Prese varie', '1.500', '0,50', '750', 'Uso non simultaneo'],
            ].map(([app, p, f, d, note], i) => (
              <Tr key={i} odd={i % 2 === 1}>
                <td style={S.td}>{app}</td>
                <td style={S.tdR}>{p}</td>
                <td style={S.tdR}>{f}</td>
                <td style={S.tdR}>{d}</td>
                <td style={S.td}>{note}</td>
              </Tr>
            ))}
            <tr style={{ background: 'var(--doc-accent-soft)' }}>
              <td style={S.tdB} colSpan={3}><strong>Demanda di picco totale</strong></td>
              <td style={{ ...S.tdR, fontWeight: 700, fontSize: '10pt' }}>9.672</td>
              <td style={S.td}><strong>≈ 9,7 kW</strong></td>
            </tr>
          </tbody>
        </table>

        <div style={S.h2}>1.3 Corrente di picco e dimensionamento ingresso</div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Configurazione</th>
              <th style={S.th}>Formula</th>
              <th style={S.thR}>Corrente picco</th>
              <th style={S.th}>Disjuntor min.</th>
              <th style={S.th}>Giudizio</th>
            </tr>
          </thead>
          <tbody>
            <Tr>
              <td style={S.td}>Monofásico 230V</td>
              <td style={S.td}>9.700 ÷ 230</td>
              <td style={S.tdR}><strong>42,2 A</strong></td>
              <td style={S.td}>≥ 40A</td>
              <td style={{ ...S.td, color: 'var(--doc-negative)' }}>⚠ Richiede upgrade se attuale &lt;40A</td>
            </Tr>
            <Tr odd>
              <td style={S.td}>Trifásico 400V</td>
              <td style={S.td}>9.700 ÷ (400 × √3)</td>
              <td style={S.tdR}><strong>14,0 A/fase</strong></td>
              <td style={S.td}>3×16A</td>
              <td style={{ ...S.td, color: 'var(--doc-positive)' }}>✓ Soluzione ottimale</td>
            </Tr>
            <Tr>
              <td style={{ ...S.td, fontWeight: 600 }}>Solo piano cottura (230V)</td>
              <td style={S.td}>7.200 ÷ 230</td>
              <td style={{ ...S.tdR, fontWeight: 700, color: 'var(--doc-negative)' }}>31,3 A</td>
              <td style={S.td}>32A dedicata</td>
              <td style={{ ...S.td, color: 'var(--doc-negative)' }}>Linea dedicata obbligatoria 5G6mm²</td>
            </Tr>
          </tbody>
        </table>

        <div style={S.warn}>
          ⚠ <strong>Azione richiesta prima dell&apos;inizio lavori:</strong> verificare con il distributore locale (AIM Lugano / AEM o gestore Massagno) la potenza contrattuale disponibile nel quadro contatore dell&apos;appartamento. Se la protezione esistente è &lt;40A monofásico o assente trifásico, richiedere upgrade. Costo stimato CHF 200–500, <em>non incluso nel preventivo</em>.
        </div>

        {/* ── 2. LAYOUT QUADRO ── */}
        <div style={S.h1}>2 · Layout Quadro di Distribuzione</div>
        <div style={S.warn}>
          ⚠️ <strong>Quadro interno da installare:</strong> attualmente l&apos;appartamento ha solo il contatore fuori dall&apos;appartamento. È necessario installare un <strong>nuovo quadro di distribuzione interno</strong> all&apos;appartamento (Hager VOLTA 48 moduli). Questo è già incluso nel preventivo (CHF 1.200 — quadro + MCBs + RCDs + posa).
        </div>
        <div style={{ ...S.info }}>
          <strong>Apparecchio:</strong> Hager VOLTA VA48A — 48 moduli DIN, IP30, superficie, bianco.<br />
          <strong>Fornitore:</strong> <a href="https://www.elettromercato.ch/it/prodotti/id/20334/quadro-hager-4-file-volta-ap-bianco" style={{ color: 'var(--doc-accent)' }}>Elettromercato Bronz, Ticino — CHF 172.95 (art. 20334)</a><br />
          <strong>Totale circuiti: 23 attivi + 14 moduli di riserva</strong>
        </div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Posizione</th>
              <th style={S.th}>Dispositivo</th>
              <th style={S.thR}>Moduli</th>
              <th style={S.th}>Calibro</th>
              <th style={S.th}>Zona protetta</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['1–2', 'Interruttore generale 2P', '2', '40A', 'Ingresso generale appartamento'],
              ['3–4', 'Differenziale 2P/30mA tipo A', '2', '25A', 'Zona illuminazione (tutti i locali)'],
              ['5–6', 'Differenziale 2P/30mA tipo A', '2', '25A', 'Zona prese standard'],
              ['7–8', 'Differenziale 2P/30mA tipo A', '2', '25A', 'Zona cucina (prese + dedicati)'],
              ['9–10', 'Differenziale 2P/30mA tipo A', '2', '25A', 'Zona bagni (IP44 — tipo A obbligatorio NIN 2020)'],
              ['11–18', 'MCB 1P × 8 (luce C1÷C8)', '8', '10A', '8 circuiti illuminazione'],
              ['19–28', 'MCB 1P × 10 (prese P1÷P10)', '10', '16A', '10 circuiti prese standard'],
              ['29–30', 'MCB 1P (piano cottura)', '2', '32A', 'Linea dedicata 5G6mm²'],
              ['31', 'MCB 1P (forno)', '1', '16A', 'Linea dedicata 3×2,5mm²'],
              ['32', 'MCB 1P (lavastoviglie)', '1', '16A', 'Linea dedicata 3×2,5mm²'],
              ['33', 'MCB 1P (lavatrice)', '1', '16A', 'Linea dedicata 3×2,5mm²'],
              ['34', 'MCB 1P (boiler)', '1', '16A', 'Linea dedicata 3×2,5mm²'],
              ['35–48', 'Moduli liberi (riserva)', '14', '—', 'Espansione futura (rete dati, citofono, ecc.)'],
            ].map(([pos, dev, mod, cal, zona], i) => (
              <Tr key={i} odd={i % 2 === 1}>
                <td style={{ ...S.td, fontFamily: 'monospace', fontSize: '8pt' }}>{pos}</td>
                <td style={S.td}>{dev}</td>
                <td style={S.tdR}>{mod}</td>
                <td style={S.tdR}>{cal}</td>
                <td style={S.td}>{zona}</td>
              </Tr>
            ))}
          </tbody>
        </table>

        {/* ── 3. DETTAGLIO PER STANZA ── */}
        <div className="pb" style={S.h1}>3 · Dettaglio per Stanza</div>

        {[
          {
            name: 'CUCINA', circuits: [
              { id: 'C-CU', type: 'Luce', cable: '3×1,5mm²', mcb: '10A', mt: 35, desc: '1 plafoniera teto + 1 sottopensile' },
              { id: 'P-CU1', type: 'Prese', cable: '3×2,5mm²', mcb: '16A', mt: 34, desc: '4 prese T13 sopra banco (frigorifero, cappa, uso gen.)' },
              { id: 'DED-PI', type: 'Dedicato', cable: '5G6mm²', mcb: '32A', mt: 20, desc: 'Piano cottura — terminal fisso, linea dedicata obbligatoria NIN 2020' },
              { id: 'DED-FO', type: 'Dedicato', cable: '3×2,5mm²', mcb: '16A', mt: 25, desc: 'Forno STENABY — presa nella colonna forno METOD' },
              { id: 'DED-LV', type: 'Dedicato', cable: '3×2,5mm²', mcb: '16A', mt: 25, desc: 'Lavastoviglie — presa sotto bancone' },
            ],
            outlets: 4, switches: '2 interruttori (tetto + sottopensile)',
          },
          {
            name: 'SOGGIORNO', circuits: [
              { id: 'C-SO', type: 'Luce', cable: '3×1,5mm²', mcb: '10A', mt: 35, desc: '2–3 punti luce; deviatori schema 6 (2 accessi: corridoio + cucina)' },
              { id: 'P-SO1', type: 'Prese', cable: '3×2,5mm²', mcb: '16A', mt: 37, desc: '4 prese T13 parete TV (TV, soundbar, console, decoder)' },
              { id: 'P-SO2', type: 'Prese', cable: '3×2,5mm²', mcb: '16A', mt: 40, desc: '4 prese T13 pareti laterali (lamps, laptop, caricatori)' },
            ],
            outlets: 8, switches: '2 deviatori schema 6 (commutazione a 2 vie)',
          },
          {
            name: 'CORRIDOIO D\'INGRESSO', circuits: [
              { id: 'C-CI', type: 'Luce', cable: '3×1,5mm²', mcb: '10A', mt: 30, desc: '1–2 punti luce; deviatori con soggiorno e corridoio principale' },
              { id: 'P-COR', type: 'Prese', cable: '3×2,5mm²', mcb: '16A', mt: 26, desc: '2 prese T13 (aspirapolvere, caricatori)' },
            ],
            outlets: 2, switches: '1 deviatore schema 6',
          },
          {
            name: 'CAMERA 1', circuits: [
              { id: 'C-CA1', type: 'Luce', cable: '3×1,5mm²', mcb: '10A', mt: 35, desc: '1 plafoniera soffitto; interruttore porta + deviatore lato letto' },
              { id: 'P-CA1', type: 'Prese', cable: '3×2,5mm²', mcb: '16A', mt: 42, desc: '4 prese T13 (2 per lato letto: abajour, caricatore, laptop)' },
            ],
            outlets: 4, switches: '1 interruttore + 1 deviatore letto',
          },
          {
            name: 'CAMERA 2', circuits: [
              { id: 'C-CA2', type: 'Luce', cable: '3×1,5mm²', mcb: '10A', mt: 38, desc: '1 plafoniera; interruttore + deviatore lato letto' },
              { id: 'P-CA2', type: 'Prese', cable: '3×2,5mm²', mcb: '16A', mt: 42, desc: '4 prese T13 (2 per lato letto)' },
            ],
            outlets: 4, switches: '1 interruttore + 1 deviatore',
          },
          {
            name: 'STANZA PADRONALE + CORRIDOIO INTERNO', circuits: [
              { id: 'C-SP', type: 'Luce', cable: '3×1,5mm²', mcb: '10A', mt: 40, desc: '2 punti luce: camera + corridoio interno creato in cartongesso; 2 deviatori + 1 interruttore corridoio' },
              { id: 'P-SP', type: 'Prese', cable: '3×2,5mm²', mcb: '16A', mt: 50, desc: '6 prese T13: 4 camera (2 per lato letto) + 2 corridoio interno' },
            ],
            outlets: 6, switches: '2 deviatori camera + 1 interruttore corridoio interno',
          },
          {
            name: 'BAGNO ESISTENTE', circuits: [
              { id: 'C-BE', type: 'Luce (IP44)', cable: '3×1,5mm²', mcb: '10A', mt: 30, desc: '1 plafoniera IP44 zona 2 NIN 2020; eventuale luce specchio IP44. Interruttore fuori dalla zona bagno.' },
              { id: 'P-BE', type: 'Prese (IP44)', cable: '3×2,5mm²', mcb: '16A', mt: 31, desc: '2 prese IP44 T13 (min. 60cm dalla doccia — zona 2 NIN 2020). RCD tipo A obbligatorio.' },
            ],
            outlets: '2 (IP44)', switches: '1 interruttore (posizionato fuori dalla zona bagno)',
          },
          {
            name: 'BAGNO NUOVO', circuits: [
              { id: 'C-BN', type: 'Luce (IP44)', cable: '3×1,5mm²', mcb: '10A', mt: 32, desc: '1 plafoniera IP44; eventuale luce specchio IP44. Interruttore fuori dalla zona bagno.' },
              { id: 'P-BN', type: 'Prese (IP44)', cable: '3×2,5mm²', mcb: '16A', mt: 31, desc: '2 prese IP44 T13. RCD tipo A obbligatorio per zone umide.' },
            ],
            outlets: '2 (IP44)', switches: '1 interruttore (fuori dalla zona bagno)',
          },
        ].map((room) => (
          <div key={room.name} style={{ marginBottom: '10px' }}>
            <div style={S.h2}>{room.name}</div>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>ID circuito</th>
                  <th style={S.th}>Tipo</th>
                  <th style={S.th}>Sezione cavo</th>
                  <th style={S.thR}>MCB</th>
                  <th style={S.thR}>Lungh. (m)</th>
                  <th style={S.th}>Descrizione</th>
                </tr>
              </thead>
              <tbody>
                {room.circuits.map((c, i) => (
                  <Tr key={i} odd={i % 2 === 1}>
                    <td style={{ ...S.td, fontFamily: 'monospace', fontSize: '8pt' }}>{c.id}</td>
                    <td style={S.td}>{c.type}</td>
                    <td style={S.td}><span style={S.mono}>{c.cable}</span></td>
                    <td style={S.tdR}>{c.mcb}</td>
                    <td style={S.tdR}>{c.mt}</td>
                    <td style={S.td}>{c.desc}</td>
                  </Tr>
                ))}
              </tbody>
            </table>
            <div style={{ fontSize: '8pt', color: 'var(--doc-ink-strong)', marginBottom: '2px' }}>
              <span style={{ marginRight: '16px' }}>🔌 <strong>Prese:</strong> {room.outlets}</span>
              <span>🔆 <strong>Interruttori/deviatori:</strong> {room.switches}</span>
            </div>
          </div>
        ))}

        {/* ── 4. SINTESI CAVI ── */}
        <div className="pb" style={S.h1}>4 · Sintesi Cavi e Calcolo Quantità</div>

        <div style={S.h2}>4.1 Cavi illuminazione 3×1,5 mm² — totale 270 ml</div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Circuito</th><th style={S.th}>Locale</th>
              <th style={S.thR}>Tronco (m)</th><th style={S.thR}>Distribuz. (m)</th>
              <th style={S.thR}>Totale (m)</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['C-CU','Cucina','20','15','35'],
              ['C-SO','Soggiorno','25','10','35'],
              ['C-CI','Corridoio ingresso','15','15','30'],
              ['C-CA1','Camera 1','25','10','35'],
              ['C-CA2','Camera 2','28','10','38'],
              ['C-SP','Stanza Padronale + corridoio int.','30','10','40'],
              ['C-BE','Bagno Esistente','20','10','30'],
              ['C-BN','Bagno Nuovo','22','10','32'],
            ].map(([id, local, tr, di, tot], i) => (
              <Tr key={i} odd={i % 2 === 1}>
                <td style={{ ...S.td, fontFamily: 'monospace', fontSize: '8pt' }}>{id}</td>
                <td style={S.td}>{local}</td>
                <td style={S.tdR}>{tr}</td>
                <td style={S.tdR}>{di}</td>
                <td style={S.tdR}><strong>{tot}</strong></td>
              </Tr>
            ))}
            <tr style={{ background: 'var(--doc-accent-soft)' }}>
              <td style={S.tdB} colSpan={4}>Totale calcolato → arrotondato in preventivo</td>
              <td style={{ ...S.tdR, fontWeight: 700 }}>275 → 270 m</td>
            </tr>
          </tbody>
        </table>
        <div style={S.note}>Fonte prezzo: Elettromercato Bronz art. 42625 — TT Rigid cable 3×1,5mm² LNPE bianco — CHF 1,75/m</div>

        <div style={S.h2}>4.2 Cavi prese standard 3×2,5 mm² — totale 360 ml</div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Circuito</th><th style={S.th}>Locale</th>
              <th style={S.thR}>Tronco (m)</th><th style={S.th}>Ramificazioni</th>
              <th style={S.thR}>Totale (m)</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['P-SO1','Soggiorno — parete TV','25','4 prese × 3m','37'],
              ['P-SO2','Soggiorno — laterali','28','4 prese × 3m','40'],
              ['P-CA1','Camera 1','30','4 prese × 3m','42'],
              ['P-CA2','Camera 2','30','4 prese × 3m','42'],
              ['P-SP','Stanza Padronale + corridoio','32','6 prese × 3m','50'],
              ['P-COR','Corridoio + ingresso','20','2 prese × 3m','26'],
              ['P-CU1','Cucina prese generali','22','4 prese × 3m','34'],
              ['P-CU2','Cucina (frigorifero + cappa)','26','2 prese × 3m','32'],
              ['P-BE','Bagno Esistente IP44','25','2 prese × 3m','31'],
              ['P-BN','Bagno Nuovo IP44','25','2 prese × 3m','31'],
            ].map(([id, local, tr, ram, tot], i) => (
              <Tr key={i} odd={i % 2 === 1}>
                <td style={{ ...S.td, fontFamily: 'monospace', fontSize: '8pt' }}>{id}</td>
                <td style={S.td}>{local}</td>
                <td style={S.tdR}>{tr}</td>
                <td style={S.td}>{ram}</td>
                <td style={S.tdR}><strong>{tot}</strong></td>
              </Tr>
            ))}
            <tr style={{ background: 'var(--doc-accent-soft)' }}>
              <td style={S.tdB} colSpan={4}>Totale (+ connessioni/morsetti nelle cassette ~5m)</td>
              <td style={{ ...S.tdR, fontWeight: 700 }}>365 → 360 m</td>
            </tr>
          </tbody>
        </table>
        <div style={S.note}>Fonte prezzo: Elettromercato Bronz art. 42564 — TT Rigid cable 3×2,5mm² LNPE bianco — CHF 3,40/m</div>

        <div style={S.h2}>4.3 Cavi circuiti dedicati — CHF 520 a corpo</div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Circuito</th><th style={S.th}>Sezione</th>
              <th style={S.thR}>Metri</th><th style={S.thR}>Prezzo/m</th>
              <th style={S.thR}>Totale</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Piano cottura (32A)','5G6mm²','20','CHF 8,00','CHF 160,00'],
              ['Forno','3×2,5mm²','25','CHF 3,40','CHF 85,00'],
              ['Lavastoviglie','3×2,5mm²','25','CHF 3,40','CHF 85,00'],
              ['Lavatrice','3×2,5mm²','20','CHF 3,40','CHF 68,00'],
              ['Boiler','3×2,5mm²','20','CHF 3,40','CHF 68,00'],
            ].map(([circ, sez, mt, pm, tot], i) => (
              <Tr key={i} odd={i % 2 === 1}>
                <td style={S.td}>{circ}</td>
                <td style={S.td}><span style={S.mono}>{sez}</span></td>
                <td style={S.tdR}>{mt}</td>
                <td style={S.tdR}>{pm}</td>
                <td style={S.tdR}><strong>{tot}</strong></td>
              </Tr>
            ))}
            <tr style={{ background: 'var(--doc-accent-soft)' }}>
              <td style={S.tdB} colSpan={4}>Subtotale cavi + connettori, terminali, capicorda (~11%)</td>
              <td style={{ ...S.tdR, fontWeight: 700 }}>CHF 520,00</td>
            </tr>
          </tbody>
        </table>

        {/* ── 5. PRESE E INTERRUTTORI ── */}
        <div style={S.h1}>5 · Prese e Interruttori</div>

        <div style={S.h2}>5.1 Prese tipo 13 — 28 pz × CHF 54,10 = CHF 1.514,80</div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Locale</th><th style={S.thR}>Quantità</th><th style={S.th}>Motivo</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Soggiorno','8','4 parete TV + 4 laterali — uso intensivo (multimedia, lamps)'],
              ['Camera 1','4','2 per lato letto — standard NIN residenziale'],
              ['Camera 2','4','2 per lato letto'],
              ['Stanza Padronale + corridoio interno','6','4 camera + 2 corridoio interno'],
              ['Cucina','4','Sopra backsplash (frigorifero, cappa, uso gen.)'],
              ['Corridoio + ingresso','2','Aspirapolvere, caricatori'],
            ].map(([local, qty, note], i) => (
              <Tr key={i} odd={i % 2 === 1}>
                <td style={S.td}>{local}</td>
                <td style={S.tdR}><strong>{qty}</strong></td>
                <td style={S.td}>{note}</td>
              </Tr>
            ))}
            <tr style={{ background: 'var(--doc-accent-soft)' }}>
              <td style={S.tdB}><strong>Totale T13</strong></td>
              <td style={{ ...S.tdR, fontWeight: 700 }}>28</td>
              <td style={S.td}>Feller EDIZIOdue art. L87063F61 (Elettromercato CHF 54,10/pz)</td>
            </tr>
          </tbody>
        </table>

        <div style={S.h2}>5.2 Prese IP44 bagno — 4 pz × CHF 85 = CHF 340</div>
        <div style={S.note}>2 pz per bagno × 2 bagni = 4 pz. Posizionate in zona 2 NIN 2020 (min. 60cm dal bordo doccia/vasca). Protezione IP44 obbligatoria per zone umide. Differenziale tipo A obbligatorio per tutto il circuito bagni.</div>

        <div style={S.h2}>5.3 Interruttori e deviatori — 22 pz × CHF 27 = CHF 594</div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Locale</th><th style={S.th}>Tipo</th>
              <th style={S.thR}>Qty</th><th style={S.th}>Motivo</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Cucina','Interruttore (×2)','2','Luce tetto + sottopensile separati'],
              ['Soggiorno','Deviatore schema 6 (×2)','2','2 ingressi: corridoio + cucina'],
              ['Corridoio ingresso','Deviatore schema 6','1','Commutazione con soggiorno'],
              ['Camera 1','Interruttore + deviatore letto','2','Porta + comando lato letto'],
              ['Camera 2','Interruttore + deviatore letto','2','Porta + comando lato letto'],
              ['Stanza Padronale','2 deviatori camera + 1 interr. corridoio','3','2 ingressi camera + luce corridoio interno'],
              ['Bagno Esistente','Interruttore (fuori bagno)','1','Obbligatorio fuori da zona umida'],
              ['Bagno Nuovo','Interruttore (fuori bagno)','1','Obbligatorio fuori da zona umida'],
              ['Pulsante campanello / extra','Pulsante NA','1','Standard ingresso'],
              ['Riserva (15% buffer)','Vari','3','Aggiustamenti layout, switch extra non previsti'],
            ].map(([local, tipo, qty, note], i) => (
              <Tr key={i} odd={i % 2 === 1}>
                <td style={S.td}>{local}</td>
                <td style={S.td}>{tipo}</td>
                <td style={S.tdR}><strong>{qty}</strong></td>
                <td style={S.td}>{note}</td>
              </Tr>
            ))}
            <tr style={{ background: 'var(--doc-accent-soft)' }}>
              <td style={S.tdB} colSpan={2}><strong>Totale</strong></td>
              <td style={{ ...S.tdR, fontWeight: 700 }}>18 + 4 riserva → <strong>22</strong></td>
              <td style={S.td}>Feller EDIZIOdue media CHF 27/pz</td>
            </tr>
          </tbody>
        </table>

        {/* ── 6. MANODOPERA ── */}
        <div style={S.h1}>6 · Manodopera — 75h × CHF 113/h = CHF 8.500</div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Attività</th>
              <th style={S.th}>Dettaglio</th>
              <th style={S.thR}>Ore stimate</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Sopralluogo, marcazioni, pianificazione','Verifica percorsi cavi, posizioni cassette, accordo con muratori','2h'],
              ['Installazione e cablaggio quadro','Montaggio box, MCBs, RCDs, pettini di distribuzione, etichettatura','4h'],
              ['Stesa cavi illuminazione','270m × 3×1,5mm², ~27m/ora con tracce già aperte','10h'],
              ['Stesa cavi prese standard','360m × 3×2,5mm², ~26m/ora (cavo più rigido)','14h'],
              ['Stesa cavi dedicati','110m (5G6 + 3×2,5) incl. piano cottura, forno, lavastoviglie, lavatrice, boiler','5h'],
              ['Montaggio cassette da incasso (70 pz)','~3,5 min/pz — fissaggio, livellamento','4h'],
              ['Connessioni nelle cassette','~10 min/cassetta × 70 — giunzioni Wago, derivazioni','12h'],
              ['Montaggio prese T13 (28 pz)','~10 min/pz — connessione, fissaggio meccanismo, plafoniera','5h'],
              ['Montaggio prese IP44 (4 pz)','~15 min/pz — procedura più accurata per umidità','1h'],
              ['Montaggio interruttori/deviatori (22 pz)','~10 min/pz','4h'],
              ['Cablaggio finale quadro (23 circuiti)','~15 min/circuito — attacchi, etichette, ferules','6h'],
              ['Test isolamento (Megger), polarità, continuità PE','Strumentazione certificata, verifica norma NIN 2020','4h'],
              ['Documentazione, schema monolineare, dichiarazione ESTI','Preparazione dichiarazione conformità + schema quadro','4h'],
            ].map(([att, det, ore], i) => (
              <Tr key={i} odd={i % 2 === 1}>
                <td style={S.td}>{att}</td>
                <td style={S.td}>{det}</td>
                <td style={S.tdR}><strong>{ore}</strong></td>
              </Tr>
            ))}
            <tr style={{ background: 'var(--doc-accent-soft)' }}>
              <td style={S.tdB} colSpan={2}><strong>Totale ore · Tariffa CHF 100/h (fonte: houzy.ch — range CHF 100–130/h)</strong></td>
              <td style={{ ...S.tdR, fontWeight: 700, fontSize: '10pt' }}>75h → CHF 7.500</td>
            </tr>
          </tbody>
        </table>

        {/* ── 7. RIEPILOGO COSTI ── */}
        <div style={S.h1}>7 · Riepilogo Costi Impianto Elettrico</div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Voce</th>
              <th style={S.thR}>Qta</th>
              <th style={S.thR}>Prezzo unit.</th>
              <th style={S.thR}>Totale</th>
              <th style={S.th}>Fonte / Link prodotto</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Quadro Hager VOLTA VA48A 48 mod. + MCBs + RCDs + posa','1 corpo','CHF 1.200,00','CHF 1.200,00','https://www.elettromercato.ch/it/prodotti/id/20334/quadro-hager-4-file-volta-ap-bianco','Elettromercato Bronz (art. 20334)'],
              ['Cavi illuminazione TT 3×1,5mm² LNPE bianco','270 ml','CHF 1,75/m','CHF 472,50','https://www.elettromercato.ch/en/browse/id/42625','Elettromercato Bronz (art. 42625)'],
              ['Cavi prese standard TT 3×2,5mm² LNPE bianco','360 ml','CHF 3,40/m','CHF 1.224,00','https://www.elettromercato.ch/en/browse/id/42564','Elettromercato Bronz (art. 42564)'],
              ['Cavi dedicati: 5G6mm² piano cottura + 4× 3×2,5mm²','1 corpo','—','CHF 520,00',null,'Cavi misti — Elettromercato Bronz'],
              ['Prese tipo 13 ABB Basic55 (std CH)','28 pz','CHF 22,00/pz','CHF 616,00','https://www.obi.ch/it/search/ABB%20presa%20tipo%2013/','OBI / Jumbo CH (~CHF 20-25/pz)'],
              ['Prese IP44 bagno (zona umida NIN 2020)','4 pz','CHF 85,00/pz','CHF 340,00',null,'Prezzo stima — verificare con fornitore locale'],
              ['Interruttori e deviatori Feller EDIZIOdue','22 pz','CHF 27,00/pz','CHF 594,00','https://www.obi.ch/it/interruttori-e-pulsanti/feller-interruttore-a-pressione-da-incasso-ediziodue-luce-ventilatore-bianco/p/6021422','OBI.ch Feller EDIZIOdue (CHF 8.95–49.95)'],
              ['Materiale vario (cassette, tubi corrugati, morsetti Wago)','1 corpo','—','CHF 195,00',null,'Elettromercato Bronz / Hornbach Lugano'],
              ['Posa impianto elettrico completo — manodopera','75h','CHF 100/h','CHF 7.500,00','https://it.houzy.ch/post/costi-elettricista','Tariffa CHF 100-130/h (fonte: houzy.ch)'],
              ['Dichiarazione di conformità ESTI + collaudo finale','1 corpo','—','CHF 650,00',null,'Obbligatoria per legge NIN 2020'],
            ].map(([voce, qty, pu, tot, url, fonte], i) => (
              <Tr key={i} odd={i % 2 === 1}>
                <td style={S.td}>{voce}</td>
                <td style={S.tdR}>{qty}</td>
                <td style={S.tdR}>{pu}</td>
                <td style={S.tdR}><strong>{tot}</strong></td>
                <td style={{ ...S.td, fontSize: '7.5pt' }}>
                  {url ? <a href={url} style={{ color: 'var(--doc-accent)', textDecoration: 'underline' }}>{fonte}</a> : <span style={{ color: 'var(--doc-ink-subtle)' }}>{fonte}</span>}
                </td>
              </Tr>
            ))}
            <tr style={{ background: 'var(--doc-brand)' }}>
              <td colSpan={3} style={{ padding: '5px 6px', color: 'var(--doc-paper)', fontWeight: 700, fontSize: '10pt' }}>TOTALE IMPIANTO ELETTRICO</td>
              <td style={{ padding: '5px 6px', color: 'var(--doc-paper)', fontWeight: 700, fontSize: '11pt', textAlign: 'right' }}>CHF 13.311,50</td>
              <td style={{ padding: '5px 6px', color: 'var(--doc-ink-subtle)', fontSize: '7.5pt' }}>PRE-2026-013 v7</td>
            </tr>
          </tbody>
        </table>

        {/* ── 8. PIANO ESECUZIONE ── */}
        <div className="pb" style={S.h1}>8 · Piano di Esecuzione — Impianto Elettrico</div>
        <div style={{ ...S.info, marginBottom: '8px' }}>
          <strong>Nota tecnica:</strong> L&apos;appartamento attualmente non ha un quadro di distribuzione interno. Il contatore/quadro condominiale è esterno all&apos;appartamento. È quindi necessario installare un <strong>nuovo quadro interno Hager VOLTA 48 moduli</strong>, alimentato dal contatore esistente tramite cavo di collegamento (incluso nella voce quadro).
        </div>
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Fase</th>
            <th style={S.th}>Attività</th>
            <th style={{ ...S.th, width: '80px' }}>Prerequisito</th>
            <th style={{ ...S.th, width: '60px' }}>Durata</th>
          </tr></thead>
          <tbody>
            {[
              ['1 — Tracce e cassette', 'Apertura tracce nelle pareti (coordinato con muratori). Installazione cassette da incasso 70 pz. I muratori aprono le tracce, l\'elettricista installa le cassette prima che vengano stuccate.', 'Muratura aperta', '1 giorno'],
              ['2 — Stesa cavi', 'Posa cavi di illuminazione (270ml 3×1,5mm²), cavi prese (360ml 3×2,5mm²), cavi dedicati cucina/bagni (110ml). Cavi passano nelle tracce aperte e nei tubi corrugati.', 'Cassette installate', '1,5 giorni'],
              ['3 — Quadro distribuzione', 'Installazione quadro Hager VOLTA 48 moduli nella posizione definita. Montaggio MCBs, RCDs. Cablaggio dal contatore esterno al quadro interno (cavo H07V-K o equivalente, protezione adeguata per il percorso).', 'Cavi stesi', '1 giorno'],
              ['4 — Connessioni e derivazioni', 'Connessioni nelle cassette di derivazione (Wago). Collegamento circuiti al quadro. Ogni circuito identificato e etichettato.', 'Quadro installato', '1,5 giorni'],
              ['5 — Posa apparecchi', 'Montaggio prese ABB T13 (28 pz + 4 IP44), interruttori e deviatori Feller EDIZIOdue (22 pz). Coordinare con tinteggiatura: le prese si montano DOPO la pittura.', 'Pittura completata', '1 giorno'],
              ['6 — Test e ESTI', 'Test isolamento con megohmetro. Verifica polarità e continuità PE su tutti i circuiti. Test differenziali. Emissione Dichiarazione di Conformità ESTI dall\'elettricista certificato.', 'Tutto montato', '0,5 giorni'],
            ].map(([fase, att, pre, dur], i) => (
              <Tr key={i} odd={i % 2 === 1}>
                <td style={{ ...S.td, fontWeight: 600, whiteSpace: 'nowrap' as const }}>{fase}</td>
                <td style={{ ...S.td, fontSize: '8pt' }}>{att}</td>
                <td style={{ ...S.td, fontSize: '8pt', color: 'var(--doc-ink-muted)' }}>{pre}</td>
                <td style={{ ...S.tdR, fontWeight: 600, color: 'var(--doc-brand)' }}>{dur}</td>
              </Tr>
            ))}
          </tbody>
        </table>
        <div style={{ ...S.info, marginBottom: '8px' }}>
          <strong>Coordinamento cantiere:</strong> L&apos;impianto elettrico si intreccia con gli altri lavori. Sequenza critica:
          1) Muratori aprono tracce → 2) Elettricista installa cassette → 3) Muratori stuccano → 4) Elettricista stende cavi → 5) Pittura → 6) Elettricista monta apparecchi → 7) ESTI.
        </div>

        {/* ── 9. ESCLUSO ── */}
        <div style={S.h1}>9 · Voci Escluse dalla Quotazione Elettrica</div>
        {[
          ['Upgrade potenza ingresso', 'Se la protezione esistente è <40A monofásico o <3×16A trifásico, necessario contattare il distributore (AIM Lugano / AEM) per upgrade contrattuale. Costo stimato CHF 200–500 — da verificare prima dell\'inizio lavori.'],
          ['Corpi illuminanti', 'Lampadari, plafoniere, faretti, strisce LED non inclusi. Inclusa unicamente la predisposizione impiantistica (cavi, punti luce IP44/IP20, cassette, morsettiere).'],
          ['Citofono / videocitofono', 'Non previsto nel presente preventivo. Aggiunta su richiesta (stimato CHF 300–800 secondo modello).'],
          ['Rete dati / TV (CAT6, coassiale)', 'Predisposizione cavi strutturati non inclusa. Aggiunta stimata CHF 300–500 per cablaggio appartamento completo.'],
          ['Impianto di terra (TT)', 'Si assume l\'impianto di terra esistente dello stabile in ordine e conforme. Se necessario rifacimento o adeguamento: CHF 500–1.000 aggiuntivi (da verificare con il manutentore dello stabile).'],
        ].map(([titolo, desc], i) => (
          <div key={i} style={S.excl}>
            <strong>✗ {titolo}:</strong> {desc}
          </div>
        ))}

        {/* Footer */}
        <div style={{ marginTop: '12mm', paddingTop: '4mm', borderTop: '1px solid var(--doc-line-strong)', display: 'flex', justifyContent: 'space-between', fontSize: '7pt', color: 'var(--doc-ink-subtle)' }}>
          <span>Zanetti Soluzioni Edili · PRE-2026-013</span>
          <span>Analisi tecnica interna — Impianto Elettrico</span>
          <span>Generato il {today}</span>
        </div>
      </div>
    </div>
  )
}
