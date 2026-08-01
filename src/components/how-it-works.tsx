import { Section } from '@/components/section'

const STEPS = [
  {
    n: '01',
    title: 'Mandi',
    body: 'Foto, vocale, misure scritte dietro uno scontrino. Su WhatsApp, quando ti fa comodo — anche alle sei del mattino. Nessun modulo da compilare.',
  },
  {
    n: '02',
    title: 'Facciamo noi',
    body: 'Preventivo in italiano professionale, fattura con QR svizzero, spese registrate e collegate al cantiere giusto, ore degli operai controllate.',
  },
  {
    n: '03',
    title: 'Controlli',
    body: 'Tutto nella tua app: quanto hai fatturato, chi ti deve, quanto ti è costato ogni cantiere. E ogni mese un report pronto per il fiduciario.',
  },
]

export function HowItWorks() {
  return (
    <Section
      id="come-funziona"
      tone="off"
      eyebrow="Come funziona"
      title={
        <>
          Tre passaggi. Il primo è l&apos;unico{' '}
          <span className="text-mint-deep">che tocca a te.</span>
        </>
      }
    >
      <ol className="grid gap-6 md:grid-cols-3">
        {STEPS.map((step) => (
          <li
            key={step.n}
            className="rounded-2xl border border-line bg-white p-8"
          >
            <span className="tabular inline-flex h-11 w-11 items-center justify-center rounded-full bg-mint text-[0.9rem] font-extrabold text-navy">
              {step.n}
            </span>
            <h3 className="mt-6 text-[1.35rem]">{step.title}</h3>
            <p className="mt-3 text-slate-ink">{step.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  )
}
