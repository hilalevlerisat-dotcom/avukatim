'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  CalendarDays,
  Wallet,
  Bell,
  Calculator,
  Scale,
  Menu,
  X,
  ChevronRight,
  LogOut,
  ShieldCheck,
  RotateCcw,
  PenTool,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { logout, getSession, UserSession, switchActiveUser } from '@/lib/auth'
import { getLawyerProfile, LawyerProfile, PanelPermission, getSystemUsers } from '@/lib/admin-store'

interface NavItem {
  id: PanelPermission
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  badge?: string
}

const ALL_NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',      href: '/',                icon: LayoutDashboard, label: 'Dashboard',       description: 'Genel bakış' },
  { id: 'dosyalar',       href: '/dosyalar',        icon: FolderOpen,      label: 'Dosyalar',        description: 'Tüm davalar' },
  { id: 'muvekkiller',   href: '/muvekkiller',     icon: Users,           label: 'Müvekkiller',    description: 'Müvekkil listesi' },
  { id: 'takvim',        href: '/takvim',          icon: CalendarDays,    label: 'Takvim',          description: 'Duruşma & süreler' },
  { id: 'finans',        href: '/finans',          icon: Wallet,          label: 'Finans',          description: 'Vekalet & ödemeler' },
  { id: 'hatirlaticilar', href: '/hatirlaticilar', icon: Bell,            label: 'Hatırlatıcılar', description: 'Bildirimler' },
  { id: 'hesaplamalar',  href: '/hesaplamalar',    icon: Calculator,      label: 'Hesaplamalar',    description: 'Süre & Faiz hesaplama' },
  { id: 'emsal-kararlar', href: '/emsal-kararlar', icon: Scale,           label: 'Emsal Kararlar',  description: 'AI ile içtihat arama', badge: 'AI' },
  { id: 'dilekce-editoru', href: '/dilekce-editoru', icon: PenTool,       label: 'Dilekçe Editörü', description: 'AI Destekli Şablonlar', badge: 'AI' },
  { id: 'yonetici',      href: '/yonetici',        icon: ShieldCheck,     label: 'Yönetici Ekranı', description: 'Profil & Yetkiler' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [session, setSession] = useState<UserSession | null>(null)
  const [profile, setProfile] = useState<LawyerProfile | null>(null)

  const loadData = () => {
    setSession(getSession())
    setProfile(getLawyerProfile())
  }

  useEffect(() => {
    loadData()
    const handleAuthChange = () => loadData()
    const handleAdminChange = () => loadData()

    window.addEventListener('avukatim-auth-change', handleAuthChange)
    window.addEventListener('avukatim-admin-change', handleAdminChange)
    return () => {
      window.removeEventListener('avukatim-auth-change', handleAuthChange)
      window.removeEventListener('avukatim-admin-change', handleAdminChange)
    }
  }, [])

  // Kullanıcının yetkili olduğu panelleri filtrele
  const allowedPanels = session?.allowed_panels
  const visibleNavItems = ALL_NAV_ITEMS.filter(item => {
    // If no explicit restrictions (admin/root), show all
    if (!allowedPanels || allowedPanels.length === 0) return true
    return allowedPanels.includes(item.id)
  })

  // Yetkili kullanıcı veya admin kontrolü
  const isAssociateUser = session && session.username !== 'admin'
  const hasYoneticiAccess = !session || session.role === 'admin' || session.username === 'admin' || Boolean(session.allowed_panels?.includes('yonetici'))

  // Admin hesabına geri dönme
  const handleReturnToAdmin = () => {
    const users = getSystemUsers()
    const adminUser = users.find(u => u.username === 'admin')
    if (adminUser) {
      switchActiveUser(adminUser)
    } else {
      logout()
    }
  }

  const displayName = session?.name || profile?.full_name || 'Av. Mahmut Sait BOZKURT'
  const displayTitle = session?.title || profile?.title || 'Yönetici Avukat'
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('') || 'AV'

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* ── Brand Banner (Kabartmalı & Çerçeveli Logo & Başlık Bannerı) ── */}
      <div className="p-3.5 border-b border-sidebar-border/60">
        <Link 
          href="/" 
          className="group relative block p-2.5 rounded-2xl bg-gradient-to-b from-slate-900/95 via-slate-950/85 to-slate-950/95 border border-indigo-500/30 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.18)] hover:border-indigo-400/60 hover:shadow-[0_14px_30px_-5px_rgba(99,102,241,0.35),inset_0_1px_1.5px_rgba(255,255,255,0.3)] transition-all duration-300 overflow-hidden"
          title="Avukat Asistanım - Ana Sayfa"
        >
          {/* İç arka plan ışıltısı */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/15 to-blue-600/10 opacity-70 group-hover:opacity-100 transition-opacity pointer-events-none" />

          {/* İnce kabartma / cam parıltı çizgisi */}
          <div className="absolute top-0 left-3 right-3 h-[1px] bg-gradient-to-r from-transparent via-indigo-300/40 to-transparent pointer-events-none" />

          <div className="relative flex items-center justify-center py-1 px-1">
            <Image
              src="/avukat-asistanim-banner-bright.png"
              alt="Avukat Asistanım"
              width={220}
              height={78}
              className="w-full h-auto max-h-12 object-contain filter drop-shadow-[0_2px_10px_rgba(99,102,241,0.45)] group-hover:scale-[1.03] transition-transform duration-300"
              priority
            />
          </div>
        </Link>
      </div>

      {/* ── Associate Preview Notification Banner (Eğer bağlı avukat olarak test ediliyorsa) ── */}
      {isAssociateUser && (
        <div className="mx-3 mt-3 p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <p className="font-semibold text-[11px] truncate">Önizleme: @{session?.username}</p>
            <p className="text-[10px] text-amber-300/80 truncate">Yetkili Paneller Görünüyor</p>
          </div>
          <button
            onClick={handleReturnToAdmin}
            className="p-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 transition-colors shrink-0"
            title="Yönetici (Admin) Hesabına Dön"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Nav Items ── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-sidebar-foreground/30 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2 mt-1">
          Menü
        </p>
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 relative',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary shadow-sm shadow-black/20'
                  : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-sidebar-accent rounded-xl"
                  style={{ zIndex: -1 }}
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                />
              )}
              <item.icon className={cn(
                'w-4.5 h-4.5 flex-shrink-0 transition-colors',
                isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80'
              )} />
              <span className="flex-1 font-medium">{item.label}</span>
              {item.badge && (
                <Badge className="h-4 min-w-4 text-[10px] px-1 bg-red-500/20 text-red-400 border-red-500/30">
                  {item.badge}
                </Badge>
              )}
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-sidebar-primary/60" />}
            </Link>
          )
        })}
      </nav>

      {/* ── User Footer ── */}
      <div className="px-3 pb-4 border-t border-sidebar-border/60 pt-3">
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-sidebar-accent/40 transition-colors">
          <Link href="/yonetici" className="flex items-center gap-2.5 min-w-0 flex-1 group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sidebar-foreground text-xs font-medium truncate group-hover:text-indigo-300 transition-colors">
                {displayName}
              </p>
              <p className="text-sidebar-foreground/40 text-[10px] truncate">
                {displayTitle}
              </p>
            </div>
          </Link>
          <button
            id="sidebar-logout-btn"
            onClick={() => logout()}
            className="p-1.5 rounded-lg text-sidebar-foreground/50 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 ml-1"
            title="Çıkış Yap"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 sidebar-gradient min-h-screen">
        <NavContent />
      </aside>

      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          id="sidebar-toggle"
          onClick={() => setMobileOpen(true)}
          className="w-10 h-10 rounded-xl bg-sidebar flex items-center justify-center shadow-lg border border-sidebar-border/40"
        >
          <Menu className="w-5 h-5 text-sidebar-foreground" />
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            />
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
              className="fixed left-0 top-0 bottom-0 w-64 sidebar-gradient z-50 lg:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-sidebar-accent/60 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-sidebar-foreground" />
              </button>
              <NavContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
