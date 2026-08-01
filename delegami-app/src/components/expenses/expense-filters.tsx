'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface Project { id: string; name: string; client: { name: string } }

export function ExpenseFilters({ projects }: { projects: Project[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  const currentProject = searchParams.get('projectId') ?? ''
  const currentStatus = searchParams.get('status') ?? ''

  // A <select> sizes itself to its widest option, so the project filter measured
  // 636px against a 375px viewport and ran off the screen. `w-full` on mobile with
  // `min-w-0` inside a grid keeps it inside the page whatever the option text is.
  const selectClass =
    'min-w-0 w-full rounded-control border border-line-strong bg-surface px-3 min-h-11 text-body text-ink ' +
    'transition-colors duration-state focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action'

  return (
    <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
      <select
        aria-label="Filtra per opera"
        className={selectClass}
        value={currentProject}
        onChange={(e) => setFilter('projectId', e.target.value)}
      >
        <option value="">Tutte le opere</option>
        <option value="none">Spese aziendali (senza opera)</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>{p.client.name} — {p.name}</option>
        ))}
      </select>
      <select
        aria-label="Filtra per stato"
        className={`${selectClass} sm:w-auto`}
        value={currentStatus}
        onChange={(e) => setFilter('status', e.target.value)}
      >
        <option value="">Tutti gli stati</option>
        <option value="PENDING">In attesa</option>
        <option value="PARTIALLY_PAID">Parz. pagata</option>
        <option value="PAID">Pagata</option>
      </select>
      {(currentProject || currentStatus) && (
        <button
          onClick={() => { setFilter('projectId', ''); setFilter('status', '') }}
          className="inline-flex min-h-11 items-center justify-center rounded-control px-3 text-body text-ink-muted transition-colors duration-state hover:bg-surface-raised hover:text-ink"
        >
          Rimuovi filtri
        </button>
      )}
    </div>
  )
}
