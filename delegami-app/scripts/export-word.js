require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@libsql/client');
const {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, AlignmentType, BorderStyle, WidthType,
  ShadingType, VerticalAlign, Header, UnderlineType,
} = require('docx');
const fs = require('fs');

const client = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN });
const Q = 'cmobzgzsh0003y0ukbly36k3q';

const fmt = n => n == null ? '—' : Number(n).toLocaleString('de-CH', { minimumFractionDigits: 2 });

// ─── Simple cell helper ───────────────────────────────────────────────────────
function tc(text, opts = {}) {
  return new TableCell({
    verticalAlign: VerticalAlign.CENTER,
    columnSpan: opts.span,
    shading: opts.shade ? { fill: opts.shade, type: ShadingType.SOLID } : undefined,
    margins: { top: 50, bottom: 50, left: 120, right: 120 },
    children: [new Paragraph({
      alignment: opts.right ? AlignmentType.RIGHT : opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
      children: [new TextRun({
        text: String(text ?? '—'),
        bold: opts.bold,
        italics: opts.italic,
        size: opts.size || 18,
        color: opts.color || '000000',
        underline: opts.underline ? { type: UnderlineType.SINGLE } : undefined,
        font: 'Calibri',
      })]
    })]
  });
}

function spacer(n = 1) {
  return new Paragraph({ spacing: { before: n * 100, after: 0 }, children: [new TextRun('')] });
}

function label(text) {
  return new Paragraph({
    spacing: { before: 160, after: 40 },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 16, color: '555555', font: 'Calibri' })]
  });
}

async function main() {
  const [q, items, cs] = await Promise.all([
    client.execute({ sql: 'SELECT q.*, p.name as pName, p.address as pAddr, c.name as cName, c.address as cAddr, c.postalCode as cp, c.city FROM quotes q JOIN projects p ON p.id=q.projectId JOIN clients c ON c.id=p.clientId WHERE q.id=?', args: [Q] }),
    client.execute({ sql: 'SELECT * FROM quote_items WHERE quoteId=? ORDER BY sortOrder', args: [Q] }),
    client.execute('SELECT * FROM company_settings LIMIT 1'),
  ]);

  const qt = q.rows[0];
  const rows = items.rows;
  const co = cs.rows[0] || {};
  const today = new Date().toLocaleDateString('it-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const body = [];

  // ── INTESTAZIONE AZIENDA ──────────────────────────────────────────────────
  body.push(new Paragraph({
    children: [new TextRun({ text: co.name || 'Zanetti Soluzioni Edili', bold: true, size: 40, font: 'Calibri' })]
  }));
  body.push(new Paragraph({
    spacing: { after: 40 },
    children: [new TextRun({ text: `${co.address || ''}, ${co.postalCode || ''} ${co.city || ''}  ·  ${co.phone || ''}  ·  ${co.email || ''}`, size: 17, color: '666666', font: 'Calibri' })]
  }));
  body.push(new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'cccccc' } },
    children: [new TextRun('')]
  }));
  body.push(spacer(2));

  // ── NUMERO E INFO PREVENTIVO ──────────────────────────────────────────────
  body.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE } },
    rows: [new TableRow({ children: [
      // Left: doc info
      new TableCell({
        width: { size: 40, type: WidthType.PERCENTAGE },
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        margins: { top: 0, bottom: 0, left: 0, right: 400 },
        children: [
          new Paragraph({ children: [new TextRun({ text: 'PREVENTIVO', size: 16, color: '888888', font: 'Calibri', bold: true })] }),
          new Paragraph({ spacing: { before: 40 }, children: [new TextRun({ text: qt.quoteNumber + '  v' + qt.version, bold: true, size: 36, font: 'Courier New' })] }),
          new Paragraph({ spacing: { before: 80 }, children: [new TextRun({ text: 'Data: ' + today, size: 18, font: 'Calibri', color: '444444' })] }),
          new Paragraph({ children: [new TextRun({ text: 'Stato: ' + qt.status, size: 18, font: 'Calibri', color: '444444' })] }),
        ]
      }),
      // Right: client
      new TableCell({
        width: { size: 60, type: WidthType.PERCENTAGE },
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.SINGLE, size: 4, color: 'dddddd' }, right: { style: BorderStyle.NONE } },
        margins: { top: 0, bottom: 0, left: 400, right: 0 },
        children: [
          new Paragraph({ children: [new TextRun({ text: 'INTESTATO A', size: 16, color: '888888', bold: true, font: 'Calibri' })] }),
          new Paragraph({ spacing: { before: 40 }, children: [new TextRun({ text: qt.cName, bold: true, size: 22, font: 'Calibri' })] }),
          new Paragraph({ children: [new TextRun({ text: qt.cAddr + '  ' + qt.cp + ' ' + qt.city, size: 18, color: '444444', font: 'Calibri' })] }),
          new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: 'OPERA', size: 16, color: '888888', bold: true, font: 'Calibri' })] }),
          new Paragraph({ spacing: { before: 40 }, children: [new TextRun({ text: qt.pName, bold: true, size: 20, font: 'Calibri' })] }),
          new Paragraph({ children: [new TextRun({ text: qt.pAddr, size: 18, color: '444444', font: 'Calibri' })] }),
        ]
      }),
    ]})]
  }));

  body.push(spacer(4));

  // ── TABELLA ARTICOLI ─────────────────────────────────────────────────────────
  body.push(new Paragraph({
    spacing: { before: 0, after: 120 },
    children: [new TextRun({ text: 'Dettaglio Articoli', bold: true, size: 26, font: 'Calibri', underline: { type: UnderlineType.SINGLE } })]
  }));

  const trows = [
    new TableRow({
      tableHeader: true,
      children: [
        tc('#', { shade: 'eeeeee', bold: true, center: true, size: 16 }),
        tc('Descrizione', { shade: 'eeeeee', bold: true, size: 16 }),
        tc('U.M.', { shade: 'eeeeee', bold: true, center: true, size: 16 }),
        tc('Qtà', { shade: 'eeeeee', bold: true, right: true, size: 16 }),
        tc('Prezzo u.', { shade: 'eeeeee', bold: true, right: true, size: 16 }),
        tc('Totale CHF', { shade: 'eeeeee', bold: true, right: true, size: 16 }),
      ]
    })
  ];

  let num = 0;
  let secTotal = 0;
  let hasSec = false;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const next = rows[i + 1];

    if (r.itemType === 'SECTION') {
      // Subtotale sezione precedente
      if (hasSec) {
        trows.push(new TableRow({ children: [
          tc('', { span: 5, shade: 'f5f5f5' }),
          tc('CHF ' + fmt(secTotal), { shade: 'f5f5f5', bold: true, right: true, size: 17 }),
        ]}));
        secTotal = 0; hasSec = false;
      }
      // Header sezione
      trows.push(new TableRow({ children: [new TableCell({
        columnSpan: 6,
        shading: { fill: 'f0f0f0', type: ShadingType.SOLID },
        margins: { top: 80, bottom: 80, left: 150, right: 150 },
        borders: { top: { style: BorderStyle.SINGLE, size: 4, color: '999999' }, bottom: { style: BorderStyle.SINGLE, size: 2, color: 'bbbbbb' }, left: { style: BorderStyle.SINGLE, size: 4, color: '999999' }, right: { style: BorderStyle.SINGLE, size: 4, color: '999999' } },
        children: [new Paragraph({ children: [new TextRun({ text: r.description || r.section || '', bold: true, size: 20, font: 'Calibri' })] })]
      })]}));
    } else if (r.itemType === 'ITEM') {
      num++;
      // Descrizione + note opzionali
      const descParagraphs = [
        new Paragraph({ children: [new TextRun({ text: r.description || '', size: 18, font: 'Calibri' })] }),
      ];
      if (r.sourceNote) {
        const note = r.sourceNote.length > 120 ? r.sourceNote.slice(0, 120) + '…' : r.sourceNote;
        descParagraphs.push(new Paragraph({ spacing: { before: 40 }, children: [new TextRun({ text: note, size: 14, color: '888888', italics: true, font: 'Calibri' })] }));
      }
      if (r.sourceUrl) {
        const domain = r.sourceUrl.replace(/^https?:\/\//, '').split('/')[0];
        descParagraphs.push(new Paragraph({ children: [new TextRun({ text: '🔗 ' + domain, size: 14, color: '2563eb', font: 'Calibri' })] }));
      }

      trows.push(new TableRow({ children: [
        new TableCell({ margins: { top: 80, bottom: 80, left: 80, right: 80 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(num), size: 16, color: '999999', font: 'Calibri' })] })]
        }),
        new TableCell({ margins: { top: 80, bottom: 80, left: 120, right: 80 }, children: descParagraphs }),
        tc(r.unit || '—', { center: true, size: 16, color: '666666' }),
        tc(r.quantity != null ? String(r.quantity) : '—', { right: true, size: 17 }),
        tc(r.unitPrice != null ? fmt(r.unitPrice) : '—', { right: true, size: 17 }),
        tc(r.totalPrice != null ? 'CHF ' + fmt(r.totalPrice) : '—', { right: true, bold: true, size: 18 }),
      ]}));
      secTotal += r.totalPrice || 0;
      hasSec = true;
    } else if (r.itemType === 'NOTE') {
      trows.push(new TableRow({ children: [new TableCell({
        columnSpan: 6,
        shading: { fill: 'fffbeb', type: ShadingType.SOLID },
        margins: { top: 60, bottom: 60, left: 150, right: 150 },
        children: [new Paragraph({ children: [new TextRun({ text: '📝  ' + (r.description || ''), size: 16, color: '92400e', italics: true, font: 'Calibri' })] })]
      })]}));
    }

    if (hasSec && (!next || next.itemType === 'SECTION')) {
      trows.push(new TableRow({ children: [
        tc('Subtotale sezione', { span: 5, shade: 'f5f5f5', right: true, bold: true, size: 17, color: '333333' }),
        tc('CHF ' + fmt(secTotal), { shade: 'f5f5f5', bold: true, right: true, size: 17 }),
      ]}));
      secTotal = 0; hasSec = false;
    }
  }

  body.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: trows }));

  // ── TOTALE ───────────────────────────────────────────────────────────────────
  body.push(spacer(3));
  body.push(new Table({
    width: { size: 40, type: WidthType.PERCENTAGE },
    rows: [
      ...(qt.subtotalCost && qt.subtotalCost !== qt.subtotalClient ? [
        new TableRow({ children: [
          tc('Subtotale costi (interno)', { size: 17 }),
          tc('CHF ' + fmt(qt.subtotalCost), { right: true, size: 17, color: '888888' }),
        ]})
      ] : []),
      new TableRow({ children: [tc('Subtotale', { size: 19, bold: true }), tc('CHF ' + fmt(qt.subtotalClient), { right: true, bold: true, size: 19 })] }),
      new TableRow({ children: [
        tc('IVA ' + qt.taxRate + '%', { shade: 'f5f5f5', size: 17 }),
        tc(qt.taxRate > 0 ? 'CHF ' + fmt(qt.taxAmount) : 'Non applicabile', { shade: 'f5f5f5', right: true, size: 17 }),
      ]}),
      new TableRow({ children: [
        tc('TOTALE', { shade: 'e5e7eb', bold: true, size: 24 }),
        tc('CHF ' + fmt(qt.total), { shade: 'e5e7eb', right: true, bold: true, size: 24 }),
      ]}),
    ]
  }));

  // ── NOTE E CONDIZIONI ────────────────────────────────────────────────────────
  if (qt.clientNotes) {
    body.push(spacer(4));
    body.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: 'Note e Condizioni', bold: true, size: 24, font: 'Calibri', underline: { type: UnderlineType.SINGLE } })] }));
    qt.clientNotes.split('\n').forEach(line => {
      body.push(new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: line || ' ', size: 18, font: 'Calibri' })] }));
    });
  }

  // ── COORDINATE BANCARIE ──────────────────────────────────────────────────────
  body.push(spacer(3));
  body.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: 'Coordinate Bancarie', bold: true, size: 20, font: 'Calibri' })] }));
  body.push(new Table({
    width: { size: 55, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [tc('IBAN', { shade: 'f5f5f5', bold: true, size: 17 }), tc(co.iban || 'CH47 0900 0000 1647 7640 1', { bold: true, size: 18 })] }),
      new TableRow({ children: [tc('Intestatario', { shade: 'f5f5f5', size: 17 }), tc('Marcos Zanetti Filho', { size: 18 })] }),
    ]
  }));

  // ── NOTE INTERNE ─────────────────────────────────────────────────────────────
  if (qt.internalNotes) {
    body.push(spacer(4));
    body.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: '⚠️  NOTE INTERNE — non stampare per il cliente', bold: true, size: 20, color: 'b91c1c', font: 'Calibri' })] }));
    body.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
      new TableRow({ children: [new TableCell({
        shading: { fill: 'fef9c3', type: ShadingType.SOLID },
        margins: { top: 150, bottom: 150, left: 200, right: 200 },
        children: qt.internalNotes.split('\n').map(line =>
          new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: line || ' ', size: 17, font: 'Calibri', color: '78350f' })] })
        )
      })]})
    ]}));
  }

  // ── BUILD ─────────────────────────────────────────────────────────────────────
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 720, bottom: 720, left: 900, right: 900 }
        }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'dddddd' } },
            children: [new TextRun({
              text: (co.name || 'Zanetti Soluzioni Edili') + '   |   ' + qt.quoteNumber + ' v' + qt.version,
              size: 16, color: 'aaaaaa', font: 'Calibri'
            })]
          })]
        })
      },
      children: body,
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const filename = qt.quoteNumber + '-v' + qt.version + '-Preventivo.docx';
  fs.writeFileSync(filename, buffer);
  console.log('✅', filename, '(' + Math.round(buffer.length / 1024) + ' KB,', num, 'articoli)');
}

main().catch(e => { console.error('Errore:', e.message); process.exit(1); });
