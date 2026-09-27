import type { Metadata } from 'next'
import TakvimClient from './TakvimClient'

export const metadata: Metadata = {
  title: 'Takvim',
  description: 'Duruşmalar, dilekçe süreleri ve önemli tarihler.',
}

export default function TakvimPage() {
  return <TakvimClient />
}
