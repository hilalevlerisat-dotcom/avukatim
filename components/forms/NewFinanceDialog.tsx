'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Wallet } from 'lucide-react'
import { Field, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './FormField'
import { FINANCE_TYPE_LABELS } from '@/lib/constants'
import type { FinanceType, PaymentMethod, Client, Case } from '@/lib/database.types'
import type { StoreFinance, InstallmentItem } from '@/lib/mock-store'
import InstallmentPlanner from './InstallmentPlanner'

interface NewFinanceDialogProps {
  open: boolean
  onClose: () => void
  clients: Pick<Client, 'id' | 'full_name'>[]
  cases: Pick<Case, 'id' | 'title' | 'client_id'>[]
  defaultClientId?: string
  defaultCaseId?: string
  onCreated: (record: StoreFinance) => void
}

const TODAY = new Date().toISOString().split('T')[0]
const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'bank_transfer', label: 'Havale / EFT' },
  { value: 'cash', label: 'Nakit' },
  { value: 'credit_card', label: 'Kredi Kartı' },
  { value: 'check', label: 'Çek' },
  { value: 'other', label: 'Diğer' },
]

const EMPTY = {
  client_id: '',
  case_id: '',
  finance_type: 'retainer' as FinanceType,
  amount: '',
  payment_method: '' as PaymentMethod | '',
  transaction_date: TODAY,
  due_date: '',
  description: '',
}

export default function NewFinanceDialog({
  open, onClose, clients, cases,
  defaultClientId = '', defaultCaseId = '',
  onCreated,
}: NewFinanceDialogProps) {
  const [form, setForm] = useState({ ...EMPTY, client_id: defaultClientId, case_id: defaultCaseId })
  const [hasInstallments, setHasInstallments] = useState(false)
  const [installments, setInstallments] = useState<InstallmentItem[]>([])
  const [loading, setLoading] = useState(false)

  const set = <K extends keyof typeof EMPTY>(k: K, v: typeof EMPTY[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  // Seçili müvekkile ait davalar
  const filteredCases = form.client_id
    ? cases.filter(c => c.client_id === form.client_id)
    : cases

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.client_id || !form.amount) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 400))
    const client = clients.find(c => c.id === form.client_id)
    const cas = cases.find(c => c.id === form.case_id)

    // Eğer taksitli ise ilk ödenmemiş taksitin vadesini genel due_date yap
    const effectiveDueDate = hasInstallments && installments.length > 0
      ? (installments.find(i => !i.is_paid)?.due_date || installments[0].due_date)
      : (form.due_date || null)

    onCreated({
      id: crypto.randomUUID(),
      client_id: form.client_id,
      client_name: client?.full_name ?? '',
      case_id: form.case_id || null,
      case_title: cas?.title ?? null,
      finance_type: form.finance_type,
      amount: Number(form.amount),
      transaction_date: form.transaction_date,
      due_date: effectiveDueDate,
      description: form.description || (hasInstallments ? `${installments.length} Taksitli Sözleşme` : ''),
      payment_method: (form.payment_method as PaymentMethod) || null,
      has_installments: hasInstallments && installments.length > 0,
      installment_count: hasInstallments ? installments.length : undefined,
      installments: hasInstallments && installments.length > 0 ? installments : undefined,
    })
    setForm({ ...EMPTY, client_id: defaultClientId, case_id: defaultCaseId })
    setHasInstallments(false)
    setInstallments([])
    setLoading(false)
    onClose()
  }

  const selectedClient = clients.find(c => c.id === form.client_id)
  const selectedCase = filteredCases.find(c => c.id === form.case_id)
  const selectedMethod = PAYMENT_METHODS.find(m => m.value === form.payment_method)

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="w-full sm:max-w-3xl lg:max-w-4xl max-h-[92vh] overflow-y-auto p-6 sm:p-7">
        <DialogHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Yeni Finans Kaydı</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Vekalet ücreti sözleşmesi, müvekkil tahsilatı veya gider kaydı oluşturun
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Satır 1: Müvekkil, Dosya, Kayıt Türü */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Müvekkil */}
            <Field label="Müvekkil" required>
              <Select value={form.client_id} onValueChange={v => set('client_id', v as any)}>
                <SelectTrigger id="fin-client-select" className="w-full h-10">
                  <SelectValue placeholder="Müvekkil seçin…">
                    {selectedClient ? selectedClient.full_name : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            {/* İlgili Dosya */}
            <Field label="İlgili Dosya (opsiyonel)">
              <Select value={form.case_id} onValueChange={v => set('case_id', v as any)}>
                <SelectTrigger id="fin-case-select" className="w-full h-10">
                  <SelectValue placeholder="Dosya seçin (opsiyonel)">
                    {selectedCase ? selectedCase.title : '— Genel (dosyaya bağlı değil)'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— Genel (dosyaya bağlı değil)</SelectItem>
                  {filteredCases.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            {/* Kayıt Türü */}
            <Field label="Kayıt Türü" required>
              <Select value={form.finance_type} onValueChange={v => set('finance_type', v as FinanceType)}>
                <SelectTrigger id="fin-type-select" className="w-full h-10">
                  <SelectValue>
                    {FINANCE_TYPE_LABELS[form.finance_type]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(FINANCE_TYPE_LABELS) as [FinanceType, string][]).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Satır 2: Tutar, Ödeme Yöntemi, İşlem Tarihi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Tutar */}
            <Field label="Toplam Tutar (₺)" required>
              <div className="relative">
                <Input
                  id="fin-amount"
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="25000.00"
                  value={form.amount}
                  onChange={e => set('amount', e.target.value)}
                  className="h-10 text-base font-bold pl-3 pr-8 tabular-nums"
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-semibold pointer-events-none">
                  ₺
                </span>
              </div>
            </Field>

            {/* Ödeme Yöntemi */}
            <Field label="Ödeme Yöntemi">
              <Select value={form.payment_method} onValueChange={v => set('payment_method', v as PaymentMethod)}>
                <SelectTrigger id="fin-method-select" className="w-full h-10">
                  <SelectValue placeholder="Yöntem seçin…">
                    {selectedMethod?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            {/* İşlem Tarihi */}
            <Field label="İşlem Tarihi" required>
              <Input
                id="fin-date"
                type="date"
                value={form.transaction_date}
                onChange={e => set('transaction_date', e.target.value)}
                className="h-10"
                required
              />
            </Field>
          </div>

          {/* Satır 3: Açıklama ve Vade Tarihi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Açıklama */}
            <div className="sm:col-span-2">
              <Field label="Açıklama">
                <Input
                  id="fin-description"
                  placeholder="Örn: 2024/4521 sayılı dosya vekalet ücreti sözleşmesi"
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  className="h-10"
                />
              </Field>
            </div>

            {/* Vade Tarihi */}
            <div className="sm:col-span-1">
              <Field label="Vade Tarihi (Opsiyonel)">
                <Input
                  id="fin-due-date"
                  type="date"
                  value={form.due_date}
                  onChange={e => set('due_date', e.target.value)}
                  className="h-10"
                  disabled={hasInstallments}
                  placeholder={hasInstallments ? 'Taksit planından yönetilir' : undefined}
                />
              </Field>
            </div>
          </div>

          {/* Taksitlendirme Planı */}
          <InstallmentPlanner
            totalAmount={Number(form.amount) || 0}
            hasInstallments={hasInstallments}
            onHasInstallmentsChange={setHasInstallments}
            installments={installments}
            onChange={setInstallments}
            baseDate={form.transaction_date}
          />

          <DialogFooter className="gap-2.5 pt-3 border-t border-border/60">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="px-5">
              İptal
            </Button>
            <Button id="submit-new-finance" type="submit" disabled={loading || !form.client_id || !form.amount} className="gap-2 px-6">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Finans Kaydını Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
