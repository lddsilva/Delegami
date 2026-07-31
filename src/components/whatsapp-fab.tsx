import { WhatsappGlyph } from '@/components/glyphs'
import { WHATSAPP_GENERIC } from '@/lib/site'

/** Always-reachable contact on mobile, where the header CTA scrolls away. */
export function WhatsappFab() {
  return (
    <a
      href={WHATSAPP_GENERIC}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2.5 rounded-full bg-wine px-5 py-3.5 text-[0.9rem] font-medium text-paper shadow-[0_6px_24px_rgba(34,32,29,0.22)] md:hidden"
    >
      <WhatsappGlyph className="h-[1.1rem] w-[1.1rem]" />
      Scrivici
    </a>
  )
}
