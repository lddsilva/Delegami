import { prisma } from '@/lib/db'
import { SettingsForm } from '@/components/settings/settings-form'
import { PaymentQrUpload } from '@/components/settings/payment-qr-upload'
import { getSession, canMutate } from '@/lib/auth'

export default async function SettingsPage() {
  const [settings, session] = await Promise.all([
    prisma.companySettings.findFirst({ orderBy: { createdAt: 'asc' } }),
    getSession(),
  ])
  const canEdit = session ? canMutate(session.role) : false

  return (
    <div className="page-form">
      <div className="mb-6">
        <h1 className="text-display font-semibold text-ink">Impostazioni azienda</h1>
        <p className="text-body text-ink-muted mt-1">Questi dati appaiono nei PDF di preventivi e fatture</p>
      </div>
      <div className="mb-6">
        <PaymentQrUpload currentUrl={settings?.paymentQrUrl ?? null} canEdit={canEdit} />
      </div>
      <SettingsForm settings={settings} canEdit={canEdit} />
    </div>
  )
}
