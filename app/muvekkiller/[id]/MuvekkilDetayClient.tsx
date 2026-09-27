'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  FolderOpen, 
  Wallet, 
  Coins, 
  Edit3, 
  Plus, 
  Trash2,
  CheckCircle2,
  Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CategoryBadge, StatusBadge } from '@/components/ui/status-badge'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency, FINANCE_TYPE_LABELS, FINANCE_TYPE_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import {
  getClientById,
  updateClientInStore,
  getStoredCases,
  saveCaseToStore,
  getStoredFinances,
  saveFinanceToStore,
  deleteFinanceFromStore,
  setClientRetainerFee,
  calculateFinanceSummary,
  type StoreClient,
  type StoreCase,
} from '@/lib/mock-store'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import EditClientDialog from '@/components/forms/EditClientDialog'
import SetRetainerDialog from '@/components/forms/SetRetainerDialog'
import EditFinanceDialog from '@/components/forms/EditFinanceDialog'
import NewFinanceDialog from '@/components/forms/NewFinanceDialog'
import NewCaseDialog from '@/components/forms/NewCaseDialog'

interface MuvekkilDetayClientProps {
  id: string
}

export default function MuvekkilDetayClient({ id }: MuvekkilDetayClientProps) {
  const router = useRouter()
  const [client, setClient] = useState<any>(null)
  const [cases, setCases] = useState<any[]>([])
  const [finances, setFinances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Dialog states
  const [editClientOpen, setEditClientOpen] = useState(false)
  const [setRetainerOpen, setSetRetainerOpen] = useState(false)
  const [newFinanceOpen, setNewFinanceOpen] = useState(false)
  const [editingFinance, setEditingFinance] = useState<any | null>(null)
  const [newCaseOpen, setNewCaseOpen] = useState(false)

  const refreshData = async () => {
    const supabase = createClient()
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()

    if (clientError) {
      setFetchError(`${clientError.message} (${clientError.code})`)
    }
    if (clientData) {
      setClient(clientData)
      setFetchError(null)
    }

    const [casesRes, finRes] = await Promise.all([
      supabase.from('cases').select('*').eq('client_id', id),
      supabase.from('finance_records').select('*').eq('client_id', id)
    ])
    if (casesRes.data) setCases(casesRes.data)
    if (finRes.data) setFinances(finRes.data)
    setLoading(false)
  }

  useEffect(() => { refreshData() }, [id])

  if (loading) return <div className="p-8 text-center animate-pulse">Yükleniyor...</div>

  if (!client) {
    return (
      <div className="p-8 text-center space-y-3 max-w-lg mx-auto">
        <p className="text-red-500 font-semibold text-lg">Müvekkil yüklenemedi</p>
        {fetchError && (
          <p className="text-xs text-left bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-lg font-mono break-all">{fetchError}</p>
        )}
        <p className="text-xs text-muted-foreground">Müvekkil ID: {id}</p>
        <Button variant="outline" onClick={() => router.push('/muvekkiller')}>Geri dön</Button>
      </div>
    )
  }

  const { totalRetainer, totalPaid, remaining, paidPct } = calculateFinanceSummary(finances)

  const handleClientSaved = async (updated: StoreClient, newRetainer?: number) => {
    const supabase = createClient()
    await supabase.from('clients').update({
      full_name: updated.full_name,
      tc_no: updated.tc_no,
      phone: updated.phone,
      email: updated.email,
      address: updated.address,
      notes: updated.notes
    }).eq('id', updated.id)
    refreshData()
  }

  const handleClientDeleted = async (clientId: string) => {
    const supabase = createClient()
    await supabase.from('clients').delete().eq('id', clientId)
    router.push('/muvekkiller')
  }

  const handleRetainerSaved = (amount: number, description: string) => {
    setClientRetainerFee(client.id, amount, description)
    refreshData()
  }

  const handleFinanceCreated = (record: any) => {
    saveFinanceToStore(record)
    refreshData()
  }

  const handleFinanceUpdated = (updated: any) => {
    saveFinanceToStore(updated)
    refreshData()
  }

  const handleFinanceDeleted = (recId: string) => {
    deleteFinanceFromStore(recId)
    refreshData()
  }

  const handleCaseCreated = (newCase: any) => {
    saveCaseToStore({
      id: newCase.id || crypto.randomUUID(),
      client_id: client.id,
      client_name: client.full_name,
      title: newCase.title,
      category: newCase.category,
      status: newCase.status || 'active',
      case_number: newCase.case_number || '',
      court_name: newCase.court_name || '',
      open_date: newCase.open_date || new Date().toISOString().split('T')[0],
      description: newCase.description || '',
    })
    refreshData()
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Link href="/muvekkiller">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-xl font-bold">{client.full_name}</h2>
            {!client.is_active && <Badge variant="secondary" className="text-xs">Pasif</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            {client.client_type === 'corporate' ? 'Kurumsal Müvekkil' : 'Bireysel Müvekkil'}
            {client.tc_no && ` • ${client.client_type === 'corporate' ? 'Vergi No: ' : 'TC: '}${client.tc_no}`}
          </p>
        </div>
        <Button
          id="edit-client-btn"
          variant="outline"
          size="sm"
          onClick={() => setEditClientOpen(true)}
          className="gap-1.5"
        >
          <Edit3 className="w-3.5 h-3.5" /> Düzenle
        </Button>
      </div>

      {/* Info + Finance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact info */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">İletişim Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {[
              { icon: Phone, value: client.phone, label: 'Telefon' },
              { icon: Mail, value: client.email, label: 'E-posta' },
              { icon: MapPin, value: client.address, label: 'Adres' },
            ].map(({ icon: Icon, value, label }) =>
              value ? (
                <div key={label} className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-foreground">{value}</span>
                </div>
              ) : null
            )}
            {!client.phone && !client.email && !client.address && (
              <p className="text-xs text-muted-foreground italic">İletişim bilgisi girilmemiş.</p>
            )}
            {client.notes && (
              <p className="text-xs text-muted-foreground pt-2 border-t border-border/40">
                {client.notes}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Financial summary */}
        <Card className="border-border/50 stat-gradient-blue relative overflow-hidden">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-primary" /> Finansal Özet
            </CardTitle>
            <Button
              id="set-retainer-btn"
              variant="outline"
              size="sm"
              onClick={() => setSetRetainerOpen(true)}
              className="h-7 text-xs gap-1 border-primary/30 hover:bg-primary/10 text-primary font-medium"
            >
              <Edit3 className="w-3 h-3" /> Vekalet Ücretini Düzenle
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Toplam Ücret</p>
                <p className="text-base font-bold text-foreground">{formatCurrency(totalRetainer)}</p>
              </div>
              <div className="border-x border-border/40">
                <p className="text-xs text-muted-foreground">Ödendi</p>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totalPaid)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Kalan</p>
                <p
                  className={cn(
                    'text-base font-bold',
                    remaining > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
                  )}
                >
                  {formatCurrency(remaining)}
                </p>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>Tahsilat oranı</span>
                <span className="font-semibold">%{paidPct}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${paidPct}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="cases">
        <TabsList className="h-9 bg-muted/50">
          <TabsTrigger value="cases" className="text-xs">
            Dosyalar ({cases.length})
          </TabsTrigger>
          <TabsTrigger value="finance" className="text-xs">
            Finans Kayıtları ({finances.length})
          </TabsTrigger>
        </TabsList>

        {/* Cases Content */}
        <TabsContent value="cases" className="mt-4 space-y-2">
          {cases.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground border border-dashed rounded-xl p-4">
              Bu müvekkile ait kayıtlı dosya bulunmuyor.
            </div>
          ) : (
            cases.map(c => (
              <Link
                key={c.id}
                href={`/dosyalar/${c.id}`}
                className="flex items-center gap-4 p-3.5 rounded-xl border border-border/50 bg-card hover:bg-muted/40 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.case_number} • {formatDate(c.open_date)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <CategoryBadge category={c.category} />
                  <StatusBadge status={c.status} />
                </div>
              </Link>
            ))
          )}
          <Button
            id="add-case-for-client-btn"
            variant="outline"
            size="sm"
            onClick={() => setNewCaseOpen(true)}
            className="w-full gap-2 mt-2"
          >
            <FolderOpen className="w-4 h-4" /> Bu Müvekkile Dosya Ekle
          </Button>
        </TabsContent>

        {/* Finance Content */}
        <TabsContent value="finance" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">
              Vekalet ücretleri, tahsilat ve masraf kayıtları
            </p>
            <Button
              id="add-finance-for-client-btn"
              size="sm"
              onClick={() => setNewFinanceOpen(true)}
              className="gap-1.5 h-8 text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Ödeme / Finans Kaydı Ekle
            </Button>
          </div>

          {finances.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground border border-dashed rounded-xl p-4">
              Henüz finans kaydı veya vekalet ücreti girilmemiş. Yukarıdaki &quot;Vekalet Ücretini Düzenle&quot; butonundan belirleyebilirsiniz.
            </div>
          ) : (
            <div className="space-y-2">
              {finances.map(f => (
                <div
                  key={f.id}
                  className="group flex items-center justify-between gap-3 p-3 rounded-xl border border-border/40 bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{f.description}</p>
                      {f.case_title && (
                        <span className="text-[11px] text-muted-foreground/80 bg-muted/60 px-1.5 py-0.5 rounded truncate max-w-[200px]">
                          {f.case_title}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span>{formatDate(f.transaction_date)}</span>
                      {f.due_date && <span>• Vade: {formatDate(f.due_date)}</span>}
                      {f.payment_method && <span>• {f.payment_method}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={cn('text-sm font-bold tabular-nums', FINANCE_TYPE_COLORS[f.finance_type as keyof typeof FINANCE_TYPE_COLORS])}>
                        {f.finance_type === 'payment' ? '+' : f.finance_type === 'expense' || f.finance_type === 'court_fee' ? '-' : ''}
                        {formatCurrency(f.amount)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{FINANCE_TYPE_LABELS[f.finance_type as keyof typeof FINANCE_TYPE_LABELS]}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
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
                        onClick={() => handleFinanceDeleted(f.id)}
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Client Modal */}
      <EditClientDialog
        open={editClientOpen}
        onClose={() => setEditClientOpen(false)}
        client={client as any}
        currentRetainer={totalRetainer}
        onSaved={handleClientSaved}
        onDeleted={handleClientDeleted}
      />

      {/* Quick Set/Edit Retainer Modal */}
      <SetRetainerDialog
        open={setRetainerOpen}
        onClose={() => setSetRetainerOpen(false)}
        clientId={client.id}
        clientName={client.full_name}
        currentAmount={totalRetainer}
        onSaved={handleRetainerSaved}
      />

      {/* New Finance Modal */}
      <NewFinanceDialog
        open={newFinanceOpen}
        onClose={() => setNewFinanceOpen(false)}
        clients={[{ id: client.id, full_name: client.full_name }]}
        cases={cases.map(c => ({ id: c.id, title: c.title, client_id: client.id }))}
        defaultClientId={client.id}
        onCreated={handleFinanceCreated}
      />

      {/* Edit Finance Record Modal */}
      <EditFinanceDialog
        open={!!editingFinance}
        onClose={() => setEditingFinance(null)}
        record={editingFinance}
        onSaved={handleFinanceUpdated}
        onDeleted={handleFinanceDeleted}
      />

      {/* New Case for Client Modal */}
      <NewCaseDialog
        open={newCaseOpen}
        onClose={() => setNewCaseOpen(false)}
        clients={[{ id: client.id, full_name: client.full_name }]}
        defaultClientId={client.id}
        onCreated={handleCaseCreated}
      />
    </div>
  )
}
