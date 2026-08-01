import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Server-rendered pagination. Plain links, no client JS — it works before
 * hydration, which matters on a phone on a building site.
 *
 * Note on what this does and does not fix: the list queries sort and group in
 * JS after fetching (expense status priority, quote version families), so the
 * page is sliced after that work rather than with SQL LIMIT. The database still
 * reads the full set. That is deliberate — moving the ordering into SQL would
 * change the semantics of those lists — and it is the render cost that actually
 * hurt: the app used to put every row in the DOM, which is what a browser
 * struggles with, not a few hundred rows over the wire.
 */
export function Pagination({
  page,
  pageSize,
  total,
  searchParams,
}: {
  page: number
  pageSize: number
  total: number
  /** Current query string, so filters survive a page change. */
  searchParams?: Record<string, string | undefined>
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (pages <= 1) return null

  const first = (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, total)

  function href(target: number) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(searchParams ?? {})) {
      if (value && key !== 'page') params.set(key, value)
    }
    if (target > 1) params.set('page', String(target))
    const qs = params.toString()
    return qs ? `?${qs}` : '?'
  }

  const linkClass =
    'inline-flex min-h-11 items-center gap-1 rounded-control border border-line-strong px-3 text-body text-ink transition-colors duration-state hover:bg-surface-raised'
  const disabledClass =
    'inline-flex min-h-11 items-center gap-1 rounded-control border border-line px-3 text-body text-ink-subtle'

  return (
    <nav className="mt-4 flex items-center justify-between gap-3" aria-label="Paginazione">
      {page > 1 ? (
        <Link href={href(page - 1)} className={linkClass} rel="prev">
          <ChevronLeft className="h-4 w-4" />
          Precedenti
        </Link>
      ) : (
        <span className={disabledClass} aria-hidden>
          <ChevronLeft className="h-4 w-4" />
          Precedenti
        </span>
      )}

      <p className="text-label text-ink-muted numeric">
        {first}–{last} di {total}
      </p>

      {page < pages ? (
        <Link href={href(page + 1)} className={linkClass} rel="next">
          Successivi
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className={disabledClass} aria-hidden>
          Successivi
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  )
}

/** Parses `?page=` defensively — junk, zero and negatives all mean page 1. */
export function parsePage(value: string | undefined): number {
  const n = Number.parseInt(value ?? '1', 10)
  return Number.isFinite(n) && n > 0 ? n : 1
}

/**
 * Clamps a requested page to the last one that has rows.
 *
 * Without this, `?page=99` on a 53-row list rendered an empty page reporting
 * "2451–53 di 53" — a dead end reachable from a stale bookmark or a filter that
 * shrank the result set.
 */
export function clampPage(page: number, total: number, pageSize: number): number {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  return Math.min(page, pages)
}
