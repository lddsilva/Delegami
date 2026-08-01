import { cn } from '@/lib/utils'
import { ProjectStatus } from '@/generated/prisma/enums'

/**
 * Four meanings, not seven colours.
 *
 * The old set (gray/blue/green/yellow/red/emerald/amber) had `green` and
 * `emerald` doing the same job and `yellow` and `amber` doing the same job, so
 * the same state read differently depending on which screen you were on. The
 * legacy names stay as aliases: existing call sites keep compiling and land on
 * the right semantic colour.
 */
type BadgeVariant = 'neutral' | 'action' | 'positive' | 'attention' | 'negative'
type LegacyVariant = 'gray' | 'blue' | 'green' | 'emerald' | 'yellow' | 'amber' | 'red'

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-surface-raised text-ink-muted',
  action: 'bg-action-surface text-action',
  positive: 'bg-positive-surface text-positive',
  attention: 'bg-attention-surface text-attention',
  negative: 'bg-negative-surface text-negative',
}

const legacyAliases: Record<LegacyVariant, BadgeVariant> = {
  gray: 'neutral',
  blue: 'action',
  green: 'positive',
  emerald: 'positive',
  yellow: 'attention',
  amber: 'attention',
  red: 'negative',
}

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant | LegacyVariant
  className?: string
}

export function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  const resolved =
    variant in legacyAliases ? legacyAliases[variant as LegacyVariant] : (variant as BadgeVariant)
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-label font-medium',
        variantClasses[resolved],
        className,
      )}
    >
      {children}
    </span>
  )
}

// Project status badge with automatic color
const statusConfig: Record<ProjectStatus, { label: string; variant: BadgeVariant }> = {
  LEAD: { label: 'Nuova richiesta', variant: 'neutral' },
  QUOTING: { label: 'In preventivo', variant: 'attention' },
  APPROVED: { label: 'Approvato', variant: 'action' },
  IN_PROGRESS: { label: 'In corso', variant: 'positive' },
  COMPLETED: { label: 'Completato', variant: 'positive' },
  CANCELLED: { label: 'Annullato', variant: 'negative' },
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const config = statusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
