'use client'

import React from 'react'
import { Plus, Trash2, Calendar, Split, CheckCircle2, AlertCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/constants'
import type { InstallmentItem } from '@/lib/mock-store'

interface InstallmentPlannerProps {
  totalAmount: number
  hasInstallments: boolean
  onHasInstallmentsChange: (enabled: boolean) => void
  installments: InstallmentItem[]
  onChange: (items: InstallmentItem[]) => void
  baseDate?: string
}

export default function InstallmentPlanner({
  totalAmount,
  hasInstallments,
  onHasInstallmentsChange,
  installments,
  onChange,
  baseDate,
}: InstallmentPlannerProps) {
  // Helper to add months to a date string YYYY-MM-DD
  const addMonths = (dateStr: string, monthsToAdd: number): string => {
    try {
      const d = new Date(dateStr || new Date().toISOString().split('T')[0])
      d.setMonth(d.getMonth() + monthsToAdd)
      return d.toISOString().split('T')[0]
    } catch {
      return new Date().toISOString().split('T')[0]
    }
  }

  // Taksitleri eşit olarak yeniden dağıt
  const handleAutoDistribute = (count?: number) => {
    const n = count || installments.length || 2
    if (n < 1) return
    const start = baseDate || new Date().toISOString().split('T')[0]
    const baseAmt = Math.floor((totalAmount / n) * 100) / 100
    const remainder = Math.round((totalAmount - baseAmt * n) * 100) / 100

    const newItems: InstallmentItem[] = []
    for (let i = 0; i < n; i++) {
      const isLast = i === n - 1
      const amt = isLast ? Number((baseAmt + remainder).toFixed(2)) : baseAmt
      const existing = installments[i]
      newItems.push({
        id: existing?.id || crypto.randomUUID(),
        installment_number: i + 1,
        due_date: existing?.due_date || addMonths(start, i),
        amount: amt,
        is_paid: existing?.is_paid || false,
        paid_date: existing?.paid_date || null,
        description: existing?.description || `${i + 1}. Taksit Tahsilatı`,
      })
    }
    onChange(newItems)
  }

  // Taksit planını etkinleştir
  const handleToggle = (enabled: boolean) => {
    onHasInstallmentsChange(enabled)
    if (enabled && installments.length === 0) {
      handleAutoDistribute(2)
    }
  }

  // Taksit sayısını hızlı butonla değiştir
  const handleSetCount = (count: number) => {
    handleAutoDistribute(count)
  }

  // Tekil taksit alanını güncelle
  const updateInstallment = (index: number, patch: Partial<InstallmentItem>) => {
    const updated = [...installments]
    updated[index] = { ...updated[index], ...patch }
    onChange(updated)
  }

  // Yeni taksit ekle
  const handleAddRow = () => {
    const nextNum = installments.length + 1
    const lastDate = installments.length > 0 
      ? installments[installments.length - 1].due_date 
      : (baseDate || new Date().toISOString().split('T')[0])
    
    const sumCurrent = installments.reduce((s, i) => s + (Number(i.amount) || 0), 0)
    const remaining = Math.max(0, totalAmount - sumCurrent)

    const newItem: InstallmentItem = {
      id: crypto.randomUUID(),
      installment_number: nextNum,
      due_date: addMonths(lastDate, 1),
      amount: remaining > 0 ? remaining : 0,
      is_paid: false,
      description: `${nextNum}. Taksit Tahsilatı`,
    }
    onChange([...installments, newItem])
  }

  // Taksit satırını sil
  const handleRemoveRow = (index: number) => {
    const filtered = installments.filter((_, i) => i !== index)
    const renumbered = filtered.map((item, i) => ({
      ...item,
      installment_number: i + 1,
      description: (item.description ?? '').replace(/^\d+\.\s*Taksit/, `${i + 1}. Taksit`),
    }))
    onChange(renumbered)
  }

  // Kalan tutarı son taksite aktar
  const handleBalanceToLast = () => {
    if (installments.length === 0) return
    const sumWithoutLast = installments.slice(0, -1).reduce((s, i) => s + (Number(i.amount) || 0), 0)
    const newLastAmount = Math.max(0, totalAmount - sumWithoutLast)
    const updated = [...installments]
    updated[updated.length - 1].amount = newLastAmount
    onChange(updated)
  }

  const sumInstallments = installments.reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const difference = Math.round((totalAmount - sumInstallments) * 100) / 100
  const isMatch = Math.abs(difference) < 0.01

  return (
    <div className="space-y-4 pt-3 border-t border-border/60">
      {/* Başlık ve Toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Taksitli Tahsilat Planı</span>
              {hasInstallments && installments.length > 0 && (
                <Badge variant="secondary" className="text-xs h-5 px-2 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                  {installments.length} Taksit
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ödeme günlerini ve taksit tutarlarını serbestçe belirleyin; takvim ve hatırlatıcıya otomatik işlensin
            </p>
          </div>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer text-xs select-none bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors">
          <input
            id="toggle-installments"
            type="checkbox"
            checked={hasInstallments}
            onChange={e => handleToggle(e.target.checked)}
            className="rounded border-border text-emerald-600 focus:ring-emerald-500 h-4 w-4"
          />
          <span className="font-semibold text-emerald-700 dark:text-emerald-300">Taksit Planı Aç</span>
        </label>
      </div>

      {hasInstallments && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 sm:p-5 space-y-4 animate-in fade-in duration-200">
          {/* Hızlı Taksit Seçimi & Eşit Dağıt Butonu */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-foreground/80">Taksit Sayısı:</span>
              {[2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleSetCount(n)}
                  className={`h-7 px-2.5 rounded-lg text-xs font-medium transition-all ${
                    installments.length === n
                      ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30 scale-105'
                      : 'bg-card border border-border/60 hover:bg-muted text-foreground'
                  }`}
                >
                  {n} Taksit
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAutoDistribute()}
                className="h-7 text-xs gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15"
                title="Toplam tutarı taksitlere eşit böl ve tarihleri 1 ay arayla sırala"
              >
                <Split className="w-3.5 h-3.5" />
                Tutarı Eşit Dağıt
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRow}
                className="h-7 text-xs gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15"
              >
                <Plus className="w-3.5 h-3.5" />
                Taksit Ekle
              </Button>
            </div>
          </div>

          {/* Taksit Tablo Başlıkları */}
          <div className="overflow-x-auto">
            <div className="min-w-[620px]">
              <div className="grid grid-cols-12 gap-3 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-emerald-500/20">
                <div className="col-span-2">Taksit No</div>
                <div className="col-span-3">Ödeme Günü (Vade)</div>
                <div className="col-span-3">Tutar (₺)</div>
                <div className="col-span-2">Açıklama</div>
                <div className="col-span-1 text-center">Durum</div>
                <div className="col-span-1 text-right">Sil</div>
              </div>

              {/* Taksit Satırları */}
              <div className="space-y-2 mt-2 max-h-72 overflow-y-auto pr-1">
                {installments.map((inst, idx) => (
                  <div
                    key={inst.id || idx}
                    className="grid grid-cols-12 gap-3 items-center p-2.5 rounded-xl bg-card border border-border/70 text-xs hover:border-emerald-500/50 transition-colors shadow-xs"
                  >
                    {/* Taksit No */}
                    <div className="col-span-2 flex items-center gap-1.5">
                      <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        #{inst.installment_number}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-medium">Taksit</span>
                    </div>

                    {/* Vade Tarihi */}
                    <div className="col-span-3">
                      <Input
                        type="date"
                        value={inst.due_date}
                        onChange={e => updateInstallment(idx, { due_date: e.target.value })}
                        className="h-8 text-xs px-2.5 bg-background font-medium"
                        required
                      />
                    </div>

                    {/* Taksit Tutarı */}
                    <div className="col-span-3">
                      <div className="relative">
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={inst.amount === 0 ? '' : inst.amount}
                          onChange={e => updateInstallment(idx, { amount: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                          className="h-8 text-xs pl-2.5 pr-6 font-bold tabular-nums bg-background"
                          required
                        />
                        <span className="absolute right-2 top-2 text-[11px] text-muted-foreground font-semibold pointer-events-none">
                          ₺
                        </span>
                      </div>
                    </div>

                    {/* Açıklama */}
                    <div className="col-span-2">
                      <Input
                        type="text"
                        value={inst.description || ''}
                        onChange={e => updateInstallment(idx, { description: e.target.value })}
                        placeholder={`${idx + 1}. Taksit`}
                        className="h-8 text-xs px-2 bg-background truncate"
                      />
                    </div>

                    {/* Tahsil Edildi Durumu */}
                    <div className="col-span-1 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => updateInstallment(idx, { 
                          is_paid: !inst.is_paid,
                          paid_date: !inst.is_paid ? new Date().toISOString().split('T')[0] : null
                        })}
                        className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors flex items-center gap-1 ${
                          inst.is_paid 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-muted/80 hover:bg-muted text-muted-foreground border border-border'
                        }`}
                        title={inst.is_paid ? 'Tahsil edildi (Değiştirmek için tıklayın)' : 'Bekliyor (Tahsil edildi yapmak için tıklayın)'}
                      >
                        {inst.is_paid ? (
                          <>
                            <Check className="w-3 h-3" />
                            Ödendi
                          </>
                        ) : (
                          'Bekliyor'
                        )}
                      </button>
                    </div>

                    {/* Satır Silme */}
                    <div className="col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        disabled={installments.length <= 1}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-20 transition-colors"
                        title="Taksiti Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tutar Eşleşme ve Denge Barı */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-emerald-500/20 bg-card/60 p-3 rounded-xl border">
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-muted-foreground">Sözleşme Tutarı: </span>
                <b className="text-foreground text-sm font-bold tabular-nums">{formatCurrency(totalAmount)}</b>
              </div>
              <div className="h-4 w-px bg-border" />
              <div>
                <span className="text-muted-foreground">Taksitler Toplamı: </span>
                <b className="text-emerald-600 dark:text-emerald-400 text-sm font-bold tabular-nums">{formatCurrency(sumInstallments)}</b>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isMatch ? (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Tutar Tam Eşleşiyor
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-xs font-semibold text-amber-700 dark:text-amber-300">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    {difference > 0 ? `Kalan Fark: +${formatCurrency(difference)}` : `Fazla Tutar: -${formatCurrency(Math.abs(difference))}`}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleBalanceToLast}
                    className="h-7 text-xs border-indigo-500/40 text-indigo-600 hover:bg-indigo-500/10"
                    title="Kalan farkı son taksite ekle"
                  >
                    Kalanı Eşitle
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
