import type { ReactNode } from 'react'

export function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
  tone = 'white',
}: {
  id?: string
  eyebrow?: string
  title?: ReactNode
  lead?: ReactNode
  children: ReactNode
  tone?: 'white' | 'off'
}) {
  return (
    <section id={id} className={tone === 'off' ? 'bg-off' : 'bg-white'}>
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24 lg:px-8">
        {eyebrow ? <p className="eyebrow text-mint-deep">{eyebrow}</p> : null}
        {title ? (
          <h2 className="mt-4 max-w-[20ch] text-[clamp(1.9rem,4vw,3rem)]">
            {title}
          </h2>
        ) : null}
        {lead ? (
          <p className="mt-5 max-w-[58ch] text-slate-ink">{lead}</p>
        ) : null}
        {/* min-w-0 so wide children scroll inside their own box instead of
            pushing the page sideways. */}
        <div className={`min-w-0 ${eyebrow || title || lead ? 'mt-12' : ''}`}>
          {children}
        </div>
      </div>
    </section>
  )
}
