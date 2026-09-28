'use client'

import { use, useEffect, useState } from 'react'
import { ArrowLeft, User, Scale, Hash, Calendar, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import CaseTabs from './CaseTabs'
import { CategoryBadge, StatusBadge } from '@/components/ui/status-badge'
import { formatDate, formatCurrency } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import EditCaseButton from './EditCaseButton'

export default function DosyaDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params)
  const id = unwrappedParams.id
  const router = useRouter()
  const [caseData, setCaseData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCase = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('cases').select('*, clients(id, full_name, phone, email)').eq('id', id).single()
      if (data) setCaseData(data)
      setLoading(false)
    }
    fetchCase()
  }, [id])

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Yükleniyor...</div>
  if (!caseData) return <div className="p-8 text-center text-red-500">Dosya bulunamadı.</div>

  const client = caseData.clients as any
  const totalRetainer = 0
  const totalPaid = 0
  const remaining = 0
  const paidPct = 0

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
            <CategoryBadge category={caseData.category} />
            <StatusBadge status={caseData.status} />
            {caseData.priority === 1 && (
              <Badge className="h-4 text-[10px] px-1.5 bg-red-500/15 text-red-600 border-red-500/30">Yüksek Öncelik</Badge>
            )}
          </div>
          <h2 className="text-xl font-bold text-foreground">{caseData.title}</h2>
          <p className="text-sm text-muted-foreground">{caseData.case_number || 'Esas no yok'} • {caseData.court_name || 'Mahkeme girilmemiş'}</p>
        </div>
        <EditCaseButton
          caseData={{
            id: caseData.id,
            title: caseData.title,
            category: caseData.category,
            status: caseData.status,
            case_number: caseData.case_number || '',
            court_name: caseData.court_name || '',
            opposing_party: caseData.opposing_party || '',
            open_date: caseData.open_date || '',
            priority: caseData.priority,
            description: caseData.description || '',
          }}
        />
      </div>

      {caseData.status === 'closed' && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400">İade Alınabilir Gider Avansı Kontrolü</h4>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">Bu dosya kapandığı için UYAP üzerinde veya veznede atıl kalmış gider avanslarınız bulunabilir. Lütfen UYAP üzerinden veya MasrafX excel dökümünden iadesi talep edilebilir avanslarınızı kontrol ediniz.</p>
          </div>
        </div>
      )}

      {/* Hızlı bilgi kartları */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: User, label: 'Müvekkil', value: client?.full_name || '—' },
          { icon: Scale, label: 'Karşı Taraf', value: caseData.opposing_party || '—' },
          { icon: Hash, label: 'Esas No', value: caseData.case_number || '—' },
          { icon: Calendar, label: 'Açılış', value: caseData.open_date ? formatDate(caseData.open_date) : '—' },
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

      <CaseTabs
        caseId={id}
        caseName={caseData.title}
        clientId={client?.id}
        initialHearings={[]}
        initialDeadlines={[]}
        initialFinance={[]}
        description={caseData.description || ''}
        openDate={caseData.open_date || ''}
      />
    </div>
  )
}
