'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, FolderOpen, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { CategoryBadge, StatusBadge } from '@/components/ui/status-badge'
import { formatDate, CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import NewCaseDialog from '@/components/forms/NewCaseDialog'
import type { CaseCategory, CaseStatus } from '@/lib/database.types'
import { createClient } from '@/lib/supabase/client'

// ── Üretim: başlangıç verisi yok ────────────────────────────────────────────
type LocalCase = {
  id: string; title: string; category: CaseCategory; status: CaseStatus
  case_number: string; client: string; client_id: string; open_date: string
  priority: 1 | 2 | 3; court_name: string; opposing_party: string; description: string
}

const PRIORITY_BADGE: Record<number, string> = {
  1: 'text-red-500',
  2: 'text-amber-500',
  3: 'text-slate-400',
}

const ALL_TABS = ['all', 'acik_dava', 'icra', 'savcilik', 'arabuluculuk', 'acilacak_dosya', 'ihtarname'] as const

export default function DosyalarClient() {
  const [cases, setCases] = useState<LocalCase[]>([])
  const [clients, setClients] = useState<{ id: string; full_name: string }[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [search, setSearch] = useState('')

  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    const supabase = createClient()
    
    const [casesRes, clientsRes] = await Promise.all([
      supabase.from('cases').select('*, clients(full_name)').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, full_name')
    ])

    if (casesRes.data) {
      setCases(casesRes.data.map((c: any) => ({
        id: c.id,
        title: c.title,
        category: c.category as CaseCategory,
        status: c.status as CaseStatus,
        case_number: c.case_number || '',
        client: (c.clients as any)?.full_name || 'Bilinmiyor',
        client_id: c.client_id,
        open_date: c.open_date || '',
        priority: c.priority as 1 | 2 | 3,
        court_name: c.court_name || '',
        opposing_party: c.opposing_party || '',
        description: c.description || '',
      })))
    }

    if (clientsRes.data) {
      setClients(clientsRes.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtered = cases.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.client.toLowerCase().includes(search.toLowerCase()) ||
    c.case_number.includes(search)
  )

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Dosyalar</p>
            <p className="text-xs text-muted-foreground">{cases.length} aktif dosya</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              id="case-search"
              placeholder="Dosya ara…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 w-52 text-sm"
            />
          </div>
          <Button id="new-case-btn" className="gap-2 h-9" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Yeni Dosya
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList className="h-9 bg-muted/50 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="all" className="text-xs h-7">Tümü ({cases.length})</TabsTrigger>
          {(Object.entries(CATEGORY_LABELS) as [CaseCategory, string][]).map(([cat, label]) => {
            const count = cases.filter(c => c.category === cat).length
            return count > 0 ? (
              <TabsTrigger key={cat} value={cat} className="text-xs h-7">
                {label} ({count})
              </TabsTrigger>
            ) : null
          })}
        </TabsList>

        {ALL_TABS.map(tab => {
          const list = tab === 'all' ? filtered : filtered.filter(c => c.category === tab)
          return (
            <TabsContent key={tab} value={tab} className="mt-4">
              {list.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                  <FolderOpen className="w-12 h-12 text-muted-foreground/20" />
                  <p className="text-sm">
                    {search ? `"${search}" için sonuç bulunamadı.` : 'Bu kategoride dosya yok.'}
                  </p>
                  <Button variant="outline" size="sm" className="gap-2 mt-1" onClick={() => setDialogOpen(true)}>
                    <Plus className="w-3.5 h-3.5" />Yeni Dosya Ekle
                  </Button>
                </div>
              ) : (
                <div className="rounded-2xl border border-border/50 overflow-hidden bg-card">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Dosya</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Müvekkil</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Kategori</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Tarih</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {list.map(c => (
                        <tr key={c.id} className="hover:bg-muted/30 transition-colors group">
                          <td className="px-4 py-3">
                            <Link href={`/dosyalar/${c.id}`} className="group-hover:text-primary font-medium transition-colors block">
                              {c.priority === 1 && <span className="text-red-500 mr-1">●</span>}
                              {c.title}
                            </Link>
                            {c.case_number && (
                              <p className="text-xs text-muted-foreground font-mono">{c.case_number}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">{c.client}</td>
                          <td className="px-4 py-3">
                            <CategoryBadge category={c.category} />
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground text-xs">{formatDate(c.open_date)}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={c.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          )
        })}
      </Tabs>

      {/* Dialog */}
      <NewCaseDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        clients={clients}
        onCreated={async (newCase) => {
          const supabase = createClient()
          const { data: authData } = await supabase.auth.getUser()
          if (!authData.user) return

          // Insert into Supabase
          await supabase.from('cases').insert({
            user_id: authData.user.id,
            client_id: newCase.client_id,
            title: newCase.title,
            category: newCase.category,
            status: newCase.status,
            case_number: newCase.case_number,
            court_name: newCase.court_name,
            open_date: newCase.open_date,
            description: newCase.description,
            priority: 2
          })
          
          loadData()
        }}
      />
    </div>
  )
}
