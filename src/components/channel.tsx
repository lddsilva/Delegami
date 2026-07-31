import { MessageSquare, Clock, FileCheck } from 'lucide-react'
import { SLA } from '@/lib/site'

const POINTS = [
  {
    icon: MessageSquare,
    title: 'Un canale solo: WhatsApp',
    body: 'Testo, vocale, foto, allegati. Quando vuoi, anche fuori orario: la tua richiesta entra in coda e non si perde.',
  },
  {
    icon: FileCheck,
    title: 'Lavoriamo per iscritto',
    body: 'Niente telefonate. Così ogni istruzione, prezzo e conferma resta documentata — e nessuno deve ricordarsi cosa era stato detto.',
  },
  {
    icon: Clock,
    title: `Risposta entro ${SLA.replyHours} ore lavorative`,
    body: `Esecuzione entro ${SLA.executionHours} ore. ${SLA.days}, ${SLA.hours}. Le urgenze si gestiscono, con un supplemento concordato prima.`,
  },
]

export function Channel() {
  return (
    <section className="border-y border-ink-100 bg-ink-50 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          Come si lavora insieme
        </h2>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {POINTS.map(({ icon: Icon, ...point }) => (
            <div key={point.title}>
              <Icon className="h-7 w-7 text-brand-600" aria-hidden />
              <h3 className="mt-5 text-lg font-bold text-ink-900">
                {point.title}
              </h3>
              <p className="mt-2.5 leading-relaxed text-ink-500">
                {point.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
