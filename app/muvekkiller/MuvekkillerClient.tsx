'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Users, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { formatCurrency } from '@/lib/constants'
import { cn } from '@/lib/utils'
import NewClientDialog from '@/components/forms/NewClientDialog'
import type { Client } from '@/lib/database.types'
import { 
  getStoredClients, 
  saveStoredClients, 
  getStoredFinances, 
  getStoredCases, 
  calculateFinanceSummary,
  type StoreClient 
} from '@/lib/mock-store'

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function avatarColor(id: string) {
  const colors = ['bg-violet-500', 'bg-indigo-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500']
  return colors[id.charCodeAt(0) % colors.length]
}

export default function MuvekkillerClient() {
  const [clients, setClients] = useState<StoreClient[]>([])
  const [finances, setFinances] = useState<any[]>([])
  const [cases, setCases] = useState<any[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [search, setSearch] = useState('')

  const loadData = () => {
    setClients(getStoredClients())
    setFinances(getStoredFinances())
    setCases(getStoredCases())
  }

  useEffect(() => {
    loadData()
    const handleUpdate = () => loadData()
    window.addEventListener('avukatim-store-update', handleUpdate)
    return () => window.removeEventListener('avukatim-store-update', handleUpdate)
  }, [])

  const filtered = clients.filter(c =>
    !search ||
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? '').includes(search) ||
    (c.email ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const handleCreated = (newClient: Omit<Client, 'user_id' | 'created_at' | 'updated_at'>) => {
    const newStoreClient: StoreClient = {
      ...newClient,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const current = getStoredClients()
    saveStoredClients([newStoreClient, ...current])
    loadData()
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Müvekkiller</p>
            <p className="text-xs text-muted-foreground">{clients.length} kayıtlı müvekkil</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              id="client-search"
              placeholder="Müvekkil ara…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 w-48 text-sm"
            />
          </div>
          <Button id="new-client-btn" className="gap-2 h-9" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4" />Yeni Müvekkil
          </Button>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <Users className="w-12 h-12 text-muted-foreground/20" />
          <p className="text-sm">{search ? `"${search}" bulunamadı.` : 'Henüz müvekkil yok.'}</p>
          <Button variant="outline" size="sm" className="gap-2 mt-1" onClick={() => setDialogOpen(true)}>
            <Plus className="w-3.5 h-3.5" />Müvekkil Ekle
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(client => {
            const clientFinances = finances.filter(f => f.client_id === client.id || (client.id === 'c1' && f.client_id === '1') || (client.id === '1' && f.client_id === 'c1'))
            const { totalRetainer, totalPaid } = calculateFinanceSummary(clientFinances)
            const remaining = Math.max(0, totalRetainer - totalPaid)
            const paidPct = totalRetainer > 0
              ? Math.min(100, Math.round((totalPaid / totalRetainer) * 100))
              : 0
            const activeCases = cases.filter(c => c.client_id === client.id || (client.id === 'c1' && c.client_id === '1')).length

            return (
              <Link
                key={client.id}
                href={`/muvekkiller/${client.id}`}
                className="group rounded-2xl border border-border/50 bg-card p-4 hover:shadow-md hover:border-primary/30 transition-all block"
              >
                <div className="flex items-start gap-3">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0', avatarColor(client.id))}>
                    {initials(client.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                      {client.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {client.client_type === 'corporate' ? '🏢 Kurumsal' : '👤 Bireysel'}
                      {' · '}
                      {activeCases} dosya
                    </p>
                  </div>
                  {client.is_active ? (
                    <Badge className="h-5 text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 flex-shrink-0">Aktif</Badge>
                  ) : (
                    <Badge variant="secondary" className="h-5 text-[10px] flex-shrink-0">Pasif</Badge>
                  )}
                </div>

                {/* Finansal durum */}
                {totalRetainer > 0 ? (
                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Vekalet ücreti</span>
                      <span className="font-medium text-foreground">{formatCurrency(totalRetainer)}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', paidPct >= 100 ? 'bg-emerald-500' : paidPct >= 50 ? 'bg-amber-500' : 'bg-red-500')}
                        style={{ width: `${paidPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="w-2.5 h-2.5" />{formatCurrency(totalPaid)} ödendi
                      </span>
                      <span className="flex items-center gap-1 text-red-500">
                        <TrendingDown className="w-2.5 h-2.5" />{formatCurrency(remaining)} kalan
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 py-1 text-[11px] text-muted-foreground/70 italic flex justify-between">
                    <span>Vekalet ücreti henüz girilmedi</span>
                    <span className="text-primary group-hover:underline">Belirle →</span>
                  </div>
                )}

                {/* İletişim */}
                {client.phone && (
                  <p className="mt-2 text-[11px] text-muted-foreground truncate">{client.phone}</p>
                )}
              </Link>
            )
          })}
        </div>
      )}

      <NewClientDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  )
}
