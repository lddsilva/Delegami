import { cn } from '@/lib/utils'

/**
 * A plain surface. No shadow by default — `shadow-none` appeared 8 times in the
 * codebase purely to switch off the shadow this component used to impose.
 * Cards separate by space and alignment; elevation is reserved for things that
 * genuinely float (see `--shadow-overlay`).
 *
 * Padding is responsive by default. Callers used to hand-roll `px-4 sm:px-6`
 * on almost every header and body because the flat `px-6` was too much at 375px.
 */
export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('bg-surface rounded-surface border border-line', className)} {...props}>
      {children}
    </div>
  )
}

/**
 * Title on the left, at most one action on the right — the dominant shape in
 * this app, so it is the default rather than something every caller re-declares
 * with `flex flex-row items-center justify-between`.
 */
export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-4 py-3 border-b border-line sm:px-5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn('text-body font-semibold text-ink', className)} {...props}>
      {children}
    </h2>
  )
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-4 py-3 sm:px-5 sm:py-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-4 py-3 border-t border-line sm:px-5 sm:py-4', className)} {...props}>
      {children}
    </div>
  )
}
