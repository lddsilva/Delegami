import { cn } from '@/lib/utils'

/**
 * Placeholder shown while a route's server components resolve.
 *
 * Every page in this app queries a remote Turso database from Vercel, and until
 * now there was no loading.tsx anywhere: navigation froze on the previous screen
 * with no feedback until the server answered. These skeletons mirror the real
 * layout so the page does not jump when the data lands.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-control bg-surface-raised', className)} {...props} />
}

/** Standard page-level placeholder: title, a couple of blocks, a list. */
export function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Caricamento in corso…</span>
      <Skeleton className="h-6 w-40" />
      <Skeleton className="mt-2 h-4 w-56" />
      <div className="mt-6 rounded-surface border border-line">
        <div className="border-b border-line px-4 py-3 sm:px-5">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="divide-y divide-line">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <Skeleton className="h-4 w-20 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
