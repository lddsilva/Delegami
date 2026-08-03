'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { unzipSync, strFromU8, strToU8, zipSync } from 'fflate'
import { AlertCircle, Archive, CheckCircle2, ChevronDown, Clipboard, Download, FileArchive, Loader2, Upload } from 'lucide-react'
import type { ReceiptImportBatchRow } from '@/modules/receipt-imports/queries'
import {
  checkReceiptImportDuplicates,
  createReceiptImportBatch,
  finalizeReceiptImportBatch,
  importReceiptBatchItem,
  type ReceiptImportReviewedItem,
} from '@/modules/receipt-imports/actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn, formatDate } from '@/lib/utils'

type ProjectOption = { id: string; name: string; clientName: string; referenceCode: string | null }
type SupplierOption = { id: string; name: string; category: string | null }

type ManifestItem = {
  receiptInboxId?: string | null
  imageFile: string
  capturedAt?: string | null
  originalNote?: string | null
  date: string
  supplierName: string | null
  supplierAddress?: string | null
  supplierVatNumber?: string | null
  description: string
  items?: Array<{ description?: string | null; quantity?: string | null; amount?: number | null }>
  amount: number
  currency: 'CHF' | 'EUR'
  expenseType: 'MATERIAL' | 'LABOR' | 'TRANSPORT' | 'EQUIPMENT' | 'ADMIN' | 'OTHER'
  paymentStatus: 'PAID' | 'PENDING' | 'PARTIALLY_PAID'
  isItalianPurchase: boolean
  notes?: string | null
  confidence?: number | null
}

type ImportRowStatus = 'READY' | 'WARNING' | 'ERROR' | 'CREATED' | 'SKIPPED' | 'IMPORT_ERROR'

type ImportRow = ManifestItem & {
  rowKey: string
  imageFile: string
  file?: File
  previewUrl?: string
  projectId: string
  projectLabel: string | null
  supplierMode: 'existing' | 'create' | 'none'
  supplierId: string
  createSupplierName: string
  createSupplierCategory: string
  allowDuplicate: boolean
  skip: boolean
  duplicateExpenseId?: string
  status: ImportRowStatus
  message?: string
}

type Summary = { created: number; skipped: number; errors: number; batchId?: string } | null

const expenseTypeOptions = [
  { value: 'MATERIAL', label: 'Materiale' },
  { value: 'LABOR', label: 'Manodopera' },
  { value: 'TRANSPORT', label: 'Trasporto' },
  { value: 'EQUIPMENT', label: 'Attrezzatura' },
  { value: 'ADMIN', label: 'Amministrativo' },
  { value: 'OTHER', label: 'Altro' },
]

const supplierCategoryOptions = [
  'Materiali edili e ferramenta',
  'Noleggio attrezzature',
  'Trasporto e smaltimento',
  'Servizi professionali',
  'Altro',
]

const projectInstructionsText = `Voce atua como assistente de importacao de scontrini do Delegami.

Sempre que eu enviar um ZIP gerado pelo botao "Scarica ZIP per IA", analise as imagens citadas no manifest.json e devolva SOMENTE o manifest.json final em JSON valido.

Regras:
- Retorne somente JSON valido, sem comentarios.
- Mantenha exatamente a mesma quantidade de entradas do manifest original.
- Preserve exatamente receiptInboxId e imageFile de cada entrada.
- Use o nome exato do arquivo no campo imageFile, incluindo images/.
- Extraia o total pago, nao subtotal, troco, IVA ou desconto.
- Use date em formato YYYY-MM-DD. Se a data do scontrino nao for legivel, use capturedAt.
- currency deve ser CHF ou EUR.
- expenseType deve ser:
  MATERIAL para materiais, consumiveis, ferramentas pequenas, tinta, cola, parafusos, piastrelle;
  EQUIPMENT para ferramentas/equipamentos reutilizaveis, maquinas, aluguel/noleggio;
  TRANSPORT para combustivel, pedagio, estacionamento, transporte, entrega;
  ADMIN para correio, taxas, escritorio, documentos;
  LABOR somente se for mao de obra;
  OTHER se estiver incerto.
- paymentStatus normalmente PAID.
- isItalianPurchase deve ser true para recibos italianos/EUR, false para suicos/CHF.
- description deve ser em italiano, curta e util. Se houver muitos itens diferentes, use um resumo: "Materiali vari da cantiere - {fornitore}".
- items e opcional, mas inclua os principais itens quando forem legiveis.
- Se o fornecedor nao for legivel, use supplierName null. O app deixara a despesa sem fornecedor e o usuario ajustara depois.
- Nao escolha obra/projeto. Isso sera decidido no Delegami.
- Se nao tiver certeza de algum campo obrigatorio, use a melhor leitura possivel e coloque a duvida em notes.

Schema esperado:
[
  {
    "receiptInboxId": "id-original-do-scontrino",
    "imageFile": "images/001.jpg",
    "date": "2026-05-23",
    "supplierName": "Bauhaus Lugano",
    "supplierAddress": null,
    "supplierVatNumber": null,
    "description": "Materiali vari da cantiere - Bauhaus",
    "items": [
      { "description": "Piastrelle bagno 30x60", "quantity": "8 m2", "amount": 485.6 }
    ],
    "amount": 485.6,
    "currency": "CHF",
    "expenseType": "MATERIAL",
    "paymentStatus": "PAID",
    "isItalianPurchase": false,
    "notes": "IVA inclusa",
    "confidence": 0.85
  }
]`

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function normalizeZipPath(value: string) {
  return value.replace(/\\/g, '/').replace(/^\/+/, '')
}

function mimeForPath(path: string) {
  const lower = path.toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  return 'image/jpeg'
}

function isSupportedImage(path: string) {
  return /\.(jpe?g|png|webp)$/i.test(path)
}

function asArrayBuffer(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return copy.buffer
}

function formatProjectLabel(projectId: string, projects: ProjectOption[]) {
  if (!projectId) return null
  const project = projects.find((p) => p.id === projectId)
  return project ? `${project.clientName} - ${project.name}` : null
}

function matchSupplier(name: string | null, suppliers: SupplierOption[]) {
  if (!name) return ''
  const target = normalizeText(name)
  if (!target) return ''

  const exact = suppliers.find((supplier) => normalizeText(supplier.name) === target)
  if (exact) return exact.id

  const partial = suppliers.find((supplier) => {
    const candidate = normalizeText(supplier.name)
    return candidate.includes(target) || target.includes(candidate)
  })
  return partial?.id ?? ''
}

function suggestedSupplierCategory(type: ImportRow['expenseType']) {
  if (type === 'EQUIPMENT') return 'Noleggio attrezzature'
  if (type === 'TRANSPORT') return 'Trasporto e smaltimento'
  if (type === 'ADMIN') return 'Servizi professionali'
  return 'Materiali edili e ferramenta'
}

function validateManifestItem(raw: unknown, index: number): ManifestItem {
  const item = raw as Partial<ManifestItem>
  const receiptInboxId = typeof item.receiptInboxId === 'string' && item.receiptInboxId.trim()
    ? item.receiptInboxId.trim()
    : null
  const imageFile = typeof item.imageFile === 'string' ? normalizeZipPath(item.imageFile) : ''
  const date = typeof item.date === 'string' ? item.date : ''
  const description = typeof item.description === 'string' ? item.description : ''
  const amount = typeof item.amount === 'number' ? item.amount : Number(item.amount)
  const currency = item.currency === 'EUR' ? 'EUR' : 'CHF'
  const allowedTypes = ['MATERIAL', 'LABOR', 'TRANSPORT', 'EQUIPMENT', 'ADMIN', 'OTHER']
  const expenseType = allowedTypes.includes(String(item.expenseType)) ? item.expenseType as ManifestItem['expenseType'] : 'MATERIAL'
  const allowedPayment = ['PAID', 'PENDING', 'PARTIALLY_PAID']
  const paymentStatus = allowedPayment.includes(String(item.paymentStatus)) ? item.paymentStatus as ManifestItem['paymentStatus'] : 'PAID'

  if (!imageFile) throw new Error(`Riga ${index + 1}: imageFile mancante`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Riga ${index + 1}: data non valida`)
  if (!description.trim()) throw new Error(`Riga ${index + 1}: descrizione mancante`)
  if (!Number.isFinite(amount) || amount <= 0) throw new Error(`Riga ${index + 1}: importo non valido`)

  return {
    receiptInboxId,
    imageFile,
    capturedAt: typeof item.capturedAt === 'string' ? item.capturedAt : null,
    originalNote: typeof item.originalNote === 'string' ? item.originalNote : null,
    date,
    supplierName: typeof item.supplierName === 'string' ? item.supplierName : null,
    supplierAddress: typeof item.supplierAddress === 'string' ? item.supplierAddress : null,
    supplierVatNumber: typeof item.supplierVatNumber === 'string' ? item.supplierVatNumber : null,
    description,
    items: Array.isArray(item.items) ? item.items : [],
    amount,
    currency,
    expenseType,
    paymentStatus,
    isItalianPurchase: typeof item.isItalianPurchase === 'boolean' ? item.isItalianPurchase : currency === 'EUR',
    notes: typeof item.notes === 'string' ? item.notes : null,
    confidence: typeof item.confidence === 'number' ? item.confidence : null,
  }
}

function rowProblems(row: ImportRow) {
  const problems: string[] = []
  if (!row.skip && !row.file && !row.receiptInboxId) problems.push('foto mancante')
  if (!row.skip && row.supplierMode === 'existing' && !row.supplierId) problems.push('fornitore da selezionare')
  if (!row.skip && row.supplierMode === 'create' && !row.createSupplierName.trim()) problems.push('nome nuovo fornitore mancante')
  if (!row.skip && row.duplicateExpenseId && !row.allowDuplicate) problems.push('possibile duplicato')
  if (!row.description.trim()) problems.push('descrizione mancante')
  return problems
}

function rowWarnings(row: ImportRow) {
  const warnings: string[] = []
  if (!row.skip && row.supplierMode === 'none') warnings.push('senza fornitore (da aggiustare dopo)')
  return warnings
}

function statusFor(row: ImportRow): ImportRowStatus {
  if (row.status === 'CREATED' || row.status === 'SKIPPED' || row.status === 'IMPORT_ERROR') return row.status
  const problems = rowProblems(row)
  if (problems.some((problem) => problem !== 'possibile duplicato')) return 'ERROR'
  if (problems.length > 0 || row.supplierMode === 'create' || row.supplierMode === 'none') return 'WARNING'
  return 'READY'
}

export function ReceiptImportClient({
  projects,
  suppliers,
  batches,
}: {
  projects: ProjectOption[]
  suppliers: SupplierOption[]
  batches: ReceiptImportBatchRow[]
}) {
  const router = useRouter()
  const [defaultProjectId, setDefaultProjectId] = useState('')
  const [zipFileName, setZipFileName] = useState('')
  const [rows, setRows] = useState<ImportRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<Summary>(null)
  const [importing, setImporting] = useState(false)
  const [importCompleted, setImportCompleted] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isPending, startTransition] = useTransition()
  const importStartedRef = useRef(false)

  const readyToImport = useMemo(() => {
    if (!rows.length || importing || importCompleted) return false
    return rows.every((row) => {
      if (row.skip) return true
      return rowProblems(row).length === 0
    })
  }, [rows, importing, importCompleted])

  function updateRow(rowKey: string, patch: Partial<ImportRow>) {
    setRows((prev) => prev.map((row) => row.rowKey === rowKey ? { ...row, ...patch, status: statusFor({ ...row, ...patch }) } : row))
  }

  async function checkDuplicates(nextRows: ImportRow[]) {
    const result = await checkReceiptImportDuplicates(nextRows.map((row) => ({
      rowKey: row.rowKey,
      date: row.date,
      amount: row.amount,
      currency: row.currency,
      supplierId: row.supplierId || null,
    })))
    if (result.error) {
      setError(result.error)
      return nextRows
    }

    const duplicates = result.duplicates ?? {}
    const withDuplicates = nextRows.map((row) => ({
      ...row,
      duplicateExpenseId: duplicates[row.rowKey],
    }))
    setRows(withDuplicates.map((row) => ({ ...row, status: statusFor(row) })))
    return withDuplicates
  }

  async function handleZip(file: File | null) {
    if (!file) return
    setError(null)
    setSummary(null)
    setImportCompleted(false)
    importStartedRef.current = false
    rows.forEach((row) => { if (row.previewUrl) URL.revokeObjectURL(row.previewUrl) })

    try {
      const isZip = file.name.toLowerCase().endsWith('.zip') || file.type.includes('zip')
      let manifest: unknown
      const fileMap = new Map<string, { name: string; bytes: Uint8Array }>()

      if (isZip) {
        const buffer = new Uint8Array(await file.arrayBuffer())
        const entries = unzipSync(buffer)
        const names = Object.keys(entries).map(normalizeZipPath)
        const manifestName = names.find((name) => name.toLowerCase() === 'manifest.json')
          ?? names.find((name) => name.toLowerCase().endsWith('/manifest.json'))
        if (!manifestName) throw new Error('manifest.json non trovato nel ZIP')

        const originalManifestName = Object.keys(entries).find((name) => normalizeZipPath(name) === manifestName) ?? manifestName
        manifest = JSON.parse(strFromU8(entries[originalManifestName]))
        for (const [name, bytes] of Object.entries(entries)) fileMap.set(normalizeZipPath(name).toLowerCase(), { name: normalizeZipPath(name), bytes })
      } else {
        manifest = JSON.parse(await file.text())
      }

      if (!Array.isArray(manifest)) throw new Error('manifest.json deve essere un array')

      const nextRows = manifest.map((raw, index) => {
        const item = validateManifestItem(raw, index)
        const zipEntry = fileMap.get(item.imageFile.toLowerCase())
        const canUseExistingPhoto = Boolean(item.receiptInboxId)
        const imageSupported = !zipEntry || isSupportedImage(item.imageFile)
        const photoMissing = !zipEntry && !canUseExistingPhoto
        const unsupportedPhoto = !imageSupported && !canUseExistingPhoto
        const rowKey = `${index}-${item.imageFile}`
        const supplierId = matchSupplier(item.supplierName, suppliers)
        const fileFromZip = zipEntry && imageSupported
          ? new File([asArrayBuffer(zipEntry.bytes)], zipEntry.name.split('/').pop() ?? item.imageFile, { type: mimeForPath(item.imageFile) })
          : undefined
        const previewUrl = fileFromZip ? URL.createObjectURL(fileFromZip) : undefined
        let message: string | undefined
        if (photoMissing) message = 'Foto non trovata nel ZIP'
        else if (unsupportedPhoto) message = 'Formato immagine non supportato'
        else if (!zipEntry && canUseExistingPhoto) message = 'Foto gia presente nel gestionale'

        const supplierNameReadable = (item.supplierName ?? '').trim().length > 0
        const initialSupplierMode: ImportRow['supplierMode'] = supplierId
          ? 'existing'
          : supplierNameReadable
            ? 'create'
            : 'none'
        const row: ImportRow = {
          ...item,
          rowKey,
          file: fileFromZip,
          previewUrl,
          projectId: defaultProjectId,
          projectLabel: formatProjectLabel(defaultProjectId, projects),
          supplierMode: initialSupplierMode,
          supplierId,
          createSupplierName: item.supplierName ?? '',
          createSupplierCategory: suggestedSupplierCategory(item.expenseType),
          allowDuplicate: false,
          skip: photoMissing || unsupportedPhoto,
          status: photoMissing || unsupportedPhoto ? 'ERROR' : 'READY',
          message,
        }
        row.status = statusFor(row)
        return row
      })

      setZipFileName(file.name)
      setRows(nextRows)
      await checkDuplicates(nextRows)
    } catch (err) {
      setRows([])
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  function applyDefaultProject(projectId: string) {
    setDefaultProjectId(projectId)
    setRows((prev) => prev.map((row) => ({
      ...row,
      projectId,
      projectLabel: formatProjectLabel(projectId, projects),
    })))
  }

  function copyPrompt() {
    void navigator.clipboard.writeText(projectInstructionsText)
  }

  function downloadExampleZip() {
    const manifest = JSON.stringify([
      {
        receiptInboxId: null,
        imageFile: 'images/001.jpg',
        date: '2026-05-23',
        supplierName: 'Bauhaus Lugano',
        supplierAddress: null,
        supplierVatNumber: null,
        description: 'Materiali vari da cantiere - Bauhaus',
        items: [{ description: 'Piastrelle bagno 30x60', quantity: '8 m2', amount: 485.6 }],
        amount: 485.6,
        currency: 'CHF',
        expenseType: 'MATERIAL',
        paymentStatus: 'PAID',
        isItalianPurchase: false,
        notes: 'IVA inclusa',
        confidence: 0.85,
      },
    ], null, 2)
    const readme = 'Metti le immagini reali nella cartella images/ e aggiorna manifest.json con gli stessi nomi file.'
    const zipped = zipSync({
      'manifest.json': strToU8(manifest),
      'images/README.txt': strToU8(readme),
    })
    const url = URL.createObjectURL(new Blob([asArrayBuffer(zipped)], { type: 'application/zip' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'delegami-scontrini-example.zip'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport() {
    if (!readyToImport || importStartedRef.current) return
    importStartedRef.current = true
    setImporting(true)
    setError(null)
    setSummary(null)
    setProgress(0)

    const defaultProjectLabel = formatProjectLabel(defaultProjectId, projects)
    const batch = await createReceiptImportBatch({
      fileName: zipFileName || 'scontrini.zip',
      defaultProjectId: defaultProjectId || null,
      defaultProjectLabel,
      totalItems: rows.length,
    })
    if (batch.error || !batch.batchId) {
      setError(batch.error ?? 'Impossibile creare il lotto import')
      importStartedRef.current = false
      setImporting(false)
      return
    }

    let created = 0
    let skipped = 0
    let errors = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const item: ReceiptImportReviewedItem = {
        receiptInboxId: row.receiptInboxId ?? null,
        imageFile: row.imageFile,
        date: row.date,
        supplierName: row.supplierName,
        supplierAddress: row.supplierAddress ?? null,
        supplierVatNumber: row.supplierVatNumber ?? null,
        description: row.description,
        items: row.items ?? [],
        amount: row.amount,
        currency: row.currency,
        expenseType: row.expenseType,
        paymentStatus: row.paymentStatus,
        isItalianPurchase: row.isItalianPurchase,
        notes: row.notes ?? null,
        confidence: row.confidence ?? null,
        projectId: row.projectId || null,
        projectLabel: row.projectLabel || null,
        supplierMode: row.supplierMode,
        supplierId: row.supplierId || null,
        createSupplierName: row.createSupplierName || null,
        createSupplierCategory: row.createSupplierCategory || null,
        allowDuplicate: row.allowDuplicate,
        skip: row.skip,
        skipReason: row.skip ? row.message || 'Saltato dall utente' : null,
      }
      const fd = new FormData()
      fd.append('itemJson', JSON.stringify(item))
      if (!row.skip && row.file) fd.append('photo', row.file)

      const result = await importReceiptBatchItem(batch.batchId, fd)
      if (result.status === 'CREATED') {
        created++
        updateRow(row.rowKey, { status: 'CREATED', message: 'Creato' })
      } else if (result.status === 'SKIPPED') {
        skipped++
        updateRow(row.rowKey, { status: 'SKIPPED', message: result.message ?? 'Saltato' })
      } else {
        errors++
        updateRow(row.rowKey, { status: 'IMPORT_ERROR', message: result.error ?? 'Errore import' })
      }
      setProgress(i + 1)
    }

    await finalizeReceiptImportBatch(batch.batchId)
    setSummary({ created, skipped, errors, batchId: batch.batchId })
    setImportCompleted(true)
    setImporting(false)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Preparare l&apos;analisi IA</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            <ol className="space-y-1 text-body text-ink-muted">
              <li>1. In ChatGPT o Claude crea un progetto Delegami Scontrini Import e incolla le istruzioni qui sotto una sola volta.</li>
              <li>2. Da <span className="font-mono">/receipts</span>, scarica il ZIP per IA con tutti gli scontrini da processare.</li>
              <li>3. Carica quel ZIP nel progetto. Il progetto deve restituire solo il JSON finale.</li>
              <li>4. Qui puoi caricare direttamente il <span className="font-mono">manifest.json</span> finale, oppure un ZIP con <span className="font-mono">manifest.json</span> + <span className="font-mono">images/</span>.</li>
            </ol>
            <Textarea value={projectInstructionsText} readOnly rows={16} className="font-mono text-label" />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={copyPrompt}>
                <Clipboard className="h-4 w-4" />
                Copia istruzioni progetto
              </Button>
              <Button type="button" variant="secondary" onClick={downloadExampleZip}>
                <Download className="h-4 w-4" />
                Scarica esempio ZIP
              </Button>
            </div>
          </div>
          <div className="rounded-control border border-action-border bg-action-surface p-4 text-body text-action">
            <p className="font-medium">Regola importante</p>
            <p className="mt-1">L&apos;opera si sceglie qui nel gestionale, non nel JSON. Se il manifest contiene receiptInboxId, l&apos;app usa la foto originale gia caricata e archivia lo scontrino dopo aver creato la spesa.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Importazione</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div>
              <label className="mb-1 block text-body font-medium text-ink">Opera predefinita</label>
              <select
                value={defaultProjectId}
                onChange={(ev) => applyDefaultProject(ev.target.value)}
                className="w-full rounded-control border border-line bg-surface px-3 py-2 text-body outline-none focus:border-action"
              >
                <option value="">Spesa aziendale</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.clientName} - {project.name}{project.referenceCode ? ` (${project.referenceCode})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-control border border-line-strong bg-surface px-4 py-2 text-body font-medium text-ink transition-colors hover:bg-surface-raised">
              <FileArchive className="h-4 w-4" />
              Carica ZIP/JSON
              <input
                type="file"
                accept=".zip,.json,application/zip,application/json"
                className="hidden"
                onChange={(ev) => { void handleZip(ev.target.files?.[0] ?? null); ev.target.value = '' }}
              />
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-control border border-negative-border bg-negative-surface px-3 py-2 text-body text-negative">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {summary && (
            <div className="flex items-center gap-2 rounded-control border border-positive-border bg-positive-surface px-3 py-2 text-body text-positive">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Import completato: {summary.created} create, {summary.skipped} saltate, {summary.errors} errori.
            </div>
          )}

          {rows.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-body font-medium text-ink">{zipFileName}</p>
                  <p className="text-label text-ink-muted">{rows.length} scontrini letti dal manifest</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={() => startTransition(() => { void checkDuplicates(rows) })} disabled={isPending || importing}>
                    Verifica duplicati
                  </Button>
                  <Button type="button" onClick={() => startTransition(() => { void handleImport() })} disabled={!readyToImport || isPending || importing}>
                    {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {importing ? `${progress}/${rows.length}` : importCompleted ? 'Import concluso' : 'Conferma import'}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {rows.map((row, index) => {
                  const status = statusFor(row)
                  const problems = rowProblems(row)
                  return (
                    <div key={row.rowKey} className={cn('rounded-control border p-3', status === 'ERROR' || status === 'IMPORT_ERROR' ? 'border-negative-border bg-negative-surface/40' : status === 'WARNING' ? 'border-attention-border bg-attention-surface/30' : 'border-line bg-surface')}>
                      <div className="grid gap-3 lg:grid-cols-[90px_1fr]">
                        <div className="h-24 w-full overflow-hidden rounded-control bg-surface-raised lg:w-[90px]">
                          {row.previewUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={row.previewUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-ink-subtle">
                              <FileArchive className="h-7 w-7" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="text-body font-medium text-ink">#{index + 1} {row.imageFile}</p>
                              <p className="text-label text-ink-muted">{row.supplierName || 'Fornitore non letto'}</p>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {status === 'READY' && <Badge variant="green">Pronto</Badge>}
                              {status === 'WARNING' && <Badge variant="amber">Da controllare</Badge>}
                              {(status === 'ERROR' || status === 'IMPORT_ERROR') && <Badge variant="red">Errore</Badge>}
                              {status === 'CREATED' && <Badge variant="emerald">Creato</Badge>}
                              {status === 'SKIPPED' && <Badge variant="gray">Saltato</Badge>}
                              {row.duplicateExpenseId && <Badge variant="amber">Possibile duplicato</Badge>}
                            </div>
                          </div>

                          <div className="grid gap-3 md:grid-cols-4">
                            <Input label="Data" type="date" value={row.date} onChange={(ev) => updateRow(row.rowKey, { date: ev.target.value, duplicateExpenseId: undefined })} />
                            <Input label="Importo" type="number" step="0.01" value={row.amount} onChange={(ev) => updateRow(row.rowKey, { amount: Number(ev.target.value), duplicateExpenseId: undefined })} />
                            <div>
                              <label className="mb-1 block text-body font-medium text-ink">Valuta</label>
                              <select value={row.currency} onChange={(ev) => updateRow(row.rowKey, { currency: ev.target.value as ImportRow['currency'], isItalianPurchase: ev.target.value === 'EUR', duplicateExpenseId: undefined })} className="w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-body">
                                <option value="CHF">CHF</option>
                                <option value="EUR">EUR</option>
                              </select>
                            </div>
                            <div>
                              <label className="mb-1 block text-body font-medium text-ink">Tipo</label>
                              <select value={row.expenseType} onChange={(ev) => updateRow(row.rowKey, { expenseType: ev.target.value as ImportRow['expenseType'], createSupplierCategory: suggestedSupplierCategory(ev.target.value as ImportRow['expenseType']) })} className="w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-body">
                                {expenseTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                              </select>
                            </div>
                          </div>

                          <Input label="Descrizione" value={row.description} onChange={(ev) => updateRow(row.rowKey, { description: ev.target.value })} />

                          <div className="grid gap-3 md:grid-cols-3">
                            <div>
                              <label className="mb-1 block text-body font-medium text-ink">Opera</label>
                              <select value={row.projectId} onChange={(ev) => updateRow(row.rowKey, { projectId: ev.target.value, projectLabel: formatProjectLabel(ev.target.value, projects) })} className="w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-body">
                                <option value="">Spesa aziendale</option>
                                {projects.map((project) => <option key={project.id} value={project.id}>{project.clientName} - {project.name}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="mb-1 block text-body font-medium text-ink">Fornitore</label>
                              <select value={row.supplierMode === 'existing' ? row.supplierId : row.supplierMode === 'create' ? '__create' : '__none'} onChange={(ev) => {
                                if (ev.target.value === '__create') updateRow(row.rowKey, { supplierMode: 'create', supplierId: '', duplicateExpenseId: undefined })
                                else if (ev.target.value === '__none') updateRow(row.rowKey, { supplierMode: 'none', supplierId: '', duplicateExpenseId: undefined })
                                else updateRow(row.rowKey, { supplierMode: 'existing', supplierId: ev.target.value, duplicateExpenseId: undefined })
                              }} className="w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-body">
                                <option value="">Seleziona fornitore</option>
                                {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
                                <option value="__create">Crea nuovo fornitore</option>
                                <option value="__none">Senza fornitore (da aggiustare dopo)</option>
                              </select>
                            </div>
                            {row.supplierMode === 'create' && (
                              <Input label="Nuovo fornitore" value={row.createSupplierName} onChange={(ev) => updateRow(row.rowKey, { createSupplierName: ev.target.value })} />
                            )}
                          </div>

                          {row.supplierMode === 'create' && (
                            <div className="grid gap-3 md:grid-cols-3">
                              <div>
                                <label className="mb-1 block text-body font-medium text-ink">Categoria nuovo fornitore</label>
                                <select value={row.createSupplierCategory} onChange={(ev) => updateRow(row.rowKey, { createSupplierCategory: ev.target.value })} className="w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-body">
                                  {supplierCategoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                                </select>
                              </div>
                              <Input label="Indirizzo" value={row.supplierAddress ?? ''} onChange={(ev) => updateRow(row.rowKey, { supplierAddress: ev.target.value })} />
                              <Input label="IVA / UID" value={row.supplierVatNumber ?? ''} onChange={(ev) => updateRow(row.rowKey, { supplierVatNumber: ev.target.value })} />
                            </div>
                          )}

                          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
                            <Textarea label="Note" rows={2} value={row.notes ?? ''} onChange={(ev) => updateRow(row.rowKey, { notes: ev.target.value })} />
                            <label className="flex items-center gap-2 self-end text-body text-ink-muted">
                              <input type="checkbox" checked={row.allowDuplicate} onChange={(ev) => updateRow(row.rowKey, { allowDuplicate: ev.target.checked })} />
                              Importa duplicato
                            </label>
                            <label className="flex items-center gap-2 self-end text-body text-ink-muted">
                              <input type="checkbox" checked={row.skip} onChange={(ev) => updateRow(row.rowKey, { skip: ev.target.checked, message: ev.target.checked ? 'Saltato dall utente' : undefined })} />
                              Salta
                            </label>
                          </div>

                          {(problems.length > 0 || row.message || rowWarnings(row).length > 0) && (
                            <div className="flex items-start gap-2 rounded-control bg-surface/70 px-3 py-2 text-label text-ink-muted">
                              {status === 'READY' || status === 'CREATED' ? <CheckCircle2 className="h-4 w-4 text-positive" /> : <AlertCircle className="h-4 w-4 text-attention" />}
                              <span>{row.message || [...problems, ...rowWarnings(row)].join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Storico import</CardTitle>
            <p className="mt-1 text-label text-ink-muted">Ultimi {batches.length} lotti con almeno uno scontrino.</p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => setShowHistory((prev) => !prev)}>
            <ChevronDown className={cn('h-4 w-4 transition-transform', showHistory && 'rotate-180')} />
            {showHistory ? 'Nascondi' : 'Mostra'}
          </Button>
        </CardHeader>
        {showHistory && <CardContent>
          {batches.length === 0 ? (
            <div className="py-8 text-center text-body text-ink-muted">
              <Archive className="mx-auto mb-2 h-8 w-8 text-ink-subtle" />
              Nessun import registrato
            </div>
          ) : (
            <div className="divide-y divide-line">
              {batches.map((batch) => {
                const activeExpenseCount = batch.items.filter((item) => item.expenseId && item.expenseExists).length
                const deletedExpenseCount = batch.items.filter((item) =>
                  item.errorMessage === 'Spesa eliminata' || (item.expenseId && !item.expenseExists),
                ).length

                return (
                  <div key={batch.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-body font-medium text-ink">{batch.fileName}</p>
                      <p className="text-label text-ink-muted">
                        {formatDate(batch.createdAt)} - {batch.defaultProjectLabel ?? 'Spesa aziendale'} - {batch.createdByName}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={batch.status === 'COMPLETED' ? 'green' : batch.status === 'PARTIAL' ? 'amber' : 'gray'}>{batch.status}</Badge>
                      <span className="text-label text-ink-muted">{batch.createdCount} create / {batch.skippedCount} saltate / {batch.errorCount} errori</span>
                      {activeExpenseCount > 0 && (
                        <Link href="/expenses" className="text-label text-action hover:underline">Vedi spese</Link>
                      )}
                      {deletedExpenseCount > 0 && (
                        <span className="text-label text-ink-muted">
                          {deletedExpenseCount === 1 ? 'Spesa eliminata' : `${deletedExpenseCount} spese eliminate`}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>}
      </Card>
    </div>
  )
}
