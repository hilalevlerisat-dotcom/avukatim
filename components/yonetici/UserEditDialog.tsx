'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  UserPlus,
  Edit,
  KeyRound,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  Lock,
  LayoutDashboard,
  FolderOpen,
  Users,
  CalendarDays,
  Wallet,
  Bell,
  Calculator,
  ShieldCheck,
  Check,
  Sparkles,
} from 'lucide-react'
import {
  SystemUser,
  PanelPermission,
  AVAILABLE_PANELS,
} from '@/lib/admin-store'

interface UserEditDialogProps {
  open: boolean
  onClose: () => void
  user: SystemUser | null // null means new user
  onSave: (user: SystemUser) => void
}

const PANEL_ICONS: Record<PanelPermission, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  dosyalar: FolderOpen,
  muvekkiller: Users,
  takvim: CalendarDays,
  finans: Wallet,
  hatirlaticilar: Bell,
  hesaplamalar: Calculator,
  yonetici: ShieldCheck,
}

export default function UserEditDialog({
  open,
  onClose,
  user,
  onSave,
}: UserEditDialogProps) {
  const isEditing = !!user

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [title, setTitle] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'admin' | 'lawyer' | 'intern' | 'clerk'>('lawyer')
  const [isActive, setIsActive] = useState(true)
  const [allowedPanels, setAllowedPanels] = useState<PanelPermission[]>([
    'dashboard',
    'dosyalar',
    'muvekkiller',
    'takvim',
    'hatirlaticilar',
  ])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setName(user.name)
      setUsername(user.username)
      setPassword(user.password)
      setTitle(user.title)
      setEmail(user.email || '')
      setPhone(user.phone || '')
      setRole(user.role)
      setIsActive(user.is_active)
      setAllowedPanels(user.allowed_panels || [])
    } else {
      setName('')
      setUsername('')
      setPassword('')
      setTitle('Bağlı Avukat')
      setEmail('')
      setPhone('')
      setRole('lawyer')
      setIsActive(true)
      // Varsayılan olarak Finans ve Yönetici kapalı gelir
      setAllowedPanels(['dashboard', 'dosyalar', 'muvekkiller', 'takvim', 'hatirlaticilar'])
    }
    setError(null)
  }, [user, open])

  const togglePanel = (panelId: PanelPermission) => {
    if (allowedPanels.includes(panelId)) {
      setAllowedPanels(allowedPanels.filter(p => p !== panelId))
    } else {
      setAllowedPanels([...allowedPanels, panelId])
    }
  }

  // Hızlı Yetki Şablonları
  const applyPreset = (preset: 'all' | 'associate' | 'intern') => {
    if (preset === 'all') {
      setAllowedPanels(['dashboard', 'dosyalar', 'muvekkiller', 'takvim', 'finans', 'hatirlaticilar', 'yonetici'])
      setRole('admin')
      setTitle('Yönetici Ortak Avukat')
    } else if (preset === 'associate') {
      setAllowedPanels(['dashboard', 'dosyalar', 'muvekkiller', 'takvim', 'hatirlaticilar'])
      setRole('lawyer')
      setTitle('Bağlı Avukat')
    } else if (preset === 'intern') {
      setAllowedPanels(['dosyalar', 'takvim', 'hatirlaticilar'])
      setRole('intern')
      setTitle('Stajyer Avukat')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Lütfen kullanıcının adını ve soyadını girin.')
      return
    }
    if (!username.trim()) {
      setError('Lütfen bir kullanıcı adı belirleyin.')
      return
    }
    if (!password.trim()) {
      setError('Lütfen kullanıcı için bir parola belirleyin.')
      return
    }
    if (allowedPanels.length === 0) {
      setError('Lütfen kullanıcının erişebileceği en az bir panel seçin.')
      return
    }

    const payload: SystemUser = {
      id: user?.id || `usr_${Date.now()}`,
      name: name.trim(),
      username: username.trim().toLowerCase(),
      password: password.trim(),
      title: title.trim() || 'Avukat',
      email: email.trim(),
      phone: phone.trim(),
      role,
      is_active: isActive,
      allowed_panels: allowedPanels,
      created_at: user?.created_at || new Date().toISOString(),
    }

    onSave(payload)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="w-full sm:max-w-2xl lg:max-w-3xl max-h-[92vh] overflow-y-auto p-6 sm:p-7">
        <DialogHeader>
          <div className="flex items-center gap-3 pb-3 border-b border-border/60">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              {isEditing ? <Edit className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                {isEditing ? `Kullanıcıyı ve Yetkileri Düzenle: ${user?.name}` : 'Yeni Kullanıcı / Avukat Ekle'}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Kullanıcı adı, giriş şifresi ve erişebileceği sistem panellerini belirleyin
              </p>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Satır 1: Ad Soyad & Ünvan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1.5">
                Adı Soyadı <span className="text-destructive">*</span>
              </label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Örn: Av. Selin Kara"
                className="h-10"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1.5">
                Ünvan / Pozisyon
              </label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Örn: Bağlı Avukat, Stajyer, Katip…"
                className="h-10"
              />
            </div>
          </div>

          {/* Satır 2: Kullanıcı Adı ve Parola */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900/30 dark:bg-slate-900/60 border border-border/70">
            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1.5">
                Kullanıcı Adı (Giriş için) <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Örn: av.selin"
                  className="h-10 pl-8 font-mono text-sm"
                  required
                  disabled={user?.username === 'admin'}
                />
                <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground font-mono">
                  @
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Kullanıcı bu kullanıcı adıyla giriş yapacaktır.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1.5">
                Giriş Parolası <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Şifre belirleyin…"
                  className="h-10 pr-10 font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Giriş ekranında bu şifre kullanılacaktır.
              </p>
            </div>
          </div>

          {/* Satır 3: İletişim Bilgileri & Durum */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1.5">
                Telefon Numarası
              </label>
              <Input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+90 (5xx) xxx xx xx"
                className="h-10"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1.5">
                E-posta Adresi
              </label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="avukat@hukuk.com"
                className="h-10"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1.5">
                Hesap Durumu
              </label>
              <label className="flex items-center gap-2.5 h-10 px-3 rounded-lg border border-border/80 bg-background cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  disabled={user?.username === 'admin'}
                  className="rounded border-border text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span className="text-xs font-medium">
                  {isActive ? '🟢 Aktif (Giriş Yapabilir)' : '⚪ Pasif (Giriş Engellendi)'}
                </span>
              </label>
            </div>
          </div>

          {/* ── PANEL YETKİLERİ SEÇİMİ ── */}
          <div className="space-y-3 pt-2 border-t border-border/70">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-500" />
                  Erişebileceği Sistem Panelleri
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  İşaretlediğiniz paneller kullanıcının menüsünde görünecektir. İşaretli olmayan panellere erişemez.
                </p>
              </div>

              {/* Hızlı Şablon Butonları */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => applyPreset('all')}
                  className="text-[11px] px-2.5 py-1 rounded-lg border border-border/80 bg-muted/50 hover:bg-muted font-medium transition-colors"
                >
                  Tam Yetki
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('associate')}
                  className="text-[11px] px-2.5 py-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 font-medium transition-colors"
                  title="Finans ve Yönetici hariç standart avukat yetkisi"
                >
                  Bağlı Avukat (Finans Kapalı)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('intern')}
                  className="text-[11px] px-2.5 py-1 rounded-lg border border-border/80 bg-muted/50 hover:bg-muted font-medium transition-colors"
                >
                  Stajyer Yetkisi
                </button>
              </div>
            </div>

            {/* Panel Kartları Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {AVAILABLE_PANELS.map(panel => {
                const Icon = PANEL_ICONS[panel.id]
                const isSelected = allowedPanels.includes(panel.id)
                const isFinance = panel.id === 'finans'
                const isAdminPanel = panel.id === 'yonetici'

                return (
                  <div
                    key={panel.id}
                    onClick={() => togglePanel(panel.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? isFinance 
                          ? 'border-emerald-500/50 bg-emerald-500/10' 
                          : isAdminPanel 
                          ? 'border-indigo-500/50 bg-indigo-500/10' 
                          : 'border-primary/50 bg-primary/10'
                        : 'border-border/60 bg-card/50 hover:border-border hover:bg-card'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? isFinance
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : isAdminPanel
                            ? 'bg-indigo-500/20 text-indigo-400'
                            : 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-foreground truncate">
                          {panel.label}
                        </span>
                        {isSelected ? (
                          <span className="flex items-center text-[10px] font-bold text-emerald-400 gap-1 shrink-0">
                            <Check className="w-3 h-3" />
                            Açık
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-muted-foreground shrink-0">
                            Kapalı
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                        {panel.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4 border-t border-border/60">
            <Button type="button" variant="outline" onClick={onClose} className="h-10 px-5">
              İptal
            </Button>
            <Button type="submit" className="gap-2 h-10 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md">
              <CheckCircle2 className="w-4 h-4" />
              {isEditing ? 'Değişiklikleri Kaydet' : 'Kullanıcıyı Oluştur'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
