export type PanelPermission = 
  | 'dashboard'
  | 'dosyalar'
  | 'muvekkiller'
  | 'takvim'
  | 'finans'
  | 'hatirlaticilar'
  | 'hesaplamalar'
  | 'emsal-kararlar'
  | 'dilekce-editoru'
  | 'yonetici'

export interface PanelDefinition {
  id: PanelPermission
  label: string
  description: string
  route: string
}

export const AVAILABLE_PANELS: PanelDefinition[] = [
  {
    id: 'dashboard',
    label: 'Dashboard (Genel Bakış)',
    description: 'Büro istatistikleri, yaklaşan işler ve özet kartlar',
    route: '/',
  },
  {
    id: 'dosyalar',
    label: 'Dosyalar (Dava & İcra)',
    description: 'Dava dosyalarını görüntüleme, evrak ekleme ve inceleme',
    route: '/dosyalar',
  },
  {
    id: 'muvekkiller',
    label: 'Müvekkiller',
    description: 'Müvekkil rehberi, iletişim ve dosya geçmişi',
    route: '/muvekkiller',
  },
  {
    id: 'takvim',
    label: 'Takvim & Duruşmalar',
    description: 'Duruşma günleri, keşif ve mazeret takvimi',
    route: '/takvim',
  },
  {
    id: 'finans',
    label: 'Finans (Kasa, Masraf & Taksitler)',
    description: 'Vekalet ücretleri, tahsilatlar, harç ve taksit planları',
    route: '/finans',
  },
  {
    id: 'hatirlaticilar',
    label: 'Hatırlatıcılar & Bildirimler',
    description: 'Duruşma ve süre bildirimleri, kişisel notlar',
    route: '/hatirlaticilar',
  },
  {
    id: 'hesaplamalar',
    label: 'Hesaplamalar & Araçlar',
    description: 'Hukuki süre hesaplama, faiz ve tazminat hesaplama araçları',
    route: '/hesaplamalar',
  },
  {
    id: 'emsal-kararlar',
    label: 'Emsal Kararlar (AI RAG)',
    description: 'Yargıtay ve Danıştay emsal kararlarında semantik arama',
    route: '/emsal-kararlar',
  },
  {
    id: 'dilekce-editoru',
    label: 'Dilekçe Editörü',
    description: 'Yapay Zeka Destekli UYAP Şablon Oluşturucu',
    route: '/dilekce-editoru',
  },
  {
    id: 'yonetici',
    label: 'Yönetici Ekranı & Yetkilendirme',
    description: 'Büro profili ve kullanıcı hesapları/yetki belirleme',
    route: '/yonetici',
  },
]

export interface LawyerProfile {
  full_name: string
  office_name: string
  title: string
  bar_association: string
  bar_number: string
  tc_tax_number: string
  tax_office: string
  phone: string
  email: string
  address: string
  iban: string
  bank_name: string
  notes?: string
}

export interface SystemUser {
  id: string
  username: string
  password: string
  name: string
  title: string
  email: string
  phone: string
  role: 'admin' | 'lawyer' | 'intern' | 'clerk'
  is_active: boolean
  allowed_panels: PanelPermission[]
  created_at: string
}

const DEFAULT_PROFILE: LawyerProfile = {
  full_name: 'Av. Mahmut Sait BOZKURT',
  office_name: 'Bozkurt Hukuk & Danışmanlık Bürosu',
  title: 'Yönetici & Kurucu Avukat',
  bar_association: 'İstanbul 1 No\'lu Barosu',
  bar_number: '48291',
  tc_tax_number: '28491029482',
  tax_office: 'Beyoğlu Vergi Dairesi',
  phone: '+90 (532) 456 78 90',
  email: 'av.mahmutsait@hukuk.com',
  address: 'Büyükdere Cad. Maya Plaza No:142 K:8 Levent / Beşiktaş / İstanbul',
  iban: 'TR33 0006 1000 0000 1234 5678 90',
  bank_name: 'Garanti BBVA - Levent Ticari Şubesi',
  notes: 'Büro çalışma saatleri hafta içi 09:00 - 18:30 arasındadır.',
}

const DEFAULT_USERS: SystemUser[] = [
  {
    id: 'usr_admin',
    username: 'admin',
    password: 'admin',
    name: 'Av. Mahmut Sait BOZKURT',
    title: 'Yönetici Avukat',
    email: 'av.mahmutsait@hukuk.com',
    phone: '+90 (532) 456 78 90',
    role: 'admin',
    is_active: true,
    allowed_panels: ['dashboard', 'dosyalar', 'muvekkiller', 'takvim', 'finans', 'hatirlaticilar', 'yonetici'],
    created_at: '2024-01-15T09:00:00Z',
  },
  {
    id: 'usr_elif',
    username: 'av.elif',
    password: '123',
    name: 'Av. Elif Yılmaz',
    title: 'Kıdemli Bağlı Avukat',
    email: 'av.elif@hukuk.com',
    phone: '+90 (533) 890 12 34',
    role: 'lawyer',
    is_active: true,
    // Finans ve Yönetici kapalı, sadece davalar ve duruşmalar
    allowed_panels: ['dashboard', 'dosyalar', 'muvekkiller', 'takvim', 'hatirlaticilar'],
    created_at: '2024-02-01T10:30:00Z',
  },
  {
    id: 'usr_can',
    username: 'stj.can',
    password: '123',
    name: 'Stj. Av. Can Demir',
    title: 'Stajyer Avukat',
    email: 'can.demir@hukuk.com',
    phone: '+90 (542) 345 67 89',
    role: 'intern',
    is_active: true,
    // Sadece Dosyalar, Takvim ve Hatırlatıcılar
    allowed_panels: ['dosyalar', 'takvim', 'hatirlaticilar'],
    created_at: '2024-03-01T11:00:00Z',
  },
]

const PROFILE_KEY = 'avukatim_profile'
const USERS_KEY = 'avukatim_system_users'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function notifyChange(): void {
  if (isBrowser()) {
    window.dispatchEvent(new Event('avukatim-admin-change'))
  }
}

// ──────────────────────────────────────────────
// PROFILE API
// ──────────────────────────────────────────────
export function getLawyerProfile(): LawyerProfile {
  if (!isBrowser()) return DEFAULT_PROFILE
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(DEFAULT_PROFILE))
      return DEFAULT_PROFILE
    }
    return JSON.parse(raw)
  } catch {
    return DEFAULT_PROFILE
  }
}

export function saveLawyerProfile(profile: LawyerProfile): void {
  if (!isBrowser()) return
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    notifyChange()
  } catch (e) {
    console.error('Error saving lawyer profile', e)
  }
}

// ──────────────────────────────────────────────
// USERS API
// ──────────────────────────────────────────────
export function getSystemUsers(): SystemUser[] {
  if (!isBrowser()) return DEFAULT_USERS
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS))
      return DEFAULT_USERS
    }
    return JSON.parse(raw)
  } catch {
    return DEFAULT_USERS
  }
}

export function saveSystemUser(user: SystemUser): SystemUser[] {
  let users = getSystemUsers()
  const idx = users.findIndex(u => u.id === user.id || u.username.toLowerCase() === user.username.toLowerCase())
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...user }
  } else {
    users = [user, ...users]
  }

  if (isBrowser()) {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users))
      notifyChange()
    } catch (e) {
      console.error('Error saving system user', e)
    }
  }
  return users
}

export function deleteSystemUser(id: string): SystemUser[] {
  let users = getSystemUsers().filter(u => u.id !== id && u.username !== 'admin')
  if (isBrowser()) {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users))
      notifyChange()
    } catch (e) {
      console.error('Error deleting user', e)
    }
  }
  return users
}

export function toggleUserStatus(id: string): SystemUser[] {
  let users = getSystemUsers().map(u => {
    if (u.id === id) {
      // Don't disable root admin
      if (u.username === 'admin') return u
      return { ...u, is_active: !u.is_active }
    }
    return u
  })

  if (isBrowser()) {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users))
      notifyChange()
    } catch (e) {
      console.error('Error toggling user status', e)
    }
  }
  return users
}
