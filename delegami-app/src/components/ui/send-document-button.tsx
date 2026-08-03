'use client'

import { swissNumber } from '@/lib/utils'

import { useState } from 'react'
import { Send, Mail, MessageCircle, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'

interface SendDocumentButtonProps {
  docNumber: string
  docType: 'quote' | 'invoice'
  clientName: string
  clientEmail?: string | null
  clientPhone?: string | null
  companyName?: string | null
  total: number
  previewUrl?: string
  docId?: string   // quote or invoice id — used to construct PDF download link
}

function formatPhone(phone: string) {
  // Normalize to international format for wa.me — strip spaces/dashes
  return phone.replace(/[\s\-().]/g, '').replace(/^0{2}/, '+').replace(/^0/, '+41')
}

export function SendDocumentButton({
  docNumber,
  docType,
  clientName,
  clientEmail,
  clientPhone,
  companyName,
  total,
  previewUrl,
  docId,
}: SendDocumentButtonProps) {
  const pdfPrintUrl = docId
    ? docType === 'quote'
      ? `/quotes/${docId}/preview?variant=client`
      : `/invoices/${docId}/preview`
    : null
  const [open, setOpen] = useState(false)

  const docLabel = docType === 'quote' ? 'preventivo' : 'fattura'
  const docLabelCap = docType === 'quote' ? 'Preventivo' : 'Fattura'

  const totalFmt = swissNumber(new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(total))

  // Email
  const emailSubject = `${docLabelCap} n° ${docNumber}`
  const emailBody = [
    `Gentile ${clientName},`,
    '',
    `In allegato trova il ${docLabel} n° ${docNumber} per un importo di CHF ${totalFmt}.`,
    previewUrl ? `\nPuò visualizzarlo anche online al seguente indirizzo:\n${previewUrl}` : '',
    '',
    'Restiamo a disposizione per qualsiasi chiarimento.',
    '',
    'Cordiali saluti,',
    'Delegami Edili',
  ].filter((l) => l !== null).join('\n')

  const mailtoHref = `mailto:${clientEmail ?? ''}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`

  // WhatsApp
  const waMessage = [
    `Gentile ${clientName},`,
    '',
    `Le inviamo il ${docLabel} n° *${docNumber}* per un importo di *CHF ${totalFmt}*.`,
    previewUrl ? `\nPuò visualizzarlo qui: ${previewUrl}` : '',
    '',
    'Per qualsiasi dubbio siamo a disposizione.',
    companyName ? `_${companyName}_` : null,
  ].filter((l) => l !== null).join('\n')

  const waHref = clientPhone
    ? `https://wa.me/${formatPhone(clientPhone)}?text=${encodeURIComponent(waMessage)}`
    : null

  const hasEmail = !!clientEmail
  const hasPhone = !!clientPhone

  if (!hasEmail && !hasPhone) return null

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Send className="w-4 h-4" /> Invia
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Invia documento"
        description={`${docNumber} · ${clientName}`}
      >
        <div className="space-y-3 pb-4">
          {pdfPrintUrl && (
            <div className="rounded-control border border-attention-border bg-attention-surface p-3 text-label text-attention">
              <p className="mb-1 font-semibold">Per allegare il PDF:</p>
              <ol className="list-inside list-decimal space-y-0.5">
                <li>Apri il PDF, poi stampa → &ldquo;Salva come PDF&rdquo;</li>
                <li>Allega manualmente a email o WhatsApp</li>
              </ol>
              <a
                href={pdfPrintUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex min-h-11 items-center gap-1.5 font-medium hover:underline"
              >
                <Download className="h-4 w-4" /> Apri PDF cliente
              </a>
            </div>
          )}

          {hasEmail && (
            <a
              href={mailtoHref}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-control border border-line-strong p-3 transition-colors duration-state hover:bg-surface-raised"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-action-surface">
                <Mail className="h-4 w-4 text-action" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-body font-medium text-ink">Email</span>
                <span className="block truncate text-label text-ink-muted">{clientEmail}</span>
              </span>
            </a>
          )}

          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-control border border-line-strong p-3 transition-colors duration-state hover:bg-surface-raised"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-positive-surface">
                <MessageCircle className="h-4 w-4 text-positive" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-body font-medium text-ink">WhatsApp</span>
                <span className="block truncate text-label text-ink-muted">{clientPhone}</span>
              </span>
            </a>
          )}

          {hasPhone && !waHref && (
            <p className="rounded-control border border-line bg-surface-raised p-3 text-label text-ink-muted">
              Numero di telefono non valido per WhatsApp
            </p>
          )}
        </div>
      </Dialog>

    </>
  )
}
