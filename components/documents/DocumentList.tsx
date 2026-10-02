'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, Image, File, Trash2, Eye,
  ExternalLink, Download, Loader2, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatFileSize as fmtSize } from '@/lib/constants'
import { formatFileSize, getDownloadUrl, deleteFile } from '@/lib/supabase/storage'
import { getFileExtension, fileTypeColor, isPreviewable } from '@/lib/utils/folder-matcher'
import { cn } from '@/lib/utils'
import type { Document } from '@/lib/database.types'
import DocumentPreviewModal from './DocumentPreviewModal'

// ── Dosya ikonu ───────────────────────────────────────────────────────────────
function DocIcon({ filename }: { filename: string }) {
  const ext = getFileExtension(filename)
  const color = fileTypeColor(filename)
  const cls = cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0')

  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'tiff', 'tif'].includes(ext))
    return (
      <div className={cn(cls, 'bg-sky-500/10')}>
        <Image className={cn('w-4 h-4', color)} />
      </div>
    )
  if (ext === 'pdf')
    return (
      <div className={cn(cls, 'bg-red-500/10')}>
        <FileText className={cn('w-4 h-4', color)} />
      </div>
    )
  if (ext === 'udf')
    return (
      <div className={cn(cls, 'bg-indigo-500/10')}>
        <FileText className={cn('w-4 h-4', color)} />
      </div>
    )
  return (
    <div className={cn(cls, 'bg-muted')}>
      <File className={cn('w-4 h-4', color)} />
    </div>
  )
}

// ── Belge satırı ──────────────────────────────────────────────────────────────
function DocumentRow({
  doc,
  onPreview,
  onDelete,
  onSummarized,
}: {
  doc: Document
  onPreview: (doc: Document) => void
  onDelete: (doc: Document) => void
  onSummarized?: (docId: string, summary: string) => void
}) {
  const [downloading, setDownloading] = useState(false)
  const [summarizing, setSummarizing] = useState(false)
  const previewable = isPreviewable(doc.file_name)
  const isPdf = getFileExtension(doc.file_name) === 'pdf'
  const computedStoragePath = doc.file_path || doc.storage_path || (doc.case_id ? `${doc.user_id}/cases/${doc.case_id}/${doc.file_name}` : (doc.client_id ? `${doc.user_id}/clients/${doc.client_id}/${doc.file_name}` : `${doc.user_id}/general/${doc.file_name}`))

  const handleSummarize = async () => {
    setSummarizing(true)
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: doc.id })
      })
      const data = await res.json()
      if (data.error) {
        alert('Hata: ' + data.error)
      } else {
        alert('Özet başarıyla çıkarıldı ve belgenin notlarına eklendi!')
        onSummarized?.(doc.id, data.summary)
      }
    } catch (err: any) {
      alert('Beklenmeyen bir hata oluştu: ' + err.message)
    } finally {
      setSummarizing(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    const url = await getDownloadUrl(computedStoragePath)
    if (url) {
      const a = document.createElement('a')
      a.href = url
      a.download = doc.file_name
      a.click()
    }
    setDownloading(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group"
    >
      <DocIcon filename={doc.file_name} />

      <div className="flex-1 min-w-0">
        <button
          onClick={() => previewable && onPreview(doc)}
          className={cn(
            'text-sm font-medium text-left truncate block w-full',
            previewable
              ? 'text-foreground hover:text-primary cursor-pointer transition-colors'
              : 'text-foreground cursor-default'
          )}
          title={doc.file_name}
        >
          {doc.file_name}
        </button>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-[11px] font-mono text-muted-foreground uppercase">
            {getFileExtension(doc.file_name)}
          </span>
          {doc.file_size && (
            <span className="text-[11px] text-muted-foreground">
              {formatFileSize(doc.file_size)}
            </span>
          )}
          <span className="text-[11px] text-muted-foreground">
            {formatDate(doc.uploaded_at, { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
          {doc.folder_name && (
            <Badge variant="outline" className="text-[10px] h-3.5 px-1 py-0">
              📁 {doc.folder_name}
            </Badge>
          )}
        </div>
      </div>

      {/* Eylemler */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {previewable && (
          <Button
            id={`preview-${doc.id}`}
            variant="ghost" size="icon"
            className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10"
            onClick={() => onPreview({ ...doc, storage_path: computedStoragePath })}
            title="Önizle / Görüntüle"
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
        )}
        {isPdf && (
          <Button
            id={`summarize-${doc.id}`}
            variant="ghost" size="icon"
            className="h-7 w-7 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
            onClick={handleSummarize}
            disabled={summarizing}
            title="Yapay Zeka ile Özet Çıkar (PDF)"
          >
            {summarizing 
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Sparkles className="w-3.5 h-3.5" />
            }
          </Button>
        )}
        <Button
          id={`download-${doc.id}`}
          variant="ghost" size="icon"
          className="h-7 w-7"
          onClick={handleDownload}
          disabled={downloading}
          title="İndir"
        >
          {downloading
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Download className="w-3.5 h-3.5" />
          }
        </Button>
        <Button
          id={`delete-${doc.id}`}
          variant="ghost" size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(doc)}
          title="Sil"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </motion.div>
  )
}

// ── Ana bileşen ───────────────────────────────────────────────────────────────
interface DocumentListProps {
  documents: Document[]
  emptyMessage?: string
  onRefresh?: () => void
  onDeleteDocument?: (docId: string) => void
}

export default function DocumentList({
  documents,
  emptyMessage = 'Henüz belge yüklenmemiş.',
  onRefresh,
  onDeleteDocument,
}: DocumentListProps) {
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)
  const [docs, setDocs] = useState<Document[]>(documents)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Parent prop değiştikçe güncelle
  useEffect(() => {
    setDocs(documents)
  }, [documents])

  const handleDelete = async (doc: Document) => {
    if (!confirm(`"${doc.file_name}" dosyasını silmek istediğinize emin misiniz?`)) return
    setDeletingId(doc.id)
    const sp = doc.storage_path || (doc.case_id ? `${doc.user_id}/cases/${doc.case_id}/${doc.file_name}` : (doc.client_id ? `${doc.user_id}/clients/${doc.client_id}/${doc.file_name}` : `${doc.user_id}/general/${doc.file_name}`));
    await deleteFile(sp)
    setDocs(prev => prev.filter(d => d.id !== doc.id))
    onDeleteDocument?.(doc.id)
    setDeletingId(null)
    onRefresh?.()
  }

  if (!docs.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
        <FileText className="w-10 h-10 text-muted-foreground/30" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <>
      <div className="divide-y divide-border/30">
        {docs.map(doc => (
          <DocumentRow
            key={doc.id}
            doc={doc}
            onPreview={setPreviewDoc}
            onDelete={handleDelete}
            onSummarized={(id, summary) => {
              setDocs(prev => prev.map(d => d.id === id ? { ...d, description: (d.description ? d.description.split('🤖 **AI DOSYA ANALİZİ**')[0].trim() + '\\n\\n---\\n\\n' : '') + '🤖 **AI DOSYA ANALİZİ**\\n\\n' + summary } : d))
            }}
          />
        ))}
      </div>

      <DocumentPreviewModal
        document={previewDoc}
        open={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
      />
    </>
  )
}
