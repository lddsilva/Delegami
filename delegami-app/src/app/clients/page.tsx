import Link from 'next/link'
import { Plus, Users, MapPin, Phone, Building2 } from 'lucide-react'
import { getClients } from '@/modules/clients/queries'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { InitialAvatar } from '@/components/ui/avatar'
import { getSession, canMutate } from '@/lib/auth'

export default async function ClientsPage() {
  const [clients, session] = await Promise.all([getClients(), getSession()])
  const canEdit = session ? canMutate(session.role) : false

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-title sm:text-display font-semibold text-ink">Clienti</h1>
          <p className="text-body text-ink-muted mt-0.5">{clients.length} clienti registrati</p>
        </div>
        {canEdit && <Link href="/clients/new">
          <Button aria-label="Nuovo cliente" size="sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Nuovo cliente</span>
          </Button>
        </Link>}
      </div>

      {clients.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-12 h-12 text-ink-subtle mb-4" />
            <h3 className="text-body font-medium text-ink mb-1">Nessun cliente</h3>
            <p className="text-body text-ink-muted mb-4">Inizia aggiungendo il tuo primo cliente.</p>
            {canEdit && <Link href="/clients/new"><Button><Plus className="w-4 h-4" /> Aggiungi cliente</Button></Link>}
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-line">
            {clients.map((client) => {
              const location = client.city ? `${client.postalCode ? client.postalCode + ' ' : ''}${client.city}` : null
              return (
                <li key={client.id} className="group relative flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-action-surface/40 transition-colors">
                  <InitialAvatar name={client.name} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/clients/${client.id}`} className="text-body font-medium text-ink group-hover:text-action after:absolute after:inset-0">
                      {client.name}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-3 flex-wrap text-label text-ink-muted">
                      {location && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{location}</span>}
                      {/* -my-3.5/py-3.5 grows the hit area to 44px without moving
                          anything: the padding is cancelled by the negative margin,
                          so the metadata line keeps its 16px height. */}
                      {client.phone && (
                        <a
                          href={`tel:${client.phone.replace(/\s/g, '')}`}
                          className="relative z-10 -my-3.5 inline-flex items-center gap-1 py-3.5 hover:text-action"
                        >
                          <Phone className="h-3 w-3" />
                          <span className="numeric">{client.phone}</span>
                        </a>
                      )}
                      {client.vatNumber && <span className="font-mono">{client.vatNumber}</span>}
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5 text-label text-ink-muted" title={`${client._count.projects} opere`}>
                    <Building2 className="w-3.5 h-3.5 text-ink-subtle" />
                    <span className="font-medium tabular-nums">{client._count.projects}</span>
                  </div>
                  {canEdit && (
                    <Link
                      href={`/clients/${client.id}/edit`}
                      className="tap-target relative z-10 inline-flex shrink-0 items-center justify-center rounded-control px-2 text-label font-medium text-ink-muted hover:text-action opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-state"
                    >
                      Modifica
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}
