'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { strToU8, zipSync } from 'fflate'

type PendingReceipt = {
  id: string
  photoUrl: string
  capturedAt: string
  note: string | null
}

function asArrayBuffer(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return copy.buffer
}

function dateOnly(value: string) {
  return value.slice(0, 10)
}

function extFromContentType(contentType: string | null) {
  if (contentType?.includes('png')) return 'png'
  if (contentType?.includes('webp')) return 'webp'
  return 'jpg'
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10)
}

export function ReceiptAiWorkpackButton({
  receipts,
}: {
  receipts: PendingReceipt[]
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDownload() {
    if (pending || receipts.length === 0) return
    setPending(true)
    setError(null)

    try {
      const zipEntries: Record<string, Uint8Array> = {}
      const manifest = []

      for (const receipt of receipts) {
        const response = await fetch(receipt.photoUrl)
        if (!response.ok) throw new Error(`Impossibile scaricare lo scontrino ${receipt.id}`)

        const bytes = new Uint8Array(await response.arrayBuffer())
        const ext = extFromContentType(response.headers.get('content-type'))
        const imageFile = `images/receipt-${receipt.id}.${ext}`

        zipEntries[imageFile] = bytes
        manifest.push({
          receiptInboxId: receipt.id,
          imageFile,
          capturedAt: dateOnly(receipt.capturedAt),
          originalNote: receipt.note,
          date: null,
          supplierName: null,
          supplierAddress: null,
          supplierVatNumber: null,
          description: null,
          items: [],
          amount: null,
          currency: null,
          expenseType: null,
          paymentStatus: 'PAID',
          isItalianPurchase: null,
          notes: null,
          confidence: null,
        })
      }

      zipEntries['manifest.json'] = strToU8(JSON.stringify(manifest, null, 2))
      zipEntries['README.txt'] = strToU8([
        'Carica questo ZIP nel progetto ChatGPT/Claude configurato con le istruzioni Zanetti Scontrini Import.',
        'Il progetto deve restituire solo il manifest.json finale, preservando receiptInboxId e imageFile.',
        'Dopo l analisi, carica il manifest.json finale in Delegami > Scontrini > Importa IA.',
      ].join('\n'))

      const zipped = zipSync(zipEntries)
      const url = URL.createObjectURL(new Blob([asArrayBuffer(zipped)], { type: 'application/zip' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `zanetti-scontrini-ia-${todayStamp()}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleDownload}
        disabled={pending || receipts.length === 0}
        className="inline-flex items-center justify-center gap-2 rounded-control border border-line-strong bg-surface px-4 min-h-11 text-body font-medium text-ink transition-colors hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Scarica ZIP per IA
      </button>
      {error && <span className="max-w-48 text-label text-negative">{error}</span>}
    </div>
  )
}
