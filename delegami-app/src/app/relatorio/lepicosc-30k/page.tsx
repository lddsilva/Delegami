import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PrintButton } from '@/components/ui/print-button'

export const metadata: Metadata = {
  title: 'PRE-2026-013 - Ballestra - LEPICOSC Analisi',
}

const S = {
  h1: { fontSize: '13pt', fontWeight: 700, color: 'var(--doc-brand)', marginBottom: '6px', marginTop: '14px', borderBottom: '2px solid var(--doc-brand)', paddingBottom: '3px' } as React.CSSProperties,
  h2: { fontSize: '10pt', fontWeight: 700, color: 'var(--doc-brand)', marginTop: '10px', marginBottom: '4px' } as React.CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '8.5pt', marginBottom: '10px' },
  th: { background: 'var(--doc-brand)', color: 'var(--doc-paper)', padding: '4px 8px', textAlign: 'left' as const, fontWeight: 600, fontSize: '8pt' },
  thR: { background: 'var(--doc-brand)', color: 'var(--doc-paper)', padding: '4px 8px', textAlign: 'right' as const, fontWeight: 600, fontSize: '8pt' },
  td: { padding: '4px 8px', borderBottom: '1px solid var(--doc-line)', verticalAlign: 'top' as const, fontSize: '8.5pt' },
  tdR: { padding: '4px 8px', borderBottom: '1px solid var(--doc-line)', textAlign: 'right' as const, fontSize: '8.5pt' },
  yes: { padding: '4px 8px', borderBottom: '1px solid var(--doc-line)', color: 'var(--doc-negative)', fontWeight: 700, fontSize: '8.5pt', background: 'var(--doc-paper)' } as React.CSSProperties,
  no: { padding: '4px 8px', borderBottom: '1px solid var(--doc-line)', color: 'var(--doc-positive)', fontWeight: 600, fontSize: '8.5pt', background: 'var(--doc-paper)' } as React.CSSProperties,
  grey: { padding: '4px 8px', borderBottom: '1px solid var(--doc-line)', color: 'var(--doc-ink-muted)', fontSize: '8.5pt' } as React.CSSProperties,
  warn: { background: 'var(--doc-warn-soft)', border: '1px solid var(--doc-warn-line)', borderRadius: '4px', padding: '6px 10px', fontSize: '8pt', color: 'var(--doc-warn)', marginBottom: '8px' } as React.CSSProperties,
  ok: { background: 'var(--doc-positive-soft)', border: '1px solid var(--doc-positive-line)', borderRadius: '4px', padding: '6px 10px', fontSize: '8pt', color: 'var(--doc-positive)', marginBottom: '8px' } as React.CSSProperties,
  src: { fontSize: '7pt', color: 'var(--doc-ink-muted)', fontStyle: 'italic' } as React.CSSProperties,
}

const Tr = ({ odd, children }: { odd?: boolean; children: React.ReactNode }) => (
  <tr style={{ background: odd ? 'var(--doc-fill)' : 'var(--doc-paper)' }}>{children}</tr>
)

const edilizia = [
  { desc: 'Muratura – rimozione vasca, passaggi idraulici/elettrici, impermeabilizzazione (Bagno esistente)', chf: 2000 },
  { desc: 'Muratura – rimozione pavimento corridoio, conduit elettrici, cassette (Corridoio e Cucina)', chf: 3000 },
  { desc: 'Demolizione parete corridoio–soggiorno e smaltimento', chf: 1500 },
  { desc: 'Posa putrella (trave metallica) apertura corridoio–soggiorno', chf: 2000 },
  { desc: 'Requadratura vano apertura corridoio–soggiorno', chf: 500 },
  { desc: 'Muratura 3 stanze – tracce cassette elettriche, rimozione armadio', chf: 2900 },
  { desc: 'Muratura bagno nuovo – base pareti, pavimento 3 livelli, passaggi, impermeabilizzazione', chf: 5500 },
  { desc: 'Chiusura porta esistente stanza padronale – muratura e intonaco', chf: 1300 },
  { desc: 'Apertura nuova porta stanza padronale – demolizione', chf: 800 },
]
const totalEdilizia = edilizia.reduce((s, r) => s + r.chf, 0)

const artigianato = [
  { desc: 'Piastrelatura bagno 25,04 m² (fornitura e posa)', cat: 'Artigianato', chf: 3380.40 },
  { desc: 'Bidet sospeso con rubinetteria', cat: 'Artigianato', chf: 320 },
  { desc: 'Sanitario WC Geberit (vaso + placca + copriwater)', cat: 'Artigianato', chf: 550 },
  { desc: 'Mobile lavabo, specchio, accessori bagno', cat: 'Artigianato', chf: 259 + 517 + 150 },
  { desc: 'Box doccia, sistema doccia, piletta, montaggio accessori bagno', cat: 'Artigianato', chf: 500 + 450 + 250 + 120 + 1000 },
  { desc: 'Controparete 10 m² idrofuga (bagno esistente)', cat: 'Artigianato / Gessatura', chf: 1450 },
  { desc: 'Piastrelatura corridoio e cucina 30 m²', cat: 'Artigianato', chf: 2398.50 },
  { desc: 'Cucina componibile METOD 307 cm + piano lavoro', cat: 'Artigianato / Allestimento', chf: 1990 },
  { desc: 'Elettrodomestici (piano cottura, cappa, frigo, forno, lavello, miscelatore, lavastoviglie)', cat: 'Artigianato / Allestimento', chf: 449 + 49.95 + 479 + 429 + 24.95 + 59.95 + 1200 },
  { desc: 'Rivestimento parete cucina backsplash 3 m²', cat: 'Artigianato', chf: 420 },
  { desc: 'Piano di lavoro laminato × 2 + montaggio cucina', cat: 'Artigianato', chf: 118 + 1000 },
  { desc: 'Pareti e contropareti cartongesso (corridoio, stanze, stanza padronale)', cat: 'Artigianato / Gessatura', chf: 2040 + 2040 + 3150 + 7540 - (1300 + 800) },
  { desc: 'Pavimenti e rivestimenti bagno nuovo', cat: 'Artigianato', chf: 3000 },
  { desc: 'Sanitari, doccia, accessori bagno nuovo', cat: 'Artigianato', chf: 550 + 517 + 259 + 500 + 450 + 250 + 120 + 150 + 1000 + 750 },
  { desc: 'Pittura appartamento, verniciatura persiane/porte', cat: 'Artigianato / Pittura', chf: 720 + 720 + 3950 },
  { desc: 'Fornitura e posa battiscopa 110 ml', cat: 'Artigianato', chf: 1045.60 },
  { desc: 'Impianto elettrico (cavi, quadro, prese, manodopera, ESTI)', cat: 'Regolato ESTI', chf: 13311.50 },
  { desc: 'Impianto idraulico (GC Termo-Idraulica — offerta separata)', cat: 'Regolato separatamente', chf: 0 },
]

export default function RelatorioLepicosc() {
  const today = new Date().toLocaleDateString('it-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const totalProject = 79064.85

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:p-0">
      <style>{`
        @media print {
          @page { margin: 15mm 20mm; size: A4; }
          html, body { height: auto !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          table { page-break-inside: auto; border-collapse: collapse; width: 100%; }
          tr { page-break-inside: avoid; }
          thead { display: table-header-group; }
          .pb { page-break-before: always; }
        }
      `}</style>

      <div className="no-print max-w-[210mm] mx-auto mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/relatori" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" />Relatori
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/projects/cmobzgzlk0001y0ukb3hkjyih" className="text-sm text-gray-500 hover:text-gray-700">
            Ristrutturazione Appartamento Ballestra
          </Link>
        </div>
        <PrintButton />
      </div>

      <div className="doc-sheet bg-white max-w-[210mm] mx-auto shadow-lg print:shadow-none" style={{ padding: '15mm 20mm', fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: '9pt', color: 'var(--doc-ink)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8mm', paddingBottom: '5mm', borderBottom: '2px solid var(--doc-brand)' }}>
          <div>
            <div style={{ fontSize: '17pt', fontWeight: 700, color: 'var(--doc-brand)' }}>Zanetti Soluzioni Edili</div>
            <div style={{ fontSize: '8pt', color: 'var(--doc-ink-muted)', marginTop: '3px', lineHeight: 1.5 }}>Via Cantonale, 1 · 6983 Magliaso · Tel: +41 76 545 40 07</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '9pt', fontWeight: 700, color: 'var(--doc-brand)' }}>ANALISI INTERNA — LEPICOSC / LICENZA</div>
            <div style={{ fontSize: '8pt', color: 'var(--doc-ink-muted)', marginTop: '2px', lineHeight: 1.5 }}>
              Rif. preventivo: <strong>PRE-2026-013</strong><br />Data: {today}
            </div>
          </div>
        </div>

        <div style={S.warn}>■ DOCUMENTO INTERNO — Non condividere con il cliente.</div>
        <div style={{ background: 'var(--doc-accent-soft)', borderRadius: '4px', padding: '6px 10px', marginBottom: '10px', fontSize: '8.5pt' }}>
          <strong>Quesito:</strong> Per eseguire questa ristrutturazione è necessaria l&apos;iscrizione al registro LEPICOSC (Albo delle Imprese Costruzione)?<br />
          <strong>Risposta sintetica:</strong> <span style={{ color: 'var(--doc-positive)', fontWeight: 700 }}>No — i lavori di &quot;edilizia&quot; soggetti a LEPICOSC sono inferiori alla soglia di CHF 30.000.</span>
        </div>

        {/* Section 1 */}
        <div style={S.h1}>1 · La Legge LEPICOSC e la Soglia di CHF 30.000</div>
        <p style={{ fontSize: '8.5pt', lineHeight: 1.6, marginBottom: '8px' }}>
          La <strong>LEPICOSC</strong> (Legge sull&apos;esercizio della professione di impresario costruttore e di operatore specialista nel settore principale della costruzione, 705.500) regolamenta chi può eseguire lavori di <em>edilizia e genio civile</em> nel Canton Ticino e richiede l&apos;iscrizione al <strong>Albo delle Imprese</strong> (gestito da SSIC-TI).
        </p>
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Categoria</th>
            <th style={S.th}>Soglia obbligatoria</th>
            <th style={S.th}>Sanzione se non iscritti</th>
          </tr></thead>
          <tbody>
            <Tr><td style={S.td}><strong>Impresa costruzione</strong> (lavori di edilizia e genio civile)</td><td style={{ ...S.td, fontWeight: 700 }}>CHF 30.000</td><td style={S.td}>Multa fino a CHF 100.000 + perseguimento penale</td></Tr>
            <Tr odd><td style={S.td}><strong>Operatore specialista</strong> (armatura, casseforme, muratura, strati in calcestruzzo)</td><td style={{ ...S.td, fontWeight: 700 }}>CHF 10.000</td><td style={S.td}>Multa fino a CHF 100.000</td></Tr>
          </tbody>
        </table>
        <div style={{ ...S.warn, background: 'var(--doc-warn-soft)' }}>
          ⚠️ <strong>ATTENZIONE:</strong> La LEPICOSC si applica esclusivamente ai lavori di <em>&quot;edilizia e genio civile&quot;</em>. La legge <strong>esclude esplicitamente</strong> le <em>&quot;professioni artigianali e settori affini&quot;</em> (pittura, gessatura, piastrellatura, falegnameria, impianti, ecc.) che rientrano nell&apos;artigianato e sono soggetti a normative separate.
        </div>
        <div style={S.src}>Fonte: LEPICOSC 705.500 Art. 1, 4 — Albo delle Imprese, Canton Ticino (www4.ti.ch/dt/temi/albo-delle-imprese)</div>

        {/* Section 2 */}
        <div style={S.h1}>2 · Cosa è &quot;Edilizia&quot; e Cosa è &quot;Artigianato&quot; nel Preventivo</div>

        <div style={S.h2}>2.1 Lavori di Edilizia / Genio Civile (soggetti a LEPICOSC)</div>
        <p style={{ fontSize: '8.5pt', lineHeight: 1.5, marginBottom: '6px' }}>
          Rientrano nell&apos;ambito LEPICOSC i lavori di <strong>muratura strutturale, demolizioni, aperture in elementi portanti e opere di genio civile</strong>.
        </p>
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Voce del preventivo</th>
            <th style={S.thR}>CHF</th>
          </tr></thead>
          <tbody>
            {edilizia.map((r, i) => (
              <Tr key={i} odd={i % 2 === 1}>
                <td style={S.td}>{r.desc}</td>
                <td style={S.tdR}>{r.chf.toLocaleString('de-CH', { minimumFractionDigits: 2 })}</td>
              </Tr>
            ))}
            <tr style={{ background: 'var(--doc-warn-soft)' }}>
              <td style={{ ...S.td, fontWeight: 700 }}>TOTALE LAVORI DI EDILIZIA</td>
              <td style={{ ...S.tdR, fontWeight: 700, fontSize: '10pt' }}>
                CHF {totalEdilizia.toLocaleString('de-CH', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>

        <div style={S.ok}>
          ✓ <strong>CHF {totalEdilizia.toLocaleString('de-CH', { minimumFractionDigits: 2 })} &lt; CHF 30.000</strong> — La soglia LEPICOSC per &quot;impresa costruzione&quot; NON è raggiunta.<br />
          <strong>Conclusione: l&apos;iscrizione all&apos;Albo delle Imprese non è obbligatoria per questa commessa.</strong>
        </div>

        <div style={S.h2}>2.2 Lavori di Artigianato (non soggetti a LEPICOSC)</div>
        <p style={{ fontSize: '8.5pt', lineHeight: 1.5, marginBottom: '6px' }}>
          Tutti i seguenti lavori rientrano nelle <em>&quot;professioni artigianali&quot;</em> esplicitamente escluse dalla LEPICOSC, oppure in settori regolati separatamente (ESTI per l&apos;elettrico, normativa idraulica).
        </p>
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Voce</th>
            <th style={S.th}>Categoria</th>
            <th style={S.thR}>CHF</th>
          </tr></thead>
          <tbody>
            {artigianato.map((r, i) => (
              <Tr key={i} odd={i % 2 === 1}>
                <td style={S.td}>{r.desc}</td>
                <td style={S.grey}>{r.cat}</td>
                <td style={S.tdR}>{r.chf > 0 ? r.chf.toLocaleString('de-CH', { minimumFractionDigits: 2 }) : '—'}</td>
              </Tr>
            ))}
          </tbody>
        </table>

        {/* Section 3 */}
        <div className="pb" style={S.h1}>3 · Il Tema della Soglia IVA (CHF 100.000 / Anno)</div>
        <p style={{ fontSize: '8.5pt', lineHeight: 1.6, marginBottom: '8px' }}>
          Questione separata ma importante: la soglia di <strong>CHF 100.000 di fatturato annuo</strong> obbliga alla registrazione IVA (MWST/IVA). Questo non ha nulla a che vedere con il valore dei singoli contratti o preventivi — riguarda il <em>totale della cifra d&apos;affari annua</em> dell&apos;impresa.
        </p>
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Aspetto</th><th style={S.th}>Dettaglio</th>
          </tr></thead>
          <tbody>
            <Tr><td style={S.td}><strong>Soglia registrazione IVA obbligatoria</strong></td><td style={S.td}>CHF 100.000 di cifra d&apos;affari annua (Art. 10 LIVA)</td></Tr>
            <Tr odd><td style={S.td}><strong>Questo progetto</strong></td><td style={{ ...S.td, fontWeight: 600 }}>CHF {totalProject.toLocaleString('de-CH', { minimumFractionDigits: 2 })} — circa il 79% della soglia IVA da solo</td></Tr>
            <Tr><td style={S.td}><strong>Dividere il preventivo in più parti aiuta?</strong></td><td style={S.td}><strong>No.</strong> Il fatturato totale resta invariato. 4 fatture da CHF 20k equivalgono a 1 fattura da CHF 79k ai fini IVA. Il fisco calcola il totale annuo, non il singolo contratto.</td></Tr>
            <Tr odd><td style={S.td}><strong>Azione raccomandata</strong></td><td style={S.td}>Verificare con il proprio fiduciario se il totale dei progetti previsti nel 2026 supererà CHF 100.000. In caso affermativo, registrarsi all&apos;AFC (Amministrazione federale delle contribuzioni) prima di raggiungere la soglia.</td></Tr>
          </tbody>
        </table>

        {/* Section 4 */}
        <div style={S.h1}>4 · Riepilogo Finale — Situazione Zanetti per Questo Progetto</div>
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Questione</th>
            <th style={{ ...S.th, width: '100px' }}>Risposta</th>
            <th style={S.th}>Motivazione</th>
          </tr></thead>
          <tbody>
            <Tr>
              <td style={S.td}>Iscrizione Albo LEPICOSC obbligatoria?</td>
              <td style={S.no}>NO</td>
              <td style={S.td}>Lavori di edilizia = CHF {totalEdilizia.toLocaleString('de-CH')} &lt; soglia CHF 30.000</td>
            </Tr>
            <Tr odd>
              <td style={S.td}>Registrazione IVA obbligatoria?</td>
              <td style={{ ...S.td, fontWeight: 700, color: 'var(--doc-warn)' }}>VERIFICARE</td>
              <td style={S.td}>Dipende dal fatturato annuo totale 2026. Se &gt; CHF 100k → sì. Consultare fiduciario.</td>
            </Tr>
            <Tr>
              <td style={S.td}>Dividere il preventivo in quote &lt; 30k serve?</td>
              <td style={S.no}>NO</td>
              <td style={S.td}>Non cambia nulla né per LEPICOSC (già sotto soglia) né per IVA (fatturato totale invariato)</td>
            </Tr>
            <Tr odd>
              <td style={S.td}>Domanda di costruzione per putrella?</td>
              <td style={S.yes}>SÌ</td>
              <td style={S.td}>Modifica strutturale — vedi relatorio separato &quot;Procedure Edilizie&quot;</td>
            </Tr>
            <Tr>
              <td style={S.td}>Dichiarazione conformità ESTI?</td>
              <td style={S.yes}>SÌ</td>
              <td style={S.td}>Obbligatoria per legge (NIN 2020) — già inclusa nel preventivo impianto elettrico</td>
            </Tr>
          </tbody>
        </table>

        {/* Section 5 */}
        <div style={S.h1}>5 · Fonti e Riferimenti Normativi</div>
        <table style={S.table}>
          <thead><tr><th style={S.th}>Documento</th><th style={S.th}>Riferimento</th></tr></thead>
          <tbody>
            {[
              ['LEPICOSC 705.500 — Legge impresario costruttore', 'https://m3.ti.ch/CAN/RLeggi/public/index.php/raccolta-leggi/legge/num/418'],
              ['Albo delle Imprese Costruzione — Canton Ticino', 'https://www4.ti.ch/dt/temi/albo-delle-imprese/albo-delle-imprese/albo-delle-imprese'],
              ['Regolamento RLEPICOSC 705.510', 'https://m3.ti.ch/CAN/RLeggi/public/index.php/index/nuovafinestra/atto/419/volume/7%20EDILIZIA%20-%20BENI%20PUBBLICI%20-%20ENERGIA%20-%20TRASPORTI/numLegge/705.510'],
              ['LIVA — Legge federale sull\'imposta sul valore aggiunto (Art. 10)', 'https://www.admin.ch/opc/it/classified-compilation/20081110/index.html'],
              ['SSIC-TI — Società Svizzera Impresari-Costruttori Ticino', 'https://www.ssic-ti.ch/'],
              ['Commissione di Vigilanza LEPICOSC, Bellinzona', 'Tel. +41 91 825 42 49 · Viale Portone 4, Bellinzona · Lun/Mar/Gio/Ven 14-17, Mer 9-11:30'],
            ].map(([doc, url], i) => (
              <Tr key={i} odd={i % 2 === 1}>
                <td style={S.td}>{doc}</td>
                <td style={{ ...S.td, fontFamily: 'monospace', fontSize: '7pt', color: 'var(--doc-accent)', wordBreak: 'break-all' as const }}>{url}</td>
              </Tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div style={{ marginTop: '12mm', paddingTop: '4mm', borderTop: '1px solid var(--doc-line-strong)', display: 'flex', justifyContent: 'space-between', fontSize: '7pt', color: 'var(--doc-ink-subtle)' }}>
          <span>Zanetti Soluzioni Edili · PRE-2026-013</span>
          <span>Analisi LEPICOSC e soglia CHF 30.000 — documento interno</span>
          <span>Generato il {today}</span>
        </div>
      </div>
    </div>
  )
}
