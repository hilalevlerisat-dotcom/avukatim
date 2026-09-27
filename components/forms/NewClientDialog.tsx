'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Users } from 'lucide-react'
import { Field, Input, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './FormField'
import type { Client } from '@/lib/database.types'

interface NewClientDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (client: Omit<Client, 'user_id' | 'created_at' | 'updated_at'>) => void
}

const EMPTY = {
  full_name: '',
  client_type: 'individual' as 'individual' | 'corporate',
  tc_no: '',
  company_name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  is_active: true,
}

export default function NewClientDialog({ open, onClose, onCreated }: NewClientDialogProps) {
  const [form, setForm] = useState({ ...EMPTY })
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof EMPTY, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name.trim()) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 400)) // Supabase insert buraya gelecek
    onCreated({ id: crypto.randomUUID(), ...form })
    setForm({ ...EMPTY })
    setLoading(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-violet-500" />
            </div>
            <DialogTitle>Yeni Müvekkil</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Müvekkil Tipi */}
          <Field label="Müvekkil Tipi" required>
            <Select value={form.client_type} onValueChange={v => set('client_type', v as 'individual' | 'corporate')}>
              <SelectTrigger id="client-type-select" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Bireysel</SelectItem>
                <SelectItem value="corporate">Kurumsal</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {/* Ad / Unvan */}
          <Field label={form.client_type === 'corporate' ? 'Şirket / Kurum Adı' : 'Ad Soyad'} required>
            <Input
              id="client-full-name"
              placeholder={form.client_type === 'corporate' ? 'Kaya İnşaat A.Ş.' : 'Ahmet Aslan'}
              value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
              className="h-9"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            {/* TC No / Vergi No */}
            <Field label={form.client_type === 'corporate' ? 'Vergi No' : 'T.C. Kimlik No'}>
              <Input
                id="client-tc"
                placeholder={form.client_type === 'corporate' ? '1234567890' : '12345678901'}
                value={form.tc_no}
                onChange={e => set('tc_no', e.target.value)}
                className="h-9"
                maxLength={11}
              />
            </Field>

            {/* Telefon */}
            <Field label="Telefon">
              <Input
                id="client-phone"
                placeholder="+90 5xx xxx xx xx"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                className="h-9"
              />
            </Field>
          </div>

          {/* E-posta */}
          <Field label="E-posta">
            <Input
              id="client-email"
              type="email"
              placeholder="ornek@email.com"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              className="h-9"
            />
          </Field>

          {/* Adres */}
          <Field label="Adres">
            <Input
              id="client-address"
              placeholder="Kadıköy, İstanbul"
              value={form.address}
              onChange={e => set('address', e.target.value)}
              className="h-9"
            />
          </Field>

          {/* Notlar */}
          <Field label="Notlar">
            <Textarea
              id="client-notes"
              placeholder="Müvekkil hakkında notlar…"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              className="h-20 resize-none"
            />
          </Field>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              İptal
            </Button>
            <Button id="submit-new-client" type="submit" disabled={loading || !form.full_name.trim()} className="gap-2">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Müvekkil Ekle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
