'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, FolderOpen } from 'lucide-react'
import { Field, Input, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './FormField'
import { CATEGORY_LABELS } from '@/lib/constants'
import type { CaseCategory, CaseStatus, Client } from '@/lib/database.types'

interface NewCaseDialogProps {
  open: boolean
  onClose: () => void
  clients: Pick<Client, 'id' | 'full_name'>[]
  defaultClientId?: string
  onCreated: (c: {
    id: string; title: string; category: CaseCategory; status: CaseStatus
    case_number: string; court_name: string; opposing_party: string
    open_date: string; priority: 1 | 2 | 3; description: string
    client: string; client_id: string
  }) => void
}

const TODAY = new Date().toISOString().split('T')[0]

const EMPTY = {
  title: '',
  category: 'acik_dava' as CaseCategory,
  case_number: '',
  court_name: '',
  opposing_party: '',
  opposing_counsel: '',
  open_date: TODAY,
  priority: 2 as 1 | 2 | 3,
  description: '',
  client_id: '',
  enforcement_amount: '',
  enforcement_office: '',
}

export default function NewCaseDialog({ open, onClose, clients, defaultClientId, onCreated }: NewCaseDialogProps) {
  const [form, setForm] = useState({ ...EMPTY, client_id: defaultClientId ?? '' })
  const [loading, setLoading] = useState(false)

  const set = <K extends keyof typeof EMPTY>(k: K, v: typeof EMPTY[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const selectedClient = clients.find(c => c.id === form.client_id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.client_id) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 400))
    onCreated({
      id: crypto.randomUUID(),
      title: form.title,
      category: form.category,
      status: 'active',
      case_number: form.case_number,
      court_name: form.court_name,
      opposing_party: form.opposing_party,
      open_date: form.open_date,
      priority: form.priority,
      description: form.description,
      client: selectedClient?.full_name ?? '',
      client_id: form.client_id,
    })
    setForm({ ...EMPTY })
    setLoading(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <FolderOpen className="w-4 h-4 text-indigo-500" />
            </div>
            <DialogTitle>Yeni Dosya / Dava</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Başlık */}
          <Field label="Dosya Başlığı" required>
            <Input
              id="case-title"
              placeholder="Aslan - Yılmaz Alacak Davası"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              className="h-9"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            {/* Müvekkil */}
            <Field label="Müvekkil" required>
              <Select value={form.client_id} onValueChange={v => set('client_id', v as any)}>
                <SelectTrigger id="case-client-select" className="h-9">
                  <SelectValue placeholder="Müvekkil seçin…" />
                </SelectTrigger>
                <SelectContent>
                  {clients.length === 0 && (
                    <SelectItem value="__none__" disabled>Önce müvekkil ekleyin</SelectItem>
                  )}
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Kategori */}
            <Field label="Kategori" required>
              <Select value={form.category} onValueChange={v => set('category', v as CaseCategory)}>
                <SelectTrigger id="case-category-select" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(CATEGORY_LABELS) as [CaseCategory, string][]).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Esas No */}
            <Field label="Esas No">
              <Input
                id="case-number"
                placeholder="2024/1234"
                value={form.case_number}
                onChange={e => set('case_number', e.target.value)}
                className="h-9"
              />
            </Field>

            {/* Açılış Tarihi */}
            <Field label="Açılış Tarihi">
              <Input
                id="case-open-date"
                type="date"
                value={form.open_date}
                onChange={e => set('open_date', e.target.value)}
                className="h-9"
              />
            </Field>
          </div>

          {/* Mahkeme */}
          <Field label="Mahkeme / Kurum">
            <Input
              id="case-court"
              placeholder="İstanbul 3. Asliye Hukuk Mahkemesi"
              value={form.court_name}
              onChange={e => set('court_name', e.target.value)}
              className="h-9"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            {/* Karşı Taraf */}
            <Field label="Karşı Taraf">
              <Input
                id="case-opposing"
                placeholder="Mehmet Yılmaz"
                value={form.opposing_party}
                onChange={e => set('opposing_party', e.target.value)}
                className="h-9"
              />
            </Field>

            {/* Öncelik */}
            <Field label="Öncelik">
              <Select value={String(form.priority)} onValueChange={v => set('priority', Number(v) as 1 | 2 | 3)}>
                <SelectTrigger id="case-priority-select" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">🔴 Yüksek</SelectItem>
                  <SelectItem value="2">🟡 Normal</SelectItem>
                  <SelectItem value="3">⚪ Düşük</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* İcra alanları */}
          {form.category === 'icra' && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/20">
              <Field label="Asıl Alacak Tutarı (₺)">
                <Input
                  id="case-enforcement-amount"
                  type="number"
                  placeholder="150000"
                  value={form.enforcement_amount}
                  onChange={e => set('enforcement_amount', e.target.value)}
                  className="h-9"
                />
              </Field>
              <Field label="İcra Dairesi">
                <Input
                  id="case-enforcement-office"
                  placeholder="İst. 12. İcra Müd."
                  value={form.enforcement_office}
                  onChange={e => set('enforcement_office', e.target.value)}
                  className="h-9"
                />
              </Field>
            </div>
          )}

          {/* Açıklama */}
          <Field label="Açıklama / Notlar">
            <Textarea
              id="case-description"
              placeholder="Dava hakkında notlar…"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className="h-20 resize-none"
            />
          </Field>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>İptal</Button>
            <Button
              id="submit-new-case"
              type="submit"
              disabled={loading || !form.title.trim() || !form.client_id}
              className="gap-2"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Dosya Oluştur
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
