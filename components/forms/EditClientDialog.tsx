'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, UserCheck } from 'lucide-react'
import { Field, Input, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './FormField'
import type { StoreClient } from '@/lib/mock-store'

interface EditClientDialogProps {
  open: boolean
  onClose: () => void
  client: StoreClient
  currentRetainer?: number
  onSaved: (updatedClient: StoreClient, newRetainer?: number) => void
}

export default function EditClientDialog({
  open,
  onClose,
  client,
  currentRetainer = 0,
  onSaved,
}: EditClientDialogProps) {
  const [form, setForm] = useState({
    full_name: client.full_name,
    client_type: client.client_type,
    tc_no: client.tc_no || '',
    phone: client.phone || '',
    email: client.email || '',
    address: client.address || '',
    notes: client.notes || '',
    retainer: currentRetainer.toString(),
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({
        full_name: client.full_name,
        client_type: client.client_type,
        tc_no: client.tc_no || '',
        phone: client.phone || '',
        email: client.email || '',
        address: client.address || '',
        notes: client.notes || '',
        retainer: currentRetainer.toString(),
      })
    }
  }, [client, currentRetainer, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name.trim()) return

    setLoading(true)
    await new Promise(r => setTimeout(r, 250))

    const updated: StoreClient = {
      ...client,
      full_name: form.full_name.trim(),
      client_type: form.client_type,
      tc_no: form.tc_no.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      notes: form.notes.trim(),
      updated_at: new Date().toISOString(),
    }

    const retNum = parseFloat(form.retainer)
    onSaved(updated, !isNaN(retNum) && retNum >= 0 ? retNum : undefined)
    setLoading(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-indigo-500" />
            </div>
            <DialogTitle>Müvekkili Düzenle</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Müvekkil Türü" required>
              <Select
                value={form.client_type}
                onValueChange={v => setForm(f => ({ ...f, client_type: v as any }))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Bireysel Müvekkil</SelectItem>
                  <SelectItem value="corporate">Kurumsal Müvekkil</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label={form.client_type === 'corporate' ? 'Vergi / Mersis No' : 'T.C. Kimlik No'}>
              <Input
                value={form.tc_no}
                onChange={e => setForm(f => ({ ...f, tc_no: e.target.value }))}
                placeholder={form.client_type === 'corporate' ? 'Vergi No' : '11 haneli T.C.'}
                maxLength={11}
                className="h-9"
              />
            </Field>
          </div>

          <Field label={form.client_type === 'corporate' ? 'Şirket / Kurum Ünvanı' : 'Ad Soyad'} required>
            <Input
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder="Ad Soyad veya Ünvan"
              className="h-9"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Telefon">
              <Input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+90 5XX XXX XX XX"
                className="h-9"
              />
            </Field>

            <Field label="E-posta">
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="ornek@email.com"
                className="h-9"
              />
            </Field>
          </div>

          {/* Anlaşılan Vekalet Ücreti Doğrudan Düzenleme */}
          <Field label="Anlaşılan Toplam Vekalet Ücreti (₺)">
            <Input
              type="number"
              min={0}
              step={100}
              value={form.retainer}
              onChange={e => setForm(f => ({ ...f, retainer: e.target.value }))}
              placeholder="Örn: 25000"
              className="h-9 font-semibold text-foreground bg-muted/30"
            />
          </Field>

          <Field label="Adres">
            <Input
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              placeholder="İlçe, İl"
              className="h-9"
            />
          </Field>

          <Field label="Özel Notlar">
            <Textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Müvekkil hakkında özel notlar, danışmanlık detayları…"
              rows={2}
            />
          </Field>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              İptal
            </Button>
            <Button type="submit" disabled={loading || !form.full_name} className="gap-2">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Değişiklikleri Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
