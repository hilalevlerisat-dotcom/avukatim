'use client'

import { useState, useEffect } from 'react'
import { Folder, FileText, Download, ArrowLeft, Server, HardDrive, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

const LOCAL_SERVER_URL = 'http://localhost:4000'

export default function YerelArsivPage() {
  const [currentPath, setCurrentPath] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
    fetchFiles('')
  }, [])

  const handleNavigate = (newPath: string) => {
    fetchFiles(newPath)
  }

  const handleBack = () => {
    if (!currentPath) return
    const parts = currentPath.split(/[\/\\]/).filter(Boolean)
    parts.pop()
    fetchFiles(parts.join('/'))
  }

  const handleDownload = (filePath: string) => {
    window.open(`${LOCAL_SERVER_URL}/api/download?path=${encodeURIComponent(filePath)}`, '_blank')
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border/50 pb-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20 text-white">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              Yerel Arşiv (Offline Dosyalar)
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {error ? <span className="text-red-500">{error}</span> : 'Masaüstünüzdeki 36GB dev arşive doğrudan, buluta yüklemeden erişiyorsunuz.'}
            </p>
          </div>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => fetchFiles(currentPath)}>
          <RefreshCcw className="w-4 h-4" /> Yenile
        </Button>
      </div>

      {/* Breadcrumb & Back */}
      <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-xl border border-border/50">
        <Button variant="ghost" size="sm" onClick={handleBack} disabled={!currentPath || loading}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Geri
        </Button>
        <div className="text-sm font-medium text-foreground opacity-80 font-mono bg-background px-3 py-1.5 rounded-lg border border-border/50">
          Root / {currentPath.replace(/\\/g, '/')}
        </div>
      </div>

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
                      <Button variant="ghost" size="sm" onClick={() => handleDownload(item.path)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Download className="w-4 h-4 mr-1.5" /> İndir
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
