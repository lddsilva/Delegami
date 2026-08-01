'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Loader2 } from 'lucide-react'
import { searchEverything, type SearchHit, type SearchKind } from '@/modules/search/actions'
import { formatAmount } from '@/lib/utils'
import { cn } from '@/lib/utils'

/** The type is the context a bare number or code would otherwise be missing. */
const KIND_LABEL: Record<SearchKind, string> = {
  quote: 'Preventivo',
  invoice: 'Fattura',
  project: 'Opera',
  client: 'Cliente',
  expense: 'Spesa',
  supplier: 'Fornitore',
  priceItem: 'Prezzario',
}

const DEBOUNCE_MS = 200

/**
 * `compact` is the phone top bar: there is no room for a labelled field next to
 * the brand, and the icon alone is unambiguous once it opens the same panel.
 */
export function GlobalSearch({ compact = false }: { compact?: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [active, setActive] = useState(0)
  const [isSearching, startSearch] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // ⌘K / Ctrl-K from anywhere. Not "/" — this app has too many text inputs for
  // a bare character to be safe as a shortcut.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const trimmed = query.trim()
  // Derived rather than cleared in the effect: below two characters there is
  // nothing to show, and stale state that is never rendered costs nothing.
  // (The project's lint rule forbids setState inside an effect, correctly —
  // it would render the old hits once before wiping them.)
  const visibleHits = trimmed.length >= 2 ? hits : []

  // Debounced so typing "Martini" is one query, not seven.
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) return
    const timer = setTimeout(() => {
      startSearch(async () => {
        const results = await searchEverything(q)
        setHits(results)
        setActive(0)
      })
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query])

  function close() {
    setOpen(false)
    setQuery('')
    setHits([])
  }

  function go(hit: SearchHit) {
    close()
    router.push(hit.href)
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault()
      close()
      return
    }
    if (!visibleHits.length) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((i) => (i + 1) % visibleHits.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => (i - 1 + visibleHits.length) % visibleHits.length)
    } else if (event.key === 'Enter' && visibleHits[active]) {
      event.preventDefault()
      go(visibleHits[active])
    }
  }

  if (!open) {
    if (compact) {
      return (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Cerca in tutta l'app"
          className="tap-target inline-flex items-center justify-center rounded-control text-ink-inverse transition-colors duration-state hover:bg-shell-raised"
        >
          <Search className="h-5 w-5" />
        </button>
      )
    }
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Cerca in tutta l'app"
        className="tap-target inline-flex w-full items-center gap-2 rounded-control bg-shell-raised/60 px-3 text-body text-shell-ink-muted transition-colors duration-state hover:bg-shell-raised hover:text-ink-inverse"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">Cerca…</span>
        <kbd className="hidden rounded border border-white/20 px-1 text-label lg:inline">⌘K</kbd>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 p-4 pt-[10vh]">
      {/* Clicking the backdrop closes. The panel stops the event so a click
          inside never dismisses what you are reading. */}
      <div className="absolute inset-0" onClick={close} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Ricerca"
        className="relative w-full max-w-xl overflow-hidden rounded-surface bg-surface shadow-overlay"
      >
        <div className="flex items-center gap-2 border-b border-line px-4">
          <Search className="h-4 w-4 shrink-0 text-ink-subtle" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Cliente, opera, PRE-…, INV-…, fornitore"
            aria-label="Cerca"
            className="min-h-12 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-subtle"
          />
          {isSearching && <Loader2 className="h-4 w-4 animate-spin text-ink-subtle" aria-hidden />}
          <button
            type="button"
            onClick={close}
            aria-label="Chiudi la ricerca"
            className="tap-target -mr-2 inline-flex items-center justify-center rounded-control text-ink-muted hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim().length < 2 ? (
            <p className="px-4 py-6 text-body text-ink-muted">
              Scrivi almeno due caratteri. Cerca fra clienti, opere, preventivi, fatture, spese,
              fornitori e prezzario.
            </p>
          ) : visibleHits.length === 0 && !isSearching ? (
            <p className="px-4 py-6 text-body text-ink-muted">
              Nessun risultato per <span className="font-medium text-ink">{query.trim()}</span>.
            </p>
          ) : (
            <ul>
              {visibleHits.map((hit, index) => (
                <li key={`${hit.kind}-${hit.id}`}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(index)}
                    onClick={() => go(hit)}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-state',
                      index === active ? 'bg-action-surface' : 'hover:bg-surface-raised',
                    )}
                  >
                    <span className="w-20 shrink-0 text-label uppercase tracking-wide text-ink-subtle">
                      {KIND_LABEL[hit.kind]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body text-ink">{hit.title}</span>
                      {hit.context && (
                        <span className="block truncate text-label text-ink-muted">{hit.context}</span>
                      )}
                    </span>
                    {hit.amount != null && (
                      <span className="shrink-0 text-body text-ink-muted numeric">
                        {formatAmount(hit.amount)}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
