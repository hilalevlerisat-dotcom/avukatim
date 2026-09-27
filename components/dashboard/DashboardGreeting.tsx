'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Scale, 
  ShieldCheck, 
  Calendar, 
  Sparkles, 
  FolderPlus, 
  ArrowRight,
  Clock
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getSession } from '@/lib/auth'
import { getLawyerProfile, LawyerProfile } from '@/lib/admin-store'

interface DashboardGreetingProps {
  upcomingCount?: number
}

export default function DashboardGreeting({ upcomingCount = 5 }: DashboardGreetingProps) {
  const [userName, setUserName] = useState<string>('Av. Mahmut Sait BOZKURT')
  const [officeName, setOfficeName] = useState<string>('Bozkurt Hukuk & Danışmanlık Bürosu')
  const [userTitle, setUserTitle] = useState<string>('Yönetici & Kurucu Avukat')
  const [barInfo, setBarInfo] = useState<string>('Ankara 1 No\'lu Barosu (Sicil: #33012)')
  const [phone, setPhone] = useState<string>('+90 (553) 589 01 93')
  const [isAdmin, setIsAdmin] = useState<boolean>(true)
  const [mounted, setMounted] = useState(false)

  const updateGreetingData = () => {
    const session = getSession()
    const profile = getLawyerProfile()

    const name = session?.name || profile?.full_name || 'Av. Mahmut Sait BOZKURT'
    setUserName(name)
    setOfficeName(profile?.office_name || 'Bozkurt Hukuk & Danışmanlık Bürosu')
    setUserTitle(session?.title || profile?.title || 'Yönetici & Kurucu Avukat')
    setIsAdmin(!session || session.role === 'admin' || session.username === 'admin')
    
    if (profile?.bar_association) {
      setBarInfo(`${profile.bar_association}${profile.bar_number ? ` (Sicil: #${profile.bar_number})` : ''}`)
    }
    if (profile?.phone) {
      setPhone(profile.phone)
    }
  }

  useEffect(() => {
    setMounted(true)
    updateGreetingData()

    const handleAuth = () => updateGreetingData()
    const handleAdmin = () => updateGreetingData()

    window.addEventListener('avukatim-auth-change', handleAuth)
    window.addEventListener('avukatim-admin-change', handleAdmin)
    return () => {
      window.removeEventListener('avukatim-auth-change', handleAuth)
      window.removeEventListener('avukatim-admin-change', handleAdmin)
    }
  }, [])

  const dateString = mounted
    ? new Intl.DateTimeFormat('tr-TR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date())
    : '26 Eylül 2026 Cumartesi'

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-950/70 via-slate-900/90 to-slate-950 border border-indigo-500/25 shadow-xl relative overflow-hidden text-white">
      {/* ── Ambient Background Lighting Effects ── */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-violet-600/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
        {/* ── Sol Bölüm: Terazi Rozeti ve Kullanıcı Karşılama ── */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 p-0.5 shadow-lg shadow-indigo-950 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950/60 rounded-[14px] flex items-center justify-center text-white backdrop-blur-sm">
                <Scale className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-300" />
              </div>
            </div>
            <span
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center shadow-sm"
              title="Sistem Çevrimiçi"
            />
          </div>

          <div className="min-w-0 space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Hoş Geldin, {userName}
            </h2>

            <p className="text-xs sm:text-sm text-indigo-200/90 font-medium">
              {officeName} • <span className="text-slate-300">{userTitle}</span>
            </p>

            <div className="flex items-center gap-1.5 text-xs text-slate-300 pt-0.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>{dateString}</span>
            </div>
          </div>
        </div>

        {/* ── Sağ Bölüm: Havalı Hızlı Kısayol Butonları ── */}
        <div className="flex items-center gap-2.5 self-start lg:self-center shrink-0 flex-wrap">
          {isAdmin ? (
            <>
              <Link
                href="/takvim"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-indigo-500/30 text-xs sm:text-sm font-semibold text-indigo-200 hover:text-white transition-all shadow-sm group"
              >
                <Calendar className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span>Ajanda & Duruşmalar</span>
              </Link>

              <Link
                href="/yonetici"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-indigo-950 hover:shadow-indigo-900/60 group"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-200 group-hover:scale-110 transition-transform" />
                <span>Yönetici Ekranı</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dosyalar"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-indigo-500/30 text-xs sm:text-sm font-semibold text-indigo-200 hover:text-white transition-all shadow-sm group"
              >
                <FolderPlus className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span>Dava Dosyalarım</span>
              </Link>

              <Link
                href="/takvim"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-indigo-950 hover:shadow-indigo-900/60 group"
              >
                <Calendar className="w-4 h-4 text-indigo-200 group-hover:scale-110 transition-transform" />
                <span>Duruşma Takvimi</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
