'use client'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print bg-action hover:bg-action-hover text-ink-inverse text-body font-medium px-4 py-2 rounded-control transition-colors flex items-center gap-2"
    >
      🖨 Stampa / Salva PDF
    </button>
  )
}
