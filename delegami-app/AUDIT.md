# AUDIT — Zanetti Office

**Data:** 26.07.2026 · **Escopo:** 72 páginas, 226 arquivos TS/TSX, ~37k linhas
**Método:** leitura do código-fonte + contagem automática de tokens de estilo + **app rodando e
medida ao vivo** (26 rotas renderizadas em Chromium a 375×812 DPR2 com toque, autenticada como ADMIN;
screenshots e medição de DOM). Nenhum arquivo de produção alterado.

---

## Veredito em uma frase

A app tem **arquitetura de dados sólida e componentes-base consistentes** (114 usos de `<Card>` com apenas 7 bypasses; 176 `<Button>` com 5 bypasses), mas **a camada de apresentação não decide nada por Marcos**: toda tela é uma pilha de cards de peso igual, os três números que definem a saúde do negócio são calculados de **três formas diferentes** em três telas diferentes, e **nenhuma das 72 páginas tem estado de carregamento ou de erro**.

O problema central não é feiúra. É que **a interface não tem opinião**. Ela mostra tudo com a mesma força e deixa o usuário fazer a triagem.

**Sobre mobile — resposta direta:** não, as telas **não** estão perfeitamente adaptadas. Das 26 medidas,
**6 estão boas, 9 passáveis e 11 quebradas**. E o app tem hoje, em produção, **o logo quebrado em todas
as páginas** e uma rota inteira (`/infografico`) inutilizável — por um único descuido de uma linha em
`src/proxy.ts`. Detalhes medidos na §6.

---

## Estado após a Fase 2 (26.07.2026)

Medido num **build de produção** a 375×812, DPR 2, sessão ADMIN, 13 telas.

| Métrica | Antes | Depois |
|---|---:|---:|
| Rotas com transbordo horizontal (49 medidas) | não medido | **0** |
| Alvos de toque < 44px (listas) | 87% (366/421) | **1% (2/389)** |
| Alvos de toque < 44px (formulários) | 49% (137/278) | **6% (17/269)** |
| Controlos sem nome acessível | 42/823 | **0/684** |
| Erros de hidratação (React #418) | 1 por ecrã com valores | **0** |
| Imagens quebradas por página | 2 (3 em `/infografico`) | **0** |
| Overflow horizontal de página | 0 | **0** |
| Erros JS em runtime | — | **0** |
| `error.tsx` | 0 | **14** |
| `not-found.tsx` | 0 | **1** (404 verificado em 3 rotas) |
| Definições de "Fatturato" | 3 | **1** |
| Tokens de cor | 107 em 17 famílias | ~24 em 5 |
| `text-gray-400` (2,5:1, reprova AA) | 286 | **0** |
| `gray-*` fora das páginas de impressão | 1499 | **0** |
| Literais hex (app + documentos) | 41 distintos em 11 ficheiros | **0** |
| Tamanhos de tipo fora da escala de 4 | 1142 | **0** |
| `confirm()` / `alert()` nativos | 52 | **0** |
| Busca global | inexistente | **⌘K sobre 7 entidades** |
| Navegação mobile | 18 destinos no hambúrguer | **4 abas + hambúrguer** |

Os alvos que restam são checkboxes e radios de 13px dentro de rótulos que já
medem 44px: o alvo real passa, é o script que conta o `<input>` em vez do
`<label>`. Nenhum botão de ícone e nenhum campo de formulário está por baixo
de 44px.

### Correção ao método (27.07.2026)

O varrimento original media `document.documentElement.scrollWidth` em 13 ecrãs de
lista e 10 formulários `/new`. Isso deixou de fora **duas classes inteiras de
defeito**:

* **As rotas `/edit`.** `/quotes/new` abre sem nenhuma voce, por isso a grelha do
  editor de artigos nunca chegou a renderizar em medição nenhuma. O ecrã que o
  Marcos usa para mexer num preventivo real nunca foi medido.
* **Transbordo contido.** Um contentor interno pode ser mais largo do que a caixa
  sem que a página role: o `main` corta-o e a medição de topo dá zero. Era
  exactamente o que acontecia — 495px de barra de ações dentro de um cartão de
  322px.

O varrimento passou a percorrer **49 rotas**, incluindo todas as `/edit`, e a
medir `scrollWidth > clientWidth` em cada elemento, com três exceções
justificadas: campos de formulário (rolam o próprio valor), puxadas ópticas
negativas (`-mx-`, `-mr-`) que comem a padding do cartão que as contém, e
`truncate` (o corte é o comportamento pretendido). Resultado: **0/49 rotas com
transbordo**.

### Segunda correção ao método (27.07.2026) — o que o Chromium não mostra

O Marcos enviou uma segunda foto: o campo **Valido fino al** a sair do cartão e
a página empurrada para o lado. O varrimento das 49 rotas dava zero.

**O emulador de iPhone do Chromium não é um iPhone.** O Safari iOS dá ao
`input[type=date]` uma largura intrínseca própria — larga o suficiente para a
data formatada — e o Chromium desenha o mesmo controlo bem mais estreito.
Nenhuma medição em Chromium, por mais rotas que percorra, pode revelar esta
classe de defeito.

A causa é do modelo de caixa, não do Safari: um item de grid ou flex tem
`min-width: auto` por defeito, ou seja **não encolhe abaixo do mínimo
intrínseco do conteúdo**. Um campo de data teimoso empurra a célula, a célula
empurra o cartão, o cartão empurra a página.

Corrigido por raciocínio, não por imitação:

* `min-width: 0` e `max-width: 100%` em todos os `input` de data/hora
  (`globals.css`), o que anula o mínimo intrínseco.
* `min-w-0` nos invólucros de `Input`, `Select` e `Textarea`, para o item de
  grid poder encolher.
* Uma coluna só no telemóvel onde havia duas células de ~170px com um campo de
  data — filtros de `/rapportini`, o rapportino do operaio e o registo de
  pagamento de fatura.

E um **teste de esforço** que substitui a emulação: injecta-se
`input[type=date] { min-width: 220px !important }` — mais largo do que o iOS
alguma vez precisa — e verifica-se se o layout absorve. 28 rotas, 0 fugas.

### Largura de página (27.07.2026)

No monitor, cada ecrã tinha a sua ideia de largura. Medido: **dez valores
diferentes** em 60 páginas — `max-w-lg`, `2xl`, `3xl`, `4xl`, `5xl`, `6xl`,
`7xl` e **oito páginas sem limite nenhum**, que num 1920 esticavam de ponta a
ponta. E incoerente dentro da mesma entidade: `/clients` parava a 1024px e
`/quotes` corria até à borda; `/settings/users/new` ficava a 512px enquanto
`/projects/[id]/edit` ia a 768px.

A largura passa a ser propriedade **do que o conteúdo é**, não de quem escreveu
a página. Três, e só três, definidas como utilitários em `globals.css` para não
voltarem a dispersar:

| | Largura | Para quê |
|---|---:|---|
| `page-form` | 768px | uma coluna de campos — um campo de texto com 1400px é pior de usar, não melhor |
| `page-content` | 1152px | listas, detalhes, relatórios: cabe uma grelha de 3 colunas e a linha ainda se lê de um olhar |
| `page-wide` | 1536px | editores de artigos, prezzario, galerias — os poucos ecrãs que usam mesmo todas as colunas |

A padding (`p-4 sm:p-8`, repetida nas 60 páginas) mudou-se para dentro dos
utilitários. Distribuição final: 20 `content`, 13 `form`, 7 `wide`, **0 fora da
escala** — verificado por um teste que falha se alguma página não usar uma das
três.

**Nota de método:** a hidratação não funciona no contentor de dev desta sessão
— o WebSocket do HMR nunca liga, e sem ele o runtime cliente do Next não
arranca, portanto nenhum componente cliente responde (incluindo os que
existiam antes de qualquer alteração). Toda a verificação de interatividade
foi feita em `next start`. As medições de layout continuam válidas nos dois
modos por serem HTML+CSS servidos.

---

## Sumário de prioridades

| # | Achado | Impacto |
|---|---|---|
| **A0** | **`proxy.ts` bloqueia todo o `public/` → logo quebrado em todas as telas, `/infografico` inutilizável** | **Alto** |
| A1 | "Fatturato" e "Margine" têm 3 definições conflitantes | **Alto** |
| A2 | `/invoices` mostra valor a receber ignorando pagamentos parciais | **Alto** |
| A3 | Dashboard: a mesma fatura vencida aparece 3 vezes | **Alto** |
| A4 | Zero `loading.tsx` / `error.tsx` / `Suspense` em 72 páginas | **Alto** |
| A5 | Dashboard não responde "quanto tenho a receber?" | **Alto** |
| A6 | Nenhuma tela tem ação primária única identificável | **Alto** |
| A7 | Zero paginação — todas as listas renderizam tudo | **Alto** |
| **A8** | **87% dos alvos de toque abaixo de 44px (medido); menores: 18×18px** | **Alto** |
| **A9** | **`/expenses` no mobile: sem data, sem fornecedor, filtro de 636px, 1 palavra por linha** | **Alto** |
| **A10** | **`break-all` parte valores monetários: "CHF-" / "12'180.00"** | **Alto** |
| M1 | 107 tokens de cor, 17 famílias, 3 escalas de cinza concorrentes | Médio |
| M2 | 286 usos de `text-gray-400` (2,5:1 — reprova WCAG AA) | Médio |
| M3 | 22 `confirm()` + 30 `alert()` nativos, zero undo | Médio |
| M4 | `formatDateInput()` em UTC num app Europe/Zurich | Médio |
| M5 | Números sem contexto: nenhuma variação, comparação ou período | Médio |
| M6 | 9 overlays, 3 tratam Esc, nenhum tem focus trap | Médio |
| M7 | Mobile: 17 destinos atrás de um hambúrguer; bottom-tab só para operário | Médio |
| M8 | `/reports` esconde as colunas de entrada no mobile, mostra só o resultado | Médio |
| B1 | Sem busca global | Baixo |
| B2 | Inconsistências de marca e idioma (logo, "Gestão de obras") | Baixo |
| B3 | 619 `style={{}}` inline concentrados nas páginas de impressão | Baixo |
| B4 | 83 `title=` como único rótulo (invisível no toque) | Baixo |

---

## 1. Inventário de telas

**72 páginas.** Agrupadas por função:

| Grupo | Rotas | Obs. |
|---|---|---|
| Dashboard | `/` | 8 cards empilhados |
| Clientes | `/clients`, `/[id]`, `/[id]/edit`, `/new` | CRUD padrão |
| Opere | `/projects` + detail/edit/new | + `schedule` (viewer/edit/import/print), + `shopping-list` (viewer/edit/import/print) = 11 rotas |
| Preventivi | `/quotes` + detail/edit/new/preview/import/import-update/invoice/template | 9 rotas |
| Fatture | `/invoices` + detail/edit/new/preview/import | 6 rotas |
| Spese | `/expenses` + detail/edit/new | 4 rotas |
| Scontrini | `/receipts`, `/[id]/process`, `/import` | 3 rotas |
| Rapportini | `/rapportini`, `/[userId]`, `/[userId]/print`, `/rapportino` | 4 rotas |
| Fornitori | `/suppliers` + detail/edit/new | 4 rotas |
| Prezzario | `/price-catalog` + edit/new | 3 rotas |
| Template | `/settings/templates` + edit/new/import | 4 rotas |
| Relatori | `/relatori`, `/import`, `/novo`, `/relatorio/[id]` + 6 relatórios estáticos | 10 rotas |
| Sistema | `/settings`, `/settings/users` (+edit/new), `/logs`, `/media`, `/reports`, `/infografico`, `/login` | 9 rotas |

**Overlays (9):** upload de scontrini, lightbox de fotos, menu de ações do preventivo, menu de criar template, mover despesa, mudar status de opera, enviar documento, painel lateral mobile, seletor de catálogo no editor de preventivo.

**O que falta no inventário:** `loading.tsx` (0), `error.tsx` (0), `not-found.tsx` (0), `global-error.tsx` (0).

---

## 2. Hierarquia por tela — a pergunta única

Para cada tela: **qual a única pergunta?** → **o elemento mais forte responde?**

### `/` Dashboard — ❌ erro grave de hierarquia

- **Pergunta:** *"O que precisa da minha atenção hoje, e quanto dinheiro está em jogo?"*
- **Próxima ação:** cobrar um cliente, ou processar o que está pendente.
- **Elemento mais forte hoje:** os quatro contadores `text-lg font-bold` — **Clienti, Opere, In corso, In preventivo**. São métricas de vaidade. O número de clientes cadastrados nunca mudou uma decisão.
- **O que deveria ser mais forte:** o total a receber. **Ele não existe na tela.** A dashboard mostra faturas vencidas individualmente mas **nunca soma quanto o negócio tem a receber**.

**Redundância medida (A3):** `getDashboardStats()` retorna `overdueInvoices` = `{status: SENT|DRAFT, dueDate < now}` e `openInvoices` = `{status: SENT}`. Uma fatura SENT vencida entra nos **dois**. Ela então é renderizada:
1. no card "Azioni richieste" (contagem),
2. no card "Fatture scadute" (linha detalhada),
3. no card "Fatture aperte" (linha detalhada de novo).

Três representações da mesma fatura, em três cards consecutivos, com dois valores diferentes (`total` vs `residuo`).

**"Opere attive" mente:** o card se chama *attive* mas a query é `status: { notIn: ['CANCELLED'] }` — inclui LEAD, QUOTING, COMPLETED. Sem `take`. Renderiza **todas** as obras que já existiram, agrupadas por cliente, sem limite.

### `/projects/[id]` Detalhe da opera — ❌ o número errado, e ele está errado

- **Pergunta:** *"Esta obra está dando lucro?"*
- **Elemento mais forte:** o `<h1>` com o nome da obra — que o usuário já sabia ao clicar.
- **O "Riepilogo finanziario"** é um card de peso igual aos outros 6, na coluna estreita (`lg:col-span-1`), com Margine em `text-sm`. A resposta à pergunta central da tela está em corpo de texto.

**E o número está errado (A1).** `page.tsx:38`:
```ts
const totalInvoiced = project.invoices.reduce((s, i) => s + i.total, 0)
const margin = totalInvoiced - totalExpenses - totalLabor
```
`getProjectById()` traz `invoices: { orderBy: { issueDate: 'desc' } }` — **sem filtro de status**. Faturas `DRAFT` e `CANCELLED` entram no "Fatturato" e inflam o "Margine".

**Seis botões no cabeçalho** (status, Cronograma, Lista acquisti, Elimina, Modifica) todos `variant="secondary"` ou `ghost`. Nenhuma ação primária.

### `/reports` — ❌ a mesma pergunta, resposta diferente

`/reports` filtra corretamente (`status: { in: ['SENT','PAID'] }`) **mas não subtrai manodopera**:

```ts
const margin = invoiced - spent   // reports/page.tsx:91
```

| Tela | Fatturato | Margine |
|---|---|---|
| `/projects/[id]` | todas as faturas, inclusive DRAFT + CANCELLED | − spese − **manodopera** |
| `/reports` | apenas SENT + PAID | − spese |
| `/invoices` | `total` bruto | — |

**A mesma obra mostra dois "Margine" diferentes em duas telas.** Para um app cuja função é dizer se a obra deu lucro, isto é o achado mais grave do documento.

### `/invoices` — ❌ o número principal está inflado (A2)

```ts
const unpaidTotal = unpaid.reduce((s, i) => s + i.total, 0)
```
Mostrado no subtítulo como *"N in attesa (CHF X)"*. Mas `getInvoices()` **não inclui `payments`** — a query nem busca os pagamentos. Logo a página é estruturalmente incapaz de calcular o residuo.

Consequência real, com dado de produção: a INV-2026-002 é um acconto de CHF 11'467.65. Se o cliente pagar metade, `/invoices` continua dizendo CHF 11'467.65 "in attesa" enquanto a dashboard diz CHF 5'733.83. **Duas telas, dois valores, para a mesma pergunta.**

### `/quotes/[id]` — ⚠️ duplicação literal + 8 ações planas

O card "Riepilogo" mostra **Costi** e **Subtotale costi** — o mesmo `quote.subtotalCost`, duas vezes, com ~40px de distância. Idem **Prezzi** / **Subtotale prezzi**.

A barra de ações tem até 8 controles (status, Crea fattura, Clona, Invia, PDF Cliente, Modifica, menu "Altre azioni", Elimina) e o `CloneQuoteButton` aparece **duas vezes** quando o preventivo está bloqueado (no aviso âmbar e na barra).

### `/rapportini` — ❌ hierarquia invertida

- **Pergunta:** *"Quais rapportini preciso aprovar?"*
- **Elemento mais forte:** o botão azul sólido **"Nuovo operaio"** — a ação mais rara do negócio (Marcos tem 1 operário).
- Os rapportini pendentes, que são o motivo de existir da tela, não têm destaque nenhum.

### `/quotes`, `/expenses`, `/suppliers`, `/clients` — ⚠️ listas sem resposta

Todas seguem o mesmo padrão: título, contagem, lista agrupada. Nenhuma responde a uma pergunta — são navegadores. Aceitável para `/clients` e `/suppliers`. **Não aceitável** para `/expenses`, onde a pergunta óbvia ("quanto devo aos fornecedores este mês?") não é respondida.

### `/login` — ⚠️ marca errada

Usa o ícone `HardHat` do lucide, não o `/logo.png` que a app inteira usa. A primeira tela do produto mostra uma marca diferente da do produto.

---

## 3. Apresentação de dados

### 3.1 Números sem contexto (M5)

**Auditei todos os KPIs da app. Nenhum tem comparação, variação ou período.**

| Local | Número | Falta |
|---|---|---|
| `/reports` | "Fatturato totale · emesso" | Período. Desde sempre? Este ano? |
| `/reports` | "Incassato" | vs. mês anterior; % do faturado |
| `/reports` | "Da incassare" | quanto está vencido dentro disso |
| `/` | "Clienti: 12" | inútil — remover |
| `/` | "Opere: 8" | inútil — remover |
| `/projects/[id]` | "Margine CHF 4'231.10" | % sobre faturado; vs. margem prevista no preventivo |
| `/rapportini` | "71 h · maturato CHF 1'420" | período; vs. mês anterior |
| `/quotes/[id]` | "Margine 23%" | vs. `defaultMargin` da empresa |

O caso mais gritante é `/projects/[id]`: o preventivo **tem** uma margem-alvo. A obra **tem** uma margem real. A app calcula as duas e **nunca as coloca lado a lado**. É a comparação mais valiosa do sistema e ela não existe.

### 3.2 Precisão excessiva

`formatCurrency()` força `minimumFractionDigits: 2` sempre. Aplicado a KPIs de resumo, produz **"CHF 127'843.00"** — sete dígitos significativos onde três bastam. Num card de KPI, `CHF 127.8k` comunica melhor e mais rápido.

Só `formatEstimatedValue()` (project detail) usa `maximumFractionDigits: 0`. É a exceção correta, aplicada em um único lugar.

### 3.3 Dados que ninguém usa

- Contadores **Clienti** / **Opere** na dashboard — cardinalidade de tabela, não informação de negócio.
- `/quotes` subtítulo: *"N preventivi - N opere - versioni raggruppate"* — a terceira parte descreve a implementação, não o dado.
- `/quotes/[id]`: **Costi** e **Prezzi** repetidos como *Subtotale costi* / *Subtotale prezzi*.
- Coluna **Tariffa** no PDF de rapportino: sempre o mesmo valor em todas as linhas, exceto quando há override.

### 3.4 Gráfico que deveria ser número, número que deveria ser gráfico

- **`/infografico`** é um **PNG estático** (`public/zanetti-office-infografico.png`) ocupando um slot na navegação principal, ao lado de `/reports` — **com o mesmo ícone `BarChart3`**. Dois itens de menu, mesmo ícone, um deles é uma imagem.
- **Faltando:** a evolução de caixa ao longo do tempo. Todos os valores financeiros são pontuais. Não existe nenhuma série temporal em toda a app — nem sparkline, nem barra. Para um negócio que vive de fluxo de caixa, é a ausência mais cara.
- O Gantt do cronograma é o único elemento visual de dados que existe, e está correto ali.

---

## 4. Fluxos de interação

### 4.1 Contagem de cliques (desktop)

| Tarefa | Cliques | Nota |
|---|---|---|
| Registrar despesa (da dashboard) | 2 + **21 campos** | atalho existe, formulário é o gargalo |
| Fotografar scontrino | 2 | ✅ o melhor fluxo da app |
| Criar preventivo com template | 4 | ✅ razoável |
| Aprovar um rapportino | 3 (sidebar → operário → Approva) | sem ação em lote |
| Ver margem de uma obra | 3 + rolagem na coluna estreita | e o número está errado (A1) |
| Cobrar cliente vencido | 2 (dashboard → mailto) | ✅ bom |
| Mudar status de fatura | 1 inline | ✅ ótimo |

**No mobile some 1 clique em tudo** (abrir hambúrguer).

### 4.2 Fricção catalogada

**Formulários longos.** Despesa: **21 campos**. Configurações: **22**. Usuário: **15**. Fatura: **14**. Nenhum é dividido em etapas ou seções colapsáveis. A despesa é a operação mais frequente da app e tem o segundo formulário mais longo.

**Confirmações (M3).** 22 `window.confirm()` e 30 `window.alert()`. Consequências:
- Bloqueiam a thread, não seguem o design do app, não são estilizáveis, aparecem como "zanetti-omega.vercel.app diz:".
- No iOS Safari, `confirm()` dentro de um handler assíncrono às vezes é suprimido.
- **Nenhuma operação da app tem undo.** Cada exclusão é definitiva, mediada por um diálogo do sistema operacional. Para dados de produção reais isto é frágil.

**Estados ausentes (A4).** Zero `loading.tsx`, zero `error.tsx`, zero `<Suspense>`, em 72 páginas que fazem query num Turso remoto a partir da Vercel. Efeito prático: **cada navegação congela na tela anterior** sem nenhum sinal, até o servidor responder. E qualquer erro de query cai no ecrã de erro padrão do Next em produção — *"Application error: a client-side exception has occurred"*.

40 componentes têm `isPending`/`useFormStatus` — os **formulários** dão feedback. A **navegação** não dá nenhum.

**Sem paginação (A7).** Apenas 3 `take:` em toda a camada `modules/`, dois deles internos. Consequências:
- `/price-catalog` renderiza **496 itens** de uma vez, sem virtualização.
- Dashboard renderiza todas as obras não-canceladas.
- `/quotes` renderiza todos os preventivos + todas as versões históricas.
- `/logs` é o único com limite (20, ou 500 com `?all=1`).

Funciona hoje com dados pequenos. Degrada linearmente e sem aviso.

**Navegação em profundidade.** Cronograma e Lista acquisti têm 4 rotas cada (viewer / `?edit=1` / import / print). A separação viewer↔editor é uma decisão **boa** — mas o acesso a ambos vem de botões `secondary` idênticos no cabeçalho da obra.

### 4.3 O que está bom (para não refazer)

- `MarkInvoiceInlineButton` — mudança de status na própria linha, sem navegar.
- Fluxo de scontrini: 2 toques da dashboard até a foto salva.
- `DateInput` do cronograma, que só salva no `blur` — resolve o congelamento por `isPending` a cada tecla.
- Snapshot + "Ripristina stato iniziale" em cronograma e lista de compras — é undo de verdade, e é o único lugar da app que tem.
- Separação viewer/editor em cronograma e lista de compras.
- Botão mailto de cobrança na dashboard, com corpo pré-preenchido.

---

## 5. Consistência — a bagunça, medida

Contagens sobre 226 arquivos `.tsx` (excluindo `src/generated`).

### 5.1 Cor — 107 tokens distintos, 17 famílias

```
slate 10 · gray 10 · blue 10 · amber 10 · red 9 · orange 9 · emerald 9
indigo 8 · zinc 6 · green 6 · violet 5 · yellow 4 · purple 3
teal 2 · rose 2 · fuchsia 2 · cyan 2
```

**Três escalas de cinza concorrentes** (`gray` 10 + `slate` 10 + `zinc` 6 = 26 neutros). `gray` no conteúdo, `slate` na navegação, `zinc` disperso. Nenhuma regra.

**Verde duplicado:** `green` **e** `emerald` para a mesma semântica (positivo/pago). `green` na dashboard, `emerald` em faturas e margens.

**Laranja/âmbar/amarelo triplicado** para "atenção": `orange` (scontrini, spese), `amber` (rapportini, bloqueado), `yellow` (badge legado).

**Cor usada como enfeite**, contra o princípio de cor-só-para-significado:
- Os 4 contadores da dashboard têm 4 cores (azul, índigo, verde, âmbar) que **não significam nada** — são apenas quatro caixinhas coloridas.
- Ícones de cabeçalho de card coloridos por decoração: `text-blue-600` no FileText, `text-indigo-600` no Building2.

### 5.2 Tipografia — quase boa

| Tamanhos | Uso | | Pesos | Uso |
|---|---|---|---|---|
| `text-sm` | 652 | | `font-medium` | 352 |
| `text-xs` | 506 | | `font-semibold` | 167 |
| `text-2xl` | 70 | | `font-bold` | 23 |
| `text-base` | 42 | | `font-normal` | 7 |
| `text-xl` | 30 | | | |
| `text-lg` | 10 | | | |
| `text-[11px]` | 20 | | | |
| `text-[10px]` | 9 | | | |

**8 tamanhos** (meta: 4) e **4 pesos** (meta: 3). Melhor do que eu esperava — mas `text-lg` (10 usos) e `text-base` (42) são redundantes entre `text-sm` e `text-xl`, e os arbitrários `[10px]`/`[11px]` existem só porque não há um degrau abaixo de `text-xs`.

O problema real: **`text-sm` + `text-xs` = 1158 de 1329 usos (87%)**. A app é quase toda tipografia de um tamanho só. É por isso que nada tem hierarquia — não há contraste de escala para criar nenhuma.

### 5.3 Raio de borda — 6 valores, sem regra

```
rounded-md  212   ← Button, Input, Select, Textarea
rounded-lg  190   ← caixas internas, alertas
rounded      55   ← (4px) disperso
rounded-full 50   ← badges, avatares  ✅ correto
rounded-xl   29   ← Card, botões da dashboard
rounded-2xl   2   ← logo do login
```

Concretamente na dashboard: o botão "Scontrini" é `rounded-xl` (hand-rolled) e todo `<Button>` do resto da app é `rounded-md`. **Dois botões primários, dois raios diferentes, na mesma tela.**

### 5.4 Sombra — 7 valores para uma app que quase não precisa de nenhum

```
shadow 18 · shadow-sm 15 · shadow-lg 11 · shadow-xl 10 · shadow-none 8 · shadow-md 5 · shadow-2xl 2
```

`shadow-none` aparecendo 8 vezes é o sintoma: alguém teve que **desligar** a sombra que o `<Card>` impõe por padrão. O componente-base tem uma decisão errada embutida.

### 5.5 Espaçamento — 21 degraus

```
0 · 0.5 · 1 · 1.5 · 2 · 2.5 · 3 · 3.5 · 4 · 5 · 6 · 8 · 9 · 10 · 11 · 12 · 14 · 16 · 20 · px · auto
```

Meia-etapas usadas intensivamente: `py-1.5` (84), `mt-0.5` (93), `py-2.5` (78), `gap-1.5` (62), `py-0.5` (41), `px-2.5` (28). Numa escala de 4pt, `0.5` = 2px e `1.5` = 6px — **não pertencem à escala**. São ajustes manuais de última hora, e há centenas deles.

`px-3` (233) e `gap-3` (151) dominam: 12px. `p-3.5`, `p-2.5`, `p-1.5` existem só para caber conteúdo que já estava apertado.

### 5.6 Valores mágicos

**44 valores arbitrários `[...]` distintos.** Os previsíveis (`max-w-[210mm]` para A4, grids de largura fixa) são legítimos. Os que não são: `text-[10px]`, `text-[11px]`, `min-w-[56px]`, `min-w-[58px]`, `min-w-[68px]` (três larguras mínimas quase iguais), `max-h-[58vh]`, `max-h-[55vh]`, `max-h-[60vh]`, `max-h-[80vh]`, `max-h-[90vh]` (cinco alturas de modal).

**`bg-[#1e3a5f]`** — o azul-marinho dos PDFs, escrito em hex literal, fora de qualquer token.

**619 `style={{}}` inline**, concentrados nas páginas de impressão (`quotes/[id]/preview` sozinha tem 118). Parcialmente justificável — impressão precisa de cor explícita para `print-color-adjust`. Mas significa que **o design dos documentos que vão ao cliente não compartilha nenhum token com a app**.

### 5.7 Duplicação de componentes

Quatro componentes de status independentes: `invoice-status-badge`, `quote-status-badge`, `project-status-button`, `quote-status-actions` — cada um com seu próprio mapa de rótulo→cor. Além do `ProjectStatusBadge` embutido em `ui/badge.tsx`. **Cinco fontes de verdade** para "status → cor".

---

## 6. Mobile — auditoria medida

> **Método:** app rodando localmente (Next dev + `dev.db`), autenticada como ADMIN, renderizada em
> Chromium com viewport **375×812, DPR 2, `isMobile`, `hasTouch`, User-Agent de iPhone**.
> **26 rotas** capturadas em screenshot e medidas via DOM (`scrollWidth`, `getBoundingClientRect`
> de cada elemento interativo). Os números abaixo são medições, não estimativas.

### 6.0 Capturas (evidência)

Renderizadas a 375×812, DPR 2, sessão ADMIN válida. Em `docs/audit-mobile/`:

| Arquivo | Mostra |
|---|---|
| `dashboard.png` | logo quebrado no topo; mesma fatura vencida em 3 cards; "467gg" e "97gg" com o mesmo peso; metadados em 4 linhas cinza |
| `expenses.png` | 1 palavra por linha; filtro de 636px cortado; sem data nem fornecedor; coluna de ação clipada |
| `reports.png` | `break-all` partindo `CHF-` / `12'180.00`; P&L só com Margine |
| `price-catalog.png` | ~1250px de chips antes do 1º item; `CHF` / `38.00` quebrado; busca truncada |
| `infografico.png` | página inteira quebrada — imagem 404 num retângulo branco de ~900px |

---

### 6.1 A boa notícia, primeiro

**Nenhuma das 26 rotas tem overflow horizontal de página.** `document.scrollWidth === 375` em todas.
Os wrappers `overflow-x-auto` cumprem o papel — o corpo da página nunca desliza lateralmente.

Também funcionam bem: o hack `font-size: 16px` para inputs (nenhum auto-zoom do iOS observado),
o formulário de nova fatura e o cabeçalho do editor de preventivo (campos empilhados, generosos,
legíveis), os grids de miniatura (`/media`, `/receipts`) e o layout mobile dedicado do
`quote-items-editor` — que **existe** e é o único componente pesado que se reconstrói de verdade
abaixo de `lg`.

Tudo o que vem a seguir é o que está quebrado.

---

### 6.2 A0 — Um bug de auth derruba as imagens de todo o app

**Causa raiz.** `src/proxy.ts:28`:

```ts
matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
```

O matcher exclui `_next/static`, `_next/image` e `favicon.ico` — mas **não exclui `public/`**.
Logo, toda requisição a um arquivo estático passa pela verificação de sessão. Medido:

| Recurso | HTTP |
|---|---|
| `/logo.png` (sem cookie) | **307** → `/login` |
| `/_next/image?url=%2Flogo.png&w=48&q=75` | **400** — *"The requested resource isn't a valid image"* |
| `/icon.png` | **307** |
| `/apple-icon.png` | **307** |
| `/zanetti-office-infografico.png` | **307** |
| `/favicon.ico` | **404** (listado em `PUBLIC_PATHS`, mas o arquivo não existe) |

**Por que quebra mesmo com o usuário logado:** o otimizador de imagens do Next busca a URL de
origem **server-side, sem repassar o cookie do usuário**. O proxy não vê `zs_session`, redireciona
para `/login`, e o otimizador recebe HTML em vez de imagem → 400.

**Medido no navegador autenticado:**

```
--- requisições de imagem (sessão válida) ---
  400  /_next/image?url=%2Flogo.png&w=48&q=75
  400  /_next/image?url=%2Flogo.png&w=32&q=75
--- <img> no DOM ---
  { src: ".../w=48", alt: "", naturalWidth: 0, broken: true }
  { src: ".../w=32", alt: "", naturalWidth: 0, broken: true }
```

**Consequências, todas visíveis nas capturas:**

1. **O logo está quebrado em todas as páginas, para todos os usuários** — `broken: 2` medido em
   cada uma das 26 rotas. Sidebar (48px) e barra superior mobile (32px). O ícone de imagem
   quebrada aparece no topo de cada tela do produto.
2. **`/infografico` está completamente inutilizável** — `broken: 3`. A página inteira é um retângulo
   branco de ~900px com um ícone de imagem quebrada e a legenda *"Scorri lateralmente per leggere
   tutta l'immagine."* apontando para nada. É um item de navegação principal.
3. **Favicon/ícone de app não carrega** — `/icon.png` e `/apple-icon.png` retornam 307. Na tela de
   login o usuário ainda não tem sessão, então a aba nunca mostra o ícone; e "adicionar à tela de
   início" no iOS não consegue buscar o ícone.
4. `alt=""` em ambos os `<img>` do logo — sem texto alternativo, a imagem quebrada não comunica nada.

**Correção:** excluir os estáticos no matcher (`|logo\\.png|icon\\.png|apple-icon\\.png|.*\\.png`)
ou, melhor, adicionar um teste de extensão em `PUBLIC_PATHS`. É uma linha, e resolve os quatro
sintomas. Bônus: `public/logo.png` tem **1024×1024 e 1,4 MB** para ser exibido a 32–48px.

---

### 6.3 A8 — Alvos de toque: 87% abaixo do mínimo

Medido: todo `a`, `button`, `[role=button]`, `input`, `select` visível, contra o mínimo de 44×44px.

| Rota | < 44px | Total | |
|---|---:|---:|---|
| `/price-catalog` | **193** | 193 | 100% |
| `/quotes/[id]/edit` | **114** | 114 | 100% |
| `/suppliers` | **39** | 39 | 100% |
| `/quotes` | 25 | 27 | 93% |
| `/projects/[id]` | **23** | 23 | 100% |
| `/quotes/new` | **21** | 21 | 100% |
| `/` (dashboard) | 20 | 33 | 61% |
| `/invoices/[id]` | **16** | 16 | 100% |
| `/expenses` | 16 | 29 | 55% |
| `/invoices` | 13 | 19 | 68% |
| `/reports`, `/clients/[id]` | 12 | 12 | 100% |
| **Total amostrado** | **~366** | **~421** | **87%** |

**Os menores estão exatamente na tela mais importante.** Medição dentro do editor de preventivo:

```
 22x  button  24×24   (setas mover ↑↓)
 11x  button  77×21   "Inserisci"
  6x  button  18×18   (sem rótulo visível)
  6x  button  22×22   "Cerca nel prezzario"
  6x  button  24×24   "Salva nel prezzario"
  6x  button  87×26   "Nascondi"
  6x  button  52×26   "Rif."
  1x  button  22×22   "Nascondi al cliente"
```

**18×18px é 41% do mínimo.** E os rótulos entre aspas acima vêm de `title=` — que **nunca aparece
no toque**. São botões de 18–24px, sem rótulo visível, que executam ações não triviais
("salvar no prezzario", "esconder do cliente"). Num celular, dentro de uma obra, com luva.

Existe no código uma correção parcial e correta — `opacity-100 sm:opacity-0 sm:group-hover:opacity-100`
para manter ícones de ação **visíveis** no toque. Resolveram visibilidade; nunca resolveram **tamanho**.

---

### 6.4 A9 — `/expenses` é a pior tela do app no celular

A operação mais frequente do negócio, e a lista fica assim em 375px:

- **Uma palavra por linha.** *"Noleggio / ponteggio / façade (4 / settimane)"* — a coluna
  Descrizione fica com ~110px porque Stato e Importo mantêm largura fixa. Cada linha ocupa
  **~180px de altura** para um conteúdo que caberia em 40px. Cabem **3 despesas por tela**.
- **A data não existe.** `Data` é `hidden sm:table-cell` e **não tem fallback mobile**. Numa lista
  de despesas, sem data, é impossível achar "o scontrino de terça".
- **O fornecedor não existe.** `Fornitore` é `hidden lg:table-cell`, também sem fallback. Só
  `Progetto` ganhou uma linha de fallback (`sm:hidden`) — souberam do padrão e aplicaram uma vez.
- **O filtro de projeto tem 636px** (medido), 261px além da tela. Fica cortado; é preciso rolar
  o container lateralmente para ver o próprio seletor.
- **A coluna de ação é cortada** — só se enxerga uma lasca verde do botão de pagar na borda direita.
- O badge *"In attesa"* quebra em duas linhas.

O cabeçalho diz *"13 spese · CHF 51'456.00 · 4 da pagare"*. O total é de **todas** as despesas;
quanto se deve dos 4 pendentes não é dito em lugar nenhum.

---

### 6.5 A10 — `break-all` parte números monetários

`reports/page.tsx:66` aplica `break-all` ao valor do KPI. Capturado em `/reports`, na tabela P&L,
uma margem negativa renderiza literalmente assim:

```
CHF-
12'180.00
```

O sinal de menos fica órfão, colado a "CHF", numa linha; o número na seguinte. À primeira vista
lê-se como dois valores. **Nunca se quebra um número** — e menos ainda um que muda de sinal.

---

### 6.6 Colunas que somem no celular (sem substituto)

| Tela | Escondido em mobile | Sobra | Fallback? |
|---|---|---|---|
| `/expenses` | Progetto, Fornitore, Tipo, **Data** | Descrizione, Stato, Importo | só Progetto |
| `/reports` P&L | **Fatturato, Spese**, Cliente, Data | **só Margine** | ❌ |
| `/suppliers` | Specialità, **Contatti (e-mail + telefone)** | Nome, Categoria | só tags (inertes) |
| `/suppliers/[id]` | Data, Progetto | — | ❌ |

Dois casos merecem destaque:

**`/reports` mostra o resultado e esconde as entradas.** Margine sozinho, sem Fatturato nem Spese,
é injulgável — CHF 2'000 de margem é ótimo sobre CHF 8'000 e péssimo sobre CHF 200'000.

**`/suppliers` esconde o telefone — no telefone.** E em lugar nenhum do app o número é tocável:
**1 único `href="tel:"`** em 24 renderizações de campo `phone` (só em `/clients/[id]`). O caso de uso
mais óbvio de um app de obra no celular — ligar para o fornecedor — não existe.

---

### 6.7 Overflow empurrado para dentro dos containers

A página não desliza, mas o conteúdo excedente foi para regiões de scroll interno. Larguras medidas:

| Local | Largura | Viewport | Excesso |
|---|---:|---:|---:|
| `/invoices/new` — grid de artigos `min-w-[760px]` | 760px | 375px | **+385px** |
| `/infografico` — wrapper `min-w-[760px]` | 760px | 375px | +385px |
| `/expenses` — `<select>` de projeto | 636px | 375px | +261px |
| `/quotes/[id]/preview` — toolbar | 417px | 375px | +42px |
| `/price-catalog` — tabela | 386px | 375px | +11px |

O caso de `/invoices/new` é o pior: criar uma fatura no celular exige rolar horizontalmente por um
grid de 760px **e** o cabeçalho de colunas é `hidden md:grid` — ou seja, no mobile você navega
lateralmente por seis campos **sem nenhum rótulo** dizendo o que cada um é.

---

### 6.8 Cronograma: a coluna de nomes rola junto com a timeline

`schedule-viewer.tsx:126` e `schedule-client.tsx:348` usam `grid-cols-[190px_1fr]` e
`grid-cols-[220px_1fr]` **sem prefixo responsivo**, dentro de um `overflow-x-auto` com
`minWidth: Math.max(720, totalDays * 18 + 220)`.

A coluna com o nome da fase está **dentro** da região que rola. Ao deslizar para ver datas
posteriores, o nome da fase sai da tela — resta uma barra colorida sem identificação. Não há
coluna fixa (`sticky left-0`). Num cronograma de 60 dias a área rolável passa de 1300px.

---

### 6.9 A barra de endereço nunca recolhe

`AppShell` monta `<main className="flex-1 overflow-y-auto">` dentro de um wrapper
`overflow-hidden`, com `html, body { height: 100% }`. **O documento nunca rola — quem rola é o
`<main>`.** Medido: `document.scrollHeight === 812` (a altura exata do viewport) em todas as 26 rotas.

Consequência no celular: Safari e Chrome só recolhem a barra de endereço quando o **documento**
rola. Como ele nunca rola, a barra fica permanentemente visível, consumindo ~60px de uma tela que
já tem 812px. É ~7% da altura útil perdida em todas as telas, o tempo todo.

---

### 6.10 Áreas seguras, PWA e navegação

- **`safe-area-inset`: 0 ocorrências** em todo o projeto. `viewport-fit`: 0. A barra de abas
  inferior do operário (`rapportino-client.tsx:165`, `fixed bottom-0`) fica por baixo do indicador
  de home do iPhone. Falta `pb-[env(safe-area-inset-bottom)]`.
- **Sem `manifest.json`, sem `themeColor`.** O app é usado diariamente no celular, em obra, e não é
  instalável na tela de início. Sem `themeColor`, a moldura do navegador não acompanha a barra
  `slate-900` do topo.
- **17 destinos atrás do hambúrguer.** Toda navegação custa 2 toques e o painel cobre a tela inteira.
  A **única** barra de abas inferior do produto está no `/rapportino` do operário — o melhor padrão
  mobile do app, reservado a quem menos o usa.
- **Botão `X` morto:** em `app-shell.tsx`, o `X` de fechar está num `<header>` sem `z-index`,
  enquanto o backdrop é `z-40`. O botão fica **por baixo** do backdrop; "funciona" só porque o
  clique atinge o backdrop, que também fecha.

---

### 6.11 Adaptação por tela — veredito

| Tela | Estado | Observação |
|---|---|---|
| `/login` | ✅ Boa | `max-w-sm` centrado; só a marca está errada (`HardHat` em vez do logo) |
| `/rapportino` (operário) | ✅ Boa | abas inferiores; falta só `safe-area-inset` |
| `/receipts` | ✅ Boa | grid 1-col, fluxo de 2 toques |
| `/media` | ✅ Boa | grid 2→3→4→6 colunas |
| `/invoices/new` (cabeçalho) | ✅ Boa | campos empilhados e generosos |
| `/quotes/[id]/edit` (cabeçalho) | ✅ Boa | idem |
| `/` dashboard | ⚠️ Passável | rola muito; redundância tripla; sem total |
| `/invoices`, `/quotes`, `/clients` | ⚠️ Passável | listas agrupadas funcionam; alvos pequenos |
| `/rapportini`, `/logs`, `/settings` | ⚠️ Passável | `/logs` usa `p-6` em vez do padrão `p-4` |
| `/reports` | ❌ Quebrada | esconde as entradas, `break-all` parte o número |
| `/suppliers` | ❌ Quebrada | esconde contatos; sem `tel:` |
| `/price-catalog` | ❌ Quebrada | ~1250px de chips antes do 1º item; "CHF / 38.00" quebra |
| `/expenses` | ❌ Quebrada | sem data, sem fornecedor, filtro de 636px, 1 palavra/linha |
| `/invoices/new` (artigos) | ❌ Quebrada | 760px de scroll lateral sem cabeçalhos |
| `/projects/[id]/schedule` | ❌ Quebrada | nome da fase rola para fora |
| `/infografico` | ❌ Quebrada | imagem quebrada; página vazia |
| `/rapportini/[userId]` | ❌ Quebrada | `grid-cols-3` fixo no card de reconciliação |
| `/relatorio/*` (7 páginas) | ❌ Quebrada | **0 breakpoints**, 40 tabelas, `fontSize: 8.5pt`, nenhum `overflow-x` |

**Resumo:** de 26 telas medidas, **6 boas, 9 passáveis, 11 quebradas**. Nenhuma está "perfeitamente
adaptada" — a resposta direta à pergunta é **não**.

---

### 6.12 Números de consistência responsiva

- **Apenas 11 de 226 componentes** têm layout duplo real (`hidden lg:` + `lg:hidden`). Em 2 deles
  (`/expenses`, `/reports`) o "layout mobile" é apenas esconder colunas.
- **15 páginas com 0 breakpoints.** 7 são print/preview A4 (legítimo); **7 são os relatórios**
  visitados pela navegação normal; 1 é `/login` (fluida por acaso).
- **33 páginas com 1–3 breakpoints** — quase todas formulários, que herdam responsividade dos
  componentes `Input`/`Select` e por isso escapam.
- **3 `grid-cols-3` sem prefixo responsivo**: `quote-items-editor.tsx:184`,
  `quotes/[id]/page.tsx:167` (KPI Costi/Prezzi/Margine) e `rapportini/[userId]/page.tsx:105`
  (reconciliação de agência, com valores `text-lg` em células de ~114px).
- **52 de 56 páginas** usam `p-4 sm:p-8`. Os desvios: `/logs` (`p-6`), `/relatorio/[id]` (`p-8`).

---

### 6.13 Contraste (calculado)

| Par | Ratio | WCAG AA (4,5:1) |
|---|---:|---|
| `text-gray-400` (#9ca3af) / branco | **2,54:1** | ❌ |
| `text-gray-300` (#d1d5db) / branco | **~1,6:1** | ❌ |
| `text-slate-500` (#64748b) / `slate-900` | **3,75:1** | ❌ |
| `text-gray-500` (#6b7280) / branco | 4,83:1 | ✅ |

**286 usos de `text-gray-400`**, **139 deles junto com `text-xs`** (12px) — é o estilo padrão de
metadados. Visível na captura do dashboard: *"Famiglia Rossi-Bernasconi · Ristrutturazione completa
appartamento Via Nassa · scad. 15.4.2025"* ocupa **4 linhas** em cinza que reprova AA.
Trocar `gray-400 → gray-500` corrige 286 ocorrências de uma vez.

`text-slate-500` a 11px são os rótulos de seção da sidebar (OPERATIVO, FINANZIARIO…) — texto
pequeno a 3,75:1.

---

### 6.14 Rótulos e overlays

- **83 `title=`** contra **14 `aria-label`** em 93 componentes client. `title` não existe no toque.
- **9 overlays**, **3** tratam `Escape`, **nenhum** tem focus trap, `role="dialog"` ou `aria-modal`.
- **5 alturas máximas de modal diferentes** (`58vh`, `55vh`, `60vh`, `80vh`, `90vh`) — nenhuma
  considera o teclado virtual, que ocupa ~40% da tela quando um campo recebe foco.

## 7. Dois bugs de dados encontrados durante a auditoria

Não são estética. Registro porque afetam números que o usuário lê.

**M4 — `formatDateInput()` usa UTC num app Europe/Zurich.**
```ts
export function formatDateInput(date) {
  return new Date(date).toISOString().split('T')[0]   // UTC
}
```
Todo o resto do app formata com `timeZone: 'Europe/Zurich'` — deliberadamente, e está documentado no CLAUDE.md. Mas `formatDateInput` não. Entre 00:00 e 02:00 no horário suíço, `formatDateInput(new Date())` retorna **o dia anterior**. Afeta a data padrão de: nova despesa, novo pagamento de fatura, data de emissão de fatura, início de cronograma. Marcos lançando um scontrino à meia-noite grava a data de ontem.

**A1 — `totalInvoiced` sem filtro de status** (detalhado na §2). Uma fatura cancelada aumenta a margem da obra.

---

## 8. Fundação para a Fase 2

Se aprovares, começo pelos tokens. O que proponho definir num único arquivo:

**Cor** — um neutro (`slate`, eliminando `gray` e `zinc`), e **quatro** cores semânticas: ação (`blue`), positivo (`emerald`, eliminando `green`), atenção (`amber`, eliminando `orange`/`yellow`), negativo (`red`). De 107 tokens para ~24. Cor nunca decorativa.

**Tipografia** — 4 tamanhos (12 / 14 / 18 / 28) e 3 pesos (400 / 500 / 600). Elimina `text-lg`, `text-base`, `[10px]`, `[11px]`.

**Espaçamento** — escala 4pt estrita: 4 / 8 / 12 / 16 / 24 / 32 / 48. Elimina todas as meia-etapas.

**Raio** — 3 valores: 6px (controles), 12px (superfícies), full (badges).

**Sombra** — 2: nenhuma (padrão) e uma elevação para overlays. `<Card>` deixa de trazer sombra; separação por espaço e alinhamento.

**Movimento** — 160ms ease-out para estados, 220ms para entrada de overlay.

**Números** — um único helper com precisão explícita: `chf(v)` sem centavos para KPIs, `chfExact(v)` com centavos para documentos. Sempre `tabular-nums`, sempre alinhado à direita, nunca `break-all`.

**Antes de qualquer redesenho** eu unificaria a definição de Fatturato/Margine numa única função em `modules/`, porque não adianta melhorar a apresentação de um número que está errado.

**Ordem das telas** (por impacto): Dashboard → Detalhe da opera → `/invoices` → `/reports` → `/quotes/[id]` → `/rapportini` → listas restantes → formulários.

Nenhuma biblioteca nova. Tailwind 4 `@theme` já dá tudo, e os componentes-base (`Card`, `Button`, `Input`, `Select`, `Textarea`, `Badge`) já estão no lugar certo — só precisam consumir tokens em vez de valores soltos.

---

## Anexo — comandos de verificação

```bash
SRC=$(find src -name "*.tsx" | grep -v generated)

# cores distintas
grep -ohE '\b(bg|text|border|ring)-(slate|gray|zinc|blue|red|amber|emerald|green|orange|indigo|violet|yellow|purple|teal|rose|fuchsia|cyan)-[0-9]{2,3}\b' $SRC \
  | sed -E 's/^[a-z]+-//' | sort -u | wc -l          # 107

# tamanhos de fonte
grep -ohE '\btext-(xs|sm|base|lg|xl|2xl)\b' $SRC | sort | uniq -c

# degraus de espaçamento
grep -ohE '\b(p|px|py|m|mt|mb|gap)-[0-9.]+\b' $SRC \
  | sed -E 's/^[a-z]+-//' | sort -u | wc -l          # 21

# estados ausentes
find src/app -name "loading.tsx" -o -name "error.tsx" | wc -l   # 0

# diálogos nativos
grep -rn "confirm(\|alert(" $SRC | wc -l                        # 52

# paginação
grep -rn "take:" src/modules --include=*.ts | wc -l             # 3
```

### Reproduzir a medição mobile

```bash
# 1. ambiente local (dev.db já está no repo)
npm install
printf 'DATABASE_URL="file:./dev.db"\nAUTH_SECRET="dev"\n' > .env.local
cp .env.local .env
npx prisma generate
DATABASE_URL="file:./dev.db" npx prisma db push --accept-data-loss
npx next dev -p 3000

# 2. o bug A0 — sem navegador, direto no curl
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/logo.png          # 307 (deveria ser 200)
curl -s http://127.0.0.1:3000/_next/image?url=%2Flogo.png\&w=48\&q=75            # 400 "isn't a valid image"

# 3. medição de alvos de toque, em qualquer página, no console do navegador
[...document.querySelectorAll('a,button,input,select')]
  .map(e => e.getBoundingClientRect())
  .filter(r => r.width && r.height)
  .reduce((a, r) => (a.total++, (r.width < 44 || r.height < 44) && a.small++, a), { small: 0, total: 0 })

# 4. imagens quebradas na página atual
[...document.querySelectorAll('img')].filter(i => i.complete && i.naturalWidth === 0).length
```

> Ao terminar, remova `.env` / `.env.local` e rode `git checkout -- dev.db` — o `prisma db push`
> altera o SQLite versionado.
