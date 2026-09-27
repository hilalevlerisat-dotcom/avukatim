import type { Metadata } from 'next'
import FinansClient from './FinansClient'

export const metadata: Metadata = {
  title: 'Finans',
  description: 'Vekalet ücretleri, ödemeler ve finansal takip.',
}

export default function FinansPage() {
  return <FinansClient />
}
