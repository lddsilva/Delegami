# Prompt para Codex — Pesquisa e atualização do Prezzario

## Contexto

Este é o prezzario (catálogo de preços) de uma empresa de construção civil na Suíça (Ticino).
Os itens têm:
- `category`: formato "Parent – Sub" (ex: "Bagno – WC", "Pavimenti – Gres Porcellanato")
- `unitCost`: preço de custo em CHF
- `productTier`: `ESSENTIAL`, `STANDARD`, `PREMIUM` ou vazio para serviço/manodopera
- `notes`: notas internas (fornecedor, referência, validade)
- `links`: URLs de produto separados por `\n` (pode estar vazio)

## O que precisa ser feito

Para **cada item no ficheiro `prezzario-for-codex.json`**:

1. **Verificar/atualizar os links** (`links` field):
   - Se o item já tem links → verificar se os URLs ainda funcionam (GET request)
   - Se o item não tem links E a categoria NÃO é Manodopera/Logistica → pesquisar e adicionar URLs reais dos produtos
   - Preferir links de produto específico (ex: `bauhaus.ch/it/p/...`) sobre páginas de categoria
   - **Para Manodopera e Logistica: deixar links VAZIOS** (são tarifas de mão de obra, sem produto)

2. **Verificar/atualizar os preços** (`unitCost` field):
   - Pesquisar o preço atual no site do fornecedor
   - Se o preço encontrado diferir >10% do atual → atualizar e registar na `notes` com "Preço verificado em YYYY-MM"
   - Se não encontrar o produto → adicionar "⚠ Stima 2026" nas `notes`

3. **Enriquecer as `notes` e fontes**:
   - Adicionar código do produto quando encontrado (ex: "Bauhaus art. 31158811")
   - Adicionar fornecedor preferencial se não estiver
   - Para materiais de mão de obra: adicionar "Tariffa di riferimento Ticino 2026"
   - Quando possível, gerar/atualizar uma fonte em `price_sources` com tipo (`PRODUCT_URL`, `CATEGORY_URL`, `SUPPLIER_QUOTE`, `RECEIPT`, `ESTIMATE`, `INDEX`, `LEGACY_PRICE`) e confiança (`LOW`, `MEDIUM`, `HIGH`)

## Fornecedores prioritários por categoria

| Categoria | Fornecedor principal | URL base |
|---|---|---|
| Pavimenti – Gres | Bauhaus CH | https://www.bauhaus.ch/it |
| Pavimenti – Parquet | Bauhaus CH | https://www.bauhaus.ch/it |
| Bagno – Sanitari | Sanitas Troesch | https://www.sanitas-troesch.ch |
| Bagno – WC (Geberit) | Geberit IT | https://www.geberit.it |
| Bagno – Rubinetteria | Grohe IT | https://www.grohe.it |
| Bagno – Mobili | IKEA CH | https://www.ikea.com/ch/it |
| Cucina – Elettrodomestici | Bosch IT | https://www.bosch-home.com/it |
| Cucina – Mobili | IKEA CH | https://www.ikea.com/ch/it |
| Strutture – Cartongesso | Knauf IT | https://tools.knauf.it |
| Pavimenti – Collanti | Weber IT | https://www.it.weber |
| Piastrelle varie | Marazzi IT | https://www.marazzigroup.com |
| Materiali generici | Leroy Merlin IT | https://www.leroymerlin.it |

## Output esperado

Per ogni item modificato, genera un array di oggetti:
```json
[
  {
    "id": "cxxx...",
    "links": "https://www.bauhaus.ch/it/p/...\nhttps://...",
    "unitCost": 29.95,
    "notes": "Bauhaus art. 31365295 – Prezzo verificato Maggio 2026"
  }
]
```

Poi crea uno script Node.js che fa UPDATE sul Turso con i dati:
```js
await db.execute({
  sql: 'UPDATE price_items SET links=?, unitCost=?, notes=? WHERE id=?',
  args: [item.links, item.unitCost, item.notes, item.id]
})
```

## Priorità

1. Items con categoria Bagno (sanitari, WC, docce, rubinetteria) — più usati
2. Pavimenti – Gres Porcellanato — prezzi variano molto
3. Cucina – Elettrodomestici — prezzi cambiam muito
4. Strutture – Cartongesso e Isolamento
5. Tutti gli altri

## Note importanti

- **Manodopera – qualsiasi subcategoria**: NON aggiungere links. Solo tariffa.
- **Logistica**: NON aggiungere links.
- I prezzi sono in **CHF** per items CH, in **CHF equiv** per items IT
- La data attuale è **Maggio 2026**
- Il file JSON è in: `prezzario-for-codex.json` nella root del progetto

## DB Connection (Turso)

Le credenziali sono in `.env.local`:
```
DATABASE_URL=libsql://delegami-app-lddsilva.aws-eu-west-1.turso.io
DATABASE_AUTH_TOKEN=...
```
