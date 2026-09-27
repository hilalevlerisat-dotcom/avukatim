'use client'

import { usePathname } from 'next/navigation'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import NotificationBell from '@/components/layout/NotificationBell'
import GlobalSearch from '@/components/layout/GlobalSearch'

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Genel bakış ve özet bilgiler' },
  '/dosyalar': { title: 'Dosyalar', subtitle: 'Tüm dava ve dosyalar' },
  '/muvekkiller': { title: 'Müvekkiller', subtitle: 'Müvekkil yönetimi' },
  '/takvim': { title: 'Takvim', subtitle: 'Duruşmalar ve son tarihler' },
  '/finans': { title: 'Finans', subtitle: 'Vekalet ücretleri ve ödemeler' },
  '/hatirlaticilar': { title: 'Hatırlatıcılar', subtitle: 'Yaklaşan görevler' },
  '/yonetici': { title: 'Yönetici Ekranı', subtitle: 'Büro profili, kullanıcı hesapları ve panel yetkilendirmesi' },
}

export default function Header() {
  const pathname = usePathname()
  const [dark, setDark] = useState(false)

  const pageKey = Object.keys(PAGE_TITLES)
    .filter(k => k !== '/')
    .find(k => pathname.startsWith(k)) ?? (pathname === '/' ? '/' : null)
  
  const page = pageKey ? PAGE_TITLES[pageKey] : { title: 'Avukat Asistanı', subtitle: '' }

  const toggleDark = () => {
    setDark(d => !d)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-md border-b border-border/60">
      {/* Page Title */}
      <div className="pl-12 lg:pl-0">
        <h1 className="text-lg font-bold text-foreground leading-tight">{page.title}</h1>
        {page.subtitle && <p className="text-xs text-muted-foreground">{page.subtitle}</p>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <GlobalSearch />
        <NotificationBell />
        <Button
          id="theme-toggle"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={toggleDark}
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
      </div>
    </header>
  )
}
