'use client'

import { useActionState } from 'react'
import Image from 'next/image'
import { login } from '@/modules/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null)

  return (
    <div className="min-h-full flex items-center justify-center bg-shell px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          {/* The product's own logo. This was a generic lucide hard-hat icon —
              the first screen of the app showed a different brand from the app. */}
          <div className="mb-4 h-16 w-16 overflow-hidden rounded-surface bg-surface p-1.5">
            <Image src="/logo-mark.svg" alt="" width={64} height={64} className="h-full w-full object-contain" priority />
          </div>
          <h1 className="text-display font-bold text-ink-inverse">Delegami</h1>
          <p className="text-ink-subtle text-body mt-1">Accedi al gestionale</p>
        </div>

        {/* Form */}
        <div className="bg-surface rounded-surface shadow-xl p-8">
          <form action={action} className="space-y-4">
            {state?.error && (
              <div className="rounded-control bg-negative-surface border border-negative-border px-4 py-3 text-body text-negative">
                {state.error}
              </div>
            )}

            <Input
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="nome@azienda.ch"
            />

            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />

            <Button type="submit" loading={pending} className="w-full mt-2">
              Accedi
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
