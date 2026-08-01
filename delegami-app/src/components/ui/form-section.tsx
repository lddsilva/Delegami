/**
 * A titled group of fields inside a form card.
 *
 * The long forms in this app were one undivided run of inputs — 21 on a new
 * expense, 22 in the settings. Nothing told the eye where one decision ended
 * and the next began, so finding the four fields that matter meant reading all
 * of them. Separation is by space and a quiet heading, not by another border:
 * the card already has one, and a second line inside it adds noise without
 * adding structure.
 */
export function FormSection({
  title,
  description,
  children,
  className = '',
}: {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`pt-6 first:pt-0 ${className}`}>
      <h3 className="text-label font-semibold uppercase tracking-wider text-ink-muted">{title}</h3>
      {description && <p className="mt-1 text-label text-ink-muted">{description}</p>}
      <div className="mt-3">{children}</div>
    </section>
  )
}
