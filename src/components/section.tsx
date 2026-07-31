import type { ReactNode } from 'react'

/**
 * Every section is an entry in a document: its numeral and name hang in the
 * left margin, the way a printed dossier indexes itself. On narrow screens the
 * margin folds up into a single line above the heading.
 */
export function Section({
  id,
  index,
  label,
  title,
  lead,
  children,
  className = '',
}: {
  id?: string
  index: string
  label: string
  title?: ReactNode
  lead?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section id={id} className={`border-t border-rule ${className}`}>
      <div className="mx-auto max-w-[70rem] px-6 py-16 sm:py-20 lg:px-10">
        <div className="grid gap-y-8 lg:grid-cols-[8rem_1fr] lg:gap-x-12">
          <div className="flex items-baseline gap-3 lg:flex-col lg:gap-2">
            <span className="font-display text-2xl leading-none text-wine">
              {index}
            </span>
            <span className="eyebrow text-ink-faint">{label}</span>
          </div>

          {/* min-w-0: grid items default to min-width:auto, which would let the
              wide case table push the whole page sideways on small screens. */}
          <div className="min-w-0">
            {title ? (
              <h2 className="max-w-[19ch] text-[clamp(1.9rem,3.6vw,2.9rem)] leading-[1.12]">
                {title}
              </h2>
            ) : null}
            {lead ? (
              <p className="mt-5 max-w-[58ch] text-ink-soft">{lead}</p>
            ) : null}
            <div className={title || lead ? 'mt-10' : ''}>{children}</div>
          </div>
        </div>
      </div>
    </section>
  )
}
