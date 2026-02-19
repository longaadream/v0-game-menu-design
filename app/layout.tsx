import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Red VS Blue',
  description: 'Red VS Blue — tactical 1v1 board game',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#1a1a2e',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 5000,
            closeButton: false,
            style: {
              backgroundColor: '#1a1a2e',
              color: '#ffffff',
              border: '1px solid #333344',
              borderRadius: '4px',
              padding: '12px 16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            },
          }}
        />
      </body>
    </html>
  )
}
