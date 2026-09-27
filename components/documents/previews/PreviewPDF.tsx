'use client'

interface PreviewPDFProps {
  url: string
  filename: string
}

export default function PreviewPDF({ url, filename }: PreviewPDFProps) {
  return (
    <div className="flex flex-col h-full gap-2">
      {/* PDF embed — tüm modern tarayıcılarda yerleşik PDF görüntüleyici */}
      <embed
        src={`${url}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
        type="application/pdf"
        className="w-full flex-1 min-h-[500px] rounded-xl border border-border/40"
        title={filename}
      />
      {/* Embed desteklenmeyen tarayıcılar için fallback */}
      <noscript>
        <p className="text-sm text-center text-muted-foreground">
          PDF görüntüleyici yüklenemedi.{' '}
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
            PDF'yi yeni sekmede aç
          </a>
        </p>
      </noscript>
    </div>
  )
}
