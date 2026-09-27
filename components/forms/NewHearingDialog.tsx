'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, CalendarDays } from 'lucide-react'
import { Field, Input, Textarea } from './FormField'

interface NewHearingDialogProps {
  caseId: string
  caseName: string
  open: boolean
  onClose: () => void
  onCreated: (h: {
    id: string; hearing_date: string; court_name: string
    courtroom: string; judge_name: string; result: null; is_completed: false
  }) => void
}

function defaultDate() {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  d.setHours(10, 0, 0, 0)
  return d.toISOString().slice(0, 16)
}

const EMPTY = {
  hearing_date: defaultDate(),
  court_name: '',
  courtroom: '',
  judge_name: '',
}

export default function NewHearingDialog({ caseId, caseName, open, onClose, onCreated }: NewHearingDialogProps) {
  const [form, setForm] = useState({ ...EMPTY, hearing_date: defaultDate() })
  const [loading, setLoading] = useState(false)

  const set = <K extends keyof typeof EMPTY>(k: K, v: string) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.hearing_date) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 400))
    onCreated({
      id: crypto.randomUUID(),
      hearing_date: new Date(form.hearing_date).toISOString(),
      court_name: form.court_name,
      courtroom: form.courtroom,
      judge_name: form.judge_name,
      result: null,
      is_completed: false,
    })
    setForm({ ...EMPTY, hearing_date: defaultDate() })
    setLoading(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <DialogTitle>Duruşma Ekle</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[280px]">{caseName}</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <Field label="Duruşma Tarihi & Saati" required>
            <Input
              id="hearing-date"
              type="datetime-local"
              value={form.hearing_date}
              onChange={e => set('hearing_date', e.target.value)}
              className="h-9"
              required
            />
          </Field>

          <Field label="Mahkeme">
            <Input
              id="hearing-court"
              placeholder="İstanbul 3. Asliye Hukuk Mahkemesi"
              value={form.court_name}
              onChange={e => set('court_name', e.target.value)}
              className="h-9"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Salon No">
              <Input
                id="hearing-courtroom"
                placeholder="Salon 4"
                value={form.courtroom}
                onChange={e => set('courtroom', e.target.value)}
                className="h-9"
              />
            </Field>
            <Field label="Hâkim">
              <Input
                id="hearing-judge"
                placeholder="H. Canan Yıldız"
                value={form.judge_name}
                onChange={e => set('judge_name', e.target.value)}
                className="h-9"
              />
            </Field>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>İptal</Button>
            <Button id="submit-new-hearing" type="submit" disabled={loading || !form.hearing_date} className="gap-2">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Duruşma Ekle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
