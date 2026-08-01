# Redesign — o que falta

> **Concluído** (26.07.2026). Os três blocos estão feitos e verificados num
> **build de produção** servido em `next start`, com Chromium a 375×812 e 1280×900.
> Os números abaixo são medições, não estimativas.

---

## Estado final

| | Antes | Agora |
|---|---:|---:|
| Alvos de toque < 44px (13 ecrãs de lista) | 366/421 (87%) | **2/389 (1%)** |
| Alvos de toque < 44px (10 formulários) | 137/278 (49%) | **17/269 (6%)** |
| Controlos sem nome acessível | 42/823 | **0/743** |
| `gray-*` fora das páginas de impressão | 1499 | **0** |
| `text-gray-400` (2,5:1, reprova AA) | 286 | **0** |
| Literais hex na app e nos documentos | 41 distintos, 11 ficheiros | **0** |
| Tamanhos de tipo fora da escala de 4 | 1142 | **0** |
| `confirm()` / `alert()` nativos | 52 | **0** |
| Overflow horizontal · imagens quebradas · erros JS | — | **0 · 0 · 0** |

Os alvos que restam são checkboxes e radios de 13px **dentro de rótulos que já
têm 44px** — o alvo real passa; é o script de medição que conta o `<input>` em
vez do `<label>`.

---

## O que foi feito

**Correção antes de estética.** Assets estáticos atrás do login (o logo estava
partido em todos os ecrãs). Três definições conflituantes de Fatturato/Margine
colapsadas numa só (`modules/finance/rules.ts`). `formatDateInput` a resolver em
Europe/Zurich em vez de UTC, que pré-preenchia despesas com a data de ontem
entre a meia-noite e as 02:00.

**Tokens.** Um `@theme` em `globals.css`: 4 tamanhos de tipo, 3 pesos, escala de
4pt, 2 raios, 1 sombra, neutros com papel e 4 cores semânticas. Um segundo bloco
`--doc-*` para os documentos impressos, que precisam de valores opacos e
seguros para papel e não podem usar oklch.

**Hierarquia.** Uma ação primária por ecrã, escolhida pelo estado do documento.
O dashboard reconstruído à volta de uma pergunta: quanto há a receber.

**Estados.** `error.tsx` nos 14 segmentos, `not-found.tsx`, esqueletos de
carregamento, estados vazios, undo real nas exclusões, paginação nas listas.

**Mobile.** Barra de abas inferior, busca global (⌘K), linhas inteiras
tocáveis, safe-area, manifest PWA, sem overflow em nenhum ecrã.

---

## Ideias para depois (não são dívida)

* **Comparação orçado vs. real** para além do detalhe da obra — hoje só lá
  existe. Levá-la ao dashboard e à lista de opere daria contexto a números que
  ainda aparecem sozinhos.
* **Aprovação em lote de rapportini**, alertas de validade de documentos,
  captura automática de localização e tarifas de horas extra estruturadas — os
  quatro estão registados no `CLAUDE.md` como adiados por decisão do Marcos.
* **Tema escuro.** Os tokens já estão por papel, por isso é um segundo bloco de
  valores e não uma reescrita.
