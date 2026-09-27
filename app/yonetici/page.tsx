'use client'

import { useState, useEffect } from 'react'
import {
  ShieldCheck,
  Building2,
  Users,
  KeyRound,
  Scale,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getLawyerProfile, getSystemUsers, LawyerProfile, SystemUser } from '@/lib/admin-store'
import UserProfileTab from '@/components/yonetici/UserProfileTab'
import UsersManagementTab from '@/components/yonetici/UsersManagementTab'

export default function YoneticiPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'users'>('profile')
  const [profile, setProfile] = useState<LawyerProfile | null>(null)
  const [users, setUsers] = useState<SystemUser[]>([])

  const loadData = () => {
    setProfile(getLawyerProfile())
    setUsers(getSystemUsers())
  }

  useEffect(() => {
    loadData()
    const handleAdminChange = () => loadData()
    window.addEventListener('avukatim-admin-change', handleAdminChange)
    return () => window.removeEventListener('avukatim-admin-change', handleAdminChange)
  }, [])

  const activeUsersCount = users.filter(u => u.is_active).length

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* ── Başlık ve Genel Bakış Bannerı ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-indigo-950/60 shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Yönetici Ekranı
              </h1>
              <Badge className="bg-indigo-500/30 text-indigo-300 border-indigo-500/40 text-[11px] h-5">
                Yönetim & Yetkilendirme
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Büro kimliği ve avukat iletişim bilgilerini düzenleyin; altınızda çalışan avukatlar için kullanıcı hesapları ve panel erişim yetkilerini yapılandırın.
            </p>
          </div>
        </div>

        {/* Hızlı Özet Metrikleri */}
        <div className="flex items-center gap-3 shrink-0 relative z-10 self-start md:self-center">
          <div className="px-4 py-2.5 rounded-xl bg-slate-950/60 border border-indigo-500/25 text-right backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Büro Hesabı</p>
            <p className="text-sm font-bold text-white truncate max-w-[160px]">
              {profile?.full_name || 'Avukat'}
            </p>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-slate-950/60 border border-indigo-500/25 text-right backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Kullanıcılar</p>
            <p className="text-sm font-bold text-emerald-400">
              {activeUsersCount} Aktif / {users.length} Toplam
            </p>
          </div>
        </div>
      </div>

      {/* ── Sekme Gezintisi (Tab Switcher) ── */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-card border border-border/80 shadow-sm w-fit">
        <button
          id="tab-profile-btn"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'profile'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Avukat & Büro Profili</span>
        </button>

        <button
          id="tab-users-btn"
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'users'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Kullanıcılar & Panel Yetkileri</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
            activeTab === 'users' 
              ? 'bg-white/20 text-white' 
              : 'bg-indigo-500/15 text-indigo-400'
          }`}>
            {users.length}
          </span>
        </button>
      </div>

      {/* ── Aktif Sekme İçeriği ── */}
      <div className="animate-fade-in">
        {activeTab === 'profile' ? (
          <UserProfileTab />
        ) : (
          <UsersManagementTab />
        )}
      </div>
    </div>
  )
}
