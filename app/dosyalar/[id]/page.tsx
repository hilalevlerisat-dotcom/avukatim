import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowLeft, User, Hash, Scale, Calendar } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CategoryBadge, StatusBadge } from '@/components/ui/status-badge'
import { formatDate, formatCurrency } from '@/lib/constants'
import CaseTabs from './CaseTabs'
import EditCaseButton from './EditCaseButton'
import type { DeadlineType, FinanceType } from '@/lib/database.types'

// Mock data — Supabase'den çekilecek
const MOCK_CASE = {
  id: '1',
  title: 'Dosya İnceleme',
  category: 'acik_dava' as const,
  status: 'active' as const,
  case_number: '2026/001',
  court_name: 'Yetkili Mahkeme',
  opposing_party: '—',
  open_date: '2026-01-01',
  description: 'Dosya detayları.',
  priority: 2 as 1 | 2 | 3,
  client: { id: 'c1', full_name: 'Müvekkil', phone: '', email: '' },
}

const MOCK_HEARINGS: Array<{ id: string; hearing_date: string; court_name: string; courtroom: string; judge_name: string; is_completed: boolean; result: string | null }> = []

const MOCK_DEADLINES: Array<{ id: string; title: string; deadline_type: DeadlineType; due_date: string; is_completed: boolean }> = []

const MOCK_FINANCE: Array<{ id: string; finance_type: FinanceType; amount: number; transaction_date: string; description: string }> = []

export function generateStaticParams() {
  return [{ id: '1' }]
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  return { title: `Dosya #${id} — ${MOCK_CASE.title}` }
}

export default async function DosyaDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) notFound()

  const totalRetainer = MOCK_FINANCE.filter(f => f.finance_type === 'retainer').reduce((s, f) => s + f.amount, 0)
  const totalPaid = MOCK_FINANCE.filter(f => f.finance_type === 'payment').reduce((s, f) => s + f.amount, 0)
  const remaining = totalRetainer - totalPaid
  const paidPct = totalRetainer > 0 ? Math.round((totalPaid / totalRetainer) * 100) : 0

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Back + başlık */}
      <div className="flex items-start gap-3">
        <Link href="/dosyalar">
          <Button variant="ghost" size="icon" className="h-8 w-8 mt-0.5">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <CategoryBadge category={MOCK_CASE.category} />
            <StatusBadge status={MOCK_CASE.status} />
            {MOCK_CASE.priority === 1 && (
              <Badge className="h-4 text-[10px] px-1.5 bg-red-500/15 text-red-600 border-red-500/30">Yüksek Öncelik</Badge>
            )}
          </div>
          <h2 className="text-xl font-bold text-foreground">{MOCK_CASE.title}</h2>
          <p className="text-sm text-muted-foreground">{MOCK_CASE.case_number} • {MOCK_CASE.court_name}</p>
        </div>
        <EditCaseButton
          caseData={{
            id: MOCK_CASE.id,
            title: MOCK_CASE.title,
            category: MOCK_CASE.category,
            status: MOCK_CASE.status,
            case_number: MOCK_CASE.case_number,
            court_name: MOCK_CASE.court_name,
            opposing_party: MOCK_CASE.opposing_party,
            open_date: MOCK_CASE.open_date,
            priority: MOCK_CASE.priority,
            description: MOCK_CASE.description,
          }}
        />
      </div>

      {/* Hızlı bilgi kartları */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: User, label: 'Müvekkil', value: MOCK_CASE.client.full_name },
          { icon: Scale, label: 'Karşı Taraf', value: MOCK_CASE.opposing_party || '—' },
          { icon: Hash, label: 'Esas No', value: MOCK_CASE.case_number },
          { icon: Calendar, label: 'Açılış', value: formatDate(MOCK_CASE.open_date) },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/30 border border-border/40">
            <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
              <p className="text-sm font-medium text-foreground">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Finans özeti */}
      <Card className="border-border/50 stat-gradient-blue">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Vekalet Ücreti</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(totalRetainer)}</p>
            </div>
            <div className="text-center border-x border-border/40">
              <p className="text-xs text-muted-foreground">Ödenen</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Kalan</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(remaining)}</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Ödeme İlerlemesi</span><span>%{paidPct}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
                style={{ width: `${paidPct}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interaktif sekmeler (Client Component) */}
      <CaseTabs
        caseId={id}
        caseName={MOCK_CASE.title}
        clientId={MOCK_CASE.client.id}
        initialHearings={MOCK_HEARINGS}
        initialDeadlines={MOCK_DEADLINES}
        initialFinance={MOCK_FINANCE}
        description={MOCK_CASE.description}
        openDate={MOCK_CASE.open_date}
      />
    </div>
  )
}
