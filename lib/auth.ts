import { getSystemUsers, SystemUser, PanelPermission, getLawyerProfile } from './admin-store'
import { createClient } from './supabase/client'

export interface UserSession {
  id?: string
  username: string
  name: string
  title: string
  email: string
  role: string
  loginTime: string
  allowed_panels?: PanelPermission[]
}

const AUTH_KEY = 'avukatim_session'
const AUTH_COOKIE = 'avukatim_auth'

export function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function getSession(): UserSession | null {
  if (!isBrowser()) return null
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  if (!isBrowser()) return false
  const session = getSession()
  if (session && session.username) return true
  if (document.cookie.includes(`${AUTH_COOKIE}=true`)) return true
  return false
}

export async function login(username: string, password: string): Promise<{ success: boolean; user?: UserSession; error?: string }> {
  const cleanUser = username.trim().toLowerCase()
  const cleanPass = password.trim()
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanUser,
    password: cleanPass
  })

  if (error) {
    return { success: false, error: 'E-posta veya şifre hatalı. Lütfen bilgilerinizi kontrol ediniz.' }
  }

  if (!data.user) {
    return { success: false, error: 'Bilinmeyen bir hata oluştu.' }
  }

  // Create or update the user_profile if needed
  try {
    const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', data.user.id).single()
    if (!profile) {
      await supabase.from('user_profiles').insert({
        id: data.user.id,
        full_name: 'Av. Mahmut Sait BOZKURT',
      })
    }
  } catch(e) {
    console.error('Error fetching/creating profile', e)
  }

  const session: UserSession = {
    id: data.user.id,
    username: cleanUser,
    name: 'Avukat',
    title: 'Yönetici Avukat',
    email: cleanUser,
    role: 'admin',
    allowed_panels: ['dashboard', 'dosyalar', 'muvekkiller', 'takvim', 'finans', 'hatirlaticilar', 'yonetici'],
    loginTime: new Date().toISOString(),
  }

  if (isBrowser()) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(session))
    document.cookie = `${AUTH_COOKIE}=true; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
    window.dispatchEvent(new Event('avukatim-auth-change'))
  }
  return { success: true, user: session }
}

export function switchActiveUser(user: SystemUser): void {
  if (!isBrowser()) return
  const session: UserSession = {
    id: user.id,
    username: user.username,
    name: user.name,
    title: user.title,
    email: user.email,
    role: user.role,
    allowed_panels: user.allowed_panels,
    loginTime: new Date().toISOString(),
  }
  localStorage.setItem(AUTH_KEY, JSON.stringify(session))
  document.cookie = `${AUTH_COOKIE}=true; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
  window.dispatchEvent(new Event('avukatim-auth-change'))
}

export function logout(): void {
  if (!isBrowser()) return
  localStorage.removeItem(AUTH_KEY)
  document.cookie = `${AUTH_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
  window.dispatchEvent(new Event('avukatim-auth-change'))
  window.location.href = '/login'
}
