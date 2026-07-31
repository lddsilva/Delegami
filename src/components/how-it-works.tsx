import { Send, PenLine, LineChart } from 'lucide-react'

const STEPS = [
  {
    icon: Send,
    step: '01',
    title: 'Mandi',
    body: 'Foto, vocale, misure scritte dietro uno scontrino. Su WhatsApp, quando ti fa comodo — anche alle sei del mattino. Nessun modulo da compilare.',
  },
  {
    icon: PenLine,
    step: '02',
    title: 'Facciamo noi',
    body: 'Preventivo in italiano professionale, fattura con QR svizzero, spese registrate e collegate al cantiere giusto, ore degli operai controllate.',
  },
  {
    icon: LineChart,
    step: '03',
    title: 'Controlli',
    body: 'Tutto nella tua app: quanto hai fatturato, chi ti deve, quanto ti è costato ogni cantiere. E ogni mese un report pronto per il fiduciario.',
  },
]

export function HowItWorks() {
  return (
    <section id="come-funziona" className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <h2 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          Come funziona
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-ink-500">
          Tre passaggi. Il primo è l&apos;unico che tocca a te.
        </p>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, ...step }) => (
            <div key={step.step}>
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ink-900 text-brand-400">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <span className="text-sm font-bold tracking-[0.18em] text-ink-300">
                  {step.step}
                </span>
              </div>
              <h3 className="mt-6 text-xl font-bold text-ink-900">
                {step.title}
              </h3>
              <p className="mt-3 leading-relaxed text-ink-500">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
