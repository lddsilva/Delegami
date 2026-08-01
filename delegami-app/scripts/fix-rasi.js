require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@libsql/client');
const client = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN });
const now = new Date().toISOString();
const Q = 'cmobzgzsh0003y0ukbly36k3q';

async function run() {
  const check = await client.execute({ sql: 'SELECT id, section, description, totalPrice FROM quote_items WHERE quoteId=? AND section IS NULL', args: [Q] });
  console.log('Null-section items:', JSON.stringify(check.rows, null, 2));

  const del = await client.execute({ sql: 'DELETE FROM quote_items WHERE quoteId=? AND section IS NULL', args: [Q] });
  console.log('Deleted:', del.rowsAffected);

  const tot = await client.execute({ sql: "SELECT SUM(totalPrice) as t FROM quote_items WHERE quoteId=? AND itemType='ITEM'", args: [Q] });
  const newTotal = Number(tot.rows[0].t);
  await client.execute({ sql: 'UPDATE quotes SET total=?, subtotalCost=?, subtotalClient=?, updatedAt=? WHERE id=?', args: [newTotal, newTotal, newTotal, now, Q] });

  const inv30 = Math.round(newTotal * 0.30 * 100) / 100;
  await client.execute({ sql: "UPDATE invoices SET subtotal=?, total=?, updatedAt=? WHERE invoiceNumber='INV-2026-002'", args: [inv30, inv30, now] });
  await client.execute({ sql: "UPDATE invoice_items SET unitPrice=?, total=?, updatedAt=? WHERE invoiceId=(SELECT id FROM invoices WHERE invoiceNumber='INV-2026-002')", args: [inv30, inv30, now] });

  console.log('New total: CHF', newTotal.toFixed(2));
  console.log('Invoice 30%: CHF', inv30.toFixed(2));
}
run().catch(e => console.error(e.message));
