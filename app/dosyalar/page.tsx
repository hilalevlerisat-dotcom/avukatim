import type { Metadata } from 'next'
import DosyalarClient from './DosyalarClient'

export const metadata: Metadata = {
  title: 'Dosyalar',
  description: 'Tüm dava, icra, savcılık ve arabuluculuk dosyalarınız.',
}

export default function DosyalarPage() {
  return <DosyalarClient />
}
