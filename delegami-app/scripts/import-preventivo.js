/**
 * import-preventivo.js
 * Lê um ficheiro .txt no formato exportado por export-preventivo
 * e cria uma NOVA VERSÃO do preventivo no Turso.
 *
 * Uso:
 *   node scripts/import-preventivo.js PRE-2026-013-v7-Preventivo.txt
 *
 * O script:
 *   1. Lê e analisa o ficheiro
 *   2. Cria uma nova quote com o mesmo quoteNumber mas versão +1
 *   3. Deleta os itens antigos e insere os novos
 *   4. Recalcula os totais
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@libsql/client');
const { randomUUID } = require('crypto');
const fs = require('fs');

const client = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN });
const now = new Date().toISOString();

// ─── Parse the text file ─────────────────────────────────────────────────────
function parseFile(content) {
  const lines = content.split('\n');
  const result = { meta: {}, items: [] };
  let mode = null;
  let current = {};
  let noteLines = [];

  const push = () => {
    if (!mode) return;
    if (mode === 'META') result.meta = { ...current };
    else if (mode === 'NOTE_CLIENTE') result.meta.clientNotes = noteLines.join('\n');
    else if (mode === 'NOTE_INTERNE') result.meta.internalNotes = noteLines.join('\n');
    else if (mode === 'SECTION' || mode === 'NOTE' || mode.startsWith('ITEM')) {
      result.items.push({ type: mode.startsWith('ITEM') ? 'ITEM' : mode, ...current });
    }
    current = {}; noteLines = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    // Section header
    const headerMatch = line.match(/^\[(.+?)\]$/);
    if (headerMatch) {
      push();
      const h = headerMatch[1];
      mode = h.startsWith('ITEM') ? h : h;
      current = {}; noteLines = [];
      continue;
    }

    // Note lines (prefixed with |)
    if (line.startsWith('|')) {
      noteLines.push(line.slice(1).trimStart());
      continue;
    }

    // Key = value lines
    const eqIdx = line.indexOf('=');
    if (eqIdx > 0) {
      const key = line.slice(0, eqIdx).trim().toLowerCase().replace(/\s+/g, '');
      const val = line.slice(eqIdx + 1).split('#')[0].trim(); // strip inline comments
      current[key] = val;
    }
  }
  push();
  return result;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const filename = process.argv[2];
  if (!filename) { console.error('Uso: node scripts/import-preventivo.js <arquivo.txt>'); process.exit(1); }
  if (!fs.existsSync(filename)) { console.error('Arquivo não encontrado:', filename); process.exit(1); }

  const content = fs.readFileSync(filename, 'utf8');
  const parsed = parseFile(content);
  const meta = parsed.meta;

  console.log('Parsed:', parsed.items.length, 'items');
  console.log('Quote:', meta.quotenumber, '— current version', meta.version);

  // Find existing quote
  const existing = await client.execute({
    sql: "SELECT id, version, projectId, status FROM quotes WHERE quoteNumber=? ORDER BY version DESC LIMIT 1",
    args: [meta.quotenumber]
  });
  if (!existing.rows.length) { console.error('Quote non trovata nel DB:', meta.quotenumber); process.exit(1); }

  const orig = existing.rows[0];
  const newVersion = Number(orig.version) + 1;
  const newId = randomUUID();

  console.log('Creating version', newVersion, '...');

  // Calculate totals from items
  let subtotalCost = 0, subtotalClient = 0;
  const itemRows = [];
  let sortOrder = 0;

  for (const item of parsed.items) {
    if (item.type === 'ITEM') {
      const qty = parseFloat(item.quantity) || 0;
      const unitCost = parseFloat(item.unitcost) || 0;
      const unitPrice = parseFloat(item.unitprice) || 0;
      const totalCost = qty * unitCost;
      const totalPrice = qty * unitPrice;
      subtotalCost += totalCost;
      subtotalClient += totalPrice;
      itemRows.push({
        id: randomUUID(),
        itemType: 'ITEM',
        section: item.section || null,
        sortOrder: sortOrder++,
        description: item.description,
        unit: item.unit || null,
        quantity: qty || null,
        unitCost: unitCost || null,
        unitPrice: unitPrice || null,
        marginPercent: parseFloat(item.marginpercent) || null,
        totalCost: totalCost || null,
        totalPrice: totalPrice || null,
        sourceNote: item.sourcenote ? item.sourcenote.replace(/ \| /g, '\n') : null,
        sourceUrl: item.sourceurl || null,
      });
    } else if (item.type === 'SECTION') {
      itemRows.push({
        id: randomUUID(),
        itemType: 'SECTION',
        section: item.section || item.description || '',
        sortOrder: sortOrder++,
        description: item.description,
        unit: null, quantity: null, unitCost: null, unitPrice: null,
        marginPercent: null, totalCost: null, totalPrice: null,
        sourceNote: null, sourceUrl: null,
      });
    } else if (item.type === 'NOTE') {
      itemRows.push({
        id: randomUUID(),
        itemType: 'NOTE',
        section: item.section || null,
        sortOrder: sortOrder++,
        description: item.description,
        unit: null, quantity: null, unitCost: null, unitPrice: null,
        marginPercent: null, totalCost: null, totalPrice: null,
        sourceNote: null, sourceUrl: null,
      });
    }
  }

  const taxRate = parseFloat(meta.taxrate) || 0;
  const taxAmount = subtotalClient * taxRate / 100;
  const total = subtotalClient + taxAmount;

  // Insert new quote
  await client.execute({
    sql: `INSERT INTO quotes
      (id,quoteNumber,version,projectId,type,status,marginPercent,subtotalCost,subtotalClient,
       taxRate,taxAmount,total,clientNotes,internalNotes,parentQuoteId,createdAt,updatedAt)
      VALUES (?,?,?,'${orig.projectId}','DETAILED','DRAFT',?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      newId, meta.quotenumber, newVersion,
      parseFloat(meta.marginpercent)||0,
      subtotalCost, subtotalClient,
      taxRate, taxAmount, total,
      parsed.meta.clientNotes || null,
      parsed.meta.internalNotes || null,
      orig.id, // parentQuoteId links to original
      now, now
    ]
  });
  console.log('Quote created:', meta.quotenumber, 'v' + newVersion, '— ID:', newId);

  // Insert items
  for (const r of itemRows) {
    await client.execute({
      sql: `INSERT INTO quote_items
        (id,quoteId,itemType,section,sortOrder,description,unit,quantity,unitCost,unitPrice,
         totalCost,totalPrice,marginPercent,sourceNote,sourceUrl,createdAt,updatedAt)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [r.id, newId, r.itemType, r.section, r.sortOrder, r.description,
             r.unit, r.quantity, r.unitCost, r.unitPrice,
             r.totalCost, r.totalPrice, r.marginPercent,
             r.sourceNote, r.sourceUrl, now, now]
    });
  }
  console.log('Items inserted:', itemRows.length);
  console.log('');
  console.log('=== DONE ===');
  console.log('Nova versão criada:', meta.quotenumber, 'v' + newVersion);
  console.log('Total:', 'CHF', total.toFixed(2));
  console.log('Subtotale cliente:', 'CHF', subtotalClient.toFixed(2));
  console.log('ID:', newId);
  console.log('');
  console.log('Abre no app: /quotes/' + newId);
}

main().catch(e => { console.error(e.message); process.exit(1); });
