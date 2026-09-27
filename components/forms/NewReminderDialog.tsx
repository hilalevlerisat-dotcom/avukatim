'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Bell, RefreshCw } from 'lucide-react'
import { Field, Input, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './FormField'
import type { Client, Case } from '@/lib/database.types'

interface NewReminderDialogProps {
  open: boolean
  onClose: () => void
  clients: Pick<Client, 'id' | 'full_name'>[]
  cases: Pick<Case, 'id' | 'title'>[]
  onCreated: (r: {
    id: string; title: string; description: string | null
    remind_at: string; status: 'pending'
    client_name: string | null; case_title: string | null
    is_recurring: boolean; recurrence_days: number | null
  }) => void
}

// Varsayılan: yarın 09:00
function defaultRemindAt() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(9, 0, 0, 0)
  return d.toISOString().slice(0, 16)
}

const EMPTY = {
  title: '',
  description: '',
  remind_at: defaultRemindAt(),
  client_id: '',
  case_id: '',
  is_recurring: false,
  recurrence_days: '7',
}

export default function NewReminderDialog({ open, onClose, clients, cases, onCreated }: NewReminderDialogProps) {
  const [form, setForm] = useState({ ...EMPTY, remind_at: defaultRemindAt() })
  const [loading, setLoading] = useState(false)

  const set = <K extends keyof typeof EMPTY>(k: K, v: typeof EMPTY[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 400))
    const client = clients.find(c => c.id === form.client_id)
    const cas = cases.find(c => c.id === form.case_id)
    onCreated({
      id: crypto.randomUUID(),
      title: form.title,
      description: form.description || null,
      remind_at: new Date(form.remind_at).toISOString(),
      status: 'pending',
      client_name: client?.full_name ?? null,
      case_title: cas?.title ?? null,
      is_recurring: form.is_recurring,
      recurrence_days: form.is_recurring ? Number(form.recurrence_days) : null,
    })
    setForm({ ...EMPTY, remind_at: defaultRemindAt() })
    setLoading(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-violet-500" />
            </div>
            <DialogTitle>Yeni Hatırlatıcı</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Başlık */}
          <Field label="Hatırlatıcı Başlığı" required>
            <Input
              id="reminder-title"
              placeholder="Ahmet Aslan 10.000 TL son ödeme günü"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              className="h-9"
              required
            />
          </Field>

          {/* Tarih/Saat */}
          <Field label="Hatırlatma Tarihi & Saati" required>
            <Input
              id="reminder-date"
              type="datetime-local"
              value={form.remind_at}
              onChange={e => set('remind_at', e.target.value)}
              className="h-9"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            {/* Müvekkil */}
            <Field label="Müvekkil (opsiyonel)">
              <Select value={form.client_id} onValueChange={v => set('client_id', v as any)}>
                <SelectTrigger id="reminder-client-select" className="h-9">
                  <SelectValue placeholder="Seçin…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— Genel</SelectItem>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            {/* Dosya */}
            <Field label="Dosya (opsiyonel)">
              <Select value={form.case_id} onValueChange={v => set('case_id', v as any)}>
                <SelectTrigger id="reminder-case-select" className="h-9">
                  <SelectValue placeholder="Seçin…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— Dosyaya bağlı değil</SelectItem>
                  {cases.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Açıklama */}
          <Field label="Açıklama">
            <Textarea
              id="reminder-description"
              placeholder="Hatırlatıcı detayı…"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className="h-20 resize-none"
            />
          </Field>

          {/* Tekrarlama */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-muted/20">
            <RefreshCw className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Tekrarla</p>
              <p className="text-xs text-muted-foreground">Belirtilen günde bir otomatik tekrar</p>
            </div>
            <div className="flex items-center gap-2">
              {form.is_recurring && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Her</span>
                  <Input
                    id="reminder-recurrence-days"
                    type="number"
                    min={1}
                    max={365}
                    value={form.recurrence_days}
                    onChange={e => set('recurrence_days', e.target.value)}
                    className="h-7 w-16 text-xs text-center"
                  />
                  <span className="text-xs text-muted-foreground">gün</span>
                </div>
              )}
              <button
                type="button"
                id="reminder-recurring-toggle"
                onClick={() => set('is_recurring', !form.is_recurring)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.is_recurring ? 'bg-primary' : 'bg-muted-foreground/30'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.is_recurring ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>İptal</Button>
            <Button id="submit-new-reminder" type="submit" disabled={loading || !form.title.trim()} className="gap-2">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Hatırlatıcı Ekle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
