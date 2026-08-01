import { Badge } from '@/components/ui/badge'
import type { InvoiceStatus } from '@/generated/prisma/enums'

const config: Record<InvoiceStatus, { label: string; variant: 'gray' | 'blue' | 'emerald' | 'red' }> = {
  DRAFT: { label: 'Bozza', variant: 'gray' },
  SENT: { label: 'Inviata', variant: 'blue' },
  PAID: { label: 'Pagata', variant: 'emerald' },
  CANCELLED: { label: 'Annullata', variant: 'red' },
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const c = config[status]
  return <Badge variant={c.variant}>{c.label}</Badge>
}
