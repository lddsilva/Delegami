import type { MetadataRoute } from 'next'

/**
 * Makes the app installable to the home screen.
 *
 * It is used daily from a phone on a building site — capturing scontrini,
 * checking an opera, filling a rapportino — and until now it could only be
 * reached through a browser tab. `standalone` drops the address bar, which
 * also gives back the ~60px the URL bar permanently occupies.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Delegami',
    short_name: 'Zanetti',
    description: 'Gestione cantieri e preventivi — Zanetti Soluzioni Edili',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#111827',
    theme_color: '#111827',
    lang: 'it',
    icons: [
      { src: '/logo.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/logo.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
