'use client'

import { useEffect, useState, lazy, Suspense } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Download, ExternalLink, X, Loader2,
  FileText, Image, File, AlertCircle, Sparkles,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { getSignedUrl, getDownloadUrl, formatFileSize } from '@/lib/supabase/storage'
import { getFileExtension, fileTypeColor } from '@/lib/utils/folder-matcher'
import { formatDate } from '@/lib/constants'
import type { Document } from '@/lib/database.types'
import { cn } from '@/lib/utils'

// ── Lazy preview bileşenleri (kod bölünmesi için) ────────────────────────────
const PreviewPDF    = lazy(() => import('./previews/PreviewPDF'))
const PreviewImage  = lazy(() => import('./previews/PreviewImage'))
const PreviewTiff   = lazy(() => import('./previews/PreviewTiff'))
const PreviewUDF    = lazy(() => import('./previews/PreviewUDF'))

// ── Dosya tipi → icon & label ─────────────────────────────────────────────────
function FileIcon({ filename, className }: { filename: string; className?: string }) {
  const ext = getFileExtension(filename)
  const color = fileTypeColor(filename)
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'tiff', 'tif'].includes(ext))
    return <Image className={cn('w-5 h-5', color, className)} />
  if (ext === 'pdf')
    return <FileText className={cn('w-5 h-5', color, className)} />
  return <File className={cn('w-5 h-5', color, className)} />
}

function getPreviewType(filename: string): 'pdf' | 'image' | 'tiff' | 'udf' | 'unsupported' {
  const ext = getFileExtension(filename)
  if (ext === 'pdf') return 'pdf'
  if (['tiff', 'tif'].includes(ext)) return 'tiff'
  if (ext === 'udf') return 'udf'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(ext)) return 'image'
  return 'unsupported'
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface DocumentPreviewModalProps {
  document: Document | null
  open: boolean
  onClose: () => void
}

export default function DocumentPreviewModal({ document: doc, open, onClose }: DocumentPreviewModalProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [urlStatus, setUrlStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')

  // Her belge değiştiğinde imzalı URL üret
  useEffect(() => {
    if (!doc || !open) {
      setSignedUrl(null)
      setUrlStatus('idle')
      return
    }

    let cancelled = false
    setUrlStatus('loading')

    getSignedUrl(doc.storage_path, 3600).then(url => {
      if (!cancelled) {
        if (url) {
          setSignedUrl(url)
          setUrlStatus('ready')
        } else {
          setUrlStatus('error')
        }
      }
    })

    return () => { cancelled = true }
  }, [doc, open])

  const handleDownload = async () => {
    if (!doc) return
    const url = await getDownloadUrl(doc.storage_path)
    if (url) {
      const a = window.document.createElement('a')
      a.href = url
      a.download = doc.file_name
      a.click()
    }
  }

  const handleOpenNew = () => {
    if (signedUrl) window.open(signedUrl, '_blank', 'noopener,noreferrer')
  }

  if (!doc) return null

  const previewType = getPreviewType(doc.file_name)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent 
        showCloseButton={false}
        className="sm:max-w-4xl lg:max-w-5xl w-[95vw] max-h-[90vh] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50 flex-shrink-0 bg-muted/20">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <FileIcon filename={doc.file_name} className="flex-shrink-0" />
            <div className="min-w-0">
              <DialogTitle 
                className="text-sm sm:text-base font-semibold text-foreground truncate max-w-[240px] sm:max-w-[420px] md:max-w-[560px]"
                title={doc.file_name}
              >
                {doc.file_name}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                <Badge variant="outline" className="text-[10px] h-4 px-1.5 uppercase font-mono">
                  {getFileExtension(doc.file_name)}
                </Badge>
                {doc.file_size && (
                  <span>{formatFileSize(doc.file_size)}</span>
                )}
                <span>•</span>
                <span>{formatDate(doc.uploaded_at)}</span>
                {doc.folder_name && (
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                    📁 {doc.folder_name}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Eylem butonları */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button
              id="preview-open-new"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={handleOpenNew}
              disabled={!signedUrl}
              title="Yeni sekmede aç"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Yeni Sekmede Aç</span>
            </Button>
            <Button
              id="preview-download"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={handleDownload}
              title="İndir"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">İndir</span>
            </Button>
            <Button
              id="preview-close"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
              onClick={onClose}
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* İçerik */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          <div className="flex-1 overflow-auto p-5 relative">
            {urlStatus === 'loading' && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm">Belge yükleniyor…</p>
              </div>
            )}

            {urlStatus === 'error' && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-destructive">
                <AlertCircle className="w-8 h-8" />
                <p className="text-sm font-medium">Belgeye erişilemiyor.</p>
                <p className="text-xs text-muted-foreground">Supabase Storage bağlantısını ve RLS politikalarını kontrol edin.</p>
              </div>
            )}

            {urlStatus === 'ready' && signedUrl && (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                }
              >
                {previewType === 'pdf' && (
                  <PreviewPDF url={signedUrl} filename={doc.file_name} />
                )}
                {previewType === 'image' && (
                  <PreviewImage url={signedUrl} filename={doc.file_name} />
                )}
                {previewType === 'tiff' && (
                  <PreviewTiff url={signedUrl} filename={doc.file_name} />
                )}
                {previewType === 'udf' && (
                  <PreviewUDF url={signedUrl} filename={doc.file_name} />
                )}
                {previewType === 'unsupported' && (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                    <File className="w-16 h-16 text-muted-foreground/30" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">Önizleme desteklenmiyor</p>
                      <p className="text-xs mt-1">
                        <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[11px]">
                          .{getFileExtension(doc.file_name)}
                        </span>{' '}
                        dosyaları için önizleme mevcut değil.
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
                      <Download className="w-4 h-4" />
                      Dosyayı İndir
                    </Button>
                  </div>
                )}
              </Suspense>
            )}
          </div>
          
          {doc.description && (
            <div className="w-80 border-l border-border/50 bg-muted/10 overflow-y-auto p-5 hidden md:block">
              <div className="flex items-center gap-2 mb-4 text-amber-500 font-semibold">
                <Sparkles className="w-4 h-4" />
                <h4 className="text-sm">Belge Notları / AI Analizi</h4>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-muted-foreground whitespace-pre-wrap">
                {/* Since we have AI Markdown, we'll try to just render it directly or use react-markdown if installed, but for safety we just use white-space-pre-wrap */}
                {doc.description}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
