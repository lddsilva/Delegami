import { forwardRef } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

/**
 * Exactly one `primary` per screen. `secondary` supports it, `ghost` is
 * tertiary, `danger` is destructive — the visual weight has to make the
 * ranking obvious without reading the labels.
 */
const variantClasses: Record<Variant, string> = {
  primary: 'bg-action text-ink-inverse hover:bg-action-hover border-transparent',
  secondary: 'bg-surface text-ink border-line-strong hover:bg-surface-raised',
  ghost: 'bg-transparent text-ink-muted border-transparent hover:bg-surface-raised hover:text-ink',
  danger: 'bg-negative text-ink-inverse hover:brightness-95 border-transparent',
}

/**
 * Every size is at least 44px tall, including `sm`.
 *
 * The old `sm` was `py-1.5 text-label` and rendered ~21px — measured at 375px it was
 * the single largest source of sub-44px tap targets. `sm` now means *visually
 * compact*, not *physically small*: the padding shrinks, the hit area does not.
 */
const sizeClasses: Record<Size, string> = {
  sm: 'min-h-11 min-w-11 px-3 text-label gap-1.5',
  md: 'min-h-11 min-w-11 px-4 text-body gap-2',
  lg: 'min-h-12 min-w-12 px-6 text-body gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          'inline-flex items-center justify-center font-medium border rounded-control',
          'transition-colors duration-state ease-out-quick',
          'focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading && (
          <span
            aria-hidden
            className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"
          />
        )}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'

const buttonShell = [
  'inline-flex items-center justify-center font-medium border rounded-control',
  'transition-colors duration-state ease-out-quick',
  'focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action',
].join(' ')

interface ButtonLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  variant?: Variant
  size?: Size
}

/**
 * A link that looks like a button — for navigation, not for actions.
 *
 * The app's habit was `<Link><Button/></Link>`, which nests a control inside a
 * control. With visible text it merely produces two entries in the
 * accessibility tree; with an icon it produces a **nameless link**, because the
 * `aria-label` sits on the inner button while the anchor — the thing that is
 * actually focused and announced — has nothing. That was 42 of the app's 823
 * controls. One element, one name, one role.
 */
export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  ({ className, href, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <Link
        ref={ref}
        href={href}
        className={cn(buttonShell, variantClasses[variant], sizeClasses[size], className)}
        {...props}
      >
        {children}
      </Link>
    )
  },
)

ButtonLink.displayName = 'ButtonLink'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Required. An icon-only control has no visible text and `title` does not
   * exist on touch — 83 controls in this app relied on it and were effectively
   * unlabelled on a phone. Typing it as required makes that impossible.
   */
  label: string
  variant?: Variant
  children: React.ReactNode
}

/** Icon-only action: the icon stays small, the hit area is always 44×44. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, label, variant = 'ghost', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        title={label}
        className={cn(
          'inline-flex items-center justify-center tap-target rounded-control border',
          'transition-colors duration-state ease-out-quick',
          'focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  },
)

IconButton.displayName = 'IconButton'
