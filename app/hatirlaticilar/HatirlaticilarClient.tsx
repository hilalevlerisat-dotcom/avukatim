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
  getStoredClients, 
  getStoredCases, 
  type CollectionItem 
} from '@/lib/mock-store'

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

  const loadData = () => {
    setCollections(getAllCollectionSchedules())
    setClients(getStoredClients().map(c => ({ id: c.id, full_name: c.full_name })))
    setCases(getStoredCases().map(c => ({ id: c.id, title: c.title })))
  }

  useEffect(() => {
    loadData()
    const handleUpdate = () => loadData()
    window.addEventListener('avukatim-store-update', handleUpdate)
    return () => window.removeEventListener('avukatim-store-update', handleUpdate)
  }, [])

  const pendingCollections = collections.filter(c => !c.is_paid)
  const completedCollections = collections.filter(c => c.is_paid)

  const pendingReminders = reminders.filter(r => r.status === 'pending')
  const others = reminders.filter(r => r.status !== 'pending')

  const totalPending = pendingReminders.length + pendingCollections.length

  const dismiss = (id: string) => setReminders(prev =>
    prev.map(r => r.id === id ? { ...r, status: 'dismissed' as ReminderStatus } : r)
  )
  const complete = (id: string) => setReminders(prev =>
    prev.map(r => r.id === id ? { ...r, status: 'sent' as ReminderStatus } : r)
  )

  const handleCollect = (financeId: string, installmentId?: string) => {
    markCollectionAsPaid(financeId, installmentId, true)
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
        onCreated={r => setReminders(prev => [r, ...prev])}
      />
    </div>
  )
}
