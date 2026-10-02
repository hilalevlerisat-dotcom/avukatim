'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Scale,
  Calendar,
  Search,
  Plus,
  Trash2,
  FileText,
  Copy,
  Check,
  Loader2,
  Database,
  ExternalLink
} from 'lucide-react'
import EmsalDetailModal from './EmsalDetailModal'

interface EmsalLibraryProps {
  onOpenAddModal: () => void
}

export default function EmsalLibrary({ onOpenAddModal }: EmsalLibraryProps) {
  const [decisions, setDecisions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDecision, setSelectedDecision] = useState<any | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [seeding, setSeeding] = useState(false)

  const fetchDecisions = async () => {
    setLoading(true)
    try {
      const url = searchTerm.trim()
        ? `/api/ai/emsal/list?q=${encodeURIComponent(searchTerm.trim())}`
        : '/api/ai/emsal/list'
      const res = await fetch(url)
      const data = await res.json()
      if (res.ok) {
        setDecisions(data.decisions || [])
      }
    } catch (err) {
      console.error('Emsal kararlar yüklenemedi:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDecisions()
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchDecisions()
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu emsal kararı veritabanından silmek istediğinize emin misiniz?')) {
      return
    }

    setDeletingId(id)
    try {
      const res = await fetch(`/api/ai/emsal/list?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setDecisions(decisions.filter(d => d.id !== id))
      }
    } catch (err) {
      console.error('Silme hatası:', err)
    } finally {
      setDeletingId(null)
    }
  }

  const handleSeed = async () => {
    setSeeding(true)
    try {
      const res = await fetch('/api/ai/emsal/seed?force=true', { method: 'POST' })
      if (res.ok) {
        await fetchDecisions()
      }
    } catch (err) {
      console.error('Seed hatası:', err)
    } finally {
      setSeeding(false)
    }
  }

  const handleCopyCitation = (decision: any) => {
    const citation = `${decision.daire}, E. ${decision.esas_no}, K. ${decision.karar_no}${decision.karar_tarihi ? `, T. ${decision.karar_tarihi}` : ''}`
    navigator.clipboard.writeText(citation)
    setCopiedId(decision.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border border-border/70 rounded-2xl p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Daire, esas no veya konu ile kütüphanede filtrele..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </form>

        <div className="flex items-center gap-2">
          {decisions.length === 0 && !loading && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
            >
              {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
              {seeding ? 'Yükleniyor...' : 'Örnek Kararları Yükle'}
            </button>
          )}

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 shadow-sm transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Yeni Emsal Karar Ekle
          </button>
        </div>
      </div>

      {/* Decisions List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
          Emsal kararlar kütüphanesi yükleniyor...
        </div>
      ) : decisions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border/80 bg-card/40 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto text-muted-foreground">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Henüz Emsal Karar Bulunmuyor</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Veritabanınıza tek tıkla doğrulanmış örnek kararları yükleyebilir veya kendi önemli kararlarınızı ekleyebilirsiniz.
            </p>
          </div>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
          >
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            Örnek Yargıtay Kararlarını Yükle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {decisions.map((dec) => (
            <motion.div
              key={dec.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-5 rounded-2xl bg-card border border-border/70 hover:border-primary/40 shadow-sm flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-3 mb-3 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-foreground">
                        {dec.daire}
                      </h4>
                      <p className="text-[11px] font-mono text-muted-foreground flex items-center gap-2 mt-0.5">
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
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(dec.id)}
                    disabled={deletingId === dec.id}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Kararı Sil"
                  >
                    {deletingId === dec.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {dec.konu && (
                  <p className="text-xs font-semibold text-foreground mb-2">
                    📌 {dec.konu}
                  </p>
                )}

                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-4">
                  {dec.ozet}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                <button
                  onClick={() => handleCopyCitation(dec)}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground font-medium transition-colors"
                >
                  {copiedId === dec.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedId === dec.id ? 'Kopyalandı' : 'Atfı Kopyala'}
                </button>

                <button
                  onClick={() => setSelectedDecision(dec)}
                  className="flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Metni Oku
                </button>
              </div>
            </motion.div>
          ))}
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
