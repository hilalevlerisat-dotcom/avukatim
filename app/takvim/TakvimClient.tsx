'use client'

import { useState, useEffect } from 'react'
import { CalendarDays, Clock, ChevronLeft, ChevronRight, Plus, MapPin, User, X, Scale, Wallet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatDateTime, daysFromNow, urgencyLabel, DEADLINE_TYPE_LABELS, formatCurrency } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { getAllCollectionSchedules, type CollectionItem } from '@/lib/mock-store'
import type { DeadlineType } from '@/lib/database.types'
import { createClient } from '@/lib/supabase/client'

// ── Tipler ve Başlangıç Verisi (Canlı Ortam: Boş Başlar) ────────────────────
export type HearingItem = {
  id: string
  hearing_date: string
  case_title: string
  client_name: string
  court_name: string
  courtroom: string
  is_completed: boolean
}

export type DeadlineItem = {
  id: string
  title: string
  deadline_type: DeadlineType
  due_date: string
  case_title: string
  client_name: string
  is_completed: boolean
}

// Mock data removed in favor of Supabase

const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
const WEEK_DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

interface DayInfo {
  date: number
  fullDate: string // YYYY-MM-DD
  currentMonth: boolean
  isToday: boolean
  hearings: HearingItem[]
  deadlines: DeadlineItem[]
  collections: CollectionItem[]
}

function getCalendarDays(
  year: number, 
  month: number, 
  collections: CollectionItem[],
  hearingsList: HearingItem[],
  deadlinesList: DeadlineItem[]
): DayInfo[] {
  const today = new Date()
  const todayISO = today.toISOString().split('T')[0]
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()
  const startOffset = (firstDay + 6) % 7 // Monday-first

  const days: DayInfo[] = []

  // Önceki ay dolgusu
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i
    const mo = month === 0 ? 11 : month - 1
    const yr = month === 0 ? year - 1 : year
    const fullDate = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({ 
      date: d, 
      fullDate, 
      currentMonth: false, 
      isToday: false, 
      hearings: [], 
      deadlines: [],
      collections: collections.filter(c => c.due_date === fullDate)
    })
  }

  // Cari ay
  for (let d = 1; d <= daysInMonth; d++) {
    const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({
      date: d,
      fullDate,
      currentMonth: true,
      isToday: fullDate === todayISO,
      hearings: hearingsList.filter(h => h.hearing_date.startsWith(fullDate)),
      deadlines: deadlinesList.filter(dl => dl.due_date === fullDate),
      collections: collections.filter(c => c.due_date === fullDate),
    })
  }

  // Sonraki ay dolgusu
  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    const mo = month === 11 ? 0 : month + 1
    const yr = month === 11 ? year + 1 : year
    const fullDate = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({ 
      date: d, 
      fullDate, 
      currentMonth: false, 
      isToday: false, 
      hearings: [], 
      deadlines: [],
      collections: collections.filter(c => c.due_date === fullDate)
    })
  }
  return days
}

export default function TakvimClient() {
  // Takvim navigasyonu
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [collections, setCollections] = useState<CollectionItem[]>([])
  const [hearings, setHearings] = useState<HearingItem[]>([])
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([])

  // Seçili gün
  const [selectedDay, setSelectedDay] = useState<DayInfo | null>(null)

  const loadData = async () => {
    const supabase = createClient()
    const [financesRes, hearingsRes, deadlinesRes] = await Promise.all([
      supabase.from('finance_records').select('*'),
      supabase.from('hearings').select('*'),
      supabase.from('deadlines').select('*')
    ])
    if (financesRes.data) setCollections(getAllCollectionSchedules(financesRes.data as any))
    if (hearingsRes.data) setHearings(hearingsRes.data as HearingItem[])
    if (deadlinesRes.data) setDeadlines(deadlinesRes.data as DeadlineItem[])
  }

  useEffect(() => {
    loadData()
  }, [])

  const calDays = getCalendarDays(viewYear, viewMonth, collections, hearings, deadlines)

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
    setSelectedDay(null)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
    setSelectedDay(null)
  }

  const handleDayClick = (day: DayInfo) => {
    if (!day.currentMonth) return
    const hasEvents = day.hearings.length > 0 || day.deadlines.length > 0 || day.collections.length > 0
    if (!hasEvents) {
      setSelectedDay(prev => prev?.fullDate === day.fullDate ? null : null)
      return
    }
    setSelectedDay(prev => prev?.fullDate === day.fullDate ? null : day)
  }

  const upcomingHearings = MOCK_HEARINGS.filter(h => !h.is_completed).sort((a, b) => a.hearing_date.localeCompare(b.hearing_date))
  const upcomingDeadlines = MOCK_DEADLINES.filter(d => !d.is_completed).sort((a, b) => a.due_date.localeCompare(b.due_date))
  const upcomingCollections = collections.filter(c => !c.is_paid).sort((a, b) => a.due_date.localeCompare(b.due_date))

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Takvim ─────────────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  {MONTHS_TR[viewMonth]} {viewYear}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button id="prev-month-btn" variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button id="next-month-btn" variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {/* Hafta başlıkları */}
              <div className="grid grid-cols-7 mb-2">
                {WEEK_DAYS.map(d => (
                  <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-1">{d}</div>
                ))}
              </div>

              {/* Günler */}
              <div className="grid grid-cols-7 gap-px bg-border/20 rounded-xl overflow-hidden">
                {calDays.map((day, i) => {
                  const hasEvents = day.hearings.length > 0 || day.deadlines.length > 0
                  const isSelected = selectedDay?.fullDate === day.fullDate
                  return (
                    <div
                      key={i}
                      id={day.currentMonth && hasEvents ? `cal-day-${day.fullDate}` : undefined}
                      onClick={() => handleDayClick(day)}
                      className={cn(
                        'min-h-[64px] p-1.5 bg-card flex flex-col gap-0.5 transition-all',
                        !day.currentMonth && 'opacity-25',
                        day.isToday && 'bg-primary/5',
                        isSelected && 'bg-primary/10 ring-1 ring-inset ring-primary/40',
                        day.currentMonth && hasEvents && 'cursor-pointer hover:bg-muted/50',
                        day.currentMonth && !hasEvents && 'cursor-default',
                      )}
                    >
                      <span className={cn(
                        'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mx-auto transition-all',
                        day.isToday && 'bg-primary text-primary-foreground font-bold',
                        isSelected && !day.isToday && 'bg-primary/20 text-primary font-bold',
                        !day.isToday && !isSelected && day.currentMonth && 'text-foreground',
                      )}>
                        {day.date}
                      </span>
                      <div className="space-y-0.5">
                        {day.hearings.slice(0, 1).map((_, ei) => (
                          <div key={`h${ei}`} className="h-1.5 rounded-full bg-blue-500" />
                        ))}
                        {day.deadlines.slice(0, 1).map((_, ei) => (
                          <div key={`d${ei}`} className="h-1.5 rounded-full bg-orange-500" />
                        ))}
                        {day.collections.slice(0, 1).map((_, ei) => (
                          <div key={`c${ei}`} className="h-1.5 rounded-full bg-emerald-500" />
                        ))}
                        {(day.hearings.length + day.deadlines.length + day.collections.length) > 2 && (
                          <p className="text-[9px] text-muted-foreground text-center">+{day.hearings.length + day.deadlines.length + day.collections.length - 2}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Lejant */}
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-blue-500 rounded-full" />Duruşma</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-orange-500 rounded-full" />Son Gün</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-emerald-500 rounded-full" />Tahsilat Yapılacak</span>
              </div>

              {/* ── Gün Detay Paneli ──────────────────────────────── */}
              {selectedDay && (
                <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                  {/* Başlık */}
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-primary/20 bg-primary/10">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-primary" />
                      <p className="text-sm font-semibold text-primary">
                        {new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(selectedDay.fullDate + 'T12:00:00'))}
                      </p>
                      <Badge className="h-4 text-[10px] px-1.5 bg-primary/20 text-primary border-0">
                        {selectedDay.hearings.length + selectedDay.deadlines.length + selectedDay.collections.length} etkinlik
                      </Badge>
                    </div>
                    <button
                      id="close-day-detail"
                      onClick={(e) => { e.stopPropagation(); setSelectedDay(null) }}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-3 space-y-2">
                    {/* Duruşmalar */}
                    {selectedDay.hearings.map(h => {
                      const time = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(new Date(h.hearing_date))
                      return (
                        <div key={h.id} className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <CalendarDays className="w-4 h-4 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded-full">DURUŞMA {time}</span>
                            </div>
                            <p className="font-semibold text-sm mt-0.5 truncate">{h.case_title}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1"><User className="w-3 h-3" />{h.client_name}</span>
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{h.court_name}</span>
                              {h.courtroom !== '—' && <span className="flex items-center gap-1"><Scale className="w-3 h-3" />{h.courtroom}</span>}
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Son Günler */}
                    {selectedDay.deadlines.map(d => {
                      const days = daysFromNow(d.due_date)
                      const urgency = urgencyLabel(days)
                      return (
                        <div key={d.id} className="flex items-start gap-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                          <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-4 h-4 text-orange-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded-full">SON GÜN</span>
                              <Badge variant="outline" className="text-[10px] h-4 px-1.5">{DEADLINE_TYPE_LABELS[d.deadline_type]}</Badge>
                              <span className={cn('text-[10px] font-bold ml-auto', urgency.color)}>{urgency.label}</span>
                            </div>
                            <p className="font-semibold text-sm mt-0.5">{d.title}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1"><User className="w-3 h-3" />{d.client_name}</span>
                              <span className="flex items-center gap-1">📁 {d.case_title}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Tahsilat Yapılacak Ödemeler */}
                    {selectedDay.collections.map(c => (
                      <div key={c.id} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-600 dark:text-emerald-400">
                            <Wallet className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded-full">
                                TAHSİLAT YAPILACAK {c.installment_number ? `(${c.installment_number}/${c.total_installments} Taksit)` : ''}
                              </span>
                              <Badge variant={c.is_paid ? 'default' : 'outline'} className={c.is_paid ? 'bg-emerald-600 text-white text-[10px] h-4' : 'text-amber-600 border-amber-500/40 text-[10px] h-4'}>
                                {c.is_paid ? 'Tahsil Edildi' : 'Tahsilat Bekliyor'}
                              </Badge>
                            </div>
                            <p className="font-semibold text-sm mt-0.5 text-foreground">{c.client_name}</p>
                            <p className="text-xs text-muted-foreground">{c.description} {c.case_title ? `• ${c.case_title}` : ''}</p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {formatCurrency(c.amount)}
                          </span>
                          {!c.is_paid ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-[10px] px-2 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/15"
                              onClick={() => {
                                markCollectionAsPaid(c.finance_id, c.installment_id, true)
                                loadData()
                              }}
                            >
                              Tahsil Edildi
                            </Button>
                          ) : (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">✓ Tahsil Edildi</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Yaklaşan Duruşmalar ─────────────────────────────── */}
          <Card className="border-border/50">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-blue-500" />
                Yaklaşan Duruşmalar
              </CardTitle>
              <Button id="add-hearing-top-btn" variant="outline" size="sm" className="text-xs gap-1.5">
                <Plus className="w-3.5 h-3.5" />Duruşma Ekle
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingHearings.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  Yaklaşan duruşma bulunmuyor.
                </div>
              ) : (
                upcomingHearings.map(h => {
                  const days = daysFromNow(h.hearing_date)
                  const urgency = urgencyLabel(days)
                  return (
                    <div
                      key={h.id}
                      id={`hearing-row-${h.id}`}
                      className="flex items-start gap-3 p-3 rounded-xl border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                      onClick={() => {
                        const isoDate = h.hearing_date.split('T')[0]
                        const day = calDays.find(d => d.fullDate === isoDate)
                        if (day) { setSelectedDay(day); setViewYear(parseInt(isoDate.split('-')[0])); setViewMonth(parseInt(isoDate.split('-')[1]) - 1) }
                      }}
                    >
                      <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-[10px] text-blue-500 font-bold leading-none">
                          {new Date(h.hearing_date).getDate()}
                        </span>
                        <span className="text-[8px] text-blue-500/70 uppercase">
                          {new Intl.DateTimeFormat('tr-TR', { month: 'short' }).format(new Date(h.hearing_date))}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{h.case_title}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                          <span>{h.client_name}</span>
                          <span>•</span>
                          <span>{h.court_name}</span>
                          <span>•</span>
                          <span>{h.courtroom}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={cn('text-xs font-semibold', urgency.color)}>{urgency.label}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(new Date(h.hearing_date))}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Süre Takibi Sidebar ─────────────────────────────────── */}
        <div className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                Süre Takibi
              </CardTitle>
              <Button id="add-deadline-top-btn" variant="outline" size="sm" className="text-xs h-7">
                <Plus className="w-3 h-3" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingDeadlines.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  Takip edilen süre bulunmuyor.
                </div>
              ) : (
                upcomingDeadlines.map(d => {
                  const days = daysFromNow(d.due_date)
                  const urgency = urgencyLabel(days)
                  return (
                    <div
                      key={d.id}
                      id={`deadline-row-${d.id}`}
                      className="p-3 rounded-xl border border-border/40 bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => {
                        const day = calDays.find(cd => cd.fullDate === d.due_date)
                        if (day) { setSelectedDay(day); setViewYear(parseInt(d.due_date.split('-')[0])); setViewMonth(parseInt(d.due_date.split('-')[1]) - 1) }
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-foreground leading-tight">{d.title}</p>
                        <span className={cn('text-[10px] font-bold flex-shrink-0 mt-0.5', urgency.color)}>{urgency.label}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">{d.client_name} • {d.case_title}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5">{DEADLINE_TYPE_LABELS[d.deadline_type]}</Badge>
                        <span className="text-[10px] text-muted-foreground">{formatDate(d.due_date)}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* ── Yaklaşan Tahsilatlar Sidebar Kartı ───────────────────── */}
          <Card className="border-border/50">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-500" />
                Yaklaşan Tahsilatlar
              </CardTitle>
              <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600">
                {upcomingCollections.length} Bekleyen
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingCollections.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Bekleyen tahsilat bulunmuyor.</p>
              ) : (
                upcomingCollections.slice(0, 5).map(c => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-xl border border-border/40 bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => {
                      const day = calDays.find(cd => cd.fullDate === c.due_date)
                      if (day) { setSelectedDay(day); setViewYear(parseInt(c.due_date.split('-')[0])); setViewMonth(parseInt(c.due_date.split('-')[1]) - 1) }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-semibold text-foreground truncate">{c.client_name}</p>
                          {c.installment_number && (
                            <span className="text-[10px] text-emerald-600 font-medium">({c.installment_number}/{c.total_installments} Taksit)</span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{c.description}</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0">
                        {formatCurrency(c.amount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/30">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        {formatDate(c.due_date)}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 text-[10px] px-1.5 text-emerald-600 hover:bg-emerald-500/10"
                        onClick={(e) => {
                          e.stopPropagation()
                          markCollectionAsPaid(c.finance_id, c.installment_id, true)
                          loadData()
                        }}
                      >
                        Tahsil Et
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
