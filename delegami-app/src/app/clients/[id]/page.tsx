import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, MapPin, Building2, CreditCard, Pencil } from 'lucide-react'
import { getClientById } from '@/modules/clients/queries'
import { ProjectStatusBadge } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DeleteClientButton } from '@/components/clients/delete-client-button'
import { formatDate, formatCurrency, mapsUrl } from '@/lib/utils'
import { getSession, canMutate, canDelete } from '@/lib/auth'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [client, session] = await Promise.all([getClientById(id), getSession()])

  if (!client) notFound()
  const canEdit = session ? canMutate(session.role) : false
  const canDel = session ? canDelete(session.role) : false

  return (
    <div className="page-content">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <ButtonLink href="/clients" variant="ghost" size="sm" aria-label="Torna indietro"><ArrowLeft className="w-4 h-4" /></ButtonLink>
          <div>
            <h1 className="text-display font-semibold text-ink">{client.name}</h1>
            {client.vatNumber && (
              <p className="text-body text-ink-muted mt-0.5">UID: {client.vatNumber}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canDel && <DeleteClientButton id={client.id} name={client.name} />}
          {canEdit && (
            <Link href={`/clients/${client.id}/edit`}>
              <Button variant="secondary" size="sm">
                <Pencil className="w-4 h-4" />
                Modifica
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Info */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contatti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {client.email && (
                <div className="flex items-center gap-2 text-body">
                  <Mail className="w-4 h-4 text-ink-muted shrink-0" />
                  <a href={`mailto:${client.email}`} className="text-action hover:underline truncate">
                    {client.email}
                  </a>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2 text-body">
                  <Phone className="w-4 h-4 text-ink-muted shrink-0" />
                  <a href={`tel:${client.phone}`} className="text-ink hover:underline">
                    {client.phone}
                  </a>
                </div>
              )}
              {(client.address || client.city) && (
                <div className="flex items-start gap-2 text-body">
                  <MapPin className="w-4 h-4 text-ink-muted shrink-0 mt-0.5" />
                  <a
                    href={mapsUrl(client.address, client.postalCode, client.city, client.country !== 'CH' ? client.country : null)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-action hover:underline"
                  >
                    {client.address && <p>{client.address}</p>}
                    {(client.postalCode || client.city) && (
                      <p>{client.postalCode} {client.city}</p>
                    )}
                    {client.country && client.country !== 'CH' && <p>{client.country}</p>}
                  </a>
                </div>
              )}
              {client.vatNumber && (
                <div className="flex items-center gap-2 text-body">
                  <CreditCard className="w-4 h-4 text-ink-muted shrink-0" />
                  <span className="text-ink">{client.vatNumber}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Note</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-body text-ink-muted whitespace-pre-wrap">{client.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Projects */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Opere ({client.projects.length})
              </CardTitle>
              {canEdit && (
                <Link href={`/projects/new?clientId=${client.id}`}>
                  <Button size="sm">+ Nuova opera</Button>
                </Link>
              )}
            </CardHeader>

            {client.projects.length === 0 ? (
              <CardContent>
                <p className="text-body text-ink-muted text-center py-8">
                  Nessuna opera per questo cliente.
                </p>
              </CardContent>
            ) : (
              <ul className="divide-y divide-line">
                {client.projects.map((project) => (
                  <li key={project.id} className="group relative flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-action-surface/40 transition-colors">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-body font-medium text-ink group-hover:text-action after:absolute after:inset-0"
                      >
                        {project.name}
                      </Link>
                      <div className="mt-1 flex items-center gap-2 flex-wrap text-label text-ink-muted">
                        <ProjectStatusBadge status={project.status} />
                        {project.referenceCode && <span className="font-mono">{project.referenceCode}</span>}
                        {project.startDate && <span>· {formatDate(project.startDate)}</span>}
                      </div>
                    </div>
                    <span className="shrink-0 text-body font-medium text-ink tabular-nums">{formatCurrency(project.estimatedValue)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
