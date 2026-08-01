import { headers } from 'next/headers'
import { prisma } from '@/lib/db'

interface Actor {
  id: string
  name: string
}

interface LogOptions {
  entityId?: string | null
  entityLabel?: string | null
  details?: Record<string, unknown> | null
  success?: boolean
  errorMessage?: string | null
  durationMs?: number | null
}

function simplifyUserAgent(ua: string | null): string | null {
  if (!ua) return null
  // Pick browser + OS in a short string. Keeps log readable.
  let browser = 'Browser'
  if (/Edg\//.test(ua)) browser = 'Edge'
  else if (/Chrome\//.test(ua) && !/Edg|OPR/.test(ua)) browser = 'Chrome'
  else if (/Firefox\//.test(ua)) browser = 'Firefox'
  else if (/Safari\//.test(ua) && !/Chrome|Edg/.test(ua)) browser = 'Safari'

  let os = 'OS'
  if (/Windows/.test(ua)) os = 'Windows'
  else if (/Macintosh|Mac OS X/.test(ua)) os = 'macOS'
  else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS'
  else if (/Android/.test(ua)) os = 'Android'
  else if (/Linux/.test(ua)) os = 'Linux'

  return `${browser} · ${os}`
}

async function readRequestContext() {
  try {
    const h = await headers()
    const ipRaw = h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? null
    const ip = ipRaw ? ipRaw.split(',')[0].trim() : null
    const ua = simplifyUserAgent(h.get('user-agent'))
    // Next 16 exposes the current pathname via `next-url`/`referer`.
    const pathHeader = h.get('x-invoke-path') ?? h.get('next-url') ?? null
    let path: string | null = pathHeader
    if (!path) {
      const referer = h.get('referer')
      if (referer) {
        try { path = new URL(referer).pathname } catch { path = null }
      }
    }
    return { ip, ua, path }
  } catch {
    return { ip: null, ua: null, path: null }
  }
}

export async function logActivity(
  actor: Actor,
  action: string,
  entityType: string,
  opts?: LogOptions,
) {
  const ctx = await readRequestContext()
  try {
    await prisma.activityLog.create({
      data: {
        action,
        entityType,
        entityId: opts?.entityId ?? undefined,
        entityLabel: opts?.entityLabel ?? undefined,
        userId: actor.id,
        userName: actor.name,
        details: opts?.details ? JSON.stringify(opts.details) : undefined,
        ipAddress: ctx.ip ?? undefined,
        userAgent: ctx.ua ?? undefined,
        path: ctx.path ?? undefined,
        success: opts?.success ?? true,
        errorMessage: opts?.errorMessage ?? undefined,
        durationMs: opts?.durationMs ?? undefined,
      },
    })
  } catch {
    // Non-blocking: log failures must never interrupt the main action
  }
}
