import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    // min-w-0: a grid or flex item defaults to min-width:auto, so a control
    // with a wide intrinsic size — a date input on iOS — refuses to shrink and
    // pushes the whole row past the card.
    return (
      <div className="flex min-w-0 flex-col gap-1">
        {label && (
          <label htmlFor={textareaId} className="text-body font-medium text-ink">
            {label}
            {props.required && <span className="text-negative ml-0.5" aria-hidden>*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={3}
          className={cn(
            'w-full rounded-control border border-line-strong bg-surface px-3 py-2.5 text-body',
            'text-ink placeholder:text-ink-muted',
            'transition-colors duration-state ease-out-quick',
            'focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action focus:border-action',
            'disabled:bg-surface-raised disabled:text-ink-muted disabled:cursor-not-allowed',
            error && 'border-negative focus-visible:outline-negative',
            className,
          )}
          {...props}
        />
        {error && <p className="text-label text-negative">{error}</p>}
        {hint && !error && <p className="text-label text-ink-muted">{hint}</p>}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
