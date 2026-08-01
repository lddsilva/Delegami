'use client'

import { useCallback, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, FileText, Layers, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExportQuoteJsonButton } from '@/components/quotes/export-quote-json-button'
import { useDismissable } from '@/components/ui/use-dismissable'

interface Props {
  id: string
  quoteLabel: string
  canEdit: boolean
}

/**
 * Secondary-actions menu for the quote detail page (all screen sizes).
 * Collapses Crea template / Esporta JSON / Aggiorna da JSON / PDF Interno into a
 * popover so the header keeps only the primary actions visible.
 */
export function QuoteActionsMenu({ id, quoteLabel, canEdit }: Props) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeMenu = useCallback(() => setOpen(false), [])
  const menuRef = useDismissable<HTMLDivElement>(open, closeMenu, triggerRef)

  return (
    <div className="relative">
      <Button
        ref={triggerRef}
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal className="w-4 h-4" />
        Altre azioni
        <ChevronDown className="w-3 h-3 opacity-70" />
      </Button>
      {open && (
          <div
            ref={menuRef}
            role="menu"
            className="absolute right-0 z-40 mt-2 w-64 space-y-0.5 rounded-surface border border-line bg-surface p-1.5 shadow-overlay"
          >
            {canEdit && (
              <Link
                href={`/quotes/${id}/template`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-control px-3 py-2 text-body text-ink hover:bg-surface-raised"
              >
                <Layers className="w-4 h-4 text-ink-muted" />
                Crea template
              </Link>
            )}
            {canEdit && (
              <div className="px-1.5 py-1">
                <ExportQuoteJsonButton id={id} label={quoteLabel} />
              </div>
            )}
            {canEdit && (
              <Link
                href={`/quotes/${id}/import-update`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-control px-3 py-2 text-body text-ink hover:bg-surface-raised"
              >
                <FileText className="w-4 h-4 text-ink-muted" />
                Aggiorna da JSON
              </Link>
            )}
            <Link
              href={`/quotes/${id}/preview?variant=internal`}
              target="_blank"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-control px-3 py-2 text-body text-ink hover:bg-surface-raised"
            >
              <FileText className="w-4 h-4 text-ink-muted" />
              PDF Interno
            </Link>
          </div>
      )}
    </div>
  )
}
