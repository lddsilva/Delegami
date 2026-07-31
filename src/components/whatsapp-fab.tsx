import { MessageCircle } from 'lucide-react'
import { WHATSAPP_GENERIC } from '@/lib/site'

/** Always-reachable contact on mobile, where the header CTA scrolls away. */
export function WhatsappFab() {
  return (
    <a
      href={WHATSAPP_GENERIC}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Scrivici su WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-ink-950 shadow-lg shadow-ink-900/25 transition-colors hover:bg-brand-400 md:hidden"
    >
      <MessageCircle className="h-6 w-6" aria-hidden />
    </a>
  )
}
