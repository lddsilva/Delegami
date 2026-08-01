'use client'

import { useEffect } from 'react'

/**
 * Compact-mode "fit on one page".
 *
 * Two levers, applied in order on `.pdf-document`:
 *  1. `--vspace` (1 → 0.3) scales the vertical whitespace between/inside blocks
 *     (never the font, signature lines keep a CSS floor). Tried first because it
 *     keeps text full size.
 *  2. If whitespace compression alone still overflows one A4 page, a layout-aware
 *     `zoom` is applied to the whole document so it is *guaranteed* to fit a
 *     single page. `zoom` (unlike `transform: scale`) shrinks the layout box too,
 *     so the browser paginates it as one page.
 *
 * Runs on mount and again on `beforeprint` so the print output matches.
 */
export function QuoteAutoFit({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    const el = document.querySelector<HTMLElement>('.pdf-document')
    if (!el) return

    const reset = () => {
      el.style.removeProperty('--vspace')
      el.style.removeProperty('zoom')
    }

    if (!enabled) {
      reset()
      return
    }

    const MM = 96 / 25.4 // CSS px per mm

    // A4 printable height (page − @page top/bottom margins of 15mm each).
    const PAGE_PRINTABLE = 297 - 15 - 15 // 267mm
    const SAFETY = 6 // mm — keep clear of the page edge
    const PRINT_BOX_LIMIT = PAGE_PRINTABLE - SAFETY // doc box must fit this
    const DOC_BOTTOM_PAD = 10 // .pdf-document print padding-bottom
    const CONTENT_LIMIT = PRINT_BOX_LIMIT - DOC_BOTTOM_PAD // content (no padding)
    const SCREEN_VPAD = 24 // on-screen padding (12mm top + 12mm bottom), print uses less

    const steps = [1, 0.85, 0.7, 0.55, 0.4, 0.3]

    // Content height in mm, excluding the screen-only vertical padding.
    const contentMm = () => el.scrollHeight / MM - SCREEN_VPAD

    const fit = () => {
      el.style.removeProperty('zoom')

      // 1) Squeeze whitespace as far as needed (or to the floor).
      let chosen = steps[0]
      for (const s of steps) {
        el.style.setProperty('--vspace', String(s))
        chosen = s
        if (contentMm() <= CONTENT_LIMIT) break
      }
      el.style.setProperty('--vspace', String(chosen))

      // 2) Still too tall → shrink the whole document to guarantee one page.
      const c = contentMm()
      if (c > CONTENT_LIMIT) {
        const z = Math.max(0.5, PRINT_BOX_LIMIT / (c + DOC_BOTTOM_PAD))
        el.style.setProperty('zoom', String(z))
      }
    }

    const raf = requestAnimationFrame(() => requestAnimationFrame(fit))
    window.addEventListener('beforeprint', fit)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('beforeprint', fit)
      reset()
    }
  }, [enabled])

  return null
}
