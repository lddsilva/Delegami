import { WhatsappGlyph } from '@/components/glyphs'
import { WHATSAPP_GENERIC } from '@/lib/site'

/** Always-reachable contact on mobile, where the header CTA scrolls away. */
export function WhatsappFab() {
  return (
    <a
      href={WHATSAPP_GENERIC}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2.5 rounded-full bg-mint px-5 py-3.5 text-[0.9rem] font-bold text-navy shadow-[0_8px_28px_rgba(20,58,86,0.28)] lg:hidden"
    >
      <WhatsappGlyph className="h-[1.1rem] w-[1.1rem]" />
      Scrivici
    </a>
  )
}
