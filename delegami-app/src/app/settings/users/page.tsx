import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Plus, Pencil, ShieldCheck, Eye, Shield, HardHat } from 'lucide-react'
import { prisma } from '@/lib/db'
import { getSession, isAdmin } from '@/lib/auth'
import { Button, ButtonLink } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DeleteUserButton } from '@/components/users/delete-user-button'
import { formatDate } from '@/lib/utils'

const roleConfig = {
  ADMIN: { label: 'Amministratore', icon: ShieldCheck, color: 'bg-negative-surface text-negative border-negative-border' },
  MANAGER: { label: 'Responsabile', icon: Shield, color: 'bg-action-surface text-action border-action-border' },
  VIEWER: { label: 'Visualizzatore', icon: Eye, color: 'bg-surface-raised text-ink-muted border-line' },
  WORKER: { label: 'Operaio', icon: HardHat, color: 'bg-attention-surface text-attention border-attention-border' },
}

export default async function UsersPage() {
  const session = await getSession()
  if (!session || !isAdmin(session.role)) notFound()

  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } })

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-display font-semibold text-ink">Gestione utenti</h1>
          <p className="text-body text-ink-muted mt-1">Crea e gestisci gli account di accesso al gestionale</p>
        </div>
        <Link href="/settings/users/new">
          <Button size="sm"><Plus className="w-4 h-4" /> Nuovo utente</Button>
        </Link>
      </div>

      {/* Role legend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {Object.entries(roleConfig).map(([role, cfg]) => {
          const Icon = cfg.icon
          return (
            <div key={role} className={`rounded-control border px-4 py-3 flex items-center gap-3 ${cfg.color}`}>
              <Icon className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-body font-semibold">{cfg.label}</p>
                <p className="text-label opacity-75">
                  {role === 'ADMIN' && 'Accesso completo + gestione utenti'}
                  {role === 'MANAGER' && 'Tutto tranne gestione utenti'}
                  {role === 'VIEWER' && 'Solo visualizzazione, nessuna modifica'}
                  {role === 'WORKER' && 'Accede solo al proprio rapportino'}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Rows, not a table. As a six-column table the actions column sat at
          x≈709 on a 375px screen — the delete button was 334px off-screen and
          only reachable by scrolling the table sideways. */}
      <Card>
        <ul className="divide-y divide-line">
          {users.map((u) => {
            const cfg = roleConfig[u.role as keyof typeof roleConfig]
            const Icon = cfg.icon
            const isSelf = u.id === session.id
            return (
              <li key={u.id} className="px-4 py-3 transition-colors duration-state hover:bg-surface-raised sm:px-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-body font-medium text-ink">
                      {u.name}
                      {isSelf && <span className="ml-1.5 text-label font-normal text-action">(tu)</span>}
                    </p>
                    <p className="truncate text-label text-ink-muted">{u.email}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-label font-medium ${cfg.color}`}>
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                      <Badge variant={u.active ? 'positive' : 'neutral'}>
                        {u.active ? 'Attivo' : 'Disabilitato'}
                      </Badge>
                      <span className="text-label text-ink-muted numeric">dal {formatDate(u.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <ButtonLink
                      href={`/settings/users/${u.id}/edit`}
                      variant="ghost"
                      size="sm"
                      aria-label={`Modifica ${u.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </ButtonLink>
                    {!isSelf && <DeleteUserButton id={u.id} name={u.name} />}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}
