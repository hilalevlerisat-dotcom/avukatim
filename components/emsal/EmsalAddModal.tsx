'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Plus, Loader2, FileText, CheckCircle2 } from 'lucide-react'

interface EmsalAddModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function EmsalAddModal({ isOpen, onClose, onSuccess }: EmsalAddModalProps) {
  const [activeMode, setActiveMode] = useState<'ai' | 'manual'>('ai')
  const [loading, setLoading] = useState(false)
  const [aiParsing, setAiParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Form states
  const [rawText, setRawText] = useState('')
  const [daire, setDaire] = useState('')
  const [esasNo, setEsasNo] = useState('')
  const [kararNo, setKararNo] = useState('')
  const [kararTarihi, setKararTarihi] = useState('')
  const [konu, setKonu] = useState('')
  const [ozet, setOzet] = useState('')
  const [metin, setMetin] = useState('')

  if (!isOpen) return null

  // AI ile metni ayıkla
  const handleAiParse = async () => {
    if (!rawText.trim()) {
      setError('Lütfen önce karar metnini yapıştırın.')
      return
    }

    setAiParsing(true)
    setError(null)

    try {
      const res = await fetch('/app/api/ai/emsal/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Ayrıştırma hatası')
      }

      setSuccessMsg('Karar başarıyla analiz edildi, veritabanına eklendi ve vektör embedding üretildi! ✨')
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Karar işlenirken hata oluştu.')
    } finally {
      setAiParsing(false)
    }
  }

  // Manuel Kaydet
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ozet.trim()) {
      setError('Hukuki özet alanı zorunludur.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/emsal/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daire: daire.trim(),
          esas_no: esasNo.trim(),
          karar_no: kararNo.trim(),
          karar_tarihi: kararTarihi || null,
          konu: konu.trim(),
          ozet: ozet.trim(),
          metin: metin.trim()
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Kaydetme hatası')
      }

      setSuccessMsg('Karar başarıyla eklendi!')
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1200)
    } catch (err: any) {
      setError(err.message || 'Kayıt sırasında hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-base">
                  Yeni Emsal Karar Ekle
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Veritabanına eklenen kararlar anında semantik aramada sorgulanabilir
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="flex border-b border-border/60 bg-muted/20 px-6 pt-3 gap-2">
            <button
              type="button"
              onClick={() => setActiveMode('ai')}
              className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-all ${
                activeMode === 'ai'
                  ? 'border-violet-500 text-violet-500'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Yapay Zeka ile Metinden Otomatik Ayıkla
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('manual')}
              className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-all ${
                activeMode === 'manual'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Manuel Form ile Giriş
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {successMsg}
              </div>
            )}

            {activeMode === 'ai' ? (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/20 text-xs text-muted-foreground">
                  💡 <strong>Nasıl çalışır:</strong> UYAP'tan, Yargıtay Bilgi Bankası'ndan veya Lexpera'dan kopyaladığınız karar metnini doğrudan buraya yapıştırın. Gemini yapay zekası; <em>Daire, Esas/Karar No, Karar Tarihi, Konu</em> ve <em>Hukuki İlkeyi</em> otomatik ayıklayıp vektörleştirerek kaydedecektir.
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">
                    Karar Metnini Yapıştırın
                  </label>
                  <textarea
                    rows={12}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="T.C. YARGITAY 9. HUKUK DAİRESİ&#10;ESAS NO: 2021/...&#10;KARAR NO: 2022/...&#10;&#10;DAVA: Davacı, kıdem tazminatı ile fazla mesai ücreti alacaklarının ödetilmesine karar verilmesini istemiştir...&#10;&#10;GEREKÇE: ..."
                    className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 font-mono"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted text-foreground transition-colors"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    onClick={handleAiParse}
                    disabled={aiParsing || !rawText.trim()}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium text-xs shadow-md shadow-violet-500/20 disabled:opacity-50 transition-all"
                  >
                    {aiParsing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        AI Analiz Ediyor & Vektörleşiyor...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        AI ile Ayıkla & Veritabanına Kaydet
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Mahkeme / Daire *
                    </label>
                    <input
                      type="text"
                      required
                      value={daire}
                      onChange={(e) => setDaire(e.target.value)}
                      placeholder="Örn: Yargıtay 9. Hukuk Dairesi"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Karar Tarihi
                    </label>
                    <input
                      type="date"
                      value={kararTarihi}
                      onChange={(e) => setKararTarihi(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Esas No
                    </label>
                    <input
                      type="text"
                      value={esasNo}
                      onChange={(e) => setEsasNo(e.target.value)}
                      placeholder="Örn: 2022/1450"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Karar No
                    </label>
                    <input
                      type="text"
                      value={kararNo}
                      onChange={(e) => setKararNo(e.target.value)}
                      placeholder="Örn: 2023/890"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Uyuşmazlık Konusu
                  </label>
                  <input
                    type="text"
                    value={konu}
                    onChange={(e) => setKonu(e.target.value)}
                    placeholder="Örn: Fazla mesai ücretinin ödenmemesi sebebiyle haklı fesih"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Hukuki İlke ve Özet *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={ozet}
                    onChange={(e) => setOzet(e.target.value)}
                    placeholder="Kararda kabul edilen ana hukuki ilke, içtihat kuralı ve yasal gerekçe..."
                    className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Karar Tam Metni (Opsiyonel)
                  </label>
                  <textarea
                    rows={5}
                    value={metin}
                    onChange={(e) => setMetin(e.target.value)}
                    placeholder="Gerekçeli kararın tam metni..."
                    className="w-full rounded-xl border border-border bg-background p-3 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted text-foreground transition-colors"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !ozet.trim()}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-xs hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Kaydediliyor & İndeksleniyor...
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        Kararı Kaydet & İndeksle
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
