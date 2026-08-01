import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * tailwind-merge has to be told about the custom scales in globals.css.
 *
 * Without this it does not recognise `text-label` / `text-body` / `text-title` /
 * `text-display` as font sizes, so it files them under "text colour" together
 * with `text-ink-muted` — and since a later class wins within a group, the size
 * was silently dropped from the DOM on every element that carried both. Badges
 * rendered at the browser default 16px instead of 12px, and the effect was
 * invisible in the source: the class was in the JSX and simply never arrived.
 *
 * Same reasoning for the radius scale.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['label', 'body', 'title', 'display'] }],
      rounded: [{ rounded: ['control', 'surface'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Node and the browser disagree about the Swiss thousands separator.
 *
 * `Intl.NumberFormat('de-CH')` returns `4'000` (U+0027 APOSTROPHE) under Node's
 * ICU and `4’000` (U+2019 RIGHT SINGLE QUOTATION MARK) in Chrome. Every amount
 * inside a client component therefore rendered one character on the server and
 * a different one after hydration — React discarded the server markup for that
 * subtree and logged error #418 on nearly every screen in the app.
 *
 * Normalising to U+0027 keeps every already-printed quote and invoice
 * byte-identical, since those are server-rendered and Node already emits it.
 *
 * Use `swissNumber()` for any figure formatted outside these helpers.
 */
export function swissNumber(formatted: string): string {
  return formatted.replace(/’/g, "'")
}

/**
 * de-CH renders a negative amount as "CHF-12'180.00" — the minus glued to the
 * symbol, which reads as part of a code rather than as a sign. We format the
 * magnitude and prepend a real minus sign so a loss is legible at a glance.
 */
function withSign(magnitude: string, negative: boolean): string {
  return negative ? `−${swissNumber(magnitude)}` : swissNumber(magnitude)
}

/**
 * Exact amount with centimes — for documents, invoice lines, payment records.
 * Anywhere the number must reconcile to the rappen.
 */
export function formatCurrency(amount: number | null | undefined, currency = 'CHF'): string {
  if (amount == null) return '—'
  const formatted = new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(Math.abs(amount))
  return withSign(formatted, amount < 0)
}

/**
 * Rounded amount for summaries, KPIs and list rows.
 *
 * Centimes are noise at a glance: "CHF 127'843.00" is seven significant digits
 * where three carry the meaning. Use this everywhere the number is being *read*
 * rather than *reconciled*; use formatCurrency() when it must add up exactly.
 */
export function formatAmount(amount: number | null | undefined, currency = 'CHF'): string {
  if (amount == null) return '—'
  const formatted = new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount))
  return withSign(formatted, Math.round(amount) < 0)
}

/** Signed percentage with the minimum useful precision. Returns '—' for null. */
export function formatPercent(value: number | null | undefined, digits = 0): string {
  if (value == null || Number.isNaN(value)) return '—'
  return `${value.toFixed(digits)}%`
}

/** Hours as the Swiss locale writes them, without trailing zeros. */
export function formatHours(hours: number | null | undefined): string {
  if (hours == null) return '—'
  return `${new Intl.NumberFormat('it-CH', { maximumFractionDigits: 2 }).format(hours)} h`
}

export function expenseAmountChf(expense: {
  amount: number
  currency?: string | null
  amountChf?: number | null
}): number {
  return expense.currency && expense.currency !== 'CHF' && expense.amountChf != null
    ? expense.amountChf
    : expense.amount
}

export const APP_TIMEZONE = 'Europe/Zurich'

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('de-CH', { timeZone: APP_TIMEZONE }).format(new Date(date))
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('de-CH', {
    timeZone: APP_TIMEZONE,
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date))
}

export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('it-CH', {
    timeZone: APP_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(date))
}

/**
 * `yyyy-mm-dd` for <input type="date">, resolved in Europe/Zurich like every other
 * date in the app. `toISOString()` would resolve in UTC, so between 00:00 and 02:00
 * local time it returns the *previous* day — which used to pre-fill new expenses,
 * invoice payments and issue dates with yesterday's date.
 */
export function formatDateInput(date: Date | string | null | undefined): string {
  if (!date) return ''
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return ''
  // en-CA gives ISO-style yyyy-mm-dd, which is exactly what the input expects.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(parsed)
}

export function mapsUrl(...parts: (string | null | undefined)[]): string {
  const query = parts.filter(Boolean).join(', ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}
