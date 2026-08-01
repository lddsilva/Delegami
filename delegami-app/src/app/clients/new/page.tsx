import { createClient } from '@/modules/clients/actions'
import { ClientForm } from '@/components/clients/client-form'

export default function NewClientPage() {
  return (
    <div className="page-form">
      <div className="mb-6">
        <h1 className="text-display font-semibold text-ink">Nuovo cliente</h1>
        <p className="text-body text-ink-muted mt-1">Inserisci i dati del nuovo cliente</p>
      </div>
      <ClientForm action={createClient} title="Dati cliente" backHref="/clients" />
    </div>
  )
}
