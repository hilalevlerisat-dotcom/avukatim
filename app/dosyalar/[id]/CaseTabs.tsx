'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarDays, Clock, Wallet, FileText, Plus, CheckCircle2 } from 'lucide-react'
import { formatDate, formatDateTime, formatCurrency, daysFromNow, urgencyLabel, DEADLINE_TYPE_LABELS, FINANCE_TYPE_LABELS, FINANCE_TYPE_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { getStoredDocuments, deleteDocumentFromStore } from '@/lib/mock-store'
import { createClient } from '@/lib/supabase/client'
import NewHearingDialog from '@/components/forms/NewHearingDialog'
import NewDeadlineDialog from '@/components/forms/NewDeadlineDialog'
import NewFinanceDialog from '@/components/forms/NewFinanceDialog'
import UploadZone from '@/components/documents/UploadZone'
import DocumentList from '@/components/documents/DocumentList'
import { FolderOpen } from 'lucide-react'
import type { CaseCategory, CaseStatus, DeadlineType, FinanceType, Document } from '@/lib/database.types'

interface CaseTabsProps {
  caseId: string
  caseName: string
  clientId: string
  initialHearings: Array<{ id: string; hearing_date: string; court_name: string; courtroom: string; judge_name: string; is_completed: boolean; result: string | null }>
  initialDeadlines: Array<{ id: string; title: string; deadline_type: DeadlineType; due_date: string; is_completed: boolean }>
  initialFinance: Array<{ id: string; finance_type: FinanceType; amount: number; transaction_date: string; description: string }>
  description: string
  openDate: string
}

export default function CaseTabs({
  caseId, caseName, clientId,
  initialHearings, initialDeadlines, initialFinance,
  description, openDate,
}: CaseTabsProps) {
  const [hearings, setHearings] = useState(initialHearings)
  const [deadlines, setDeadlines] = useState(initialDeadlines)
  const [finances, setFinances] = useState(initialFinance)
  const [documents, setDocuments] = useState<Document[]>([])
  const [mounted, setMounted] = useState(false)
  const [hearingDialogOpen, setHearingDialogOpen] = useState(false)
  const [deadlineDialogOpen, setDeadlineDialogOpen] = useState(false)
  const [financeDialogOpen, setFinanceDialogOpen] = useState(false)

  // Listen to store updates
  useEffect(() => {
    setMounted(true)
    const fetchDocs = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('documents').select('*').eq('case_id', caseId)
      if (data) setDocuments(data as Document[])
    }
    fetchDocs()
    
    // Listen for local updates until we setup realtime
    const handleUpdate = () => fetchDocs()
    window.addEventListener('avukatim-store-update', handleUpdate)
    return () => window.removeEventListener('avukatim-store-update', handleUpdate)
  }, [caseId])

  const toggleDeadline = (id: string) =>
    setDeadlines(prev => prev.map(d => d.id === id ? { ...d, is_completed: !d.is_completed } : d))

  return (
    <>
      <Tabs defaultValue="hearings">
        <TabsList className="h-9 bg-muted/50">
          <TabsTrigger value="hearings" className="text-xs">Duruşmalar</TabsTrigger>
          <TabsTrigger value="deadlines" className="text-xs">Süreler</TabsTrigger>
          <TabsTrigger value="finance" className="text-xs">Finans</TabsTrigger>
          <TabsTrigger value="belgeler" className="text-xs">
            Belgeler {mounted && documents.length > 0 && `(${documents.length})`}
          </TabsTrigger>
          <TabsTrigger value="notes" className="text-xs">Notlar</TabsTrigger>
        </TabsList>

        {/* ── Duruşmalar ──────────────────────────────────────────── */}
        <TabsContent value="hearings" className="mt-4 space-y-2">
          <div className="flex justify-end">
            <Button id="add-hearing-btn" size="sm" variant="outline" className="text-xs gap-1.5"
              onClick={() => setHearingDialogOpen(true)}>
              <Plus className="w-3.5 h-3.5" /> Duruşma Ekle
            </Button>
          </div>
          {hearings.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm">Henüz duruşma yok.</div>
          )}
          {hearings.map(h => {
            const days = daysFromNow(h.hearing_date)
            const urgency = urgencyLabel(days)
            return (
              <div key={h.id} className={cn(
                'flex items-start gap-3 p-3 rounded-xl border',
                h.is_completed ? 'border-border/30 bg-muted/20 opacity-70'
                  : days <= 7 ? 'border-red-500/20 bg-red-500/5' : 'border-border/40 bg-card'
              )}>
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                  h.is_completed ? 'bg-muted' : 'bg-blue-500/10')}>
                  <CalendarDays className={cn('w-4 h-4', h.is_completed ? 'text-muted-foreground' : 'text-blue-500')} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('font-medium text-sm', h.is_completed && 'line-through text-muted-foreground')}>
                    {formatDateTime(h.hearing_date)}
                  </p>
                  <p className="text-xs text-muted-foreground">{h.court_name}{h.courtroom && ` • ${h.courtroom}`}{h.judge_name && ` • ${h.judge_name}`}</p>
                  {h.result && <p className="text-xs text-muted-foreground mt-1 italic">Sonuç: {h.result}</p>}
                </div>
                {!h.is_completed && <p className={cn('text-xs font-semibold flex-shrink-0', urgency.color)}>{urgency.label}</p>}
                {h.is_completed && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
              </div>
            )
          })}
        </TabsContent>

        {/* ── Süreler ─────────────────────────────────────────────── */}
        <TabsContent value="deadlines" className="mt-4 space-y-2">
          <div className="flex justify-end">
            <Button id="add-deadline-btn" size="sm" variant="outline" className="text-xs gap-1.5"
              onClick={() => setDeadlineDialogOpen(true)}>
              <Plus className="w-3.5 h-3.5" /> Süre Ekle
            </Button>
          </div>
          {deadlines.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm">Henüz süre/son gün yok.</div>
          )}
          {deadlines.map(d => {
            const days = daysFromNow(d.due_date)
            const urgency = urgencyLabel(days)
            return (
              <div key={d.id} className={cn(
                'flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-muted/30 transition-colors',
                d.is_completed ? 'border-border/30 opacity-60' : days <= 7 ? 'border-amber-500/20 bg-amber-500/5' : 'border-border/40 bg-card'
              )} onClick={() => toggleDeadline(d.id)}>
                <div className={cn('w-2 h-2 rounded-full flex-shrink-0',
                  d.is_completed ? 'bg-slate-300 dark:bg-slate-600'
                    : days <= 7 ? 'bg-red-500' : days <= 30 ? 'bg-amber-500' : 'bg-emerald-500'
                )} />
                <div className="flex-1 min-w-0">
                  <p className={cn('font-medium text-sm', d.is_completed && 'line-through text-muted-foreground')}>{d.title}</p>
                  <p className="text-xs text-muted-foreground">{DEADLINE_TYPE_LABELS[d.deadline_type]}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatDate(d.due_date)}</p>
                  {!d.is_completed && <p className={cn('text-xs font-semibold', urgency.color)}>{urgency.label}</p>}
                </div>
              </div>
            )
          })}
        </TabsContent>

        {/* ── Finans ──────────────────────────────────────────────── */}
        <TabsContent value="finance" className="mt-4 space-y-2">
          <div className="flex justify-end">
            <Button
              id="add-finance-btn"
              size="sm"
              variant="outline"
              className="text-xs gap-1.5"
              onClick={() => setFinanceDialogOpen(true)}
            >
              <Wallet className="w-3.5 h-3.5" /> Kayıt Ekle
            </Button>
          </div>
          {finances.map(f => (
            <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{f.description}</p>
                <p className="text-xs text-muted-foreground">{formatDate(f.transaction_date)}</p>
              </div>
              <div className="text-right">
                <p className={cn('text-sm font-semibold tabular-nums', FINANCE_TYPE_COLORS[f.finance_type])}>
                  {f.finance_type === 'payment' ? '+' : f.finance_type === 'expense' || f.finance_type === 'court_fee' ? '-' : ''}{formatCurrency(f.amount)}
                </p>
                <p className="text-[10px] text-muted-foreground">{FINANCE_TYPE_LABELS[f.finance_type]}</p>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* ── Belgeler ────────────────────────────────────────────── */}
        <TabsContent value="belgeler" className="mt-4 space-y-4">
          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border/40 bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-indigo-500" />
                <p className="text-sm font-semibold">Belge Yükleme</p>
              </div>
              <p className="text-xs text-muted-foreground">PDF, PNG, JPG, TIFF, UDF, DOCX desteklenir</p>
            </div>
            <div className="p-4">
              <UploadZone
                userId="demo-user-id"
                caseId={caseId}
                clientId={clientId}
                onUploadComplete={(docs) => {
                  setDocuments(prev => {
                    const existingIds = new Set(prev.map(d => d.id))
                    const fresh = docs.filter(d => !existingIds.has(d.id))
                    return [...fresh, ...prev]
                  })
                }}
              />
            </div>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border/40 bg-muted/20 flex items-center justify-between">
              <p className="text-sm font-semibold">Yüklü Belgeler</p>
              <span className="text-xs text-muted-foreground">{documents.length} evrak</span>
            </div>
            <DocumentList
              documents={documents}
              emptyMessage="Bu dosyaya henüz belge yüklenmemiş."
              onDeleteDocument={(docId) => {
                deleteDocumentFromStore(docId)
                setDocuments(prev => prev.filter(d => d.id !== docId))
              }}
            />
          </div>
        </TabsContent>

        {/* ── Notlar ──────────────────────────────────────────────── */}
        <TabsContent value="notes" className="mt-4">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-sm text-foreground leading-relaxed">{description}</p>
              <div className="mt-4 pt-4 border-t border-border/40 flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="w-3.5 h-3.5" />
                Dosya açılış notu • {formatDate(openDate)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Dialoglar ──────────────────────────────────────────────── */}
      <NewHearingDialog
        caseId={caseId}
        caseName={caseName}
        open={hearingDialogOpen}
        onClose={() => setHearingDialogOpen(false)}
        onCreated={async (h) => {
          const supabase = createClient()
          const { data } = await supabase.from('hearings').insert({
            case_id: caseId,
            case_title: caseName,
            client_id: clientId,
            client_name: 'Müvekkil', // In a real app we'd fetch this properly if not available
            hearing_date: h.hearing_date,
            court_name: h.court_name,
            courtroom: h.courtroom,
            judge_name: h.judge_name,
            is_completed: h.is_completed,
            result: h.result
          }).select().single()
          
          if (data) {
            setHearings(prev => [data, ...prev])
          }
        }}
      />
      <NewDeadlineDialog
        caseId={caseId}
        caseName={caseName}
        open={deadlineDialogOpen}
        onClose={() => setDeadlineDialogOpen(false)}
        onCreated={async (d) => {
          const supabase = createClient()
          const { data } = await supabase.from('deadlines').insert({
            case_id: caseId,
            case_title: caseName,
            client_id: clientId,
            client_name: 'Müvekkil', // In a real app we'd fetch this properly
            title: d.title,
            deadline_type: d.deadline_type,
            due_date: d.due_date,
            description: d.description,
            is_completed: d.is_completed
          }).select().single()

          if (data) {
            setDeadlines(prev => [data, ...prev])
          }
        }}
      />
      <NewFinanceDialog
        open={financeDialogOpen}
        onClose={() => setFinanceDialogOpen(false)}
        clients={[{ id: clientId, full_name: 'Müvekkil' }]}
        cases={[{ id: caseId, title: caseName, client_id: clientId }]}
        defaultClientId={clientId}
        defaultCaseId={caseId}
        onCreated={async (rec) => {
          const supabase = createClient()
          const { data } = await supabase.from('finance_records').insert({
            ...rec, id: undefined
          }).select().single()
          
          if (data) {
            setFinances(prev => [data, ...prev])
          }
        }}
      />
    </>
  )
}
