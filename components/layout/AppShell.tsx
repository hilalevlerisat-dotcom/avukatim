'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { isAuthenticated, getSession, UserSession } from '@/lib/auth'
import { PanelPermission } from '@/lib/admin-store'
import { Button } from '@/components/ui/button'

const ROUTE_PANEL_MAP: Record<string, PanelPermission> = {
  '/': 'dashboard',
  '/dosyalar': 'dosyalar',
  '/muvekkiller': 'muvekkiller',
  '/takvim': 'takvim',
  '/finans': 'finans',
  '/hatirlaticilar': 'hatirlaticilar',
  '/yonetici': 'yonetici',
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const isLoginPage = pathname === '/login'
  const [mounted, setMounted] = useState(false)
  const [isAuth, setIsAuth] = useState(false)
  const [session, setSession] = useState<UserSession | null>(null)

  const checkAuth = () => {
    const authed = isAuthenticated()
    setIsAuth(authed)
    setSession(getSession())
    return authed
  }

  useEffect(() => {
    setMounted(true)
    const authed = checkAuth()

    if (!authed && !isLoginPage) {
      router.replace('/login')
    } else if (authed && isLoginPage) {
      router.replace('/')
    }

    const handleAuthChange = () => {
      const currentAuth = checkAuth()
      if (!currentAuth && pathname !== '/login') {
        router.replace('/login')
      }
    }

    window.addEventListener('avukatim-auth-change', handleAuthChange)
    return () => window.removeEventListener('avukatim-auth-change', handleAuthChange)
  }, [pathname, isLoginPage, router])

  // If on login page, render full screen login with no sidebar/header
  if (isLoginPage) {
    return <>{children}</>
  }

  // Prevent flash of unauthenticated content during SSR/initial mount
  if (mounted && !isAuth) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  // Check RBAC permission for the active route
  const currentPanel = Object.keys(ROUTE_PANEL_MAP).find(r => 
    r === '/' ? pathname === '/' : pathname.startsWith(r)
  )
  const requiredPermission = currentPanel ? ROUTE_PANEL_MAP[currentPanel] : null

  const isRestricted = Boolean(
    session?.allowed_panels &&
    session.allowed_panels.length > 0 &&
    requiredPermission &&
    !session.allowed_panels.includes(requiredPermission)
  )

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 sm:p-6 animate-fade-up">
          {isRestricted ? (
            <div className="max-w-xl mx-auto my-12 p-8 rounded-2xl bg-card border border-destructive/30 text-center shadow-xl space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-foreground">
                Bu Panele Erişim Yetkiniz Yok
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Sayın <b>{session?.name}</b>, büro yöneticiniz bu paneli (<code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono">{requiredPermission}</code>) kullanıcı hesabınız için yetkilendirmemiştir.
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-border bg-card hover:bg-accent text-sm font-medium transition-colors shadow-sm"
                >
                  <Home className="w-4 h-4" />
                  <span>Ana Sayfaya Dön</span>
                </Link>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </>
  )
}
