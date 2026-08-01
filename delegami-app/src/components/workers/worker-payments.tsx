'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Paperclip, Plus, X, FileText } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { PhotoLightbox, type LightboxPhoto } from '@/components/media/photo-lightbox'
import { formatCurrency, formatDate, formatDateInput } from '@/lib/utils'
import { isImageUrl } from '@/lib/document-preview'
import { normalizeImageFile, isImageFile } from '@/lib/image-normalize'
import {
  addWorkerPayment,
  deleteWorkerPayment,
  uploadWorkerPaymentReceipt,
} from '@/modules/workers/actions'
import { useConfirm } from '@/components/ui/use-confirm'
import { useToast } from '@/components/ui/use-toast'

export interface PaymentView {
  id: string
  amount: number
  paidAt: string | Date
  method?: string | null
  note?: string | null
  receiptUrl?: string | null
}

interface Props {
  userId: string
  payments: PaymentView[]
  canManage: boolean
  canDelete: boolean
}

const METHODS = ['Contanti', 'Bonifico', 'TWINT', 'Altro']

export function WorkerPayments({ userId, payments, canManage, canDelete }: Props) {
  const { toastError, toaster } = useToast()
  const { confirm, dialog } = useConfirm()
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [paidAt, setPaidAt] = useState(formatDateInput(new Date()))
  const [method, setMethod] = useState('Contanti')
  const [note, setNote] = useState('')
  const [receipt, setReceipt] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const receiptRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [pending, startTransition] = useTransition()
  const [lightbox, setLightbox] = useState<LightboxPhoto[] | null>(null)

  async function prepareReceipt(file: File | null): Promise<File | null> {
    if (!file) return null
    if (isImageFile(file)) return normalizeImageFile(file)
    return file // PDF or other — keep as-is
  }

  async function handleAdd() {
    setError(null)
    const value = Number(amount.replace(',', '.'))
    if (!Number.isFinite(value) || value <= 0) { setError('Importo non valido'); return }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.set('amount', amount)
      fd.set('paidAt', paidAt)
      fd.set('method', method)
      fd.set('note', note)
      const prepared = await prepareReceipt(receipt)
      if (prepared) fd.set('receipt', prepared)
      const res = await addWorkerPayment(userId, null, fd)
      if (res?.errors) { setError(Object.values(res.errors).flat()[0] ?? 'Errore'); return }
      if (res?.message) { setError(res.message); return }
      setAmount(''); setNote(''); setReceipt(null); setShowForm(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  function handleRowReceipt(paymentId: string, file: File | null) {
    if (!file) return
    startTransition(async () => {
      const prepared = await prepareReceipt(file)
      if (!prepared) return
      const fd = new FormData()
      fd.set('receipt', prepared)
      const res = await uploadWorkerPaymentReceipt(paymentId, fd)
      if (res?.error) toastError(res.error)
      else router.refresh()
    })
  }

  async function handleDelete(id: string) {
    const ok = await confirm({
      title: 'Eliminare il pagamento?',
      description: 'Il compenso registrato verrà rimosso e il saldo ricalcolato.',
      confirmLabel: 'Elimina',
      destructive: true,
    })
    if (!ok) return
    startTransition(async () => {
      const res = await deleteWorkerPayment(id)
      if (res?.error) toastError(res.error)
      else router.refresh()
    })
  }

  return (
    <>
      {toaster}
          <>
      {dialog}
      <div className="space-y-4">
      {canManage && (
        showForm ? (
          <div className="rounded-control border border-line p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-body font-medium text-ink">Registra pagamento</p>
              <button onClick={() => setShowForm(false)} className="text-ink-muted hover:text-ink-muted"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Importo (CHF)" type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="es. 500" />
              <Input label="Data" type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
            </div>
            <Select label="Metodo" value={method} onChange={(e) => setMethod(e.target.value)} options={METHODS.map((m) => ({ value: m, label: m }))} />
            <Textarea label="Nota" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
            <div>
              <label className="text-body font-medium text-ink">Comprovante (foto o PDF)</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
                className="mt-1 block w-full text-body text-ink-muted file:mr-3 file:rounded-control file:border-0 file:bg-action-surface file:px-3 file:py-2 file:text-action"
              />
            </div>
            {error && <p className="text-body text-negative">{error}</p>}
            <div className="flex justify-end">
              <Button type="button" onClick={handleAdd} loading={saving}>Salva pagamento</Button>
            </div>
          </div>
        ) : (
          <Button type="button" variant="secondary" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> Registra pagamento
          </Button>
        )
      )}

      {payments.length === 0 ? (
        <p className="text-body text-ink-muted">Nessun pagamento registrato.</p>
      ) : (
        <div className="divide-y divide-line">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="font-medium text-ink">{formatCurrency(p.amount)}</p>
                <p className="text-label text-ink-muted">
                  {formatDate(p.paidAt)}{p.method ? ` · ${p.method}` : ''}
                </p>
                {p.note && <p className="text-label text-ink-muted mt-0.5 whitespace-pre-wrap">{p.note}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {p.receiptUrl ? (
                  isImageUrl(p.receiptUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.receiptUrl}
                      alt="comprovante"
                      onClick={() => setLightbox([{ id: p.id, filePath: p.receiptUrl! }])}
                      className="w-11 h-11 object-cover rounded-control border border-line cursor-pointer"
                    />
                  ) : (
                    <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 text-ink-muted hover:text-action" aria-label="Comprovante">
                      <FileText className="w-5 h-5" />
                    </a>
                  )
                ) : canManage ? (
                  <>
                    <button
                      onClick={() => receiptRefs.current[p.id]?.click()}
                      disabled={pending}
                      className="p-2.5 text-ink-muted hover:text-action"
                      title="Allega comprovante"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <input
                      ref={(el) => { receiptRefs.current[p.id] = el }}
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => handleRowReceipt(p.id, e.target.files?.[0] ?? null)}
                    />
                  </>
                ) : null}
                {canDelete && (
                  <button onClick={() => handleDelete(p.id)} disabled={pending} className="p-2.5 text-ink-muted hover:text-negative" title="Elimina">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <PhotoLightbox photos={lightbox} index={0} onClose={() => setLightbox(null)} onIndexChange={() => {}} />
      )}
    </div>
    </>
    </>
  )
}
