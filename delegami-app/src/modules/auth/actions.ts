'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { setSession, clearSession, getSession } from '@/lib/auth'
import type { UserRole } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log'

export type LoginState = { error?: string } | null

export async function login(prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email e password sono obbligatori.' }
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.active) {
    return { error: 'Credenziali non valide.' }
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return { error: 'Credenziali non valide.' }
  }

  await setSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
  })

  await logActivity(user, 'LOGIN', 'Auth', { entityLabel: user.email })

  // Redirect straight to the right landing page — avoids a double redirect
  // ('/' then layout bouncing WORKER to '/rapportino') which can leave the
  // client router in a stale state until a manual reload.
  redirect(user.role === 'WORKER' ? '/rapportino' : '/')
}

export async function logout() {
  const session = await getSession()
  if (session) await logActivity(session, 'LOGOUT', 'Auth', { entityLabel: session.email })
  await clearSession()
  redirect('/login')
}
