'use client'

import { useEffect, useRef } from 'react'

/**
 * Behaviour for a dropdown menu — the three in this app
 * (`project-status-button`, `quote-actions-menu`, `create-template-menu`) each
 * closed only by clicking an invisible full-screen backdrop, so Esc did
 * nothing and focus was left wherever it happened to be.
 *
 * Deliberately *not* the Dialog primitive: a menu is not modal. It must not
 * trap focus or set `aria-modal`, because Tab is expected to move past it and
 * screen readers should still reach the page behind. What it does need is Esc,
 * click-outside, and returning focus to the trigger so keyboard users are not
 * dumped at the top of the document.
 *
 *   const ref = useDismissable(open, () => setOpen(false), triggerRef)
 *   <div ref={ref} role="menu">…</div>
 */
export function useDismissable<T extends HTMLElement>(
  open: boolean,
  onDismiss: () => void,
  triggerRef?: React.RefObject<HTMLElement | null>,
) {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      onDismiss()
      triggerRef?.current?.focus()
    }

    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node
      if (ref.current?.contains(target)) return
      if (triggerRef?.current?.contains(target)) return
      onDismiss()
    }

    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [open, onDismiss, triggerRef])

  return ref
}
