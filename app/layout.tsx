import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import AppShell from '@/components/layout/AppShell'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'Avukat Asistanı',
    template: '%s | Avukat Asistanı',
  },
  description: 'Avukatlar için modern dosya, müvekkil ve finans yönetim sistemi.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Avukat Asistanı' },
  keywords: ['avukat', 'dava yönetimi', 'hukuk', 'müvekkil', 'dosya takip'],
}

export const viewport: Viewport = {
  themeColor: '#1e1b4b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex bg-background">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
