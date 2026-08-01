'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronDown, FileText, Plus, Search, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'
import type { QuoteTemplatePickerOption } from '@/modules/quote-templates/queries'
import { Dialog } from '@/components/ui/dialog'
import { useDismissable } from '@/components/ui/use-dismissable'

interface Props {
  quotes: QuoteTemplatePickerOption[]
}

export function CreateTemplateMenu({ quotes }: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const closeMenu = useCallback(() => setOpen(false), [])
  const menuRef = useDismissable<HTMLDivElement>(open, closeMenu, triggerRef)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return quotes.slice(0, 50)
    return quotes
      .filter((quote) =>
        quote.quoteNumber.toLowerCase().includes(q)
        || quote.projectName.toLowerCase().includes(q)
        || quote.clientName.toLowerCase().includes(q),
      )
      .slice(0, 50)
  }, [quotes, query])

  function pickQuote(quoteId: string) {
    setPickerOpen(false)
    setOpen(false)
    router.push(`/quotes/${quoteId}/template`)
  }

  return (
    <>
      <div className="relative">
        <Button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <Plus className="h-4 w-4" />
          Crea template
          <ChevronDown className="h-4 w-4 opacity-70" />
        </Button>
        {open && (
          <div
            ref={menuRef}
            role="menu"
            className="absolute right-0 z-20 mt-2 w-72 rounded-surface border border-line bg-surface p-2 shadow-overlay"
          >
            <button
              type="button"
              onClick={() => { setOpen(false); setPickerOpen(true) }}
              className="flex w-full items-start gap-3 rounded-control px-3 py-2 text-left text-body hover:bg-surface-raised"
            >
              <FileText className="mt-0.5 h-4 w-4 text-action" />
              <span>
                <span className="block font-medium text-ink">Da preventivo esistente</span>
                <span className="block text-label text-ink-muted">Scegli un preventivo, poi seleziona le sezioni da riutilizzare.</span>
              </span>
            </button>
            <Link
              href="/settings/templates/new"
              onClick={() => setOpen(false)}
              className="mt-1 flex items-start gap-3 rounded-control px-3 py-2 text-body hover:bg-surface-raised"
            >
              <Plus className="mt-0.5 h-4 w-4 text-positive" />
              <span>
                <span className="block font-medium text-ink">Da zero</span>
                <span className="block text-label text-ink-muted">Crea un template vuoto e aggiungi le voci manualmente.</span>
              </span>
            </Link>
            <Link
              href="/settings/templates/import"
              onClick={() => setOpen(false)}
              className="mt-1 flex items-start gap-3 rounded-control px-3 py-2 text-body hover:bg-surface-raised"
            >
              <Sparkles className="mt-0.5 h-4 w-4 text-action" />
              <span>
                <span className="block font-medium text-ink">Importa da IA</span>
                <span className="block text-label text-ink-muted">Incolla il JSON generato da ChatGPT/Claude.</span>
              </span>
            </Link>
          </div>
        )}
      </div>

      <Dialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Scegli un preventivo"
        className="sm:max-w-2xl"
      >
        <div className="relative pb-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca per numero, progetto o cliente"
            aria-label="Cerca un preventivo"
            className="pl-9"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-body text-ink-muted">Nessun preventivo trovato.</p>
        ) : (
          <ul className="-mx-4 divide-y divide-line sm:-mx-5">
            {filtered.map((quote) => (
              <li key={quote.id}>
                <button
                  type="button"
                  onClick={() => pickQuote(quote.id)}
                  className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors duration-state hover:bg-surface-raised sm:px-5"
                >
                  <span className="min-w-0">
                    <span className="block text-body font-medium text-ink">
                      {quote.quoteNumber} <span className="text-ink-muted">v{quote.version}</span>
                    </span>
                    <span className="block truncate text-label text-ink-muted">
                      {quote.projectName} · {quote.clientName}
                    </span>
                  </span>
                  <span className="shrink-0 text-label text-ink-muted numeric">{formatDate(quote.updatedAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Dialog>

    </>
  )
}
