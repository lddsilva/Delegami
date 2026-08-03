/**
 * Auth helpers — session cookie (HMAC-SHA256 signed, HttpOnly).
 * Only use in Server Components and Server Actions (Node.js runtime).
 */

import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'

export type UserRole = 'ADMIN' | 'MANAGER' | 'VIEWER' | 'WORKER'

export interface SessionUser {
  id: string
  name: string
  email: string
  role: UserRole
}

const COOKIE = 'zs_session'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days

function secret() {
  return process.env.AUTH_SECRET ?? 'delegami-dev-only-set-AUTH_SECRET-in-production'
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

export function encodeSession(user: SessionUser): string {
  const payload = Buffer.from(JSON.stringify(user)).toString('base64url')
  return `${payload}.${sign(payload)}`
}

export function decodeSession(token: string): SessionUser | null {
  const dot = token.lastIndexOf('.')
  if (dot < 0) return null
  const payload = token.substring(0, dot)
  const sig = token.substring(dot + 1)
  try {
    const a = Buffer.from(sig, 'base64url')
    const b = Buffer.from(sign(payload), 'base64url')
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
    return JSON.parse(Buffer.from(payload, 'base64url').toString()) as SessionUser
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE)?.value
  if (!token) return null
  const session = decodeSession(token)
  if (!session) return null

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, role: true, active: true },
  })
  if (!user?.active) return null

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  }
}

export async function setSession(user: SessionUser): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE, encodeSession(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  })
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE)
}

/** Role checks */
export function isAdmin(role: UserRole) { return role === 'ADMIN' }
export function canMutate(role: UserRole) { return role === 'ADMIN' || role === 'MANAGER' }
export function canDelete(role: UserRole) { return role === 'ADMIN' }
/** WORKER = restricted operaio account: only sees the rapportino area. */
export function isWorker(role: UserRole) { return role === 'WORKER' }
