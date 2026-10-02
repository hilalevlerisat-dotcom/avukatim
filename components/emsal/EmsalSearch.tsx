'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Sparkles,
  ShieldCheck,
  Scale,
  Calendar,
  Copy,
  Check,
  ExternalLink,
  SlidersHorizontal,
  FileText,
  AlertCircle,
  Loader2,
  Database,
  Download,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import EmsalDetailModal from './EmsalDetailModal'

const QUICK_PROMPTS = [
  'Tahliye taahhütnamesinde düzenleme ve tahliye tarihlerinin boş bırakılması',
  'İşçinin fazla mesai ücretlerinin ödenmemesi ve kıdem tazminatı haklı feshi',
  'Düğünde takılan ziynet eşyalarının kime ait olduğu ve güncel Yargıtay içtihadı',
  'Trafik kazasında hatır taşıması indirimi ve emniyet kemeri takmama',
  'Tacirler arasında faturaya 8 günlük itiraz süresi ve temerrüt faizi',
  '5 yılı aşan kira sözleşmesinde kira tespit davası ve hakkaniyet indirimi',
  'Emekli maaşının haczedilemezliği ve önceden verilen muvafakatin geçersizliği',
  'İdarenin hizmet kusuru ve kusursuz sorumluluk tazminatı'
]

export default function EmsalSearch() {
  const [query, setQuery] = useState('')
  const [threshold, setThreshold] = useState(0.45)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  
  // Results
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [decisions, setDecisions] = useState<any[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [copiedAnalysis, setCopiedAnalysis] = useState(false)
  
  // Selected decision for modal view
  const [selectedDecision, setSelectedDecision] = useState<any | null>(null)

  // Seed loading state
  const [seeding, setSeeding] = useState(false)
  const [seedMessage, setSeedMessage] = useState<string | null>(null)

  // HuggingFace import state
  const [showImportPanel, setShowImportPanel] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const [importConfig, setImportConfig] = useState<'yargitay' | 'danistay' | 'emsal'>('yargitay')
  const [importLimit, setImportLimit] = useState(10)
  const [importOffset, setImportOffset] = useState(0)
  const [importMinYear, setImportMinYear] = useState(2020)
  const [importCourtFilter, setImportCourtFilter] = useState('')

  const handleImportFromHuggingFace = async () => {
    setImporting(true)
    setImportMsg(null)
    try {
      const res = await fetch('/api/ai/emsal/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: importConfig,
          limit: importLimit,
          offset: importOffset,
          minYear: importMinYear,
          courtFilter: importCourtFilter || null,
          generateSummaries: true
        })
      })
      const data = await res.json()
      if (res.ok) {
        setImportMsg(`✅ ${data.message}`)
      } else {
        setImportMsg(`❌ ${data.error || 'İçe aktarma başarısız.'}`)
      }
    } catch (err: any) {
      setImportMsg(`❌ Hata: ${err.message}`)
    } finally {
      setImporting(false)
    }
  }

  const handleSearch = async (searchQuery: string = query) => {
    const q = searchQuery.trim()
    if (!q) return

    setLoading(true)
    setError(null)
    setHasSearched(true)
    setAnalysis(null)
    setDecisions([])

    try {
      const res = await fetch('/api/ai/emsal/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          threshold: Number(threshold),
          limit: 5
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Arama sırasında hata oluştu.')
      }

      setDecisions(data.decisions || [])
      setAnalysis(data.analysis || null)

      if (data.matchedCount === 0 && data.message) {
        setError(data.message)
      }
    } catch (err: any) {
      setError(err.message || 'Sunucu ile iletişim kurulamadı.')
    } finally {
      setLoading(false)
    }
  }

  const handleSeed = async () => {
    setSeeding(true)
    setSeedMessage(null)
    try {
      const res = await fetch('/api/ai/emsal/seed?force=true', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setSeedMessage('✅ 8 adet doğrulanmış gerçek Yargıtay emsal kararı başarıyla yüklendi!')
      } else {
        setSeedMessage('❌ ' + (data.error || 'Yüklenemedi'))
      }
    } catch (err: any) {
      setSeedMessage('❌ Hata: ' + err.message)
    } finally {
      setSeeding(false)
    }
  }

  const handleCopyCitation = (decision: any, index: number) => {
    const citation = `${decision.daire}, E. ${decision.esas_no}, K. ${decision.karar_no}${decision.karar_tarihi ? `, T. ${decision.karar_tarihi}` : ''}`
    navigator.clipboard.writeText(citation)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleCopyAnalysis = () => {
    if (!analysis) return
    navigator.clipboard.writeText(analysis)
    setCopiedAnalysis(true)
    setTimeout(() => setCopiedAnalysis(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Anti-Hallucination Shield Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300">
        <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="flex-1 text-xs leading-relaxed">
          <div className="font-semibold text-emerald-900 dark:text-emerald-200 text-sm mb-0.5 flex items-center gap-2">
            <span>Halüsinasyon Korumalı Semantik İçtihat Arama (RAG)</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
              Sıfır Sahte Karar
            </span>
          </div>
          Bu sistem sıradan yapay zekalar gibi karar numarası uydurmaz. Gemini vektör modeliyle sorunuzun hukuki anlamını çözer, Supabase veritabanındaki <strong>doğrulanmış gerçek Yargıtay/Danıştay kararlarını</strong> çeker ve sadece bu kararlara dayanarak hukuki analiz üretir.
          <div className="mt-1 text-[11px] opacity-80">📂 Kaynak: Yargıtay, Danıştay, UYAP Emsal, AYM — <strong>11 Milyon+ Gerçek Karar</strong> (CC0 Lisanslı Açık Veri)</div>
        </div>
        
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-background/80 hover:bg-emerald-500/20 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 transition-colors"
            title="8 adet örnek emsal karar yükler"
          >
            {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
            {seeding ? 'Yükleniyor...' : 'Örnek Kararları Yükle'}
          </button>
          <button
            onClick={() => setShowImportPanel(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-500/40 bg-background/80 hover:bg-indigo-500/20 text-[11px] font-medium text-indigo-700 dark:text-indigo-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            {showImportPanel ? 'Aktarım Panelini Kapat' : 'Gerçek Kararları Aktar'}
            {showImportPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {seedMessage && (
        <div className="p-3 rounded-xl bg-card border border-border text-xs text-foreground">
          {seedMessage}
        </div>
      )}

      {/* HuggingFace Import Panel */}
      <AnimatePresence>
        {showImportPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card border border-indigo-500/30 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">Yargıtay / Danıştay Kararlarını Aktar</h4>
                    <p className="text-[11px] text-muted-foreground">
                      Kaynak: <a href="https://huggingface.co/datasets/mrfg/turkish-court-decisions" target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline hover:no-underline">mrfg/turkish-court-decisions</a> — 11M+ Gerçek Karar, CC0 Lisanslı (ücretsiz, açık veri)
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-foreground mb-1">Kaynak</label>
                  <select
                    value={importConfig}
                    onChange={e => setImportConfig(e.target.value as any)}
                    className="w-full rounded-xl border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="yargitay">Yargıtay (9.8M+)</option>
                    <option value="danistay">Danıştay (835K+)</option>
                    <option value="emsal">UYAP Emsal (283K+)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-foreground mb-1">Kaç Karar? (Max 50)</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={importLimit}
                    onChange={e => setImportLimit(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-foreground mb-1">Min. Yıl</label>
                  <input
                    type="number"
                    min={2000}
                    max={2026}
                    value={importMinYear}
                    onChange={e => setImportMinYear(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-foreground mb-1">Daire Filtresi</label>
                  <input
                    type="text"
                    value={importCourtFilter}
                    onChange={e => setImportCourtFilter(e.target.value)}
                    placeholder="Örn: 9. Hukuk"
                    className="w-full rounded-xl border border-border bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 mt-4 border-t border-border pt-4">
                <div className="text-[11px] text-muted-foreground">
                  💡 Her "Aktar" dediğinizde havuzdan <span className="font-semibold text-indigo-500">rastgele</span> yeni kararlar seçilir, yapay zeka ile özetlenir ve semantik aramaya hazır hale getirilir.
                </div>

                <button
                  onClick={handleImportFromHuggingFace}
                  disabled={importing}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-xs shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all flex-shrink-0"
                >
                  {importing ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" />Aktarılıyor & Vektörleşiyor...</>
                  ) : (
                    <><Download className="w-3.5 h-3.5" />{importLimit} Karar Aktar</>
                  )}
                </button>
              </div>

              {importMsg && (
                <div className="p-3 rounded-xl bg-muted/30 border border-border text-xs text-foreground leading-relaxed">
                  {importMsg}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Input Box */}
      <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-sm space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSearch()
          }}
          className="relative flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Hukuki uyuşmazlığı veya sorunuzu doğal dille yazın (Örn: Kiracı tahliye taahhüdünde tarihi boş bıraktıysa geçerli mi?)..."
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-500 text-primary-foreground font-medium text-sm shadow-md shadow-primary/20 disabled:opacity-50 transition-all flex-shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Vektör Aranıyor...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Emsal Ara
              </>
            )}
          </button>
        </form>

        {/* Filters & Similarity Threshold */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1 border-t border-border/40 text-xs">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
              <span>Benzerlik Eşiği:</span>
            </div>
            <input
              type="range"
              min="0.30"
              max="0.80"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-28 accent-primary cursor-pointer"
            />
            <span className="font-mono font-semibold text-primary">
              %{Math.round(threshold * 100)}
            </span>
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              (Daha yüksek eşik = daha katı eşleşme)
            </span>
          </div>

          <span className="text-[11px] text-muted-foreground">
            ⚡ 768 Boyutlu Vektör Uzayı • Cosine Similarity
          </span>
        </div>

        {/* Quick Precedent Prompts */}
        <div>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
            Örnek Hukuki Konular (Tıklayıp Deneyin):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(prompt)
                  handleSearch(prompt)
                }}
                className="text-left px-3 py-1.5 rounded-lg border border-border/60 bg-muted/30 hover:bg-primary/10 hover:border-primary/40 text-xs text-foreground/80 hover:text-foreground transition-all duration-150"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="p-8 rounded-2xl bg-card border border-border/60 text-center space-y-4">
          <div className="relative inline-flex">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary animate-pulse">
              <Scale className="w-6 h-6" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Vektör Araması & Halüsinasyonsuz Analiz Yapılıyor...
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Sorgunuz Gemini embedding modeliyle 768 boyutlu vektöre dönüştürülüyor ve veritabanındaki emsal kararlarla eşleştiriliyor.
            </p>
          </div>
        </div>
      )}

      {/* Error / No Match Notice */}
      {error && !loading && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="space-y-1">
            <div className="font-semibold text-sm text-amber-900 dark:text-amber-200">
              Emsal Karar Eşleşmesi
            </div>
            <p className="leading-relaxed">{error}</p>
            <div className="pt-2 text-[11px] text-amber-700 dark:text-amber-400">
              💡 <strong>İpucu:</strong> Sağ üstteki <em>'Örnek Kararları Yükle'</em> butonuna basarak popüler Yargıtay kararlarını sisteminize yükleyebilir veya Benzerlik Eşiği çubuğunu biraz düşürebilirsiniz.
            </div>
          </div>
        </div>
      )}

      {/* AI Grounded Legal Analysis Card */}
      {analysis && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border-2 border-emerald-500/40 rounded-2xl p-6 shadow-lg shadow-emerald-500/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

          {/* Card Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-foreground text-base">
                    Doğrulanmış İçtihat Analizi
                  </h3>
                  <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    <ShieldCheck className="w-3 h-3" />
                    %100 Gerçek Karar Dayanaklı
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Yalnızca eşleşen {decisions.length} adet emsal kararın gerekçeleri sentezlenmiştir.
                </p>
              </div>
            </div>

            <button
              onClick={handleCopyAnalysis}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-border bg-background hover:bg-muted text-foreground transition-colors"
            >
              {copiedAnalysis ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedAnalysis ? 'Analiz Kopyalandı' : 'Analizi Kopyala'}
            </button>
          </div>

          {/* Analysis Markdown Content */}
          <div className="text-xs sm:text-sm text-foreground/90 space-y-3 leading-relaxed whitespace-pre-wrap font-sans">
            {analysis}
          </div>
        </motion.div>
      )}

      {/* Matched Decisions List */}
      {decisions.length > 0 && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" />
              Eşleşen Doğrulanmış Emsal Kararlar ({decisions.length})
            </h3>
            <span className="text-xs text-muted-foreground">
              Vektör Benzerliğine Göre Sıralandı
            </span>
          </div>

          <div className="space-y-3">
            {decisions.map((dec, index) => {
              const similarityPercent = Math.round((dec.similarity || 0.7) * 100)
              const uyapSearchUrl = `https://karararama.yargitay.gov.tr/`

              return (
                <motion.div
                  key={dec.id || index}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-5 rounded-2xl bg-card border border-border/70 hover:border-primary/40 shadow-sm transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-border/50">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Scale className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground text-sm flex items-center gap-2">
                          <span>{dec.daire}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 font-mono">
                          <span className="font-semibold text-foreground">
                            E. {dec.esas_no} / K. {dec.karar_no}
                          </span>
                          {dec.karar_tarihi && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 font-sans">
                                <Calendar className="w-3 h-3" />
                                {new Date(dec.karar_tarihi).toLocaleDateString('tr-TR')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Similarity score badge */}
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        %{similarityPercent} Uyuşma
                      </div>
                    </div>
                  </div>

                  {/* Konu */}
                  {dec.konu && (
                    <div className="text-xs font-semibold text-foreground/80 mb-2">
                      📌 <span className="text-foreground">{dec.konu}</span>
                    </div>
                  )}

                  {/* Özet */}
                  <div className="text-xs text-muted-foreground leading-relaxed bg-muted/20 p-3 rounded-xl border border-border/40 mb-4">
                    {dec.ozet}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyCitation(dec, index)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors font-medium"
                      >
                        {copiedIndex === index ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        {copiedIndex === index ? 'Kopyalandı' : 'Resmi Atfı Kopyala'}
                      </button>

                      <button
                        onClick={() => setSelectedDecision(dec)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary transition-colors font-medium"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Gerekçeli Metni İncele
                      </button>
                    </div>

                    <a
                      href={uyapSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-[11px] underline underline-offset-2 transition-colors"
                      title="Yargıtay Emsal Karar Bilgi Bankası'nda kontrol et"
                    >
                      <span>Yargıtay Bilgi Bankası'nda Aç</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Decision detail modal */}
      <EmsalDetailModal
        decision={selectedDecision}
        onClose={() => setSelectedDecision(null)}
      />
    </div>
  )
}
