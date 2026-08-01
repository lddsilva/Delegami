'use client'

import { useState, useTransition, useRef } from 'react'
import { Plus, Trash2, CheckCircle, Paperclip, ExternalLink, Upload } from 'lucide-react'
import { addInvoicePayment, deleteInvoicePayment } from '@/modules/invoices/actions'
import { uploadPaymentReceipt } from '@/modules/documents/actions'
import { formatCurrency, formatDate, formatDateInput } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { isImageUrl } from '@/lib/document-preview'
import { PhotoLightbox } from '@/components/media/photo-lightbox'
import { useToast } from '@/components/ui/use-toast'
import { useConfirm } from '@/components/ui/use-confirm'

interface Payment {
  id: string
  amount: number
  paidAt: Date
  notes: string | null
  receiptUrl: string | null
}

interface Props {
  invoiceId: string
  invoiceTotal: number
  payments: Payment[]
  canEdit: boolean
}

export function InvoicePaymentList({ invoiceId, invoiceTotal, payments, canEdit }: Props) {
  const { confirm, dialog } = useConfirm()
  const { toastError, toaster } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [paidAt, setPaidAt] = useState(formatDateInput(new Date()))
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
  const remaining = invoiceTotal - totalPaid

  const imageReceipts = payments
    .filter((p) => p.receiptUrl && isImageUrl(p.receiptUrl))
    .map((p) => ({ id: p.id, filePath: p.receiptUrl as string, name: `Ricevuta ${formatDate(p.paidAt)}`, uploadedAt: p.paidAt }))
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  function openReceipt(payment: Payment, event: React.MouseEvent) {
    if (!payment.receiptUrl) return
    if (isImageUrl(payment.receiptUrl)) {
      event.preventDefault()
      const idx = imageReceipts.findIndex((r) => r.id === payment.id)
      setLightboxIndex(idx >= 0 ? idx : 0)
    }
  }

  function handleAdd() {
    const n = parseFloat(amount)
    if (isNaN(n) || n <= 0) { setError('Importo non valido'); return }
    setError(null)
    startTransition(async () => {
      const result = await addInvoicePayment(invoiceId, n, new Date(paidAt), notes || undefined)
      if (result?.error) { setError(result.error); return }

      if (file && result.paymentId) {
        const fd = new FormData()
        fd.append('file', file)
        const upResult = await uploadPaymentReceipt(result.paymentId, invoiceId, fd)
        if (upResult.error) setError(`Pagamento registrato ma errore ricevuta: ${upResult.error}`)
      }

      setAmount('')
      setNotes('')
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setShowForm(false)
    })
  }

  async function handleDelete(id: string) {
    const ok = await confirm({
      title: 'Eliminare il pagamento?',
      description: 'Il residuo della fattura verrà ricalcolato.',
      confirmLabel: 'Elimina',
      destructive: true,
    })
    if (!ok) return
    startTransition(async () => {
      await deleteInvoicePayment(id, invoiceId)
    })
  }

  function handleAttachReceipt(paymentId: string, selectedFile: File) {
    setUploadingFor(paymentId)
    startTransition(async () => {
      const fd = new FormData()
      fd.append('file', selectedFile)
      const result = await uploadPaymentReceipt(paymentId, invoiceId, fd)
      if (result.error) toastError(`Errore upload: ${result.error}`)
      setUploadingFor(null)
    })
  }

  return (
    <div className="space-y-3">
      {toaster}
      {dialog}
      {/* Summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-body px-1">
        <div className="space-y-0.5">
          <div className="flex flex-wrap gap-3">
            <span className="text-ink-muted">Totale: <span className="font-medium text-ink">{formatCurrency(invoiceTotal)}</span></span>
            <span className="text-positive">Pagato: <span className="font-medium">{formatCurrency(totalPaid)}</span></span>
          </div>
          {remaining > 0.01 ? (
            <p className="text-attention font-medium">Residuo: {formatCurrency(remaining)}</p>
          ) : totalPaid >= invoiceTotal && payments.length > 0 ? (
            <p className="text-positive flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Saldato</p>
          ) : null}
        </div>
        {canEdit && !showForm && (
          <Button type="button" size="sm" variant="secondary" onClick={() => setShowForm(true)} className="shrink-0">
            <Plus className="w-3.5 h-3.5" /> Acconto
          </Button>
        )}
      </div>

      {/* Add payment form */}
      {showForm && canEdit && (
        <div className="p-3 rounded-control border border-action-border bg-action-surface space-y-2">
          <p className="text-label font-medium text-action">Nuovo pagamento ricevuto</p>
          {/* One column on a phone — the date control needs the full row. */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <label className="text-label text-ink-muted mb-0.5 block">Importo CHF *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={remaining > 0 ? remaining.toFixed(2) : '0.00'}
                className="min-h-11 w-full min-w-0 rounded-control border border-line-strong px-3 text-body outline-none focus:ring-2 focus:ring-action"
              />
            </div>
            <div className="min-w-0">
              <label className="text-label text-ink-muted mb-0.5 block">Data pagamento</label>
              <input
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className="min-h-11 w-full min-w-0 rounded-control border border-line-strong px-3 text-body outline-none focus:ring-2 focus:ring-action"
              />
            </div>
          </div>
          <div>
            <label className="text-label text-ink-muted mb-0.5 block">Note / Riferimento bonifico</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="es. Bonifico rif. 12345"
              className="w-full border border-line-strong rounded-control px-3 py-1.5 text-body outline-none focus:ring-2 focus:ring-action"
            />
          </div>
          <div>
            <label className="text-label text-ink-muted mb-0.5 block">Ricevuta / Comprovante (opzionale)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-label text-ink-muted file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-label file:bg-action-surface file:text-action hover:file:bg-action-surface"
            />
            {file && <p className="text-label text-action mt-0.5 flex items-center gap-1"><Paperclip className="w-3 h-3" />{file.name}</p>}
          </div>
          {error && <p className="text-label text-negative">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleAdd} loading={isPending}>Registra</Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => { setShowForm(false); setError(null); setFile(null) }}>Annulla</Button>
          </div>
        </div>
      )}

      {/* Payments list */}
      {payments.length === 0 ? (
        <p className="text-body text-ink-muted text-center py-4">Nessun pagamento registrato</p>
      ) : (
        <div className="space-y-1.5">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-control border border-line bg-surface hover:bg-surface-raised group">
              <CheckCircle className="w-4 h-4 text-positive shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-positive tabular-nums">{formatCurrency(p.amount)}</span>
                  <span className="text-label text-ink-muted">{formatDate(p.paidAt)}</span>
                </div>
                {p.notes && <p className="text-label text-ink-muted truncate">{p.notes}</p>}
                {p.receiptUrl ? (
                  <a
                    href={p.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) => openReceipt(p, event)}
                    className="inline-flex items-center gap-1 text-label text-action hover:text-action mt-0.5"
                  >
                    <Paperclip className="w-3 h-3" />
                    Ricevuta
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                ) : canEdit ? (
                  <>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      ref={(el) => { uploadInputRefs.current[p.id] = el }}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleAttachReceipt(p.id, f)
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => uploadInputRefs.current[p.id]?.click()}
                      disabled={uploadingFor === p.id}
                      className="inline-flex items-center gap-1 text-label text-ink-muted hover:text-action mt-0.5 transition-colors"
                    >
                      <Upload className="w-3 h-3" />
                      {uploadingFor === p.id ? 'Caricamento…' : 'Allega ricevuta'}
                    </button>
                  </>
                ) : null}
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  className="text-ink-subtle hover:text-negative sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {lightboxIndex !== null && imageReceipts.length > 0 && (
        <PhotoLightbox
          photos={imageReceipts}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </div>
  )
}
