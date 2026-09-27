import type { Metadata } from 'next'
import MuvekkillerClient from './MuvekkillerClient'

export const metadata: Metadata = {
  title: 'Müvekkiller',
  description: 'Müvekkil listesi, iletişim bilgileri ve finansal durumları.',
}

export default function MuvekkillerPage() {
  return <MuvekkillerClient />
}
