'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

export function TemplateArchiveToggle({
  count,
  children,
}: {
  count: number
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mb-3 inline-flex items-center gap-2 text-body font-medium text-ink-muted transition-colors hover:text-ink"
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        Archiviati ({count})
      </button>
      {open && children}
    </div>
  )
}
