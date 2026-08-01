'use client'

import { useCallback, useRef, useState, useTransition } from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'
import { updateProjectStatus } from '@/modules/projects/actions'
import type { ProjectStatus } from '@/generated/prisma/enums'
import { useDismissable } from '@/components/ui/use-dismissable'

const STATUS_OPTIONS: { value: ProjectStatus; label: string; color: string }[] = [
  { value: 'LEAD', label: 'Nuova richiesta', color: 'text-ink-muted' },
  { value: 'QUOTING', label: 'In preventivo', color: 'text-attention' },
  { value: 'APPROVED', label: 'Approvato', color: 'text-action' },
  { value: 'IN_PROGRESS', label: 'In corso', color: 'text-positive' },
  { value: 'COMPLETED', label: 'Completato', color: 'text-positive' },
  { value: 'CANCELLED', label: 'Annullato', color: 'text-negative' },
]

interface Props {
  id: string
  currentStatus: ProjectStatus
}

export function ProjectStatusButton({ id, currentStatus }: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSelect(status: ProjectStatus) {
    setOpen(false)
    if (status === currentStatus) return
    startTransition(async () => {
      await updateProjectStatus(id, status)
    })
  }

  const closeMenu = useCallback(() => setOpen(false), [])
  const menuRef = useDismissable<HTMLDivElement>(open, closeMenu, triggerRef)

  const current = STATUS_OPTIONS.find(o => o.value === currentStatus)

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={isPending}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-control border border-line-strong bg-surface px-3 text-body font-medium text-ink transition-colors duration-state hover:bg-surface-raised disabled:opacity-50"
      >
        {isPending
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <span className={current?.color}>{current?.label ?? currentStatus}</span>
        }
        <ChevronDown className="h-3.5 w-3.5 text-ink-muted" />
      </button>

      {open && (
          <div ref={menuRef} role="menu" className="absolute right-0 z-20 mt-1 w-44 rounded-surface border border-line bg-surface py-1 shadow-overlay">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`flex min-h-11 w-full items-center px-3 text-left text-body transition-colors duration-state hover:bg-surface-raised ${opt.color} ${opt.value === currentStatus ? 'bg-surface-raised font-semibold' : ''}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
      )}
    </div>
  )
}
