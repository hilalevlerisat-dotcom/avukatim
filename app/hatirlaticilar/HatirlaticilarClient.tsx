'use client'

import { useState, useEffect } from 'react'
import { Plus, Bell, Clock, AlertTriangle, CheckCircle2, RefreshCw, X, Wallet, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDateTime, formatDate, daysFromNow, urgencyLabel, formatCurrency } from '@/lib/constants'
import { cn } from '@/lib/utils'
import NewReminderDialog from '@/components/forms/NewReminderDialog'
import type { ReminderStatus } from '@/lib/database.types'
import { 
  getAllCollectionSchedules, 
  markCollectionAsPaid, 
  type CollectionItem 
} from '@/lib/mock-store'
import { createClient } from '@/lib/supabase/client'

type ReminderRow = {
  id: string; title: string; description: string | null
  remind_at: string; status: ReminderStatus
  client_name: string | null; case_title: string | null
  is_recurring: boolean; recurrence_days: number | null
}

const INITIAL: ReminderRow[] = []

export default function HatirlaticilarClient() {
  const [reminders, setReminders] = useState<ReminderRow[]>(INITIAL)
  const [collections, setCollections] = useState<CollectionItem[]>(() => getAllCollectionSchedules())
  const [clients, setClients] = useState<{ id: string; full_name: string }[]>([])
  const [cases, setCases] = useState<{ id: string; title: string }[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filterTab, setFilterTab] = useState<'all' | 'collections' | 'reminders'>('all')

  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    const supabase = createClient()
    const [financesRes, clientsRes, casesRes, remindersRes] = await Promise.all([
      supabase.from('finance_records').select('*').order('transaction_date', { ascending: false }),
      supabase.from('clients').select('id, full_name'),
      supabase.from('cases').select('id, title'),
      supabase.from('reminders').select('*').order('remind_at', { ascending: true })
    ])

    if (financesRes.data) setCollections(getAllCollectionSchedules(financesRes.data as any))
    if (clientsRes.data) setClients(clientsRes.data)
    if (casesRes.data) setCases(casesRes.data)
    if (remindersRes.data) setReminders(remindersRes.data as ReminderRow[])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const pendingCollections = collections.filter(c => !c.is_paid)
  const completedCollections = collections.filter(c => c.is_paid)

  const pendingReminders = reminders.filter(r => r.status === 'pending')
  const others = reminders.filter(r => r.status !== 'pending')

  const totalPending = pendingReminders.length + pendingCollections.length

  const dismiss = async (id: string) => {
    const supabase = createClient()
    await supabase.from('reminders').update({ status: 'dismissed' }).eq('id', id)
    setReminders(prev => prev.map(r => r.id === id ? { ...r, status: 'dismissed' as ReminderStatus } : r))
  }
  const complete = async (id: string) => {
    const supabase = createClient()
    await supabase.from('reminders').update({ status: 'sent' }).eq('id', id)
    setReminders(prev => prev.map(r => r.id === id ? { ...r, status: 'sent' as ReminderStatus } : r))
  }

  const handleCollect = async (financeId: string, installmentId?: string) => {
    // Note: Since collection marking involves complex JSON updates for installments,
    // we should really update the row in Supabase here.
    // For now, to keep the UI responsive, we will just call loadData after a mock update or implement full logic later.
    // Let's implement full logic:
    const supabase = createClient()
    const record = (await supabase.from('finance_records').select('*').eq('id', financeId).single()).data
    if (record) {
      if (installmentId && record.has_installments && record.installments) {
        const updatedInstallments = record.installments.map((i: any) => 
          i.id === installmentId ? { ...i, is_paid: true, paid_date: new Date().toISOString() } : i
        )
        await supabase.from('finance_records').update({ installments: updatedInstallments }).eq('id', financeId)
      } else {
        await supabase.from('finance_records').update({ is_collected: true }).eq('id', financeId)
      }
    }
    loadData()
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Hatırlatıcılar & Tahsilat Takibi</p>
            <p className="text-xs text-muted-foreground">{totalPending} bekleyen işlem</p>
          </div>
        </div>
        <Button id="new-reminder-btn" className="gap-2 h-9" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4" />Hatırlatıcı Ekle
        </Button>
      </div>

      {/* Filtre Sekmeleri */}
      <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-xl w-fit text-xs">
        <button
          onClick={() => setFilterTab('all')}
          className={cn(
            'px-3 py-1.5 rounded-lg font-medium transition-colors',
            filterTab === 'all' ? 'bg-card text-foreground shadow-sm font-semibold' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Tümü ({totalPending})
        </button>
        <button
          onClick={() => setFilterTab('collections')}
          className={cn(
            'px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5',
            filterTab === 'collections' ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-sm font-semibold' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Wallet className="w-3.5 h-3.5" />
          Tahsilat Yapılacak ({pendingCollections.length})
        </button>
        <button
          onClick={() => setFilterTab('reminders')}
          className={cn(
            'px-3 py-1.5 rounded-lg font-medium transition-colors',
            filterTab === 'reminders' ? 'bg-card text-foreground shadow-sm font-semibold' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Diğer Hatırlatıcılar ({pendingReminders.length})
        </button>
      </div>

      {/* Bekleyen Tahsilatlar ve Hatırlatıcılar */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bekleyen İşlemler</p>
        
        {totalPending === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Bekleyen hatırlatıcı veya tahsilat bulunmuyor.
          </div>
        )}

        {/* 1. Tahsilat Yapılacak Kartları */}
        {(filterTab === 'all' || filterTab === 'collections') && pendingCollections.map(c => {
          const days = daysFromNow(c.due_date)
          const urgency = urgencyLabel(days)
          return (
            <div key={c.id} className={cn(
              'flex items-start gap-4 p-4 rounded-2xl border transition-all',
              days <= 1 ? 'border-red-500/30 bg-red-500/5' : days <= 7 ? 'border-amber-500/20 bg-amber-500/5' : 'border-emerald-500/30 bg-emerald-500/5'
            )}>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0 text-emerald-600 dark:text-emerald-400">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                    TAHSİLAT YAPILACAK
                  </span>
                  {c.installment_number && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                      {c.installment_number}/{c.total_installments} Taksit
                    </Badge>
                  )}
                </div>
                <p className="font-semibold text-sm text-foreground">
                  {c.client_name} — <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(c.amount)}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {c.description} {c.case_title ? `• ${c.case_title}` : ''}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Vade Tarihi: <span className="font-medium text-foreground">{formatDate(c.due_date)}</span>
                </p>
              </div>
              <div className="text-right flex-shrink-0 space-y-2">
                <p className={cn('text-xs font-bold', urgency.color)}>{urgency.label}</p>
                <Button
                  id={`collect-${c.id}`}
                  size="sm"
                  className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-sm"
                  onClick={() => handleCollect(c.finance_id, c.installment_id)}
                >
                  <Check className="w-3.5 h-3.5" />
                  Tahsil Edildi
                </Button>
              </div>
            </div>
          )
        })}

        {/* 2. Standart Hatırlatıcılar */}
        {(filterTab === 'all' || filterTab === 'reminders') && pendingReminders.map(r => {
          const days = daysFromNow(r.remind_at)
          const urgency = urgencyLabel(days)
          return (
            <div key={r.id} className={cn(
              'flex items-start gap-4 p-4 rounded-2xl border transition-all',
              days <= 1 ? 'border-red-500/30 bg-red-500/5' : days <= 7 ? 'border-amber-500/20 bg-amber-500/5' : 'border-border/50 bg-card'
            )}>
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                days <= 1 ? 'bg-red-500/15' : days <= 7 ? 'bg-amber-500/15' : 'bg-violet-500/10')}>
                {days <= 1 ? <AlertTriangle className="w-5 h-5 text-red-500" /> : <Bell className={cn('w-5 h-5', days <= 7 ? 'text-amber-500' : 'text-violet-500')} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{r.title}</p>
                {r.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.description}</p>}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {r.client_name && <Badge variant="outline" className="text-[10px] h-4 px-1.5">{r.client_name}</Badge>}
                  {r.case_title && <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{r.case_title}</Badge>}
                  {r.is_recurring && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <RefreshCw className="w-2.5 h-2.5" />Her {r.recurrence_days} günde bir
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0 space-y-1.5">
                <p className={cn('text-xs font-bold', urgency.color)}>{urgency.label}</p>
                <p className="text-[10px] text-muted-foreground">{formatDateTime(r.remind_at)}</p>
                <div className="flex gap-1 justify-end">
                  <Button id={`dismiss-${r.id}`} variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => dismiss(r.id)}>
                    Kapat
                  </Button>
                  <Button id={`complete-${r.id}`} size="sm" className="h-6 text-[10px] px-2" onClick={() => complete(r.id)}>
                    ✓
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Geçmiş */}
      {others.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Geçmiş</p>
          {others.map(r => (
            <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/30 bg-muted/20 opacity-60">
              <CheckCircle2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground line-through truncate">{r.title}</p>
                {r.client_name && <p className="text-[11px] text-muted-foreground">{r.client_name}</p>}
              </div>
              <p className="text-[10px] text-muted-foreground">{formatDateTime(r.remind_at)}</p>
            </div>
          ))}
        </div>
      )}

      <NewReminderDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        clients={clients}
        cases={cases}
        onCreated={async (r) => {
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return

          const client = clients.find(c => c.full_name === r.client_name)
          const cas = cases.find(c => c.title === r.case_title)
          
          const { data } = await supabase.from('reminders').insert({
            user_id: user.id,
            title: r.title,
            description: r.description,
            remind_at: r.remind_at,
            status: r.status,
            client_name: r.client_name,
            case_title: r.case_title,
            is_recurring: r.is_recurring,
            recurrence_days: r.recurrence_days
          }).select().single()

          if (data) {
            setReminders(prev => [data as ReminderRow, ...prev])
          }
        }}
      />
    </div>
  )
}
