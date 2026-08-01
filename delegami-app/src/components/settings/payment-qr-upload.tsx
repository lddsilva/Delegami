'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { QrCode, Trash2, Upload } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { uploadPaymentQr, removePaymentQr } from '@/modules/settings/actions'

type Props = {
  currentUrl: string | null
  canEdit: boolean
}

export function PaymentQrUpload({ currentUrl, canEdit }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    const formData = new FormData()
    formData.set('file', file)
    startTransition(async () => {
      const res = await uploadPaymentQr(formData)
      if (res.error) setError(res.error)
      else router.refresh()
      if (inputRef.current) inputRef.current.value = ''
    })
  }

  const onRemove = () => {
    if (!confirm('Rimuovere il QR di pagamento dalle fatture?')) return
    setError(null)
    startTransition(async () => {
      const res = await removePaymentQr()
      if (res.error) setError(res.error)
      else router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <QrCode className="w-4 h-4 text-ink-muted" />
          QR di pagamento (fatture)
        </CardTitle>
        <p className="text-xs text-ink-subtle mt-0.5">
          Immagine statica con le coordinate bancarie — stampata nel PDF delle fatture, accanto all&apos;IBAN
        </p>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentUrl}
            alt="QR pagamento"
            className="w-24 h-24 rounded border border-line object-contain bg-white"
          />
        ) : (
          <div className="w-24 h-24 rounded border border-dashed border-line-strong flex items-center justify-center text-ink-subtle">
            <QrCode className="w-8 h-8" />
          </div>
        )}
        <div className="space-y-2">
          {canEdit && (
            <>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileChange}
              />
              <button
                type="button"
                disabled={pending}
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-md bg-action px-3 py-1.5 text-xs font-medium text-white hover:bg-action-hover disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                {pending ? 'Caricamento…' : currentUrl ? 'Sostituisci QR' : 'Carica QR'}
              </button>
              {currentUrl && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={onRemove}
                  className="inline-flex items-center gap-1.5 rounded-md border border-negative-border px-3 py-1.5 text-xs font-medium text-negative hover:bg-negative-surface disabled:opacity-50 ml-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Rimuovi
                </button>
              )}
            </>
          )}
          <p className="text-[11px] text-ink-subtle">PNG o JPG, max 5 MB. Sfondo bianco consigliato.</p>
          {error && <p className="text-xs text-negative">{error}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
