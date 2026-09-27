'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Coins } from 'lucide-react'
import { Field, Input } from './FormField'
import { formatCurrency } from '@/lib/constants'

interface SetRetainerDialogProps {
  open: boolean
  onClose: () => void
  clientId: string
  clientName: string
  currentAmount: number
  onSaved: (amount: number, description: string) => void
}

export default function SetRetainerDialog({
  open,
  onClose,
  clientId,
  clientName,
  currentAmount,
  onSaved,
}: SetRetainerDialogProps) {
  const [amount, setAmount] = useState<string>(currentAmount.toString())
  const [description, setDescription] = useState<string>('Anlaşılan Vekalet Ücreti')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setAmount(currentAmount.toString())
    }
  }, [open, currentAmount])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseFloat(amount)
    if (isNaN(num) || num < 0) return

    setLoading(true)
    await new Promise(r => setTimeout(r, 200))
    onSaved(num, description)
    setLoading(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Coins className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Vekalet Ücreti Belirle / Düzenle</DialogTitle>
              <p className="text-xs text-muted-foreground">{clientName}</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-xs flex justify-between items-center">
            <span className="text-muted-foreground">Mevcut Vekalet Ücreti:</span>
            <span className="font-bold text-foreground text-sm">{formatCurrency(currentAmount)}</span>
          </div>

          <Field label="Yeni Vekalet Ücreti Tutarı (₺)" required>
            <Input
              id="set-retainer-amount"
              type="number"
              min={0}
              step={100}
              placeholder="Örn: 35000"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="h-10 text-base font-bold"
              required
              autoFocus
            />
          </Field>

          <Field label="Açıklama / Not">
            <Input
              id="set-retainer-desc"
              placeholder="Örn: Dava vekalet ücreti sözleşmesi"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="h-9"
            />
          </Field>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              İptal
            </Button>
            <Button
              id="save-retainer-btn"
              type="submit"
              disabled={loading || !amount}
              className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Ücreti Güncelle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
