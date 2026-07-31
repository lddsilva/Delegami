/**
 * Single source of truth for every business constant on the site.
 * Change a number here and it changes everywhere — never hardcode in a component.
 */

/**
 * WhatsApp business number, digits only, with country code and no "+".
 * Set NEXT_PUBLIC_WHATSAPP_NUMBER in Vercel once the SIM is active —
 * no code change and no redeploy of the source needed.
 */
export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '41790000000'

export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'ciao@delegami.ch'

/** Pre-filled first message. Lowers the barrier: the prospect only presses send. */
const FREE_QUOTE_MESSAGE =
  'Ciao! Ho visto il sito. Vorrei provare il preventivo gratuito.'

const GENERIC_MESSAGE = 'Ciao! Ho visto il sito e vorrei qualche informazione.'

export function whatsappLink(message: string = GENERIC_MESSAGE): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}

export const WHATSAPP_FREE_QUOTE = whatsappLink(FREE_QUOTE_MESSAGE)
export const WHATSAPP_GENERIC = whatsappLink()

export const PRICING = {
  /** Entry anchor shown publicly. Exact tiers stay off the site until the
   *  4-week time tracking confirms the hours per client. */
  from: 490,
  employeeCostLow: 1300,
  employeeCostHigh: 1500,
  fiduciaryRateLow: 90,
  fiduciaryRateHigh: 150,
  minimumCommitmentMonths: 3,
  noticeDays: 30,
  exportDays: 10,
} as const

/** Anonymised reference case. Numbers are real; the client is not named. */
export const CASE_STUDY = {
  revenue: "CHF 73'800",
  months: 4,
  label: 'Ditta individuale, Ticino · un titolare, cantieri di ristrutturazione',
} as const

export const SLA = {
  replyHours: 4,
  executionHours: 48,
  days: 'Lun–Ven',
  hours: '8:00–18:00',
} as const
