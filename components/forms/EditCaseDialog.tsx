'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, FolderOpen, CheckCircle2 } from 'lucide-react'
import { Field, Input, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './FormField'
import { CATEGORY_LABELS, STATUS_LABELS } from '@/lib/constants'
import type { CaseCategory, CaseStatus } from '@/lib/database.types'

interface CaseData {
  id: string
  title: string
  category: CaseCategory
  status: CaseStatus
  case_number: string
  court_name: string
  opposing_party: string
  opposing_counsel?: string
  open_date: string
  priority: 1 | 2 | 3
  description: string
}

interface EditCaseDialogProps {
  open: boolean
  onClose: () => void
  caseData: CaseData
  onUpdated: (updated: CaseData) => void
}

export default function EditCaseDialog({ open, onClose, caseData, onUpdated }: EditCaseDialogProps) {
  const [form, setForm] = useState<CaseData>({ ...caseData })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const set = <K extends keyof CaseData>(k: K, v: CaseData[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 500)) // Supabase update buraya gelecek
    onUpdated(form)
    setLoading(false)
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onClose()
    }, 800)
  }

  // Dialog kapandığında formu orijinal veriye sıfırla
  const handleClose = () => {
    setForm({ ...caseData })
    setSaved(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <FolderOpen className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <DialogTitle>Dosyayı Düzenle</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[350px]">{caseData.title}</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Başlık */}
          <Field label="Dosya Başlığı" required>
            <Input
              id="edit-case-title"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              className="h-9"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            {/* Kategori */}
            <Field label="Kategori">
              <Select value={form.category} onValueChange={v => set('category', v as CaseCategory)}>
                <SelectTrigger id="edit-case-category" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(CATEGORY_LABELS) as [CaseCategory, string][]).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Durum */}
            <Field label="Durum">
              <Select value={form.status} onValueChange={v => set('status', v as CaseStatus)}>
                <SelectTrigger id="edit-case-status" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(STATUS_LABELS) as [CaseStatus, string][]).map(([v, l]) => (
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
                id="edit-case-number"
                value={form.case_number}
                onChange={e => set('case_number', e.target.value)}
                className="h-9"
              />
            </Field>

            {/* Açılış Tarihi */}
            <Field label="Açılış Tarihi">
              <Input
                id="edit-case-open-date"
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
              id="edit-case-court"
              value={form.court_name}
              onChange={e => set('court_name', e.target.value)}
              className="h-9"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            {/* Karşı Taraf */}
            <Field label="Karşı Taraf">
              <Input
                id="edit-case-opposing"
                value={form.opposing_party}
                onChange={e => set('opposing_party', e.target.value)}
                className="h-9"
              />
            </Field>

            {/* Karşı Taraf Avukatı */}
            <Field label="Karşı Taraf Avukatı">
              <Input
                id="edit-case-opposing-counsel"
                value={form.opposing_counsel ?? ''}
                onChange={e => set('opposing_counsel', e.target.value)}
                className="h-9"
                placeholder="Av. ..."
              />
            </Field>
          </div>

          {/* Öncelik */}
          <Field label="Öncelik">
            <Select value={String(form.priority)} onValueChange={v => set('priority', Number(v) as 1 | 2 | 3)}>
              <SelectTrigger id="edit-case-priority" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">🔴 Yüksek</SelectItem>
                <SelectItem value="2">🟡 Normal</SelectItem>
                <SelectItem value="3">⚪ Düşük</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {/* Açıklama */}
          <Field label="Açıklama / Notlar">
            <Textarea
              id="edit-case-description"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className="h-24 resize-none"
              placeholder="Dava hakkında notlar…"
            />
          </Field>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              İptal
            </Button>
            <Button
              id="submit-edit-case"
              type="submit"
              disabled={loading || saved || !form.title.trim()}
              className="gap-2 min-w-[100px]"
            >
              {saved ? (
                <><CheckCircle2 className="w-3.5 h-3.5" />Kaydedildi</>
              ) : loading ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" />Kaydediliyor…</>
              ) : (
                'Değişiklikleri Kaydet'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
