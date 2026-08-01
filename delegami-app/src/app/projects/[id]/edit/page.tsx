import { notFound } from 'next/navigation'
import { getProjectById } from '@/modules/projects/queries'
import { getClientsSelect } from '@/modules/clients/queries'
import { updateProject } from '@/modules/projects/actions'
import { ProjectForm } from '@/components/projects/project-form'
import { prisma } from '@/lib/db'

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [project, clients, settings] = await Promise.all([
    getProjectById(id),
    getClientsSelect(),
    prisma.companySettings.findFirst({ select: { paymentTerms: true }, orderBy: { createdAt: 'asc' } }),
  ])

  if (!project) notFound()

  const action = updateProject.bind(null, id)

  return (
    <div className="page-form">
      <div className="mb-6">
        <h1 className="text-display font-semibold text-ink">Modifica opera</h1>
        <p className="text-body text-ink-muted mt-1">{project.name}</p>
      </div>
      <ProjectForm
        action={action}
        project={project}
        clients={clients}
        defaultPaymentTerms={settings?.paymentTerms ?? undefined}
        title="Dati opera"
        backHref={`/projects/${id}`}
      />
    </div>
  )
}
