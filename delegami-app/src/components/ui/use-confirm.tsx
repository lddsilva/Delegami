'use client'

import { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'

type ConfirmOptions = {
  title: string
  description?: string
  /** Label of the confirming action. Say what will happen, not "OK". */
  confirmLabel?: string
  cancelLabel?: string
  /** Red confirm button. Use for anything that deletes or cannot be undone. */
  destructive?: boolean
}

/**
 * Drop-in replacement for `window.confirm`, which the app used 22 times —
 * always on a destructive action against real production data.
 *
 * The native dialog blocks the main thread, cannot be styled, announces itself
 * as "zanetti-omega.vercel.app says:", and on iOS Safari is sometimes suppressed
 * outright when called from an async handler — which silently turns "are you
 * sure?" into "deleted".
 *
 * Usage mirrors the old call site closely:
 *
 *   const { confirm, dialog } = useConfirm()
 *   ...
 *   if (!(await confirm({ title: '…', destructive: true }))) return
 *   ...
 *   return <>{dialog}<Button …/></>
 */
export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((value: boolean) => void) | null>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const settle = useCallback((value: boolean) => {
    resolver.current?.(value)
    resolver.current = null
    setOptions(null)
  }, [])

  const dialog = options ? (
    <Dialog
      open
      onClose={() => settle(false)}
      title={options.title}
      description={options.description}
      initialFocusRef={confirmRef}
      footer={
        <>
          <Button variant="secondary" onClick={() => settle(false)}>
            {options.cancelLabel ?? 'Annulla'}
          </Button>
          <Button
            ref={confirmRef}
            variant={options.destructive ? 'danger' : 'primary'}
            onClick={() => settle(true)}
          >
            {options.confirmLabel ?? 'Conferma'}
          </Button>
        </>
      }
    />
  ) : null

  return { confirm, dialog }
}
