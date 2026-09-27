'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FolderOpen,
  Users,
  CalendarDays,
  Bell,
  Wallet,
  Clock,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  FileText,
  AlertTriangle,
  Lock,
} from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryBadge, StatusBadge } from '@/components/ui/status-badge'
import { Badge } from '@/components/ui/badge'
import { formatDateTime, daysFromNow, urgencyLabel } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { getSession, UserSession } from '@/lib/auth'
import { PanelPermission, AVAILABLE_PANELS } from '@/lib/admin-store'
import { 
  getStoredCases, 
  getStoredClients, 
  getStoredFinances, 
  calculateFinanceSummary, 
  type StoreCase, 
  type StoreClient, 
  type StoreFinance 
} from '@/lib/mock-store'
import DashboardGreeting from './DashboardGreeting'

const EVENT_ICONS = {
  hearing: { icon: CalendarDays, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Duruşma' },
  deadline: { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Son Gün' },
  reminder: { icon: Bell, color: 'text-violet-500', bg: 'bg-violet-500/10', label: 'Hatırlatıcı' },
}

export default function DashboardClient() {
  const [session, setSession] = useState<UserSession | null>(null)
  const [cases, setCases] = useState<StoreCase[]>([])
  const [clients, setClients] = useState<StoreClient[]>([])
  const [finances, setFinances] = useState<StoreFinance[]>([])
  const [mounted, setMounted] = useState(false)

  const reloadSession = () => {
    setSession(getSession())
  }

  const loadStoreData = () => {
    setCases(getStoredCases())
    setClients(getStoredClients())
    setFinances(getStoredFinances())
  }

  useEffect(() => {
    setMounted(true)
    reloadSession()
    loadStoreData()

    const handleAuth = () => reloadSession()
    const handleAdmin = () => reloadSession()
    const handleStore = () => loadStoreData()

    window.addEventListener('avukatim-auth-change', handleAuth)
    window.addEventListener('avukatim-admin-change', handleAdmin)
    window.addEventListener('avukatim-store-update', handleStore)
    return () => {
      window.removeEventListener('avukatim-auth-change', handleAuth)
      window.removeEventListener('avukatim-admin-change', handleAdmin)
      window.removeEventListener('avukatim-store-update', handleStore)
    }
  }, [])

  // Kullanıcı yetkileri kontrolü
  const allowedPanels = session?.allowed_panels
  const isPanelAllowed = (panel: PanelPermission) => {
    if (!allowedPanels || allowedPanels.length === 0) return true
    return allowedPanels.includes(panel)
  }

  const hasFinance = isPanelAllowed('finans')
  const hasCases = isPanelAllowed('dosyalar')
  const hasClients = isPanelAllowed('muvekkiller')
  const hasCalendar = isPanelAllowed('takvim')
  const hasReminders = isPanelAllowed('hatirlaticilar')
  const hasAdmin = isPanelAllowed('yonetici')

  // Dinamik istatistik hesaplamaları
  const totalCases = cases.length
  const activeCases = cases.filter(c => c.status === 'active').length
  const totalClients = clients.length
  const upcomingHearings = 0
  const pendingReminders = 0
  const { remaining: totalReceivable } = calculateFinanceSummary(finances)

  const recentCases = cases.slice(0, 5)
  const upcomingEvents: any[] = []

  // Kolay erişim kartları konfigürasyonu
  const QUICK_ACCESS_ITEMS = [
    {
      id: 'dosyalar' as PanelPermission,
      title: 'Dava & İcra Dosyaları',
      subtitle: `${activeCases} aktif dava • Evrak inceleme`,
      icon: FolderOpen,
      href: '/dosyalar',
      color: 'from-blue-600 to-indigo-600',
      badge: `${totalCases} Dosya`,
      allowed: hasCases,
    },
    {
      id: 'takvim' as PanelPermission,
      title: 'Duruşma Takvimi',
      subtitle: `${upcomingHearings} duruşma • Keşif & son günler`,
      icon: CalendarDays,
      href: '/takvim',
      color: 'from-amber-500 to-orange-600',
      badge: 'Aktif Takvim',
      allowed: hasCalendar,
    },
    {
      id: 'muvekkiller' as PanelPermission,
      title: 'Müvekkil Rehberi',
      subtitle: `${totalClients} kayıtlı müvekkil iletişimi`,
      icon: Users,
      href: '/muvekkiller',
      color: 'from-purple-600 to-violet-600',
      badge: 'Rehber',
      allowed: hasClients,
    },
    {
      id: 'hatirlaticilar' as PanelPermission,
      title: 'Hatırlatıcılar & Görevler',
      subtitle: `${pendingReminders} bekleyen iş & bildirim`,
      icon: Bell,
      href: '/hatirlaticilar',
      color: 'from-rose-500 to-pink-600',
      badge: 'Bildirimler',
      allowed: hasReminders,
    },
    {
      id: 'finans' as PanelPermission,
      title: 'Finans & Kasa Paneli',
      subtitle: 'Tahsilatlar, vekalet ücreti & taksitler',
      icon: Wallet,
      href: '/finans',
      color: 'from-emerald-600 to-teal-600',
      badge: 'Finans',
      allowed: hasFinance,
    },
    {
      id: 'yonetici' as PanelPermission,
      title: 'Yönetici Ekranı',
      subtitle: 'Büro profili ve kullanıcı hesapları',
      icon: ShieldCheck,
      href: '/yonetici',
      color: 'from-indigo-600 to-violet-700',
      badge: 'Yönetim',
      allowed: hasAdmin,
    },
  ].filter(item => item.allowed)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Karşılama Kartı (Hoş Geldin [Kullanıcı Adı]) ── */}
      <DashboardGreeting upcomingCount={upcomingEvents.length} />

      {/* ── Kullanıcı Yetkilerine Göre Dinamik İstatistik Kartları ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {hasCases && (
          <StatCard
            title="Toplam Dosya"
            value={totalCases}
            icon={FolderOpen}
            gradient="blue"
          />
        )}
        {hasCases && (
          <StatCard
            title="Aktif Dava"
            value={activeCases}
            icon={CheckCircle2}
            gradient="green"
          />
        )}
        {hasClients && (
          <StatCard
            title="Müvekkil"
            value={totalClients}
            icon={Users}
            gradient="purple"
          />
        )}
        {hasCalendar && (
          <StatCard
            title="Duruşma"
            value={upcomingHearings}
            subtitle="30 gün içinde"
            icon={CalendarDays}
            gradient="amber"
          />
        )}

        {/* Finans Yetkisi Varsa: Alacak Tutarı */}
        {hasFinance ? (
          <StatCard
            title="Alacak"
            value={totalReceivable}
            icon={Wallet}
            gradient="red"
            currency
          />
        ) : (
          /* Finans Yetkisi Yoksa: Görevler veya Bildirimler Kartı */
          hasReminders && (
            <StatCard
              title="Bekleyen Görev"
              value={pendingReminders}
              subtitle="Aktif hatırlatıcılar"
              icon={Bell}
              gradient="purple"
            />
          )
        )}
      </div>

      {/* ── Kolay Erişim & Yetkili Paneller Bölümü (Kullanıcı Talebi) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-foreground">
              Kolay Erişim & Yetkili Panelleriniz
            </h3>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {QUICK_ACCESS_ITEMS.length} Modül Aktif
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {QUICK_ACCESS_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.id}
                href={item.href}
                className="group relative flex flex-col justify-between p-4 rounded-2xl bg-card border border-border/70 hover:border-indigo-500/40 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${item.color} flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge variant="outline" className="text-[10px] px-2 h-5 font-medium bg-muted/50 border-border/60">
                    {item.badge}
                  </Badge>
                </div>

                <div className="mt-3">
                  <h4 className="text-sm font-bold text-foreground group-hover:text-indigo-400 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {item.subtitle}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
                  <span>Panele Git</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Ana İçerik Grid (Yaklaşan Etkinlikler & Son Dosyalar) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Yaklaşan Etkinlikler */}
        {hasCalendar && (
          <div className={hasCases ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <Card className="border-border/50">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold">Yaklaşan Etkinlikler</CardTitle>
                <Link href="/takvim" className="text-xs text-primary hover:underline">Tümünü gör →</Link>
              </CardHeader>
              <CardContent className="space-y-2">
                {upcomingEvents.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Yaklaşan duruşma veya süre takibi bulunmuyor.
                  </div>
                ) : (
                  upcomingEvents.map((event, i) => {
                    const cfg = EVENT_ICONS[event.event_type as keyof typeof EVENT_ICONS]
                    const days = daysFromNow(event.event_date)
                    const urgency = urgencyLabel(days)
                    return (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', cfg.bg)}>
                          <cfg.icon className={cn('w-4 h-4', cfg.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-medium text-muted-foreground">{cfg.label}</span>
                            <Badge variant="outline" className="h-4 text-[10px] px-1.5 py-0">{event.client_name}</Badge>
                          </div>
                          <p className="text-sm font-medium text-foreground mt-0.5 truncate">{event.detail}</p>
                          <p className="text-xs text-muted-foreground truncate">{event.case_title}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={cn('text-xs font-semibold', urgency.color)}>{urgency.label}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {formatDateTime(event.event_date).split(',')[0]}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Son Dosyalar */}
        {hasCases && (
          <div className={!hasCalendar ? 'lg:col-span-3' : ''}>
            <Card className="border-border/50">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold">Son Dosyalar</CardTitle>
                <Link href="/dosyalar" className="text-xs text-primary hover:underline">Tümünü gör →</Link>
              </CardHeader>
              <CardContent className="space-y-1">
                {recentCases.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Henüz dosya eklenmedi. Yeni dosya ekleyerek başlayabilirsiniz.
                  </div>
                ) : (
                  recentCases.map((c) => (
                    <Link
                      key={c.id}
                      href={`/dosyalar/${c.id}`}
                      className="flex flex-col gap-1.5 p-2.5 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground leading-snug line-clamp-1">{c.title}</p>
                        <StatusBadge status={c.status} className="flex-shrink-0" />
                      </div>
                      <div className="flex items-center gap-2">
                        <CategoryBadge category={c.category} />
                        <span className="text-[11px] text-muted-foreground">{c.client_name}</span>
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
