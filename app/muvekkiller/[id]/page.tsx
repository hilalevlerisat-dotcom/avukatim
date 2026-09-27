import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import MuvekkilDetayClient from './MuvekkilDetayClient'

export function generateStaticParams() {
  return [{ id: '1' }]
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  return { title: `Müvekkil Detayı — Avukat Asistanı` }
}

export default async function MuvekkilDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) notFound()

  return <MuvekkilDetayClient id={id} />
}
