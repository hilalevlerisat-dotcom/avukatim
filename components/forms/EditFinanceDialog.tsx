'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Edit3, Trash2 } from 'lucide-react'
import { Field, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './FormField'
import { FINANCE_TYPE_LABELS } from '@/lib/constants'
import type { FinanceType, PaymentMethod } from '@/lib/database.types'
import type { StoreFinance, InstallmentItem } from '@/lib/mock-store'
import InstallmentPlanner from './InstallmentPlanner'

interface EditFinanceDialogProps {
  open: boolean
  onClose: () => void
  record: StoreFinance | null
  onSaved: (updated: StoreFinance) => void
  onDeleted?: (id: string) => void
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'bank_transfer', label: 'Havale / EFT' },
  { value: 'cash', label: 'Nakit' },
  { value: 'credit_card', label: 'Kredi Kartı' },
  { value: 'check', label: 'Çek' },
  { value: 'other', label: 'Diğer' },
]

export default function EditFinanceDialog({
  open,
  onClose,
  record,
  onSaved,
  onDeleted,
}: EditFinanceDialogProps) {
  const [financeType, setFinanceType] = useState<FinanceType>('retainer')
  const [amount, setAmount] = useState('')
  const [transactionDate, setTransactionDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('')
  const [hasInstallments, setHasInstallments] = useState(false)
  const [installments, setInstallments] = useState<InstallmentItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (record) {
      setFinanceType(record.finance_type)
      setAmount(record.amount.toString())
      setTransactionDate(record.transaction_date || '')
      setDueDate(record.due_date || '')
      setDescription(record.description || '')
      setPaymentMethod(record.payment_method || '')
      setHasInstallments(!!record.has_installments)
      setInstallments(record.installments ? [...record.installments] : [])
    }
  }, [record, open])

  if (!record) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseFloat(amount)
    if (isNaN(num) || num < 0) return

    setLoading(true)
    await new Promise(r => setTimeout(r, 200))

    const effectiveDueDate = hasInstallments && installments.length > 0
      ? (installments.find(i => !i.is_paid)?.due_date || installments[0].due_date)
      : (dueDate || null)

    onSaved({
      ...record,
      finance_type: financeType,
      amount: num,
      transaction_date: transactionDate,
      due_date: effectiveDueDate,
      description,
      payment_method: (paymentMethod as PaymentMethod) || null,
      has_installments: hasInstallments && installments.length > 0,
      installment_count: hasInstallments ? installments.length : undefined,
      installments: hasInstallments && installments.length > 0 ? installments : undefined,
    })
    setLoading(false)
    onClose()
  }

  const handleDelete = () => {
    if (confirm('Bu finans kaydını silmek istediğinize emin misiniz?')) {
      onDeleted?.(record.id)
      onClose()
    }
  }

  const selectedMethod = PAYMENT_METHODS.find(m => m.value === paymentMethod)

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="w-full sm:max-w-3xl lg:max-w-4xl max-h-[92vh] overflow-y-auto p-6 sm:p-7">
        <DialogHeader>
          <div className="flex items-center justify-between pb-1 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Finans Kaydını Düzenle</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ödeme, tahsilat, masraf veya taksit planı detaylarını güncelleyin
                </p>
              </div>
            </div>
            {onDeleted && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-destructive hover:bg-destructive/10 h-9 px-3 gap-1.5 text-xs font-medium"
                title="Kaydı Sil"
              >
                <Trash2 className="w-4 h-4" />
                <span>Kaydı Sil</span>
              </Button>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Satır 1: Kayıt Türü, Tutar, Ödeme Yöntemi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <Field label="Kayıt Türü" required>
              <Select value={financeType} onValueChange={v => setFinanceType(v as FinanceType)}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue>
                    {FINANCE_TYPE_LABELS[financeType]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(FINANCE_TYPE_LABELS) as [FinanceType, string][]).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Toplam Tutar (₺)" required>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="h-10 text-base font-bold pl-3 pr-8 tabular-nums"
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-semibold pointer-events-none">
                  ₺
                </span>
              </div>
            </Field>

            <Field label="Ödeme Yöntemi">
              <Select value={paymentMethod} onValueChange={v => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Seçin…">
                    {selectedMethod?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Satır 2: İşlem Tarihi, Vade Tarihi, Açıklama */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <Field label="İşlem Tarihi" required>
              <Input
                type="date"
                value={transactionDate}
                onChange={e => setTransactionDate(e.target.value)}
                className="h-10"
                required
              />
            </Field>

            <Field label="Vade Tarihi (Opsiyonel)">
              <Input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="h-10"
                disabled={hasInstallments}
                placeholder={hasInstallments ? 'Taksit planından yönetilir' : undefined}
              />
            </Field>

            <Field label="Açıklama" required>
              <Input
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="h-10"
                placeholder="Açıklama yazın…"
                required
              />
            </Field>
          </div>

          {/* Taksitlendirme Planı */}
          <InstallmentPlanner
            totalAmount={parseFloat(amount) || 0}
            hasInstallments={hasInstallments}
            onHasInstallmentsChange={setHasInstallments}
            installments={installments}
            onChange={setInstallments}
            baseDate={transactionDate}
          />

          <DialogFooter className="gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="h-10 px-5">
              İptal
            </Button>
            <Button type="submit" disabled={loading || !amount} className="gap-2 h-10 px-6 font-medium">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Güncellemeyi Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
