import type { CaseCategory, CaseStatus, FinanceType, DeadlineType, ReminderStatus } from './database.types'

// ─── Kategori Etiketleri ──────────────────────────────────────────────────
export const CATEGORY_LABELS: Record<CaseCategory, string> = {
  acik_dava: 'Açık Dava',
  icra: 'İcra',
  savcilik: 'Savcılık',
  arabuluculuk: 'Arabuluculuk',
  acilacak_dosya: 'Açılacak Dosya',
  ihtarname: 'İhtarname',
}

export const CATEGORY_COLORS: Record<CaseCategory, string> = {
  acik_dava: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  icra: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
  savcilik: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30',
  arabuluculuk: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
  acilacak_dosya: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30',
  ihtarname: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
}

// ─── Durum Etiketleri ──────────────────────────────────────────────────────
export const STATUS_LABELS: Record<CaseStatus, string> = {
  active: 'Aktif',
  closed: 'Kapalı',
  pending: 'Beklemede',
  archived: 'Arşiv',
}

export const STATUS_COLORS: Record<CaseStatus, string> = {
  active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  closed: 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30',
  pending: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
  archived: 'bg-zinc-500/15 text-zinc-500 border-zinc-500/30',
}

// ─── Finans Tipi Etiketleri ───────────────────────────────────────────────
export const FINANCE_TYPE_LABELS: Record<FinanceType, string> = {
  retainer: 'Vekalet Ücreti',
  payment: 'Ödeme',
  expense: 'Gider',
  court_fee: 'Yargılama Gideri',
  refund: 'İade',
}

export const FINANCE_TYPE_COLORS: Record<FinanceType, string> = {
  retainer: 'text-violet-600 dark:text-violet-400',
  payment: 'text-emerald-600 dark:text-emerald-400',
  expense: 'text-red-600 dark:text-red-400',
  court_fee: 'text-orange-600 dark:text-orange-400',
  refund: 'text-sky-600 dark:text-sky-400',
}

// ─── Süre Tipi Etiketleri ─────────────────────────────────────────────────
export const DEADLINE_TYPE_LABELS: Record<DeadlineType, string> = {
  petition: 'Dilekçe',
  appeal: 'Temyiz / İstinaf',
  response: 'Cevap Süresi',
  evidence: 'Delil Bildirimi',
  payment: 'Ödeme Süresi',
  other: 'Diğer',
}

// ─── Hatırlatıcı Durumu ───────────────────────────────────────────────────
export const REMINDER_STATUS_LABELS: Record<ReminderStatus, string> = {
  pending: 'Bekliyor',
  sent: 'Gönderildi',
  dismissed: 'Kapatıldı',
}

// ─── Para Formatı ─────────────────────────────────────────────────────────
export function formatCurrency(amount: number, currency = 'TRY'): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

// ─── Tarih Formatı ────────────────────────────────────────────────────────
export function formatDate(dateStr: string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('tr-TR', opts ?? { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(dateStr))
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr))
}

// ─── Gün Farkı ────────────────────────────────────────────────────────────
export function daysFromNow(dateStr: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function urgencyLabel(days: number): { label: string; color: string } {
  if (days < 0) return { label: 'Geçmiş', color: 'text-slate-400' }
  if (days === 0) return { label: 'Bugün', color: 'text-red-500' }
  if (days <= 3) return { label: `${days} gün`, color: 'text-red-500' }
  if (days <= 7) return { label: `${days} gün`, color: 'text-orange-500' }
  if (days <= 30) return { label: `${days} gün`, color: 'text-amber-500' }
  return { label: `${days} gün`, color: 'text-muted-foreground' }
}
