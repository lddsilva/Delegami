export const PHASE_COLOR_PALETTE = [
  '#2563eb',
  '#059669',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
  '#db2777',
  '#65a30d',
  '#475569',
  '#ea580c',
]

export function phaseColorAt(index: number): string {
  const i = ((index % PHASE_COLOR_PALETTE.length) + PHASE_COLOR_PALETTE.length) % PHASE_COLOR_PALETTE.length
  return PHASE_COLOR_PALETTE[i]
}
