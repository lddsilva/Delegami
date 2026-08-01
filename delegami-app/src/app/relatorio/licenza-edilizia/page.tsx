import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PrintButton } from '@/components/ui/print-button'

export const metadata: Metadata = {
  title: 'PRE-2026-013 - Ballestra - Procedure Edilizie',
}

const S = {
  h1: { fontSize: '13pt', fontWeight: 700, color: 'var(--doc-brand)', marginBottom: '6px', marginTop: '14px', borderBottom: '2px solid var(--doc-brand)', paddingBottom: '3px' } as React.CSSProperties,
  h2: { fontSize: '10pt', fontWeight: 700, color: 'var(--doc-brand)', marginTop: '10px', marginBottom: '4px' } as React.CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '8.5pt', marginBottom: '10px' },
  th: { background: 'var(--doc-brand)', color: 'var(--doc-paper)', padding: '4px 8px', textAlign: 'left' as const, fontWeight: 600, fontSize: '8pt' },
  td: { padding: '4px 8px', borderBottom: '1px solid var(--doc-line)', verticalAlign: 'top' as const, fontSize: '8.5pt' },
  yes: { padding: '4px 8px', borderBottom: '1px solid var(--doc-line)', color: 'var(--doc-negative)', fontWeight: 700, fontSize: '8.5pt' } as React.CSSProperties,
  nota: { padding: '4px 8px', borderBottom: '1px solid var(--doc-line)', color: 'var(--doc-warn)', fontWeight: 700, fontSize: '8.5pt' } as React.CSSProperties,
  no: { padding: '4px 8px', borderBottom: '1px solid var(--doc-line)', color: 'var(--doc-positive)', fontWeight: 600, fontSize: '8.5pt' } as React.CSSProperties,
  warn: { background: 'var(--doc-warn-soft)', border: '1px solid var(--doc-warn-line)', borderRadius: '4px', padding: '6px 10px', fontSize: '8pt', color: 'var(--doc-warn)', marginBottom: '8px' } as React.CSSProperties,
  ok: { background: 'var(--doc-positive-soft)', border: '1px solid var(--doc-positive-line)', borderRadius: '4px', padding: '6px 10px', fontSize: '8pt', color: 'var(--doc-positive)', marginBottom: '8px' } as React.CSSProperties,
  info: { background: 'var(--doc-accent-soft)', border: '1px solid var(--doc-line-strong)', borderRadius: '4px', padding: '6px 10px', fontSize: '8pt', color: 'var(--doc-brand)', marginBottom: '8px' } as React.CSSProperties,
  src: { fontSize: '7pt', color: 'var(--doc-ink-muted)', fontStyle: 'italic' } as React.CSSProperties,
}

const Tr = ({ odd, children }: { odd?: boolean; children: React.ReactNode }) => (
  <tr style={{ background: odd ? 'var(--doc-fill)' : 'var(--doc-paper)' }}>{children}</tr>
)

export default function RelatorioLicenzaEdilizia() {
  const today = new Date().toLocaleDateString('it-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
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
            <div style={{ fontSize: '8pt', color: 'var(--doc-ink-muted)', marginTop: '3px', lineHeight: 1.5 }}>
              Via Cantonale, 1 · 6983 Magliaso · Tel: +41 76 545 40 07
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '9pt', fontWeight: 700, color: 'var(--doc-brand)' }}>ANALISI INTERNA — PROCEDURE EDILIZIE</div>
            <div style={{ fontSize: '8pt', color: 'var(--doc-ink-muted)', marginTop: '2px', lineHeight: 1.5 }}>
              Rif. preventivo: <strong>PRE-2026-013</strong><br />Data: {today}
            </div>
          </div>
        </div>

        <div style={S.warn}>■ DOCUMENTO INTERNO — Non condividere con il cliente.</div>

        <div style={{ background: 'var(--doc-accent-soft)', borderRadius: '4px', padding: '6px 10px', marginBottom: '10px', fontSize: '8.5pt' }}>
          <strong>Oggetto:</strong> Analisi procedure edilizie necessarie — Ristrutturazione Appartamento Ballestra<br />
          <strong>Indirizzo opera:</strong> Via Bernardino Stazio 2, 3° piano, Massagno<br />
          <strong>Quesito:</strong> Per i lavori previsti nel preventivo, serve una domanda di costruzione, una notifica o niente?
        </div>

        {/* Section 1 */}
        <div style={S.h1}>1 · Quadro Normativo — Legge Edilizia Cantonale (LE) + RLE</div>
        <p style={{ fontSize: '8.5pt', lineHeight: 1.6, marginBottom: '8px' }}>
          La Legge Edilizia Cantonale del Canton Ticino (LE 705.100, aggiornata al 1° gennaio 2024) e il suo Regolamento di applicazione (RLE 705.110) stabiliscono tre livelli di procedura per i lavori edilizi:
        </p>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Procedura</th>
              <th style={S.th}>Quando si applica</th>
              <th style={S.th}>Pubblicazione / Tempi</th>
            </tr>
          </thead>
          <tbody>
            <Tr>
              <td style={{ ...S.td, fontWeight: 700, color: 'var(--doc-positive)' }}>Nessun adempimento</td>
              <td style={S.td}>Manutenzione ordinaria senza modifiche strutturali, di uso o di aspetto esterno. Piccoli interventi interni non strutturali.</td>
              <td style={S.td}>—</td>
            </Tr>
            <Tr odd>
              <td style={{ ...S.td, fontWeight: 700, color: 'var(--doc-warn)' }}>Notifica di costruzione<br />(Art. 6 RLE)</td>
              <td style={S.td}>Lavori di importanza secondaria: ristrutturazioni senza modifica sostanziale di destinazione, volume o aspetto esterno. Riconfigurazione interna nell&apos;ambito della stessa destinazione d&apos;uso.</td>
              <td style={S.td}>Nessuna pubblicazione su foglio ufficiale. Il Comune può dispensare anche dalla notifica ai vicini. Termine di risposta: 20 giorni.</td>
            </Tr>
            <Tr>
              <td style={{ ...S.td, fontWeight: 700, color: 'var(--doc-negative)' }}>Domanda di costruzione<br />(Art. 1 LE)</td>
              <td style={S.td}>Nuove costruzioni, ricostruzioni, trasformazioni rilevanti, demolizioni, <strong>modifiche strutturali</strong>, <strong>cambiamento di destinazione d&apos;uso</strong> (es. residenziale → commerciale), modifiche importanti del terreno.</td>
              <td style={S.td}>Pubblicazione sul Foglio Ufficiale. Termine legale: 30 giorni dalla pubblicazione. Tecnico abilitato obbligatorio.</td>
            </Tr>
          </tbody>
        </table>
        <div style={S.src}>Fonti: LE 705.100 Art. 1, 9–11 · RLE 705.110 Art. 3, 6 · Lugano.ch procedure edilizie · Minusio.ch procedure edilizie</div>

        {/* Section 2 */}
        <div style={S.h1}>2 · Analisi per Intervento — Appartamento Ballestra</div>

        <div style={S.h2}>2.1 Apertura corridoio–soggiorno con posa putrella metallica (vano 2,5 m)</div>
        <div style={S.ok}>
          ✓ <strong>Notifica di costruzione — probabilmente sufficiente</strong>
        </div>

        <div style={{ background: 'var(--doc-accent-soft)', border: '1px solid var(--doc-line-strong)', borderRadius: '4px', padding: '6px 10px', marginBottom: '8px', fontSize: '8.5pt', color: 'var(--doc-brand)' }}>
          <strong>Aggiornamento rispetto all&apos;analisi iniziale:</strong> La parete da demolire è una <strong>parete di tamponamento/vedazione</strong> (non portante). Non trasferisce carichi strutturali della soletta. La putrella metallica viene installata non per ragioni strutturali, ma come <strong>architrave/telaio</strong> del vano di 2,5 m per dare rigidità all&apos;apertura e sostenere la muratura di riempimento superiore. Questo cambia sostanzialmente la classificazione dell&apos;intervento.
        </div>

        <p style={{ fontSize: '8.5pt', lineHeight: 1.6, marginBottom: '6px' }}>
          Giustificazione normativa:
        </p>
        <ul style={{ fontSize: '8.5pt', lineHeight: 1.7, paddingLeft: '14px', marginBottom: '8px' }}>
          <li>La <strong>parete di tamponamento</strong> non è un elemento strutturale — la sua rimozione non costituisce &quot;modifica strutturale&quot; ai sensi dell&apos;Art. 1 LE</li>
          <li>Il RLE Art. 3 esenta da qualsiasi adempimento le <em>&quot;piccole trasformazioni all&apos;interno degli edifici, come lo spostamento di pareti e porte&quot;</em></li>
          <li>Un vano di 2,5 m in parete non portante è una riconfigurazione interna di importanza secondaria → al più soggetta a <strong>notifica</strong> (Art. 6 RLE), non a domanda di costruzione</li>
          <li>La putrella in questo contesto svolge la funzione di <strong>architrave</strong> (telaio del vano), non di trave strutturale portante — non trasferisce carichi della soletta</li>
          <li>Nessuna modifica all&apos;aspetto esterno, al volume né alla destinazione d&apos;uso dell&apos;appartamento</li>
        </ul>

        <div style={{ ...S.warn, background: 'var(--doc-warn-soft)', marginBottom: '8px' }}>
          ⚠️ <strong>Distinzione importante da documentare:</strong> Prima dell&apos;inizio lavori, verificare e documentare per iscritto (con foto dello stato attuale) che la parete è effettivamente di tamponamento e non portante. In caso di contestazione futura, questa documentazione protegge da responsabilità.
        </div>

        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Aspetto</th><th style={S.th}>Dettaglio</th>
          </tr></thead>
          <tbody>
            <Tr><td style={S.td}>Procedura</td><td style={{ ...S.td, fontWeight: 700, color: 'var(--doc-warn)' }}>Notifica di costruzione (da verificare con UTC Massagno)</td></Tr>
            <Tr odd><td style={S.td}>Natura della parete</td><td style={S.td}>Parete di tamponamento/vedazione — non portante. Nessun carico strutturale.</td></Tr>
            <Tr><td style={S.td}>Natura della putrella</td><td style={S.td}>Architrave/telaio del vano 2,5 m — funzione di rigidità e sostegno muratura superiore, non strutturale</td></Tr>
            <Tr odd><td style={S.td}>Tecnico necessario?</td><td style={S.td}>Non obbligatorio (no strutturale), ma consigliato per documentare natura non portante della parete</td></Tr>
            <Tr><td style={S.td}>Documenti per notifica</td><td style={S.td}>Planimetria prima/dopo, breve descrizione lavori, modulo istanza di notifica Comune Massagno</td></Tr>
            <Tr odd><td style={S.td}>Tempi</td><td style={S.td}>20 giorni dalla notifica. Spesso senza osservazioni per lavori interni di questo tipo.</td></Tr>
            <Tr><td style={S.td}>Costo stimato</td><td style={S.td}>Tasse comunali CHF 100–300 (importanza secondaria)</td></Tr>
            <Tr odd><td style={S.td}>Attenzione</td><td style={S.td}>Verificare con l&apos;amministrazione condominiale: un vano di 2,5 m tra corridoio e soggiorno modifica l&apos;interno dell&apos;appartamento — potrebbe richiedere autorizzazione assembleare.</td></Tr>
          </tbody>
        </table>

        <div style={S.h2}>2.2 Creazione nuovo bagno nella camera matrimoniale (ex-camera)</div>
        <div style={S.ok}>
          ✓ <strong>Notifica di costruzione — probabilmente sufficiente</strong>
        </div>
        <p style={{ fontSize: '8.5pt', lineHeight: 1.6, marginBottom: '6px' }}>
          L&apos;intervento converte una camera da letto in bagno all&apos;interno di un appartamento che rimane <strong>interamente residenziale</strong>. Non vi è alcuna modifica della destinazione d&apos;uso dell&apos;unità abitativa (residenziale → residenziale).
        </p>
        <p style={{ fontSize: '8.5pt', lineHeight: 1.6, marginBottom: '6px' }}>
          Giustificazione normativa:
        </p>
        <ul style={{ fontSize: '8.5pt', lineHeight: 1.7, paddingLeft: '14px', marginBottom: '8px' }}>
          <li>Il <em>&quot;cambiamento di destinazione&quot;</em> (Art. 1 LE) che richiede domanda si riferisce a cambi di uso dell&apos;unità/edificio (residenziale→commerciale), non alla riconfigurazione di stanze interne</li>
          <li>Le pareti in cartongesso previste sono <strong>non portanti</strong> → rientrano nelle &quot;piccole trasformazioni&quot; (Art. 3 RLE)</li>
          <li>Nessuna modifica di volume, nessuna modifica dell&apos;aspetto esterno, nessuna modifica di uso dell&apos;unità abitativa</li>
          <li>La creazione di pavimento su 3 livelli rimane interna all&apos;appartamento</li>
        </ul>
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Aspetto</th><th style={S.th}>Dettaglio</th>
          </tr></thead>
          <tbody>
            <Tr><td style={S.td}>Procedura</td><td style={{ ...S.td, fontWeight: 700, color: 'var(--doc-warn)' }}>Notifica di costruzione</td></Tr>
            <Tr odd><td style={S.td}>Documenti richiesti</td><td style={S.td}>Planimetria prima/dopo, breve descrizione lavori, modulo istanza di notifica</td></Tr>
            <Tr><td style={S.td}>Tempi</td><td style={S.td}>20 giorni dalla notifica. Spesso senza osservazioni, si può procedere</td></Tr>
            <Tr odd><td style={S.td}>Attenzione</td><td style={S.td}>Verificare con l&apos;amministrazione del condominio: i lavori idraulici toccano la colonna di scarico comune → potrebbe servire autorizzazione assemblea condominiale</td></Tr>
            <Tr><td style={S.td}>Costo stimato</td><td style={S.td}>Tasse comunali CHF 100–300 (importanza secondaria)</td></Tr>
          </tbody>
        </table>

        {/* Section 3 - all other works */}
        <div style={S.h1}>3 · Tutti gli Altri Lavori del Preventivo</div>
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Lavoro</th>
            <th style={{ ...S.th, width: '130px' }}>Procedura</th>
            <th style={S.th}>Motivazione</th>
          </tr></thead>
          <tbody>
            {[
              ['Ristrutturazione bagno esistente (piastrelatura, sanitari, box doccia)', 'Nessun adempimento', 'Manutenzione straordinaria senza modifiche strutturali né di uso'],
              ['Muratura – tracce elettriche nelle stanze', 'Nessun adempimento', 'Piccole tracce per impianti, nessuna modifica strutturale'],
              ['Rimozione armadio + nicchia in cartongesso soggiorno', 'Nessun adempimento', 'Arredo/finitura interna, nessuna parete portante'],
              ['Contropareti in cartongesso (corridoio, cucina, bagni)', 'Nessun adempimento', 'Pareti non portanti, nessuna modifica di struttura o destinazione'],
              ['Chiusura porta esistente + apertura nuova porta (stanza padronale)', 'Notifica – da verificare', 'Modifica aperture interne; se parete non portante → notifica. Verificare con UTC Massagno'],
              ['Piastrelatura corridoio e cucina', 'Nessun adempimento', 'Lavori di finitura interni'],
              ['Cucina componibile + elettrodomestici', 'Nessun adempimento', 'Arredo, nessuna modifica edilizia'],
              ['Pittura appartamento + battiscopa', 'Nessun adempimento', 'Manutenzione ordinaria/straordinaria'],
              ['Impianto elettrico', 'Regolato da ESTI (NIE/NIN 2020)', 'Dichiarazione di conformità ESTI obbligatoria — procedura separata'],
              ['Impianto idraulico (GC Termo-Idraulica)', 'Nessun adempimento edilizio', 'Intervento su impianti interni; offerta separata N° 2026.05.002'],
            ].map(([lavoro, proc, mot], i) => (
              <Tr key={i} odd={i % 2 === 1}>
                <td style={S.td}>{lavoro}</td>
                <td style={proc.startsWith('Nessun') ? S.no : proc.startsWith('Notifica') ? S.nota : S.yes}>{proc}</td>
                <td style={S.td}>{mot}</td>
              </Tr>
            ))}
          </tbody>
        </table>

        {/* Section 4 */}
        <div className="pb" style={S.h1}>4 · Riepilogo e Azioni da Intraprendere</div>
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Intervento</th>
            <th style={{ ...S.th, width: '120px' }}>Procedura</th>
            <th style={{ ...S.th, width: '80px' }}>Priorità</th>
            <th style={S.th}>Azione richiesta</th>
          </tr></thead>
          <tbody>
            <Tr>
              <td style={S.td}>Apertura corridoio-soggiorno — vano 2,5 m in <strong>parete di tamponamento</strong> (non portante) con putrella architrave</td>
              <td style={S.nota}>Notifica</td>
              <td style={{ ...S.td, fontWeight: 700, color: 'var(--doc-warn)' }}>Necessario</td>
              <td style={S.td}>1) Documentare per iscritto/foto che la parete è non portante. 2) Presentare notifica a UTC Massagno. 3) Verificare con amministrazione condominiale. 4) Telefonare UTC per conferma rapida (091 960 35 22).</td>
            </Tr>
            <Tr odd>
              <td style={S.td}>Nuovo bagno in camera matrimoniale</td>
              <td style={S.nota}>Notifica</td>
              <td style={{ ...S.td, fontWeight: 700, color: 'var(--doc-warn)' }}>Necessario</td>
              <td style={S.td}>Presentare istanza di notifica all&apos;UTC Massagno prima dell&apos;inizio. Verificare con l&apos;amministrazione condominiale.</td>
            </Tr>
            <Tr>
              <td style={S.td}>Chiusura/apertura porte stanza padronale</td>
              <td style={S.nota}>Notifica – da verificare</td>
              <td style={{ ...S.td, color: 'var(--doc-ink-muted)' }}>Verificare</td>
              <td style={S.td}>Telefonare UTC Massagno (091 960 35 22) per conferma rapida.</td>
            </Tr>
            <Tr odd>
              <td style={S.td}>Impianto elettrico</td>
              <td style={S.nota}>Dichiaraz. ESTI</td>
              <td style={{ ...S.td, color: 'var(--doc-ink-muted)' }}>Normale</td>
              <td style={S.td}>Elettricista certificato NIN deve emettere dichiarazione di conformità ESTI al termine lavori. Già incluso nel preventivo (CHF 650).</td>
            </Tr>
            <Tr>
              <td style={S.td}>Tutti gli altri lavori</td>
              <td style={S.no}>Nessun adempimento</td>
              <td style={{ ...S.td, color: 'var(--doc-positive)' }}>—</td>
              <td style={S.td}>Nessun atto necessario.</td>
            </Tr>
          </tbody>
        </table>

        <div style={S.info}>
          <strong>Contatto diretto per conferma definitiva:</strong><br />
          Ufficio Tecnico Comunale di Massagno · Via Motta 53, 6900 Massagno<br />
          📞 091 960 35 22 · ✉ utc@massagno.ch · Lun-Ven 10:00–11:45, 14:00–16:00 (Mar fino 18:30)
        </div>

        {/* Sources */}
        <div style={S.h1}>5 · Fonti e Riferimenti Normativi</div>
        <table style={S.table}>
          <thead><tr><th style={S.th}>Documento</th><th style={S.th}>Riferimento</th></tr></thead>
          <tbody>
            {[
              ['Legge Edilizia Cantonale del Ticino (LE 705.100)', 'https://m3.ti.ch/CAN/RLeggi/public/index.php/raccolta-leggi/pdfatto/atto/9703'],
              ['Regolamento di applicazione LE (RLE 705.110)', 'https://m3.ti.ch/CAN/RLeggi/public/index.php/raccolta-leggi/pdfatto/atto/8903'],
              ['Procedure edilizie — Città di Lugano', 'https://www.lugano.ch/temi-servizi/territorio-e-mobilita/edilizia/procedure-tasse/'],
              ['Procedure edilizie — Comune di Minusio (esempio)', 'https://www.minusio.ch/Procedure-edilizie-domanda-di-costruzione-e-notifica-di-costruzione-b2029c00'],
              ['Ufficio Tecnico Comunale Massagno', 'https://massagno.ch/Ufficio-tecnico'],
              ['Formulario istanza di notifica — Massagno', 'https://www.massagno.ch/Formulario-istanza-di-notifica-235fd800?i=1'],
              ['Domande di costruzione — Canton Ticino', 'https://www4.ti.ch/dt/sg/udc/temi/domande-di-costruzione/tema/tema'],
            ].map(([doc, url], i) => (
              <Tr key={i} odd={i % 2 === 1}>
                <td style={S.td}>{doc}</td>
                <td style={{ ...S.td, fontFamily: 'monospace', fontSize: '7.5pt', color: 'var(--doc-accent)' }}>{url}</td>
              </Tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div style={{ marginTop: '12mm', paddingTop: '4mm', borderTop: '1px solid var(--doc-line-strong)', display: 'flex', justifyContent: 'space-between', fontSize: '7pt', color: 'var(--doc-ink-subtle)' }}>
          <span>Zanetti Soluzioni Edili · PRE-2026-013</span>
          <span>Analisi procedure edilizie — documento interno</span>
          <span>Generato il {today}</span>
        </div>
      </div>
    </div>
  )
}
