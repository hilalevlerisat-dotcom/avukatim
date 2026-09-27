import type { Metadata } from 'next'
import DashboardClient from '@/components/dashboard/DashboardClient'

export const metadata: Metadata = {
  title: 'Dashboard | Avukat Asistanı',
  description: 'Avukat Asistanı genel bakış sayfası.',
}

export default function DashboardPage() {
  return <DashboardClient />
}

