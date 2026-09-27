'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Clock } from 'lucide-react'
import { Field, Input, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './FormField'
import { DEADLINE_TYPE_LABELS } from '@/lib/constants'
import type { DeadlineType } from '@/lib/database.types'

interface NewDeadlineDialogProps {
  caseId: string
  caseName: string
  open: boolean
  onClose: () => void
  onCreated: (d: {
    id: string; title: string; deadline_type: DeadlineType
    due_date: string; description: string; is_completed: false
  }) => void
}

function defaultDate() {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  return d.toISOString().split('T')[0]
}

const EMPTY = {
  title: '',
  deadline_type: 'petition' as DeadlineType,
  due_date: defaultDate(),
  description: '',
}

export default function NewDeadlineDialog({ caseId, caseName, open, onClose, onCreated }: NewDeadlineDialogProps) {
  const [form, setForm] = useState({ ...EMPTY, due_date: defaultDate() })
  const [loading, setLoading] = useState(false)

  const set = <K extends keyof typeof EMPTY>(k: K, v: string) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.due_date) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 400))
    onCreated({
      id: crypto.randomUUID(),
      title: form.title,
      deadline_type: form.deadline_type as DeadlineType,
      due_date: form.due_date,
      description: form.description,
      is_completed: false,
    })
    setForm({ ...EMPTY, due_date: defaultDate() })
    setLoading(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <DialogTitle>Süre / Son Gün Ekle</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[280px]">{caseName}</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <Field label="Süre Başlığı" required>
            <Input
              id="deadline-title"
              placeholder="İtiraz dilekçesi son günü"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              className="h-9"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Tür" required>
              <Select value={form.deadline_type} onValueChange={v => set('deadline_type', v as any)}>
                <SelectTrigger id="deadline-type-select" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(DEADLINE_TYPE_LABELS) as [DeadlineType, string][]).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Son Tarih" required>
              <Input
                id="deadline-date"
                type="date"
                value={form.due_date}
                onChange={e => set('due_date', e.target.value)}
                className="h-9"
                required
              />
            </Field>
          </div>

          <Field label="Açıklama">
            <Textarea
              id="deadline-description"
              placeholder="Süre hakkında notlar…"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className="h-20 resize-none"
            />
          </Field>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>İptal</Button>
            <Button id="submit-new-deadline" type="submit" disabled={loading || !form.title.trim()} className="gap-2">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Süre Ekle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
