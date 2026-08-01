/**
 * Single source of truth for every business constant on the site.
 * Change a number here and it changes everywhere — never hardcode in a component.
 */

export const SITE_URL = 'https://delegami.ch'

/**
 * WhatsApp business number, digits only, with country code and no "+".
 * Set NEXT_PUBLIC_WHATSAPP_NUMBER in Vercel once the SIM is active —
 * no code change and no redeploy of the source needed.
 */
export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '41790000000'

export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'ciao@delegami.ch'

/**
 * Legal identity. Swiss law requires the operator to be identifiable on the
 * site (Impressum), and the nFADP requires a named contact for data requests.
 * TODO before launch: replace with the registered details of the firm.
 */
export const LEGAL = {
  entityName: 'Delegami — [ragione sociale da registrare]',
  responsible: '[Nome e cognome del titolare]',
  street: '[Via e numero]',
  postalCode: '[CAP]',
  city: '[Località]',
  country: 'Svizzera',
  ideNumber: '[CHE-000.000.000]',
  lastUpdated: '2026-08-01',
} as const

/**
 * The person the client actually deals with. Deliberately one named human:
 * a micro-builder buys a person, not a brand, and "one interlocutor who knows
 * your company" beats "a team" for this buyer.
 * TODO before launch: real name and one line of real background.
 */
export const FOUNDER = {
  name: '[Nome del titolare]',
  role: 'Fondatore · il tuo interlocutore unico',
  initials: 'DL',
} as const

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
  vatThreshold: 100000,
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

/** Where we work. Named explicitly because local intent is most of the search. */
export const AREAS = [
  'Lugano',
  'Bellinzona',
  'Locarno',
  'Mendrisio',
  'Chiasso',
  'Biasca',
  'Malcantone',
  'Vallemaggia',
] as const

export const NAV_MAIN = [
  { href: '/servizi', label: 'Servizi' },
  { href: '/come-funziona', label: 'Come funziona' },
  { href: '/app', label: "L'app" },
  { href: '/prezzi', label: 'Prezzi' },
  { href: '/chi-siamo', label: 'Chi siamo' },
] as const

export const NAV_LEGAL = [
  { href: '/note-legali', label: 'Note legali' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/condizioni', label: 'Condizioni' },
] as const
