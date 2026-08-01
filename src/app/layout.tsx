import type { Metadata, Viewport } from 'next'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { WhatsappFab } from '@/components/whatsapp-fab'
import { JsonLd, organizationJsonLd } from '@/lib/seo'
import { SITE_URL } from '@/lib/site'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Delegami — l’ufficio della tua impresa edile, fatto da noi',
    template: '%s · Delegami',
  },
  description:
    'Preventivi, fatture, spese, ore degli operai e report per il fiduciario: li facciamo noi. Tu mandi una foto o un vocale su WhatsApp. Per piccole imprese edili in Ticino.',
  applicationName: 'Delegami',
  authors: [{ name: 'Delegami' }],
  openGraph: {
    type: 'website',
    locale: 'it_CH',
    siteName: 'Delegami',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

export const viewport: Viewport = {
  themeColor: '#143A56',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it-CH">
      <body className="flex min-h-screen flex-col antialiased">
        <a
          href="#contenuto"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-navy focus:px-5 focus:py-3 focus:text-white"
        >
          Vai al contenuto
        </a>
        <Header />
        <main id="contenuto" className="flex-1">
          {children}
        </main>
        <Footer />
        <WhatsappFab />
        <JsonLd data={organizationJsonLd()} />
      </body>
    </html>
  )
}
