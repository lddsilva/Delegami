import { cn } from '@/lib/utils'

/**
 * Neutral by design.
 *
 * This used to pick one of ten saturated hues per name — rose, violet, teal,
 * cyan, fuchsia — which was the largest remaining source of colours outside the
 * semantic palette, and it made a client avatar shout as loudly as an "overdue"
 * badge sitting next to it. Colour in this app means action, positive,
 * attention or negative; identity is carried by the initials and by the client
 * name, which is always adjacent.
 */
function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

interface InitialAvatarProps {
  name: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'w-6 h-6 text-label',
  md: 'w-8 h-8 text-label',
  lg: 'w-11 h-11 text-body',
}

export function InitialAvatar({ name, className, size = 'md' }: InitialAvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full',
        'bg-surface-raised font-semibold tracking-wide text-ink-muted',
        sizeClasses[size],
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}
