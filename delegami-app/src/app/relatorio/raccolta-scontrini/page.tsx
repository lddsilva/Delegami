import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PrintButton } from '@/components/ui/print-button'

export const metadata: Metadata = {
  title: 'Raccolta scontrini & deducibilità — Ditta Individuale 2026',
}

const S = {
  h1: { fontSize: '13pt', fontWeight: 700, color: 'var(--doc-brand)', marginBottom: '4px', marginTop: '14px', borderBottom: '2px solid var(--doc-brand)', paddingBottom: '3px' } as React.CSSProperties,
  h2: { fontSize: '10pt', fontWeight: 700, color: 'var(--doc-ink-strong)', marginTop: '10px', marginBottom: '4px' } as React.CSSProperties,
  p: { fontSize: '9pt', lineHeight: 1.5, color: 'var(--doc-ink-strong)', margin: '4px 0' } as React.CSSProperties,
  small: { fontSize: '8pt', color: 'var(--doc-ink-muted)', fontStyle: 'italic' as const, margin: '6px 0' } as React.CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '8.5pt', margin: '8px 0 12px' },
  th: { background: 'var(--doc-brand)', color: 'var(--doc-paper)', padding: '4px 7px', textAlign: 'left' as const, fontWeight: 600, fontSize: '8pt' },
  thR: { background: 'var(--doc-brand)', color: 'var(--doc-paper)', padding: '4px 7px', textAlign: 'right' as const, fontWeight: 600, fontSize: '8pt' },
  td: { padding: '4px 7px', borderBottom: '1px solid var(--doc-line)', fontSize: '8.5pt', verticalAlign: 'top' as const },
  tdR: { padding: '4px 7px', borderBottom: '1px solid var(--doc-line)', textAlign: 'right' as const, fontSize: '8.5pt', verticalAlign: 'top' as const, fontVariantNumeric: 'tabular-nums' as const },
  callout: { background: 'var(--doc-warn-soft)', borderLeft: '4px solid var(--doc-warn)', padding: '8px 12px', margin: '10px 0', fontSize: '9pt', lineHeight: 1.5 } as React.CSSProperties,
  good: { background: 'var(--doc-positive-soft)', borderLeft: '4px solid var(--doc-positive)', padding: '8px 12px', margin: '10px 0', fontSize: '9pt', lineHeight: 1.5 } as React.CSSProperties,
  diagram: { background: 'var(--doc-fill)', padding: '10px 14px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '8.5pt', lineHeight: 1.55, whiteSpace: 'pre' as const, margin: '8px 0' } as React.CSSProperties,
  li: { fontSize: '9pt', lineHeight: 1.55, color: 'var(--doc-ink-strong)', marginBottom: '3px' } as React.CSSProperties,
}

const fmt = (n: number) => n.toLocaleString('de-CH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

export default function RaccoltaScontriniPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-6 print:bg-white print:py-0">
      <style>{`
        @media print {
          @page { margin: 14mm 14mm; size: A4; }
          html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
          .no-print { display: none !important; }
          .sheet { padding: 0 !important; max-width: none !important; box-shadow: none !important; }
          h1, h2, h3 { page-break-after: avoid; }
          table, tr { page-break-inside: avoid; }
        }
        .sheet { background: white; max-width: 880px; margin: 0 auto; padding: 28px 36px 40px; box-shadow: 0 4px 14px rgba(0,0,0,0.05); }
      `}</style>

      <div className="no-print mx-auto mb-4 flex max-w-4xl items-center justify-between px-4">
        <Link href="/relatori" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft className="h-4 w-4" />
          Torna ai relatori
        </Link>
        <PrintButton />
      </div>

      <article className="sheet">
        <header style={{ borderBottom: '2px solid var(--doc-brand)', paddingBottom: '8px', marginBottom: '12px' }}>
          <h1 style={{ fontSize: '15pt', fontWeight: 700, color: 'var(--doc-brand)', margin: 0 }}>
            Raccolta scontrini &amp; deducibilità
          </h1>
          <p style={{ fontSize: '9pt', color: 'var(--doc-ink-muted)', marginTop: '4px', marginBottom: 0 }}>
            Zanetti Soluzioni Edili — Ditta Individuale · Magliaso TI · Anno fiscale 2026
          </p>
        </header>

        <p style={S.p}>
          Questo documento spiega <strong>perché conviene raccogliere e fotografare TUTTI gli scontrini</strong>
          {' '}delle spese aziendali, come funzionano le deduzioni nel caso di ditta individuale e quali sono
          {' '}le soglie fiscali da monitorare. Le cifre sono indicative; i valori esatti vanno confermati con
          {' '}il fiduciario, che conosce la situazione completa di Marcos Zanetti.
        </p>

        <h2 style={S.h1}>1. Inquadramento — Ditta individuale</h2>
        <p style={S.p}>
          La <em>Zanetti Soluzioni Edili</em> è una <strong>ditta individuale</strong>: non c&apos;è separazione
          {' '}fiscale tra azienda e persona. L&apos;utile dell&apos;attività finisce direttamente nella
          {' '}<em>dichiarazione personale</em> di Marcos Zanetti come reddito da attività indipendente.
        </p>
        <p style={S.p}>
          Conseguenza: <strong>ogni spesa professionale documentata riduce l&apos;utile aziendale</strong>,
          {' '}quindi riduce il reddito imponibile, quindi riduce l&apos;imposta sul reddito da pagare a fine anno.
          {' '}Senza documento (scontrino, fattura, ricevuta), la spesa <strong>non è deducibile</strong> anche
          {' '}se realmente avvenuta: l&apos;autorità fiscale (AFC + Cantonale Ticino) richiede prove.
        </p>

        <h2 style={S.h1}>2. Stato attuale — Nessuna registrazione IVA</h2>
        <p style={S.p}>
          Marcos <strong>non è ancora registrato al regime IVA</strong> perché il fatturato non ha superato la
          {' '}soglia obbligatoria di <strong>CHF 100&apos;000 nei 12 mesi mobili</strong>.
        </p>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Aspetto</th>
              <th style={S.th}>Conseguenza oggi (senza IVA)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={S.td}>Fatture al cliente</td>
              <td style={S.td}>Senza IVA — prezzi netti</td>
            </tr>
            <tr style={{ background: 'var(--doc-fill)' }}>
              <td style={S.td}>IVA sui materiali (8.1%)</td>
              <td style={S.td}><strong>Non recuperabile</strong> — diventa costo puro</td>
            </tr>
            <tr>
              <td style={S.td}>Dichiarazioni IVA trimestrali</td>
              <td style={S.td}>Non dovute</td>
            </tr>
            <tr style={{ background: 'var(--doc-fill)' }}>
              <td style={S.td}>Soglia obbligatoria</td>
              <td style={S.td}>Iscrizione entro 30 giorni quando fatturato 12 mesi &gt; CHF 100&apos;000</td>
            </tr>
          </tbody>
        </table>
        <div style={S.callout}>
          <strong>Monitorare il fatturato.</strong> Quando si avvicina a CHF 80&apos;000–90&apos;000 nei 12 mesi
          {' '}mobili, parlare con il fiduciario per pianificare l&apos;iscrizione IVA (anche volontariamente,
          {' '}prima della soglia, può convenire se i clienti sono prevalentemente aziende).
        </div>
        <p style={S.p}>
          A questo livello, il valore di raccogliere scontrini deriva <strong>esclusivamente</strong> dalla
          {' '}deduzione sull&apos;imposta sul reddito. Quando Marcos passerà al regime IVA, ogni scontrino
          {' '}varrà <em>il doppio</em>: deduzione imposta + recupero IVA 8.1%.
        </p>

        <h2 style={S.h1}>3. Come funziona la deduzione, passo-passo</h2>
        <div style={S.diagram}>{`Fatturato annuo                          150'000
− Spese documentate                      ( 50'000)
= Utile aziendale                         100'000

Utile aziendale + altri redditi           100'000
− Deduzioni personali                    ( 25'000)
  (AVS, LPP, cassa malati, 3° pilastro)
= Reddito imponibile                       75'000

Reddito imponibile × aliquota progressiva
(Federale + Cantonale TI + Comunale Magliaso)
= IMPOSTA TOTALE                        ~  12'500`}</div>

        <p style={S.p}>
          L&apos;imposta in Svizzera è <strong>progressiva</strong>: ogni franco aggiuntivo è tassato a
          {' '}un&apos;aliquota più alta del precedente, come una scala. Quello che conta per le deduzioni è
          {' '}l&apos;<strong>aliquota marginale</strong>, cioè quanta imposta in meno paghi sull&apos;ultimo
          {' '}franco di reddito.
        </p>

        <h2 style={S.h1}>4. Aliquota marginale stimata (Magliaso, coniugato)</h2>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.thR}>Reddito imponibile</th>
              <th style={S.thR}>Aliquota marginale</th>
              <th style={S.thR}>Risparmio per CHF 1&apos;000 di spesa</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={S.tdR}>CHF {fmt(50000)}</td>
              <td style={S.tdR}>~18 %</td>
              <td style={S.tdR}>~CHF 180</td>
            </tr>
            <tr style={{ background: 'var(--doc-fill)' }}>
              <td style={S.tdR}>CHF {fmt(80000)}</td>
              <td style={S.tdR}>~24 %</td>
              <td style={S.tdR}>~CHF 240</td>
            </tr>
            <tr>
              <td style={S.tdR}>CHF {fmt(120000)}</td>
              <td style={S.tdR}>~30 %</td>
              <td style={S.tdR}>~CHF 300</td>
            </tr>
            <tr style={{ background: 'var(--doc-fill)' }}>
              <td style={S.tdR}>CHF {fmt(180000)}+</td>
              <td style={S.tdR}>~35 %</td>
              <td style={S.tdR}>~CHF 350</td>
            </tr>
          </tbody>
        </table>
        <p style={S.small}>
          Valori indicativi 2026, soggetto coniugato. Aliquote esatte: confermare con il fiduciario.
          {' '}Per single/celibe le aliquote sono più alte a parità di reddito.
        </p>

        <h2 style={S.h1}>5. Esempio numerico — Anno 2026</h2>
        <p style={S.p}>Ipotesi: utile aziendale CHF 90&apos;000, soggetto coniugato in Magliaso.</p>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Voce</th>
              <th style={S.thR}>Scenario A — Tutti gli scontrini</th>
              <th style={S.thR}>Scenario B — 10&apos;000 di scontrini persi</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={S.td}>Spese documentate</td>
              <td style={S.tdR}>CHF {fmt(40000)}</td>
              <td style={S.tdR}>CHF {fmt(30000)}</td>
            </tr>
            <tr style={{ background: 'var(--doc-fill)' }}>
              <td style={S.td}>Utile aziendale</td>
              <td style={S.tdR}>CHF {fmt(90000)}</td>
              <td style={S.tdR}>CHF {fmt(100000)}</td>
            </tr>
            <tr>
              <td style={S.td}>Reddito imponibile (dopo deduzioni personali)</td>
              <td style={S.tdR}>~CHF {fmt(75000)}</td>
              <td style={S.tdR}>~CHF {fmt(85000)}</td>
            </tr>
            <tr style={{ background: 'var(--doc-fill)' }}>
              <td style={S.td}><strong>Imposta totale stimata</strong></td>
              <td style={S.tdR}><strong>~CHF {fmt(12500)}</strong></td>
              <td style={S.tdR}><strong>~CHF {fmt(15200)}</strong></td>
            </tr>
            <tr>
              <td style={S.td}><strong>Differenza</strong></td>
              <td style={S.tdR} colSpan={2}><strong style={{ color: 'var(--doc-negative)' }}>+CHF 2&apos;700 di imposta in più</strong> per CHF 10&apos;000 di scontrini buttati</td>
            </tr>
          </tbody>
        </table>
        <div style={S.callout}>
          <strong>In pratica:</strong> ogni scontrino di CHF 100 buttato = ~CHF 27 di imposta extra a fine anno.
          {' '}Fotografare lo scontrino richiede 5 secondi. ROI orario equivalente: oltre CHF 15&apos;000 / ora
          {' '}di tempo investito in raccolta.
        </div>

        <h2 style={S.h1}>6. Cosa si può dedurre (e cosa no)</h2>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Categoria</th>
              <th style={S.th}>Deducibilità</th>
              <th style={S.th}>Note</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={S.td}>Materiale di costruzione, ferramenta, EPI</td>
              <td style={S.td} colSpan={1}><strong style={{ color: 'var(--doc-positive)' }}>100%</strong></td>
              <td style={S.td}>Scontrino o fattura sempre</td>
            </tr>
            <tr style={{ background: 'var(--doc-fill)' }}>
              <td style={S.td}>Carburante &amp; manutenzione veicolo lavoro</td>
              <td style={S.td}><strong style={{ color: 'var(--doc-positive)' }}>Proporzionale</strong></td>
              <td style={S.td}>Quota uso professionale (es. 70%)</td>
            </tr>
            <tr>
              <td style={S.td}>Telefono / internet</td>
              <td style={S.td}><strong style={{ color: 'var(--doc-positive)' }}>Proporzionale</strong></td>
              <td style={S.td}>Tipicamente 50–70%</td>
            </tr>
            <tr style={{ background: 'var(--doc-fill)' }}>
              <td style={S.td}>Formazione professionale, libri tecnici</td>
              <td style={S.td}><strong style={{ color: 'var(--doc-positive)' }}>100%</strong></td>
              <td style={S.td}>Corsi, fiere di settore</td>
            </tr>
            <tr>
              <td style={S.td}>Assicurazioni professionali, RC</td>
              <td style={S.td}><strong style={{ color: 'var(--doc-positive)' }}>100%</strong></td>
              <td style={S.td}>Polizza dedicata all&apos;attività</td>
            </tr>
            <tr style={{ background: 'var(--doc-fill)' }}>
              <td style={S.td}>Contributi AVS/AI/IPG imprenditore</td>
              <td style={S.td}><strong style={{ color: 'var(--doc-positive)' }}>100%</strong></td>
              <td style={S.td}>Bollettini cassa di compensazione</td>
            </tr>
            <tr>
              <td style={S.td}>Subappalti, manodopera esterna</td>
              <td style={S.td}><strong style={{ color: 'var(--doc-positive)' }}>100%</strong></td>
              <td style={S.td}>Richiede <strong>fattura nominativa</strong></td>
            </tr>
            <tr style={{ background: 'var(--doc-fill)' }}>
              <td style={S.td}>Affitto cantiere/deposito attrezzi</td>
              <td style={S.td}><strong style={{ color: 'var(--doc-positive)' }}>100%</strong></td>
              <td style={S.td}>Contratto + ricevute</td>
            </tr>
            <tr>
              <td style={S.td}>Vestiario da lavoro <em>specifico</em></td>
              <td style={S.td}><strong style={{ color: 'var(--doc-warn)' }}>Con cautela</strong></td>
              <td style={S.td}>EPI sì; vestiario generico no</td>
            </tr>
            <tr style={{ background: 'var(--doc-fill)' }}>
              <td style={S.td}>Pasti durante trasferte di lavoro</td>
              <td style={S.td}><strong style={{ color: 'var(--doc-warn)' }}>Limite forfettario</strong></td>
              <td style={S.td}>Regola specifica AFC</td>
            </tr>
            <tr>
              <td style={S.td}>3° pilastro (3a)</td>
              <td style={S.td}><strong style={{ color: 'var(--doc-warn)' }}>Con limiti</strong></td>
              <td style={S.td}>~CHF 7&apos;000/anno (2026)</td>
            </tr>
            <tr style={{ background: 'var(--doc-negative-soft)' }}>
              <td style={S.td}>Pasti rutinieri personali</td>
              <td style={S.td}><strong style={{ color: 'var(--doc-negative)' }}>No</strong></td>
              <td style={S.td}>Spesa privata</td>
            </tr>
            <tr style={{ background: 'var(--doc-negative-soft)' }}>
              <td style={S.td}>Vestiario quotidiano</td>
              <td style={S.td}><strong style={{ color: 'var(--doc-negative)' }}>No</strong></td>
              <td style={S.td}>Spesa privata</td>
            </tr>
            <tr style={{ background: 'var(--doc-negative-soft)' }}>
              <td style={S.td}>Spese palesemente private</td>
              <td style={S.td}><strong style={{ color: 'var(--doc-negative)' }}>No</strong></td>
              <td style={S.td}>Mai dedurre, rischio sanzioni</td>
            </tr>
          </tbody>
        </table>

        <h2 style={S.h1}>7. Procedura operativa</h2>
        <ol style={{ paddingLeft: '20px', margin: '6px 0 10px' }}>
          <li style={S.li}>
            <strong>Foto immediata.</strong> Ad ogni acquisto, fotografare lo scontrino con l&apos;app Zanetti Office:
            {' '}menu <em>Scontrini</em> → pulsante fotocamera. Si può assegnare già l&apos;opera di riferimento al
            {' '}momento della foto.
          </li>
          <li style={S.li}>
            <strong>Acquisti sopra CHF 400</strong>: chiedere SEMPRE fattura nominativa intestata a{' '}
            <em>Zanetti Soluzioni Edili — Marcos Zanetti Filho — Via Cantonale 1, 6983 Magliaso</em>.
            {' '}Sarà essenziale quando si passerà al regime IVA.
          </li>
          <li style={S.li}>
            <strong>Annotare il contesto</strong>: opera, cosa è stato comprato, perché. L&apos;app permette
            {' '}una nota libera per ogni scontrino.
          </li>
          <li style={S.li}>
            <strong>Mensile</strong>: rivedere gli scontrini &ldquo;Da processare&rdquo; e trasformarli in
            {' '}spese. Più si lascia accumulare, più è difficile ricordare il contesto.
          </li>
          <li style={S.li}>
            <strong>Fine anno</strong>: esportare l&apos;elenco completo delle spese dall&apos;app e
            {' '}consegnarlo al fiduciario per la dichiarazione fiscale.
          </li>
        </ol>

        <h2 style={S.h1}>8. Soglia IVA — Cosa monitorare di mese in mese</h2>
        <p style={S.p}>
          La soglia obbligatoria è basata sul <strong>fatturato dei 12 mesi mobili</strong>, non sull&apos;anno
          {' '}calendario. Quando supera CHF 100&apos;000:
        </p>
        <ul style={{ paddingLeft: '20px', margin: '4px 0' }}>
          <li style={S.li}>Iscrizione presso ESTV entro <strong>30 giorni</strong>.</li>
          <li style={S.li}>Da quel momento, IVA 8.1% su tutte le nuove fatture.</li>
          <li style={S.li}>IVA recuperabile su tutti gli acquisti aziendali.</li>
          <li style={S.li}>Dichiarazioni periodiche (trimestrali o semestrali).</li>
        </ul>
        <div style={S.callout}>
          <strong>Sanzione tipica</strong> in caso di mancata iscrizione: l&apos;AFC chiede l&apos;IVA arretrata
          {' '}su tutte le fatture emesse <em>sopra la soglia senza addebito IVA</em>. L&apos;importo esce
          {' '}direttamente dalla cassa di Marcos (i clienti non rifatturano), oltre a multa e interessi.
        </div>

        <h2 style={S.h1}>9. Riepilogo</h2>
        <div style={S.good}>
          <strong>Continuare a fotografare ogni scontrino.</strong>
          {' '}Anche senza IVA recuperabile, ogni CHF 1&apos;000 di spese documentate vale tra CHF 180 e CHF 350
          {' '}di imposta evitata. Cinque secondi di tempo per fotografia, ROI superiore a CHF 15&apos;000/ora.
        </div>
        <div style={S.good}>
          <strong>Monitorare il fatturato 12 mesi mobili.</strong>
          {' '}Quando ci si avvicina a CHF 100&apos;000, contattare il fiduciario per pianificare
          {' '}l&apos;iscrizione IVA. Una volta dentro il regime, il valore di ogni scontrino raddoppia.
        </div>
        <div style={S.good}>
          <strong>Confermare i numeri esatti con il fiduciario.</strong>
          {' '}Le aliquote dipendono dallo stato civile, dagli altri redditi e dalle deduzioni personali specifiche.
        </div>

        <p style={S.small}>
          Documento generato per uso interno aziendale. Riferimenti normativi: LIFD (RS 642.11), LT 10.2.1.1
          {' '}Cantone Ticino, LIVA (RS 641.20). Valori delle aliquote indicativi per il 2026.
        </p>
      </article>
    </div>
  )
}
