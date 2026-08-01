'use client'

import { useEffect } from 'react'
import { ErrorState } from '@/components/ui/error-state'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return <ErrorState description="Non è stato possibile caricare i fornitori. Riprova tra un momento." reset={reset} />
}
