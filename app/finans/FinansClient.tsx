'use client'

import { useState, useEffect } from 'react'
import { Plus, Wallet, TrendingUp, TrendingDown, AlertCircle, Edit3, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatCard } from '@/components/ui/stat-card'
import { formatCurrency, formatDate, FINANCE_TYPE_LABELS, FINANCE_TYPE_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import NewFinanceDialog from '@/components/forms/NewFinanceDialog'
import EditFinanceDialog from '@/components/forms/EditFinanceDialog'
import type { FinanceType } from '@/lib/database.types'
import { 
  getStoredFinances, 
  saveFinanceToStore, 
  deleteFinanceFromStore, 
  getStoredClients, 
  getStoredCases,
  calculateFinanceSummary,
  getAllCollectionSchedules,
  markCollectionAsPaid,
  type StoreFinance 
} from '@/lib/mock-store'

export default function FinansClient() {
  const [records, setRecords] = useState<StoreFinance[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [cases, setCases] = useState<any[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingFinance, setEditingFinance] = useState<StoreFinance | null>(null)

  const loadData = () => {
    setRecords(getStoredFinances())
    setClients(getStoredClients())
    setCases(getStoredCases())
  }

  useEffect(() => {
    loadData()
    const handleUpdate = () => loadData()
    window.addEventListener('avukatim-store-update', handleUpdate)
    return () => window.removeEventListener('avukatim-store-update', handleUpdate)
  }, [])

  const { totalRetainer, totalPaid, totalExpense, remaining } = calculateFinanceSummary(records)

  const upcomingCollections = getAllCollectionSchedules().filter(c => !c.is_paid)

  const handleCreated = (rec: StoreFinance) => {
    saveFinanceToStore(rec)
    loadData()
  }

  const handleUpdated = (rec: StoreFinance) => {
    saveFinanceToStore(rec)
    loadData()
  }

  const handleDeleted = (id: string) => {
    deleteFinanceFromStore(id)
    loadData()
  }

  const handleQuickCollect = (financeId: string, installmentId?: string) => {
    markCollectionAsPaid(financeId, installmentId, true)
    loadData()
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Finans Yönetimi</p>
            <p className="text-xs text-muted-foreground">Vekalet ücretleri, taksit planları ve tahsilat takibi</p>
          </div>
        </div>
        <Button id="new-finance-btn" className="gap-2 h-9" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4" />Kayıt Ekle
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Toplam Sözleşme" value={totalRetainer} icon={Wallet} gradient="blue" currency />
        <StatCard title="Tahsil Edilen" value={totalPaid} icon={TrendingUp} gradient="green" currency />
        <StatCard title="Kalan Alacak" value={remaining} icon={TrendingDown} gradient="red" currency />
        <StatCard title="Toplam Gider" value={totalExpense} icon={AlertCircle} gradient="amber" currency />
      </div>

      {upcomingCollections.length > 0 && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-start gap-3">
            <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                  Tahsilat Yapılacak Ödemeler & Taksitler ({upcomingCollections.length})
                </p>
                <span className="text-[11px] text-muted-foreground">Takvim & Hatırlatıcı ile senkronize</span>
              </div>
              <div className="mt-2 space-y-2">
                {upcomingCollections.slice(0, 4).map(c => (
                  <div key={c.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-card/60 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-foreground font-medium truncate">{c.client_name}</span>
                      <span className="text-muted-foreground truncate hidden sm:inline">
                        — {c.description} {c.installment_number ? `(${c.installment_number}/${c.total_installments}. Taksit)` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-muted-foreground">{formatDate(c.due_date)}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatCurrency(c.amount)}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                        onClick={() => handleQuickCollect(c.finance_id, c.installment_id)}
                      >
                        Tahsil Et
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="all">
        <TabsList className="h-9 bg-muted/50">
          <TabsTrigger value="all" className="text-xs">Tüm Kayıtlar</TabsTrigger>
          <TabsTrigger value="retainer" className="text-xs">Vekalet Ücretleri</TabsTrigger>
          <TabsTrigger value="payment" className="text-xs">Ödemeler</TabsTrigger>
          <TabsTrigger value="expense" className="text-xs">Giderler</TabsTrigger>
        </TabsList>
        {(['all', 'retainer', 'payment', 'expense'] as const).map(tab => {
          const list = tab === 'all' ? records
            : tab === 'expense' ? records.filter(f => ['expense', 'court_fee'].includes(f.finance_type))
            : records.filter(f => f.finance_type === tab)
          return (
            <TabsContent key={tab} value={tab} className="mt-4">
              <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Müvekkil</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Açıklama</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Tür</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Tarih</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Tutar</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground w-20">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {list.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                          Kayıt bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      list.map(f => (
                        <tr key={f.id} className="group hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground">{f.client_name}</p>
                            {f.case_title && <p className="text-[11px] text-muted-foreground">{f.case_title}</p>}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                            <p>{f.description}</p>
                            {f.has_installments && f.installments && f.installments.length > 0 && (
                              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                {f.installments.map(inst => (
                                  <span
                                    key={inst.id}
                                    className={cn(
                                      "text-[10px] px-1.5 py-0.5 rounded border transition-colors",
                                      inst.is_paid
                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium"
                                        : "bg-muted/70 border-border/70 text-foreground/80 hover:border-emerald-500/50"
                                    )}
                                    title={`${inst.installment_number}. Taksit: ${formatCurrency(inst.amount)} (Vade: ${formatDate(inst.due_date)}) — ${inst.is_paid ? 'Tahsil Edildi' : 'Bekliyor'}`}
                                  >
                                    #{inst.installment_number}: {formatCurrency(inst.amount)} {inst.is_paid ? '✓' : ''}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={cn('text-xs font-medium', FINANCE_TYPE_COLORS[f.finance_type])}>
                                {FINANCE_TYPE_LABELS[f.finance_type]}
                              </span>
                              {f.has_installments && f.installments && f.installments.length > 0 && (
                                <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                                  {f.installments.filter(i => i.is_paid).length}/{f.installments.length} Taksit
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground text-xs">{formatDate(f.transaction_date)}</td>
                          <td className="px-4 py-3 text-right font-bold tabular-nums">
                            <span className={cn(FINANCE_TYPE_COLORS[f.finance_type])}>
                              {f.finance_type === 'payment' ? '+' : f.finance_type === 'expense' || f.finance_type === 'court_fee' ? '-' : ''}
                              {formatCurrency(f.amount)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={() => setEditingFinance(f)}
                                title="Düzenle"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleted(f.id)}
                                title="Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {list.length > 0 && (
                    <tfoot className="bg-muted/30 border-t border-border/50">
                      <tr>
                        <td colSpan={4} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">{list.length} kayıt</td>
                        <td className="px-4 py-2.5 text-right font-bold tabular-nums">
                          {formatCurrency(list.reduce((s, f) => s + f.amount, 0))}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </TabsContent>
          )
        })}
      </Tabs>

      <NewFinanceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        clients={clients.map(c => ({ id: c.id, full_name: c.full_name }))}
        cases={cases.map(c => ({ id: c.id, title: c.title, client_id: c.client_id }))}
        onCreated={handleCreated}
      />

      <EditFinanceDialog
        open={!!editingFinance}
        onClose={() => setEditingFinance(null)}
        record={editingFinance}
        onSaved={handleUpdated}
        onDeleted={handleDeleted}
      />
    </div>
  )
}
