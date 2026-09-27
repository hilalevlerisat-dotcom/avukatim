import type { Metadata } from 'next'
import HatirlaticilarClient from './HatirlaticilarClient'

export const metadata: Metadata = {
  title: 'Hatırlatıcılar',
  description: 'Görevler, vadeler ve önemli tarih hatırlatıcıları.',
}

export default function HatirlaticilarPage() {
  return <HatirlaticilarClient />
}
