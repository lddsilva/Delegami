import type { Metadata, Viewport } from 'next'
import './globals.css'

const title = 'Delegami — Tu costruisci. Delegami il resto.'
const description =
  'Ufficio amministrativo per piccole imprese edili in Ticino. Preventivi, fatture, spese, ore degli operai e report per il fiduciario: li facciamo noi. Tu mandi una foto o un vocale su WhatsApp.'

export const metadata: Metadata = {
  metadataBase: new URL('https://delegami.ch'),
  title: {
    default: title,
    template: '%s · Delegami',
  },
  description,
  keywords: [
    'amministrazione imprese edili',
    'preventivi edilizia Ticino',
    'back office costruzioni',
    'gestione fatture impresa edile',
    'segretariato esterno Ticino',
  ],
  openGraph: {
    type: 'website',
    locale: 'it_CH',
    url: 'https://delegami.ch',
    siteName: 'Delegami',
    title,
    description,
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#0d1728',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
