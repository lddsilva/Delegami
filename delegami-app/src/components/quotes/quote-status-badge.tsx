import { Badge } from '@/components/ui/badge'
import type { QuoteStatus } from '@/generated/prisma/enums'

const config: Record<QuoteStatus, { label: string; variant: 'gray' | 'blue' | 'green' | 'red' | 'amber' | 'emerald' | 'yellow' }> = {
  DRAFT: { label: 'Bozza', variant: 'gray' },
  SENT: { label: 'Inviato', variant: 'blue' },
  APPROVED: { label: 'Approvato', variant: 'green' },
  REJECTED: { label: 'Rifiutato', variant: 'red' },
  INVOICED: { label: 'Fatturato', variant: 'emerald' },
}

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  const c = config[status]
  return <Badge variant={c.variant}>{c.label}</Badge>
}
