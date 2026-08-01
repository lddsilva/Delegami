import { createProject } from '@/modules/projects/actions'
import { getClientsSelect } from '@/modules/clients/queries'
import { getNextProjectCode } from '@/modules/projects/queries'
import { ProjectForm } from '@/components/projects/project-form'
import { prisma } from '@/lib/db'

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>
}) {
  const { clientId } = await searchParams
  const [clients, nextCode, settings] = await Promise.all([
    getClientsSelect(),
    getNextProjectCode(),
    prisma.companySettings.findFirst({ select: { paymentTerms: true }, orderBy: { createdAt: 'asc' } }),
  ])

  return (
    <div className="page-form">
      <div className="mb-6">
        <h1 className="text-display font-semibold text-ink">Nuova opera</h1>
        <p className="text-body text-ink-muted mt-1">Inserisci i dati del nuovo cantiere</p>
      </div>
      <ProjectForm
        action={createProject}
        clients={clients}
        defaultClientId={clientId}
        suggestedCode={nextCode}
        defaultPaymentTerms={settings?.paymentTerms ?? undefined}
        title="Dati opera"
        backHref="/projects"
      />
    </div>
  )
}
