type Tone = 'navy' | 'light'

const SHELL: Record<Tone, string> = { navy: '#143A56', light: '#F5F7F8' }

/** The D whose counter holds a check: the letter says who, the check says what
 *  happened to your paperwork. Below 32px use `simple` — the check stops
 *  resolving and turns into a smudge. */
export function LogoMark({
  size = '2rem',
  tone = 'navy',
  simple = false,
}: {
  size?: string
  tone?: Tone
  simple?: boolean
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      style={{ height: size, width: size, display: 'block' }}
      aria-hidden
      focusable="false"
    >
      <path d="M14 10H34a22 22 0 0 1 0 44H14Z" fill={SHELL[tone]} />
      <path d="M24 20h10a12 12 0 0 1 0 24H24Z" fill="#2ACAAB" />
      {!simple && (
        <path
          d="M28.5 32.5 32 36l7.5-8.5"
          fill="none"
          stroke="#143A56"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}

/**
 * Horizontal lockup. The mark runs 1.45× the wordmark's cap height on purpose:
 * at matching height it read as a second D at the start of the word.
 */
export function Logo({ tone = 'navy' }: { tone?: Tone }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size="2.1rem" tone={tone} />
      <span className="flex flex-col">
        <span
          className={`text-[1.15rem] font-extrabold leading-none tracking-[0.005em] ${
            tone === 'light' ? 'text-off' : 'text-navy'
          }`}
        >
          DELEGAMI
        </span>
        <span
          aria-hidden
          className={`mt-[3px] h-[1.5px] w-full ${tone === 'light' ? 'bg-mint' : 'bg-mint'}`}
        />
        <span
          className={`mt-[3px] text-[0.44rem] font-semibold leading-none tracking-[0.19em] ${
            tone === 'light' ? 'text-off/60' : 'text-slate'
          }`}
        >
          COLLABORAZIONE AMMINISTRATIVA
        </span>
      </span>
    </span>
  )
}
