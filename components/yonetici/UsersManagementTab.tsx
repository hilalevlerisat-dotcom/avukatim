'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  KeyRound,
  ShieldCheck,
  Shield,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  LogIn,
  RotateCcw,
  Sparkles,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  SystemUser,
  getSystemUsers,
  saveSystemUser,
  deleteSystemUser,
  toggleUserStatus,
  AVAILABLE_PANELS,
  PanelPermission,
} from '@/lib/admin-store'
import { switchActiveUser, getSession, UserSession } from '@/lib/auth'
import UserEditDialog from './UserEditDialog'

export default function UsersManagementTab() {
  const [users, setUsers] = useState<SystemUser[]>([])
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null)
  const [currentSession, setCurrentSession] = useState<UserSession | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const reload = () => {
    setUsers(getSystemUsers())
    setCurrentSession(getSession())
  }

  useEffect(() => {
    reload()
    const handleAdminChange = () => reload()
    const handleAuthChange = () => reload()

    window.addEventListener('avukatim-admin-change', handleAdminChange)
    window.addEventListener('avukatim-auth-change', handleAuthChange)
    return () => {
      window.removeEventListener('avukatim-admin-change', handleAdminChange)
      window.removeEventListener('avukatim-auth-change', handleAuthChange)
    }
  }, [])

  const showToast = (msg: string) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(null), 4000)
  }

  const handleOpenAdd = () => {
    setEditingUser(null)
    setDialogOpen(true)
  }

  const handleOpenEdit = (user: SystemUser) => {
    setEditingUser(user)
    setDialogOpen(true)
  }

  const handleSaveUser = (user: SystemUser) => {
    saveSystemUser(user)
    reload()
    showToast(`"${user.name}" kullanıcısı başarıyla kaydedildi.`)
  }

  const handleDelete = (id: string, name: string) => {
    if (confirm(`"${name}" adlı kullanıcıyı silmek istediğinize emin misiniz?`)) {
      deleteSystemUser(id)
      reload()
      showToast(`"${name}" kullanıcısı silindi.`)
    }
  }

  const handleToggleStatus = (id: string, name: string) => {
    toggleUserStatus(id)
    reload()
    showToast(`"${name}" kullanıcısının durumu güncellendi.`)
  }

  const handleSwitchUser = (user: SystemUser) => {
    switchActiveUser(user)
    reload()
    showToast(`"${user.name}" kullanıcısına geçiş yapıldı. Artık bu kullanıcının yetkileriyle görüntülüyorsunuz.`)
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.title.toLowerCase().includes(search.toLowerCase())
  )

  const panelNames: Record<PanelPermission, string> = {
    dashboard: 'Dashboard',
    dosyalar: 'Dosyalar',
    muvekkiller: 'Müvekkiller',
    takvim: 'Takvim',
    finans: 'Finans',
    hatirlaticilar: 'Hatırlatıcılar',
    yonetici: 'Yönetici Ekranı',
  }

  return (
    <div className="space-y-6">
      {/* ── Üst Bilgilendirme ve İşlem Barı ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-card border border-border/70 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Büro Kullanıcıları & Yetki Yönetimi
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Toplam {users.length} kayıtlı kullanıcı • Panel bazlı erişim denetimi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Kullanıcı veya rol ara…"
              className="pl-9 h-9 text-xs"
            />
          </div>

          <Button
            onClick={handleOpenAdd}
            className="gap-2 h-9 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shrink-0 shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Kullanıcı Ekle</span>
          </Button>
        </div>
      </div>

      {feedback && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedback}</span>
        </div>
      )}

      {/* ── Kullanıcı Kartları / Listesi ── */}
      <div className="grid grid-cols-1 gap-4">
        {filteredUsers.map(user => {
          const isCurrentUser = currentSession?.username === user.username
          const isRootAdmin = user.username === 'admin'
          const hasFinance = user.allowed_panels?.includes('finans')
          const initials = user.name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map(p => p[0].toUpperCase())
            .join('') || 'U'

          return (
            <div
              key={user.id}
              className={`p-5 rounded-2xl border transition-all ${
                isCurrentUser
                  ? 'bg-indigo-950/20 border-indigo-500/40 shadow-md ring-1 ring-indigo-500/20'
                  : 'bg-card border-border/70 hover:border-border'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Sol Kısım: Avatar & Bilgiler */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-base shadow shrink-0">
                    {initials}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-foreground">
                        {user.name}
                      </h4>
                      <Badge variant="outline" className="text-[11px] font-mono font-medium px-2 h-5 bg-muted/60 text-muted-foreground border-border/60">
                        @{user.username}
                      </Badge>
                      {isRootAdmin && (
                        <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 text-[10px] h-5">
                          Sistem Yöneticisi
                        </Badge>
                      )}
                      {user.is_active ? (
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] h-5 gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Aktif
                        </Badge>
                      ) : (
                        <Badge className="bg-muted text-muted-foreground border-border/60 text-[10px] h-5 gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                          Pasif
                        </Badge>
                      )}
                      {isCurrentUser && (
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] h-5">
                          Şu Anki Oturum
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/80">{user.title}</span>
                      {user.email && ` • ${user.email}`}
                      {user.phone && ` • ${user.phone}`}
                    </p>

                    <div className="flex items-center gap-2 pt-0.5 text-xs text-muted-foreground">
                      <span className="text-[11px] font-mono bg-muted/40 px-2 py-0.5 rounded border border-border/50">
                        🔑 Şifre: <span className="font-semibold text-foreground">{user.password}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sağ Kısım: Hızlı Aksiyon Butonları */}
                <div className="flex items-center gap-2 self-end lg:self-center flex-wrap">
                  {!isCurrentUser && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSwitchUser(user)}
                      className="gap-1.5 text-xs h-8 border-indigo-500/30 hover:bg-indigo-500/10 text-indigo-400 font-medium"
                      title="Bu kullanıcının yetkileriyle sisteme bak"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Bu Kullanıcı Olarak Dene</span>
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(user)}
                    className="gap-1.5 text-xs h-8"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Yetkileri Düzenle</span>
                  </Button>

                  {!isRootAdmin && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(user.id, user.name)}
                        className={`text-xs h-8 ${user.is_active ? 'text-amber-500 hover:bg-amber-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'}`}
                      >
                        {user.is_active ? 'Dondur' : 'Aktifleştir'}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(user.id, user.name)}
                        className="text-destructive hover:bg-destructive/10 h-8 w-8"
                        title="Kullanıcıyı Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* ── Alt Bar: Panel Erişim İzinleri ── */}
              <div className="mt-4 pt-3 border-t border-border/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Erişebildiği Paneller ({user.allowed_panels?.length || 0}):</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {user.allowed_panels && user.allowed_panels.length > 0 ? (
                      user.allowed_panels.map(p => (
                        <Badge
                          key={p}
                          variant="secondary"
                          className={`text-[10px] h-5 px-2 font-medium ${
                            p === 'finans'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : p === 'yonetici'
                              ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                              : 'bg-muted/80 text-foreground/80'
                          }`}
                        >
                          {panelNames[p] || p}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-destructive">Hiçbir panele yetkisi yok</span>
                    )}

                    {!hasFinance && (
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-dashed border-red-500/40 text-red-400/90 bg-red-500/5">
                        🚫 Finans Kapalı
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {filteredUsers.length === 0 && (
          <div className="p-8 text-center rounded-2xl border border-dashed border-border/80 text-muted-foreground text-sm">
            Arama kriterine uygun kullanıcı bulunamadı.
          </div>
        )}
      </div>

      {/* Kullanıcı Ekleme / Düzenleme Modalı */}
      <UserEditDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        user={editingUser}
        onSave={handleSaveUser}
      />
    </div>
  )
}
