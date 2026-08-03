# Future Features — Delegami

Idee e proposte di funzionalità per le prossime evoluzioni dell'app. Non sono ancora impegni di sviluppo: servono come backlog di riferimento.

Ultimo aggiornamento: 2026-05-26

---

## Implementato in v1 (2026-05-26)

### Aggiornamento UX v1.1 (2026-05-26)
**Stato**: implementato.

- Lista acquisti e cronograma ora aprono un viewer ottimizzato per consultazione/mobile; il full editor resta su `?edit=1` tramite bottone `Modifica`.
- Nei viewer si possono fare cambi rapidi di status senza aprire il full editor: status articolo per lista acquisti, status attivita per cronograma.
- Descrizioni lunghe della lista acquisti e nomi lunghi di fasi/attivita del cronograma usano textarea con `Salva`/`Annulla`; Enter crea una nuova riga, Ctrl/Cmd+Enter salva.
- Cronograma: picker colore fase visibile direttamente nell'editor, con 10 colori.
- Cronograma: campo `ProjectSchedule.notes` per note generali libere, stampate alla fine del PDF.
- PDF cronograma: timeline ridisegnata con date e giorni visibili sopra le barre, tabella piu compatta (`Dal`, `Al`, `gg`) per lasciare spazio alle descrizioni.

### Lista acquisti per cantiere (v1)
**Stato**: implementato.

- Genera automaticamente da preventivo APPROVED/INVOICED, raggruppando le voci per fornitore inferito (`PriceSource.supplierName`, `QuoteItem.sourceNote`, `sourceUrl`/website).
- Puo essere creata vuota (`Crea vuota`) e popolata manualmente articolo per articolo.
- Articoli senza supplier inferito vanno in "Da assegnare".
- Modelli: `ShoppingList` (un per progetto, opzionalmente legato a un quote) + `ShoppingListItem` (descrizione, unit, qtyPlanned, qtyPurchased, unitPriceEstimated, unitPricePaid, supplierId, status, sourceQuoteItemId, expenseId, notes, sortOrder).
- Pagina: `/projects/[id]/shopping-list` con editing inline (descrizione, qty, prezzo, supplier, status).
- Tutti i campi editabili dopo la creazione; gli articoli si possono spostare tra fornitori cambiando `supplierId`; "Aggiungi articolo manualmente" sempre disponibile.
- Campo `unit` con dropdown (`pz`, `m²`, `m³`, `ml`, `kg`, `t`, `l`, `h`, `set`, `corpo`, `sacco`, `scatola`, `confezione`, `rotolo`, `tubo`, `lastra`, `barattolo`) e opzione `Altro`.
- Statuses: `PENDING` → `ORDERED` → `PURCHASED` → `RECEIVED`.
- Bottone "Crea spesa da articolo" pre-compila il form Spesa con descrizione/supplier/prezzo totale e linka via `expenseId`; il prezzo pagato unitario viene calcolato dal totale/quantita.
- Bottoni individuali `Esporta per IA` e `Importa da IA`; import usa preview e modalita `Sostituisci corrente` / `Aggiungi a corrente`.
- Stampa PDF: una pagina per fornitore, checkbox `☐` per spunta in cantiere.
- Mobile-first: card layout su mobile, tabella su desktop.

### Cronograma Lite per cantiere (v1)
**Stato**: implementato.

- Modelli: `ProjectSchedule` (uno per progetto) + `SchedulePhase` (name, startDate, endDate, color, notes, sortOrder) + `ScheduleTask` per attivita/item dentro ogni fase.
- Pagina: `/projects/[id]/schedule` con elenco fasi + anteprima Gantt CSS semplice.
- Genera dal preventivo APPROVED/INVOICED: una `SchedulePhase` per ogni `SECTION` del preventivo e una `ScheduleTask` per ogni `ITEM` dentro la sezione, datate sequenzialmente a partire da `project.startDate`.
- Tutti i campi editabili: nome fase, date fase, colore tag, note, ordine (frecce ↑↓), aggiungere/eliminare manualmente; dentro ogni fase, aggiungere/editare/eliminare item/attivita con date inizio/fine.
- Bottoni individuali `Esporta per IA` e `Importa da IA`; import usa preview e modalita `Sostituisci corrente` / `Aggiungi a corrente`.
- Niente dipendenze tra fasi, niente ricalcolo automatico.
- Stampa PDF: lista cronologica + attivita sotto ogni fase + barra Gantt visiva semplice.
- Mobile-first.

### Template import da JSON (v1)
**Stato**: implementato.

- Action `importTemplateFromJson(jsonText)` che valida e crea un `QuoteTemplate`.
- Schema: `kind: "template"` + `name, category, subcategory, emoji, templateType, items[]`.
- Pagina: `/settings/templates/import` con istruzioni e esempio.
- Entry point: 3ª opzione nel menu "Crea template" su `/settings/templates`.

---

## Prossime versioni (v2) delle funzionalità sopra

### Lista acquisti v2 (idee)
- Multi-lista per cantiere (es. una lista per fase del cronograma)
- Comparativa fornitori: mostrare 2-3 prezzi dello stesso item da fornitori diversi
- Suggerire consolidamento ("compra 50kg di stucco in una volta sola, non 3 viaggi")
- Export Excel
- Tracking di chi nel team ha comprato cosa
- Notifiche/promemoria: "questa lista è ferma in PENDING da 5 giorni"
- Integrazione con scontrini: quando si elabora uno scontrino, suggerisce automaticamente di matchare con un articolo della lista
- Generazione di un ordine PDF da inviare al fornitore via email/WhatsApp

### Cronograma v2 (idee)
- Dipendenze tra fasi (FS, SS, FF) con ricalcolo automatico
- Drag-and-drop sulla timeline (oggi solo frecce ↑↓)
- Dipendenze anche tra attivita dentro le fasi
- Assegnazione di operai/risorse per fase (richiede prima il modulo time tracking — vedi #1 nel backlog alto)
- Vista calendario mensile/settimanale
- Promemoria: "fase Demolizione inizia tra 2 giorni"
- Confronto preventivato vs reale (durata pianificata vs effettiva, scostamento)
- Sincronizzazione con Google Calendar (1-way export)
- Multipli cronogrammi per cantiere (versioni / scenari)

### Template import v2 (idee)
- Bulk import di più template in un singolo file JSON
- Riconoscimento automatico di template duplicati (per nome+categoria)
- Suggerimento di sostituire template esistenti vs crearne nuovi

---

---

## Alto impatto (dolori reali del quotidiano)

### 1. Time tracking / rapportini di lavoro
Oggi c'è "Manodopera" nel prezzario ma nessun registro di ore reali per cantiere. Senza questo, è impossibile confrontare **stimato vs realizzato** della manodopera (dove tipicamente sparisce il margine).

- Modello: `WorkLog(projectId, userId, date, hours, taskDescription)`
- Schermata mobile-first: operaio apre il cantiere e timbra 8h
- Aggregato per cantiere → input per la "Margine reale" sotto

### 2. Margine reale per cantiere
Oggi il preventivo mostra margine stimato. Manca la dashboard per cantiere che chiude il ciclo:

*"Cantiere X — preventivato CHF 50k, spese CHF 38k + Y ore di manodopera, fatturato CHF 30k → margine attuale Z%"*

- Riusa dati già in DB (Expense + Invoice + WorkLog quando arriva)
- Tab "Economia" sulla pagina `/projects/[id]`
- Risponde alla domanda fondamentale: *"questo cantiere mi sta dando lucro?"*

### 3. Cash flow / scadenzario
Il modello `FinancialTransaction` è nel schema ma non usato.

- Schermata "Prossimi 60 giorni": fatture in scadenza (a ricevere), spese pendenti (a pagare), saldo previsto
- Evita sorprese con la banca a fine mese
- Niente integrazioni bancarie — solo le info già nel DB

### 4. Promemoria / scadenze automatiche
Niente notifiche oggi. Casi ovvi:

- Preventivo inviato da 14+ giorni senza risposta
- Fattura SENT scaduta
- Scontrino capturato non processato da X giorni
- Spesa PENDING da X giorni

Email giornaliera o settimanale, le credenziali Gmail sono già configurate via MCP.

---

## Medio impatto (accelera molto quando c'è)

### 5. Portale cliente / firma digitale del preventivo
Oggi il cliente riceve PDF, stampa, firma, scansiona.

- Link unico per preventivo: `/p/{token}` accessibile senza login
- Cliente vede il preventivo, clicca "Accetto" → registra IP/data/nome
- Riduce giorni di ciclo di vendita
- Token randomico nel modello Quote (`shareToken`, `acceptedByIp`, `acceptedByName`, `acceptedAt`)

### 6. Esportazione contabile (Bexio / Banana / Abacus)
Nel Ticino il commercialista usa uno di questi.

- Bottone "Esporta movimenti mensili in CSV" formato Bexio
- Riduce tempo speso ogni mese sulla contabilità
- Da iniziare con Bexio (più diffuso), poi Banana

### 7. Subappaltatori
Differenziare fornitore-materiale da fornitore-manodopera (subappaltatore).

- Aggiungere `Supplier.type = 'MATERIAL' | 'SUBCONTRACTOR' | 'MIXED'`
- Storico per subappaltatore: quanto è costato per cantiere
- Garanzia del lavoro suo
- Status del pagamento

### 8. Report mensile / annuale
Cose che probabilmente già tenta di fare su Excel:

- Top 10 fornitori per volume
- Categorie di spesa
- Ranking cantieri per margine
- Fatturato vs incassato
- P&L annuale per cantiere

---

## Basso impatto ma economici da fare

### 9. Comunicazioni log
Annettare email/WhatsApp a un cliente/cantiere per storico.

- Già c'è upload di allegati; manca solo campo "Comunicazione" con data/canale (email/telefono/WhatsApp/persona)
- Lista cronologica per cliente

### 10. Garanzia post-consegna
Sapere cosa è coperto quando il cliente chiama 6 mesi dopo.

- `Project.deliveredAt` + `Project.warrantyMonths`
- Schermata "Cantieri in garanzia"

### 11. Backup automatico
Turso ha backup nativi ma un export settimanale su Google Drive dà tranquillità extra.

- MCP del Drive già configurato
- Script cron settimanale che dumpa tabelle critiche in JSON/CSV
- Mantenere ultime 12 settimane

---

## Approccio raccomandato

Se dovessi pianificare i prossimi blocchi di lavoro:

1. **Blocco "Gestione vera"** — #1 (time tracking) + #2 (margine reale) insieme. Trasforma l'app da "strumento amministrativo" a "strumento di gestione".
2. **Blocco "No surprises"** — #3 (cash flow) + #4 (promemoria). Piccoli ma eliminano frizione quotidiana.
3. **Blocco "Velocità di vendita"** — #5 (portale cliente).
4. **Blocco "Contabile felice"** — #6 (export Bexio).

---

## Note

- Mantenere la regola del CLAUDE.md: smallest safe change, una soluzione per problema, niente over-engineering.
- Nessuna API route per CRUD (Server Actions + Server Components).
- Continuare a non usare `@prisma/client` (solo `@/generated/prisma/...`).
- Migrazioni: aggiornare schema → SQL → `migrate-turso.ts` → `prisma generate`.
