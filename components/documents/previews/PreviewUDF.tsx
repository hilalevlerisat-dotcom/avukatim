'use client'

import { useEffect, useState } from 'react'
import { Loader2, AlertCircle, FileText, ChevronDown, ChevronRight } from 'lucide-react'

interface PreviewUDFProps {
  url: string
  filename: string
}

// ── UDF içerik ayrıştırıcı ────────────────────────────────────────────────────

interface UDFContent {
  metadata: Record<string, string>
  html: string
  files: string[]
}

/**
 * UYAP UDF formatı: ZIP tabanlı arşiv.
 * İçindeki olası dosyalar: content.xml, document.xml, metadata.xml, styles.xml
 * Bu parser XML yapısını HTML'e dönüştürür.
 */
async function parseUDF(buffer: ArrayBuffer): Promise<UDFContent> {
  const JSZip = (await import('jszip')).default
  const zip = await JSZip.loadAsync(buffer)

  const files = Object.keys(zip.files).filter(f => !zip.files[f].dir)
  const metadata: Record<string, string> = {}
  let html = ''

  // ── Metadata XML ────────────────────────────────────────────────────────
  const metaFile =
    zip.file('metadata.xml') ??
    zip.file('Metadata.xml') ??
    zip.file('META-INF/metadata.xml')

  if (metaFile) {
    const xmlStr = await metaFile.async('string')
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlStr, 'application/xml')
    doc.querySelectorAll('*').forEach((el) => {
      const tag = el.localName
      const val = el.textContent?.trim()
      if (val && !el.children.length) metadata[tag] = val
    })
  }

  // ── İçerik XML ─────────────────────────────────────────────────────────
  const contentFile =
    zip.file('content.xml') ??
    zip.file('Content.xml') ??
    zip.file('document.xml') ??
    zip.file('Document.xml') ??
    zip.file('body.xml') ??
    files.find(f => f.endsWith('.xml') && !f.includes('metadata') && !f.includes('style'))
      ? zip.file(files.find(f => f.endsWith('.xml') && !f.includes('metadata') && !f.includes('style'))!)
      : null

  if (contentFile) {
    const xmlStr = await contentFile.async('string')
    html = xmlToHtml(xmlStr)
  } else if (files.length) {
    // Hiç XML yoksa dosya listesini göster
    html = `<p class="text-muted">Bu UDF dosyası okunabilir içerik barındırmıyor.</p>
<ul>${files.map(f => `<li><code>${f}</code></li>`).join('')}</ul>`
  }

  return { metadata, html, files }
}

/** UYAP XML → HTML dönüştürücü */
function xmlToHtml(xmlStr: string): string {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlStr, 'application/xml')

  // Parse error kontrolü
  const parseError = xmlDoc.querySelector('parsererror')
  if (parseError) {
    // XML geçersizse ham metin göster
    return `<pre class="uyap-raw">${escapeHtml(xmlStr.slice(0, 8000))}</pre>`
  }

  return nodeToHtml(xmlDoc.documentElement)
}

function nodeToHtml(node: Element | Document): string {
  if (node.nodeType === Node.DOCUMENT_NODE) {
    return nodeToHtml((node as Document).documentElement)
  }

  const el = node as Element
  const tag = el.localName?.toLowerCase() ?? ''
  const children = Array.from(el.childNodes)
    .map(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        return escapeHtml(child.textContent ?? '')
      }
      if (child.nodeType === Node.ELEMENT_NODE) {
        return nodeToHtml(child as Element)
      }
      return ''
    })
    .join('')

  // UYAP özel etiket haritası → HTML
  const tagMap: Record<string, string> = {
    belge: 'article',
    dilekce: 'article',
    document: 'article',
    body: 'div',
    paragraf: 'p',
    paragraph: 'p',
    para: 'p',
    satir: 'p',
    line: 'p',
    baslik: 'h2',
    title: 'h2',
    heading: 'h2',
    altbaslik: 'h3',
    tablo: 'table',
    table: 'table',
    satir_tablo: 'tr',
    row: 'tr',
    hucre: 'td',
    cell: 'td',
    td: 'td',
    th: 'th',
    liste: 'ul',
    list: 'ul',
    madde: 'li',
    item: 'li',
    kalin: 'strong',
    bold: 'strong',
    b: 'strong',
    italik: 'em',
    italic: 'em',
    i: 'em',
    alti_cizili: 'u',
    underline: 'u',
  }

  const htmlTag = tagMap[tag]
  if (htmlTag) {
    return `<${htmlTag} class="uyap-${tag}">${children}</${htmlTag}>`
  }

  // Bilinmeyen etiket → span
  if (children.trim()) {
    return `<span class="uyap-${tag}">${children}</span>`
  }
  return children
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ── Bileşen ───────────────────────────────────────────────────────────────────

export default function PreviewUDF({ url, filename }: PreviewUDFProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [content, setContent] = useState<UDFContent | null>(null)
  const [showMeta, setShowMeta] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setStatus('loading')
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const buf = await res.arrayBuffer()
        const parsed = await parseUDF(buf)
        if (!cancelled) {
          setContent(parsed)
          setStatus('ready')
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'UDF dosyası okunamadı.')
          setStatus('error')
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [url])

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm">UDF dosyası çözümleniyor…</p>
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

  const meta = content?.metadata ?? {}
  const metaKeys = Object.keys(meta)

  return (
    <div className="flex flex-col gap-4">
      {/* Metadata şeridi */}
      {metaKeys.length > 0 && (
        <div className="rounded-xl border border-border/40 bg-muted/30 overflow-hidden">
          <button
            onClick={() => setShowMeta(m => !m)}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            <FileText className="w-4 h-4 text-indigo-500" />
            UYAP Metadata ({metaKeys.length} alan)
            {showMeta ? <ChevronDown className="w-3.5 h-3.5 ml-auto" /> : <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
          </button>
          {showMeta && (
            <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs border-t border-border/40 pt-3">
              {metaKeys.map(k => (
                <div key={k} className="flex gap-2">
                  <span className="text-muted-foreground font-medium min-w-28 capitalize">{k}:</span>
                  <span className="text-foreground truncate">{meta[k]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* UYAP içerik alanı */}
      <div
        className="uyap-viewer rounded-xl border border-border/40 bg-card p-6 overflow-auto max-h-[60vh] prose prose-sm dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: content?.html ?? '<p>İçerik bulunamadı.</p>' }}
      />

      {/* Arşiv dosyaları */}
      {content && content.files.length > 0 && (
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Arşiv içeriği:</span>{' '}
          {content.files.join(' • ')}
        </div>
      )}
    </div>
  )
}
