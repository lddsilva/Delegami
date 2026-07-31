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
      index="II"
      label="Come funziona"
      title={
        <>
          Tre passaggi. Il primo è l&apos;unico <em>che tocca a te.</em>
        </>
      }
    >
      {/* A real sequence, so it earns its numbers and its connecting rule. */}
      <ol className="relative">
        <span
          aria-hidden
          className="absolute left-[1.15rem] top-3 bottom-3 hidden w-px bg-rule sm:block"
        />
        {STEPS.map((step) => (
          <li
            key={step.n}
            className="relative grid gap-x-7 gap-y-2 pb-10 last:pb-0 sm:grid-cols-[2.3rem_1fr]"
          >
            <span className="tabular relative z-10 hidden h-[2.3rem] w-[2.3rem] items-center justify-center rounded-full border border-rule bg-paper text-[0.8rem] font-semibold text-wine sm:flex">
              {step.n}
            </span>
            <div>
              <h3 className="text-[1.4rem] leading-snug">{step.title}</h3>
              <p className="mt-2 max-w-[54ch] text-ink-soft">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  )
}
