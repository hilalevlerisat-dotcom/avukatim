import { getSystemUsers, SystemUser, PanelPermission, getLawyerProfile } from './admin-store'

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

export function login(username: string, password: string): { success: boolean; user?: UserSession; error?: string } {
  const cleanUser = username.trim().toLowerCase()
  const cleanPass = password.trim()

  // 1. Check against registered system users
  const systemUsers = getSystemUsers()
  const foundUser = systemUsers.find(
    u => u.username.toLowerCase() === cleanUser && u.password === cleanPass
  )

  if (foundUser) {
    if (!foundUser.is_active) {
      return {
        success: false,
        error: 'Bu kullanıcı hesabı yönetici tarafından devre dışı bırakılmıştır.',
      }
    }

    const session: UserSession = {
      id: foundUser.id,
      username: foundUser.username,
      name: foundUser.name,
      title: foundUser.title,
      email: foundUser.email,
      role: foundUser.role,
      allowed_panels: foundUser.allowed_panels,
      loginTime: new Date().toISOString(),
    }

    if (isBrowser()) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(session))
      document.cookie = `${AUTH_COOKIE}=true; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
      window.dispatchEvent(new Event('avukatim-auth-change'))
    }
    return { success: true, user: session }
  }

  // 2. Fallback check for root admin
  if (cleanUser === 'admin' && cleanPass === 'admin') {
    const profile = getLawyerProfile()
    const session: UserSession = {
      username: 'admin',
      name: profile.full_name || 'Av. Mahmut Sait BOZKURT',
      title: 'Yönetici Avukat',
      email: profile.email || 'av.mahmutsait@hukuk.com',
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

  return { 
    success: false, 
    error: 'Kullanıcı adı veya şifre hatalı. Lütfen bilgilerinizi kontrol ediniz.' 
  }
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
