'use client'

import Link from 'next/link'
import { Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CreateInvoiceButton({ quoteId, primary = false }: { quoteId: string; primary?: boolean }) {
  return (
    <Link href={`/quotes/${quoteId}/invoice`}>
      <Button variant={primary ? 'primary' : 'secondary'} size="sm">
        <Receipt className="w-4 h-4" /> Genera fattura
      </Button>
    </Link>
  )
}
