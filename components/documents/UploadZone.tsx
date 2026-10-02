'use client'

import { useCallback, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FolderOpen, CheckCircle2, XCircle,
  Loader2, AlertTriangle, X, FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  readDroppedItems, matchClientByFolderName,
  getFileExtension, fileTypeColor,
  type ClientForMatch, type FolderFile,
} from '@/lib/utils/folder-matcher'
import {
  buildStoragePath, uploadFile, mimeToFileType, formatFileSize,
} from '@/lib/supabase/storage'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { saveDocumentToStore } from '@/lib/mock-store'
import type { Document } from '@/lib/database.types'

// ── Tipler ───────────────────────────────────────────────────────────────────

interface UploadItem {
  id: string
  file: File
  storagePath: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  progress: number
  error?: string
}

interface MatchState {
  folderName: string
  files: FolderFile[]
  clientMatch: ReturnType<typeof matchClientByFolderName>
}

export interface UploadZoneProps {
  userId: string
  clientId?: string           // Önceden seçili müvekkil (dosya detay sayfası)
  caseId?: string             // Önceden seçili dosya
  clients?: ClientForMatch[]  // Klasör eşleştirme için
  onUploadComplete?: (docs: Document[]) => void
  className?: string
}

// ── Progress çubuğu ───────────────────────────────────────────────────────────
function ProgressBar({ value, status }: { value: number; status: UploadItem['status'] }) {
  return (
    <div className="h-1 bg-muted rounded-full overflow-hidden w-full">
      <motion.div
        className={cn(
          'h-full rounded-full',
          status === 'done' ? 'bg-emerald-500' :
          status === 'error' ? 'bg-red-500' :
          'bg-primary'
        )}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  )
}

// ── Müvekkil eşleşme onay diyaloğu ───────────────────────────────────────────
function MatchConfirmDialog({
  match,
  fileCount,
  onConfirm,
  onCancel,
}: {
  match: MatchState
  fileCount: number
  onConfirm: (clientId: string, caseId: string | null) => void
  onCancel: () => void
}) {
  const { clientMatch, folderName } = match

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 8 }}
      className="rounded-2xl border border-border/50 bg-card shadow-xl p-5 space-y-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
          <FolderOpen className="w-5 h-5 text-indigo-500" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Klasör tanındı</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">{folderName}</span>
          </p>
        </div>
      </div>

      {clientMatch ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/40">
            <div>
              <p className="text-xs text-muted-foreground">Eşleşen Müvekkil</p>
              <p className="font-semibold text-sm">{clientMatch.client.full_name}</p>
            </div>
            <Badge
              className={cn(
                'text-[10px] h-5',
                clientMatch.confidence === 'high'
                  ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-600 border-amber-500/30'
              )}
            >
              {clientMatch.score}% eşleşme
            </Badge>
          </div>

          {clientMatch.confidence === 'medium' && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Eşleşme kesin değil. Lütfen doğrulayın.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-muted/40 border border-border/40 text-center">
          <p className="text-sm text-muted-foreground">Müvekkil eşleşmesi bulunamadı.</p>
          <p className="text-xs text-muted-foreground mt-0.5">Belgeler genel klasöre yüklenecek.</p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{fileCount}</span> dosya yüklenecek
      </p>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} className="flex-1">
          İptal
        </Button>
        <Button
          size="sm"
          className="flex-1 gap-2"
          onClick={() => onConfirm(clientMatch?.client.id ?? '', null)}
        >
          <Upload className="w-3.5 h-3.5" />
          Yükle
        </Button>
      </div>
    </motion.div>
  )
}

// ── Ana bileşen ───────────────────────────────────────────────────────────────

export default function UploadZone({
  userId,
  clientId: propClientId,
  caseId: propCaseId,
  clients = [],
  onUploadComplete,
  className,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [matchState, setMatchState] = useState<MatchState | null>(null)
  const [items, setItems] = useState<UploadItem[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
  const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'image/jpeg', 'image/png', 'image/tiff', 'application/octet-stream']
  const ALLOWED_EXTS = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.jpg', '.jpeg', '.png', '.tiff', '.tif', '.udf']

  const validateFiles = (files: FolderFile[]): FolderFile[] => {
    setGlobalError(null)
    const validFiles: FolderFile[] = []
    const errors: string[] = []

    files.forEach(({ file, relativePath }) => {
      const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '')
      if (!ALLOWED_EXTS.includes(ext) && !ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name} desteklenmeyen bir dosya formatı.`)
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name} boyutu 50MB'den büyük.`)
        return
      }
      validFiles.push({ file, relativePath })
    })

    if (errors.length > 0) {
      setGlobalError(errors.join(' '))
      setTimeout(() => setGlobalError(null), 5000)
    }
    return validFiles
  }

  // ── Dosya listesi oluştur ─────────────────────────────────────────────────
  function buildUploadItems(
    folderFiles: FolderFile[],
    clientId: string,
    caseId: string | null,
  ): UploadItem[] {
    return folderFiles.map(({ file }) => ({
      id: crypto.randomUUID(),
      file,
      storagePath: buildStoragePath(userId, clientId, caseId, file.name),
      status: 'pending' as const,
      progress: 0,
    }))
  }

  // ── Sürükle bırak ─────────────────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => setIsDragging(false), [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const { folderName, files: droppedFiles } = await readDroppedItems(e.dataTransfer)
    
    const files = validateFiles(droppedFiles)
    if (!files.length) return

    // Önceden müvekkil seçiliyse direkt yüklemeye geç
    if (propClientId) {
      const uploadItems = buildUploadItems(files, propClientId, propCaseId ?? null)
      setItems(uploadItems)
      startUpload(uploadItems, propClientId, propCaseId ?? null)
      return
    }

    // Klasör bırakıldıysa eşleştirme diyaloğunu göster
    if (folderName && clients.length > 0) {
      const clientMatch = matchClientByFolderName(folderName, clients)
      setMatchState({ folderName, files, clientMatch })
      return
    }

    // Eşleştirme yoksa genel yükleme
    const uploadItems = buildUploadItems(files, 'genel', null)
    setItems(uploadItems)
    startUpload(uploadItems, 'genel', null)
  }, [propClientId, propCaseId, clients]) // eslint-disable-line

  // ── Input değişimi (dosya/klasör seçimi) ──────────────────────────────────
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList?.length) return
    const folderFiles = validateFiles(Array.from(fileList).map(f => ({
      file: f,
      relativePath: f.webkitRelativePath || f.name,
    })))
    if (!folderFiles.length) return

    const clientId = propClientId ?? 'genel'
    const uploadItems = buildUploadItems(folderFiles, clientId, propCaseId ?? null)
    setItems(uploadItems)
    startUpload(uploadItems, clientId, propCaseId ?? null)
    e.target.value = ''
  }, [propClientId, propCaseId]) // eslint-disable-line

  // ── Eşleşme onayı ─────────────────────────────────────────────────────────
  const handleMatchConfirm = useCallback((clientId: string, caseId: string | null) => {
    if (!matchState) return
    const uploadItems = buildUploadItems(matchState.files, clientId || 'genel', caseId)
    setMatchState(null)
    setItems(uploadItems)
    startUpload(uploadItems, clientId || 'genel', caseId)
  }, [matchState]) // eslint-disable-line

  // ── Yükleme işlemi ────────────────────────────────────────────────────────
  const startUpload = useCallback(async (
    uploadItems: UploadItem[],
    clientId: string,
    caseId: string | null,
  ) => {
    setIsUploading(true)
    const supabase = createClient()
    const uploadedDocs: Document[] = []

    for (let i = 0; i < uploadItems.length; i++) {
      const item = uploadItems[i]

      setItems(prev => prev.map(p =>
        p.id === item.id ? { ...p, status: 'uploading', progress: 5 } : p
      ))

      // Supabase Storage'a yükle
      const result = await uploadFile(item.storagePath, item.file, (pct) => {
        setItems(prev => prev.map(p =>
          p.id === item.id ? { ...p, progress: pct } : p
        ))
      })

      if (result.error) {
        setItems(prev => prev.map(p =>
          p.id === item.id ? { ...p, status: 'error', progress: 0, error: result.error! } : p
        ))
        continue
      }

      // Documents tablosuna kaydet
      let docToSave: Document | null = null

      if (isSupabaseConfigured()) {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          const activeUserId = user ? user.id : userId

          const { data: doc, error: dbError } = await supabase
            .from('documents')
            .insert({
              user_id: activeUserId,
              client_id: clientId === 'genel' ? null : clientId,
              case_id: caseId,
              file_name: item.file.name,
              file_path: result.path,
              mime_type: item.file.type || null,
              file_size: item.file.size,
            } as any)
            .select()
            .single()

          if (dbError) {
            setItems(prev => prev.map(p =>
              p.id === item.id ? { ...p, status: 'error', progress: 0, error: 'Veritabanına kaydedilemedi: ' + dbError.message } : p
            ))
            continue
          }
          if (doc) {
            docToSave = doc as Document
          }
        } catch (e) {
          console.warn('Supabase DB insert error', e)
          setItems(prev => prev.map(p =>
            p.id === item.id ? { ...p, status: 'error', progress: 0, error: 'Bilinmeyen veritabanı hatası' } : p
          ))
          continue
        }
      } else {
        // Mock Store fallback for offline mode
        docToSave = {
          id: crypto.randomUUID(),
          user_id: userId || 'demo-user-id',
          client_id: clientId === 'genel' ? null : clientId,
          case_id: caseId,
          file_name: item.file.name,
          storage_path: result.path,
          file_path: result.path,
          file_type: mimeToFileType(item.file.type, item.file.name),
          mime_type: item.file.type || null,
          file_size: item.file.size,
          description: null,
          folder_name: matchState?.folderName ?? null,
          uploaded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        saveDocumentToStore(docToSave)
      }

      setItems(prev => prev.map(p =>
        p.id === item.id ? { ...p, status: 'done', progress: 100 } : p
      ))

      if (docToSave) {
        uploadedDocs.push(docToSave)
      }
    }

    setIsUploading(false)
    if (uploadedDocs.length) {
      onUploadComplete?.(uploadedDocs)
    }
  }, [userId, matchState, onUploadComplete])

  const clearItems = () => setItems([])
  const doneCount = items.filter(i => i.status === 'done').length
  const errorCount = items.filter(i => i.status === 'error').length

  return (
    <div className={cn('space-y-4', className)}>
      {/* ── Eşleşme diyaloğu ───────────────────────────────────────────── */}
      <AnimatePresence>
        {matchState && (
          <MatchConfirmDialog
            match={matchState}
            fileCount={matchState.files.length}
            onConfirm={handleMatchConfirm}
            onCancel={() => setMatchState(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Hata Mesajı ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {globalError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{globalError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Drop zone ─────────────────────────────────────────────────── */}
      {!items.length && !matchState && (
        <motion.div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          animate={{
            borderColor: isDragging ? 'var(--primary)' : 'var(--border)',
            backgroundColor: isDragging ? 'rgba(99, 102, 241, 0.05)' : 'rgba(0, 0, 0, 0)',
          }}
          className={cn(
            'relative rounded-2xl border-2 border-dashed transition-all cursor-pointer',
            'flex flex-col items-center justify-center gap-4 p-8 min-h-[200px]',
            isDragging && 'scale-[1.01]'
          )}
        >
          <motion.div
            animate={{ scale: isDragging ? 1.15 : 1 }}
            className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center"
          >
            {isDragging
              ? <FolderOpen className="w-7 h-7 text-primary" />
              : <Upload className="w-7 h-7 text-primary/70" />
            }
          </motion.div>

          <div className="text-center">
            <p className="font-semibold text-foreground">
              {isDragging ? 'Bırakın!' : 'Dosya veya klasör bırakın'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              PDF, PNG, JPG, TIFF, UDF, DOCX, XLSX
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Müvekkil klasörü bıraktığınızda otomatik tanıma yapılır
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              id="upload-file-btn"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
            >
              <FileText className="w-3.5 h-3.5" />
              Dosya Seç
            </Button>
            <Button
              id="upload-folder-btn"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={(e) => { e.stopPropagation(); folderInputRef.current?.click() }}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Klasör Seç
            </Button>
          </div>

          {/* Gizli input'lar */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />
          <input
            ref={folderInputRef}
            type="file"
            // @ts-expect-error webkitdirectory HTML5 attribute
            webkitdirectory=""
            directory=""
            multiple
            className="hidden"
            onChange={handleFileInput}
          />
        </motion.div>
      )}

      {/* ── Yükleme listesi ───────────────────────────────────────────── */}
      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border/50 bg-card overflow-hidden"
          >
            {/* Başlık */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/20">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">
                  {isUploading ? 'Yükleniyor…' : 'Yükleme Tamamlandı'}
                </p>
                {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
                {!isUploading && doneCount > 0 && (
                  <Badge className="h-5 text-[10px] bg-emerald-500/15 text-emerald-600 border-emerald-500/30">
                    {doneCount} başarılı
                  </Badge>
                )}
                {errorCount > 0 && (
                  <Badge className="h-5 text-[10px] bg-red-500/15 text-red-600 border-red-500/30">
                    {errorCount} hata
                  </Badge>
                )}
              </div>
              {!isUploading && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearItems}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>

            {/* Dosya listesi */}
            <div className="divide-y divide-border/30 max-h-72 overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                  {/* Durum ikonu */}
                  <div className="flex-shrink-0">
                    {item.status === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {item.status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                    {item.status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                    {item.status === 'pending' && (
                      <div className="w-4 h-4 rounded-full border-2 border-border" />
                    )}
                  </div>

                  {/* Dosya bilgisi */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className={cn('text-xs font-medium truncate', fileTypeColor(item.file.name))}>
                        {item.file.name}
                      </p>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {formatFileSize(item.file.size)}
                      </span>
                    </div>
                    {item.status !== 'pending' && (
                      <ProgressBar value={item.progress} status={item.status} />
                    )}
                    {item.error && (
                      <p className="text-[10px] text-red-500">{item.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Yeni yükleme butonu */}
            {!isUploading && (
              <div className="px-4 py-3 border-t border-border/40">
                <Button
                  id="upload-more-btn"
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-xs"
                  onClick={() => { clearItems(); fileInputRef.current?.click() }}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Daha Fazla Yükle
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
