'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, X } from 'lucide-react'

type ToastTone = 'error' | 'success'
type Toast = { id: number; message: string; tone: ToastTone }

const TONE = {
  error: {
    icon: AlertTriangle,
    className: 'border-negative-border bg-negative-surface text-negative',
    role: 'alert' as const,
  },
  success: {
    icon: CheckCircle2,
    className: 'border-positive-border bg-positive-surface text-positive',
    role: 'status' as const,
  },
}

/**
 * Replaces `window.alert`, which the app used 29 times to report the error from
 * a failed server action.
 *
 * A native alert blocks the thread, cannot be styled, is announced as
 * "delegami-omega.vercel.app says:", and forces the user to dismiss it before
 * they can even read the form behind it. A failed save is not worth a modal —
 * it is worth a message that appears, can be read, and goes away.
 *
 * Errors stay until dismissed; confirmations auto-dismiss after 4s.
 */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const push = useCallback(
    (message: string, tone: ToastTone) => {
      const id = nextId.current++
      setToasts((current) => [...current, { id, message, tone }])
      if (tone === 'success') {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), 4000),
        )
      }
    },
    [dismiss],
  )

  const toastError = useCallback((message: string) => push(message, 'error'), [push])
  const toastSuccess = useCallback((message: string) => push(message, 'success'), [push])

  const timersRef = timers
  useEffect(() => {
    const map = timersRef.current
    return () => {
      map.forEach(clearTimeout)
      map.clear()
    }
  }, [timersRef])

  const toaster =
    toasts.length === 0 ? null : (
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {toasts.map((toast) => {
          const tone = TONE[toast.tone]
          const Icon = tone.icon
          return (
            <div
              key={toast.id}
              role={tone.role}
              className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-surface border px-4 py-3 shadow-overlay ${tone.className}`}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="flex-1 text-body">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Chiudi"
                className="-my-2 -mr-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control hover:bg-black/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    )

  return { toastError, toastSuccess, toaster }
}
