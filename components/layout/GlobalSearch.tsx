'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Search, 
  X, 
  User, 
  FolderOpen, 
  Calendar, 
  Wallet, 
  Clock, 
  ArrowRight, 
  ChevronRight,
  LayoutDashboard,
  FileText
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getStoredClients, getStoredCases, type StoreClient, type StoreCase } from '@/lib/mock-store'
import { CATEGORY_LABELS } from '@/lib/constants'

const QUICK_PAGES = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard, desc: 'Genel bakış ve özetler' },
  { title: 'Dosyalar', href: '/dosyalar', icon: FolderOpen, desc: 'Tüm dava ve takipler' },
  { title: 'Müvekkiller', href: '/muvekkiller', icon: User, desc: 'Müvekkil yönetimi' },
  { title: 'Takvim', href: '/takvim', icon: Calendar, desc: 'Duruşmalar ve son tarihler' },
  { title: 'Finans', href: '/finans', icon: Wallet, desc: 'Vekalet ücretleri ve ödemeler' },
  { title: 'Hatırlatıcılar', href: '/hatirlaticilar', icon: Clock, desc: 'Süre ve görev hatırlatmaları' },
]

export default function GlobalSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [clients, setClients] = useState<StoreClient[]>([])
  const [cases, setCases] = useState<StoreCase[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load clients and cases from store
  const loadData = () => {
    setClients(getStoredClients())
    setCases(getStoredCases())
  }

  useEffect(() => {
    loadData()
    const handleUpdate = () => loadData()
    window.addEventListener('avukatim-store-update', handleUpdate)
    return () => window.removeEventListener('avukatim-store-update', handleUpdate)
  }, [])

  // Keyboard shortcut Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      } else if (e.key === 'Escape') {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Filtered results
  const q = query.trim().toLowerCase()

  const matchedClients = useMemo(() => {
    if (!q) return []
    return clients.filter(c => 
      c.full_name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.tc_no && c.tc_no.includes(q)) ||
      (c.notes && c.notes.toLowerCase().includes(q))
    ).slice(0, 5)
  }, [clients, q])

  const matchedCases = useMemo(() => {
    if (!q) return []
    return cases.filter(c => 
      c.title.toLowerCase().includes(q) ||
      (c.case_number && c.case_number.toLowerCase().includes(q)) ||
      (c.court_name && c.court_name.toLowerCase().includes(q)) ||
      (c.client_name && c.client_name.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
    ).slice(0, 5)
  }, [cases, q])

  const matchedPages = useMemo(() => {
    if (!q) return []
    return QUICK_PAGES.filter(p => 
      p.title.toLowerCase().includes(q) ||
      p.desc.toLowerCase().includes(q)
    )
  }, [q])

  const hasResults = matchedClients.length > 0 || matchedCases.length > 0 || matchedPages.length > 0

  const handleSelect = (url: string) => {
    setIsOpen(false)
    setQuery('')
    router.push(url)
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          id="global-search"
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Müvekkil veya dosya ara…"
          className="pl-8 pr-14 h-8 w-52 sm:w-64 focus:w-72 sm:focus:w-80 text-xs bg-muted/50 border-border/50 focus:bg-background transition-all duration-200"
        />
        {query ? (
          <button
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
            className="absolute right-2 text-muted-foreground hover:text-foreground p-0.5 rounded"
            title="Temizle"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded border border-border/50 pointer-events-none">
            ⌘K
          </kbd>
        )}
      </div>

      {/* Dropdown Results Overlay */}
      {isOpen && (
        <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-[340px] sm:w-[440px] max-h-[460px] overflow-y-auto rounded-2xl border border-border/80 bg-background/95 backdrop-blur-xl shadow-2xl z-50 p-2 divide-y divide-border/40 animate-in fade-in-0 zoom-in-95 duration-150">
          
          {/* If no query: show quick links */}
          {!q && (
            <div className="p-2 space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">
                Hızlı Erişim
              </p>
              <div className="grid grid-cols-2 gap-1">
                {QUICK_PAGES.map(page => {
                  const Icon = page.icon
                  return (
                    <button
                      key={page.href}
                      onClick={() => handleSelect(page.href)}
                      className="flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-muted/60 transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                          {page.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">{page.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>

              {clients.length > 0 && (
                <div className="pt-2 border-t border-border/30 mt-2">
                  <p className="text-[11px] font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">
                    Son Müvekkiller
                  </p>
                  <div className="space-y-0.5">
                    {clients.slice(0, 3).map(c => (
                      <button
                        key={c.id}
                        onClick={() => handleSelect(`/muvekkiller/${c.id}`)}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-muted/50 transition-colors text-left group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-violet-500/10 text-violet-500 flex items-center justify-center text-[11px] font-bold">
                            {c.full_name[0]}
                          </div>
                          <span className="text-xs font-medium text-foreground group-hover:text-primary truncate">
                            {c.full_name}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          Görüntüle <ChevronRight className="w-3 h-3" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* If query has text */}
          {q && !hasResults && (
            <div className="py-8 px-4 text-center">
              <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">&quot;{query}&quot; için sonuç bulunamadı</p>
              <p className="text-xs text-muted-foreground mt-1">
                Müvekkil adı, dosya numarası, mahkeme veya dava başlığı ile arama yapabilirsiniz.
              </p>
            </div>
          )}

          {/* Matched Clients */}
          {matchedClients.length > 0 && (
            <div className="p-1.5">
              <p className="text-[11px] font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3 h-3 text-violet-500" /> Müvekkiller ({matchedClients.length})
              </p>
              <div className="space-y-0.5 mt-1">
                {matchedClients.map(client => (
                  <button
                    key={client.id}
                    onClick={() => handleSelect(`/muvekkiller/${client.id}`)}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-muted/60 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-600 flex items-center justify-center text-xs font-bold shrink-0">
                        {client.full_name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground group-hover:text-primary truncate">
                          {client.full_name}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {client.client_type === 'corporate' ? 'Kurumsal' : 'Bireysel'}
                          {client.phone && ` • ${client.phone}`}
                          {client.email && ` • ${client.email}`}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0 text-muted-foreground">
                      Müvekkil
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Cases */}
          {matchedCases.length > 0 && (
            <div className="p-1.5">
              <p className="text-[11px] font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider flex items-center gap-1.5">
                <FolderOpen className="w-3 h-3 text-sky-500" /> Dosyalar ({matchedCases.length})
              </p>
              <div className="space-y-0.5 mt-1">
                {matchedCases.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(`/dosyalar/${c.id}`)}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-muted/60 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground group-hover:text-primary truncate">
                          {c.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {c.case_number && `${c.case_number} • `}
                          {c.court_name || (c.category && CATEGORY_LABELS[c.category])}
                          {c.client_name && ` (${c.client_name})`}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {c.category ? CATEGORY_LABELS[c.category] : 'Dosya'}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Pages */}
          {matchedPages.length > 0 && (
            <div className="p-1.5">
              <p className="text-[11px] font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">
                Sayfalar
              </p>
              <div className="space-y-0.5 mt-1">
                {matchedPages.map(page => {
                  const Icon = page.icon
                  return (
                    <button
                      key={page.href}
                      onClick={() => handleSelect(page.href)}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-muted/60 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-medium text-foreground group-hover:text-primary">
                          {page.title}
                        </span>
                      </div>
                      <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Footer hint */}
          <div className="px-3 py-2 bg-muted/20 text-[10px] text-muted-foreground flex justify-between items-center">
            <span>Seçmek için tıklayın</span>
            <span>Kapatmak için <kbd className="px-1 py-0.5 bg-muted rounded border border-border/50">ESC</kbd></span>
          </div>

        </div>
      )}
    </div>
  )
}
