'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PreviewTiffProps {
  url: string
  filename: string
}

export default function PreviewTiff({ url, filename }: PreviewTiffProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [pageCount, setPageCount] = useState(1)
  const [currentPage, setCurrentPage] = useState(0)
  const [pages, setPages] = useState<ImageData[]>([])

  useEffect(() => {
    let cancelled = false

    async function loadTiff() {
      try {
        setStatus('loading')

        // 1. İmzalı URL'den ham buffer yükle
        const response = await fetch(url)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const buffer = await response.arrayBuffer()

        // 2. UTIF ile decode et (lazy import — SSR'dan kaçın)
        const UTIF = (await import('utif')).default

        const ifds = UTIF.decode(buffer)
        UTIF.decodeImages(buffer, ifds)

        if (!ifds.length) throw new Error('TIFF içinde görüntü bulunamadı.')

        // 3. Her sayfayı ImageData'ya dönüştür
        const imageDataList: ImageData[] = ifds.map((ifd) => {
          const rgba = UTIF.toRGBA8(ifd)
          const w = ifd.width
          const h = ifd.height
          const imgData = new ImageData(new Uint8ClampedArray(rgba.buffer as ArrayBuffer), w, h)
          return imgData
        })

        if (cancelled) return

        setPages(imageDataList)
        setPageCount(imageDataList.length)
        setCurrentPage(0)
        setStatus('ready')
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'TIFF yüklenemedi.')
          setStatus('error')
        }
      }
    }

    loadTiff()
    return () => { cancelled = true }
  }, [url])

  // Sayfa değişince canvas'ı güncelle
  useEffect(() => {
    if (status !== 'ready' || !canvasRef.current || !pages[currentPage]) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    const imgData = pages[currentPage]
    canvas.width = imgData.width
    canvas.height = imgData.height
    ctx.putImageData(imgData, 0, 0)
  }, [status, currentPage, pages])

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm">TIFF dosyası yükleniyor…</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-destructive">
        <AlertCircle className="w-8 h-8" />
        <p className="text-sm font-medium">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Sayfa navigasyonu (çok sayfalı TIFF için) */}
      {pageCount > 1 && (
        <div className="flex items-center gap-3">
          <Button
            variant="outline" size="icon"
            disabled={currentPage === 0}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Sayfa {currentPage + 1} / {pageCount}
          </span>
          <Button
            variant="outline" size="icon"
            disabled={currentPage === pageCount - 1}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Canvas çıktısı */}
      <div className="w-full overflow-auto rounded-xl border border-border/40 bg-checkerboard">
        <canvas
          ref={canvasRef}
          className="max-w-full h-auto block mx-auto"
          title={filename}
        />
      </div>
    </div>
  )
}
