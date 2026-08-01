import { notFound } from 'next/navigation'
import { getClientById } from '@/modules/clients/queries'
import { updateClient } from '@/modules/clients/actions'
import { ClientForm } from '@/components/clients/client-form'

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = await getClientById(id)

  if (!client) notFound()

  const action = updateClient.bind(null, id)

  return (
    <div className="page-form">
      <div className="mb-6">
        <h1 className="text-display font-semibold text-ink">Modifica cliente</h1>
        <p className="text-body text-ink-muted mt-1">{client.name}</p>
      </div>
      <ClientForm
        action={action}
        client={client}
        title="Dati cliente"
        backHref={`/clients/${id}`}
      />
    </div>
  )
}
