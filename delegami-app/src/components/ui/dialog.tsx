'use client'

import { useEffect, useId, useRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * The app's only modal primitive.
 *
 * Before this, nine overlays each rolled their own backdrop: three handled Esc,
 * none had a focus trap, `role="dialog"`, `aria-modal`, or focus restore, so
 * keyboard navigation inside a modal fell straight through to the page behind
 * it. Body scroll was never locked either, so the page scrolled under the sheet.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  initialFocusRef,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: React.ReactNode
  footer?: React.ReactNode
  className?: string
  /** Element to focus on open. Defaults to the first focusable node. */
  initialFocusRef?: React.RefObject<HTMLElement | null>
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return

    // Declared inside the effect: reading a ref is only safe after commit, and
    // the lint rule that enforces render purity is right to flag it elsewhere.
    const focusables = () => {
      const root = panelRef.current
      if (!root) return [] as HTMLElement[]
      return Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement)
    }

    const previouslyFocused = document.activeElement as HTMLElement | null
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    // Move focus into the dialog so the next Tab stays inside it.
    const target = initialFocusRef?.current ?? focusables()[0] ?? panelRef.current
    target?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      // Focus trap: wrap around instead of escaping to the page behind.
      const items = focusables()
      if (items.length === 0) {
        event.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (event.shiftKey && (active === first || !panelRef.current?.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.body.style.overflow = overflow
      previouslyFocused?.focus?.()
    }
  }, [open, onClose, initialFocusRef])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'relative w-full max-w-md bg-surface shadow-overlay outline-none',
          // Bottom sheet on phones, centred card from sm up. The inset padding
          // keeps the actions clear of the iPhone home indicator.
          'rounded-t-surface pb-[env(safe-area-inset-bottom)] sm:rounded-surface sm:pb-0',
          'max-h-[85vh] overflow-y-auto',
          className,
        )}
      >
        <div className="px-4 pt-4 sm:px-5 sm:pt-5">
          <h2 id={titleId} className="text-title font-semibold text-ink">
            {title}
          </h2>
          {description && <p className="mt-1 text-body text-ink-muted">{description}</p>}
        </div>

        {children && <div className="px-4 pt-3 sm:px-5">{children}</div>}

        {footer && (
          <div className="flex flex-col-reverse gap-2 px-4 pb-4 pt-4 sm:flex-row sm:justify-end sm:px-5 sm:pb-5">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
