'use client'

import { useState, useEffect } from 'react'
import { Folder, FileText, Download, ArrowLeft, RefreshCcw, Eye, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

const LOCAL_SERVER_URL = 'http://localhost:4000'

interface LocalFileBrowserProps {
  initialPath?: string;
}

export default function LocalFileBrowser({ initialPath = '' }: LocalFileBrowserProps) {
  const [currentPath, setCurrentPath] = useState(initialPath)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [previewItem, setPreviewItem] = useState<any>(null)
  const [previewType, setPreviewType] = useState<'image' | 'pdf' | 'text' | 'unsupported'>('unsupported')
  const [previewContent, setPreviewContent] = useState<string>('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<string>('')
  const [analyzing, setAnalyzing] = useState(false)

  const fetchFiles = async (path: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${LOCAL_SERVER_URL}/api/files?path=${encodeURIComponent(path)}`)
      if (!res.ok) {
        throw new Error('Yerel sunucuya bağlanılamadı. Masaüstündeki server.js çalışıyor mu?')
      }
      const data = await res.json()
      setItems(data.items)
      setCurrentPath(data.currentPath)
    } catch (err: any) {
      setError(err.message)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles(initialPath)
  }, [initialPath])

  const handleNavigate = (newPath: string) => {
    fetchFiles(newPath)
  }

  const handleBack = () => {
    // If we are at the initialPath, don't allow going back further than initialPath if we want to lock them in?
    // Actually, allowing full navigation is fine, but if we are at root, disable.
    if (!currentPath) return
    if (currentPath === initialPath) return // prevent escaping the initial sandbox if needed. Actually let's allow it, but stop at root.
    
    const parts = currentPath.split(/[\/\\]/).filter(Boolean)
    parts.pop()
    fetchFiles(parts.join('/'))
  }

  const handleDownload = (filePath: string) => {
    window.open(`${LOCAL_SERVER_URL}/api/download?path=${encodeURIComponent(filePath)}`, '_blank')
  }

  const handlePreview = async (item: any) => {
    setPreviewItem(item)
    setAiAnalysis('')
    
    const ext = item.name.split('.').pop()?.toLowerCase()
    
    if (ext === 'pdf') {
      setPreviewType('pdf')
      setPreviewContent(`${LOCAL_SERVER_URL}/api/download?path=${encodeURIComponent(item.path)}`)
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      setPreviewType('image')
      setPreviewContent(`${LOCAL_SERVER_URL}/api/download?path=${encodeURIComponent(item.path)}`)
    } else if (ext === 'udf' || ext === 'pdf') {
      // For UDF (or if we want text preview of PDF)
      setPreviewType('text')
      setPreviewLoading(true)
      try {
        const res = await fetch(`${LOCAL_SERVER_URL}/api/extract?path=${encodeURIComponent(item.path)}`)
        const data = await res.json()
        if (data.success) {
          setPreviewContent(data.text)
        } else {
          setPreviewContent(`Hata: ${data.error}`)
        }
      } catch (err: any) {
        setPreviewContent(`Bağlantı hatası: ${err.message}`)
      } finally {
        setPreviewLoading(false)
      }
    } else {
      setPreviewType('unsupported')
      setPreviewContent('')
    }
  }

  const handleAnalyze = async () => {
    if (previewType !== 'text' && previewType !== 'pdf') return
    
    setAnalyzing(true)
    try {
      let textToAnalyze = previewContent;
      
      if (previewType === 'pdf') {
        // Fetch text from local server first
        const extractRes = await fetch(`${LOCAL_SERVER_URL}/api/extract?path=${encodeURIComponent(previewItem.path)}`)
        const extractData = await extractRes.json()
        if (extractData.success) {
          textToAnalyze = extractData.text
        } else {
          throw new Error('Metin çıkarılamadı: ' + extractData.error)
        }
      }

      const res = await fetch('/api/ai/analyze-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToAnalyze, filename: previewItem.name })
      })
      const data = await res.json()
      if (data.analysis) {
        setAiAnalysis(data.analysis)
      } else {
        setAiAnalysis('Hata: ' + (data.error || 'Bilinmeyen bir hata oluştu.'))
      }
    } catch (err: any) {
      setAiAnalysis('Bağlantı hatası: ' + err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border/50 pb-4">
        <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-xl border border-border/50 flex-1">
          <Button variant="ghost" size="sm" onClick={handleBack} disabled={!currentPath || loading}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Geri
          </Button>
          <div className="text-sm font-medium text-foreground opacity-80 font-mono bg-background px-3 py-1.5 rounded-lg border border-border/50 truncate">
            Root / {currentPath.replace(/\\/g, '/')}
          </div>
        </div>
        <Button variant="outline" className="gap-2 shrink-0" onClick={() => fetchFiles(currentPath)}>
          <RefreshCcw className="w-4 h-4" /> Yenile
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 rounded-xl text-sm border border-red-500/20">
          {error}
        </div>
      )}

      {/* File List */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground animate-pulse">Dosyalar yükleniyor...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">Bu klasörde öğe bulunmuyor.</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-muted/50 border-b border-border/50">
                <th className="px-6 py-4 font-semibold text-muted-foreground">Ad</th>
                <th className="px-6 py-4 font-semibold text-muted-foreground w-32">Boyut</th>
                <th className="px-6 py-4 font-semibold text-muted-foreground w-48 hidden md:table-cell">Tarih</th>
                <th className="px-6 py-4 font-semibold text-muted-foreground w-24">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      {item.isDirectory ? (
                        <Folder className="w-5 h-5 text-indigo-400 shrink-0 fill-indigo-400/20" />
                      ) : (
                        <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                      )}
                      {item.isDirectory ? (
                        <button 
                          onClick={() => handleNavigate(item.path)}
                          className="font-medium hover:text-indigo-500 hover:underline transition-all text-left truncate"
                        >
                          {item.name}
                        </button>
                      ) : (
                        <span className="font-medium text-foreground/80 truncate">{item.name}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">
                    {item.isDirectory ? '-' : formatSize(item.size)}
                  </td>
                  <td className="px-6 py-3 text-muted-foreground hidden md:table-cell">
                    {new Date(item.lastModified).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-3">
                    {!item.isDirectory && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={() => handlePreview(item)} className="h-8">
                          <Eye className="w-4 h-4 mr-1.5" /> Önizle
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(item.path)} className="h-8">
                          <Download className="w-4 h-4 mr-1.5" /> İndir
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col overflow-hidden p-0 gap-0">
          <DialogHeader className="p-4 border-b border-border/50 bg-muted/20 shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" /> 
                {previewItem?.name}
              </DialogTitle>
              {(previewType === 'text' || previewType === 'pdf') && !aiAnalysis && (
                <Button onClick={handleAnalyze} disabled={analyzing || previewLoading} size="sm" className="gap-2">
                  <Sparkles className="w-4 h-4" /> {analyzing ? 'Analiz Ediliyor...' : 'AI ile Analiz Et'}
                </Button>
              )}
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex relative bg-background/50">
            {/* Left side: Content preview */}
            <div className={`flex-1 overflow-hidden flex flex-col ${aiAnalysis ? 'border-r border-border/50' : ''}`}>
              {previewLoading ? (
                <div className="flex items-center justify-center h-full text-muted-foreground animate-pulse">
                  Dosya içeriği okunuyor...
                </div>
              ) : previewType === 'image' ? (
                <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-black/5">
                  <img src={previewContent} alt={previewItem?.name} className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
                </div>
              ) : previewType === 'pdf' ? (
                <iframe src={previewContent} className="w-full h-full border-0" />
              ) : previewType === 'text' ? (
                <ScrollArea className="flex-1 p-6">
                  <div className="whitespace-pre-wrap font-mono text-sm opacity-90 leading-relaxed">
                    {previewContent}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
                  <p className="mb-4">Bu dosya formatının doğrudan önizlemesi desteklenmiyor.</p>
                  <Button variant="outline" onClick={() => handleDownload(previewItem?.path)}>
                    <Download className="w-4 h-4 mr-2" /> Dosyayı İndir
                  </Button>
                </div>
              )}
            </div>

            {/* Right side: AI Analysis Panel */}
            {aiAnalysis && (
              <div className="w-1/3 min-w-[300px] flex flex-col bg-muted/10">
                <div className="p-3 border-b border-border/50 font-semibold text-sm flex items-center gap-2 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-4 h-4" /> Yapay Zeka Analizi
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="prose prose-sm dark:prose-invert">
                    {aiAnalysis.split('\n').map((line, i) => (
                      <p key={i} className="mb-2">{line}</p>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
