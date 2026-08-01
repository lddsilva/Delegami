'use client'

import { cn } from '@/lib/utils'

/**
 * A toggleable filter.
 *
 * /suppliers and /price-catalog each grew their own chip markup with slightly
 * different padding, radius and colours, and both landed around 26–34px tall —
 * on /price-catalog that was 190+ sub-44px targets on a single screen. One
 * component, one hit area, one set of tokens.
 *
 * `count` is rendered dimmer than the label so a row of chips reads as labels
 * first and numbers second.
 */
export function FilterChip({
  active,
  onClick,
  children,
  count,
  className,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  count?: number
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex min-h-11 items-center gap-1.5 rounded-control border px-3 text-body',
        'transition-colors duration-state ease-out-quick',
        'focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action',
        active
          ? 'border-action bg-action font-medium text-ink-inverse'
          : 'border-line-strong bg-surface text-ink-muted hover:text-ink',
        className,
      )}
    >
      <span className="truncate">{children}</span>
      {count != null && (
        <span className={cn('numeric', active ? 'text-ink-inverse/70' : 'text-ink-subtle')}>{count}</span>
      )}
    </button>
  )
}
