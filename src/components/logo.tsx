type Tone = 'ink' | 'paper'

/** Newsreader's cap height, measured: 0.66 × font-size. The mark is sized and
 *  baseline-aligned to it so it reads as the first letter, not as an icon. */
const CAP = 0.66
const RATIO = 27 / 40 // ink box of the mark

const COLORS: Record<Tone, { bar: string; seal: string }> = {
  ink: { bar: '#22201D', seal: '#6B2637' },
  paper: { bar: '#FAF8F4', seal: '#D9A8B2' },
}

/** Margin rule + seal. Read together they form a D. */
export function LogoMark({
  size = '1.6rem',
  tone = 'ink',
  className = '',
}: {
  size?: string
  tone?: Tone
  className?: string
}) {
  const { bar, seal } = COLORS[tone]
  return (
    <svg
      viewBox="18 12 27 40"
      className={className}
      style={{ height: size, width: `calc(${size} * ${RATIO})`, display: 'block' }}
      aria-hidden
      focusable="false"
    >
      <rect x="18" y="12" width="8" height="40" rx="1" fill={bar} />
      <path d="M29 12a16 20 0 0 1 0 40Z" fill={seal} />
    </svg>
  )
}

export function Logo({
  tone = 'ink',
  size = '1.35rem',
  className = '',
}: {
  tone?: Tone
  size?: string
  className?: string
}) {
  return (
    <span
      className={`flex items-baseline gap-[0.2em] ${className}`}
      style={{ fontSize: size }}
    >
      <LogoMark size={`${CAP}em`} tone={tone} />
      <span
        className={`font-display leading-none tracking-[-0.012em] ${
          tone === 'paper' ? 'text-paper' : 'text-ink'
        }`}
      >
        Delegami
      </span>
    </span>
  )
}
