'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Scale, Calendar, FileText, Check, Copy } from 'lucide-react'
import { useState } from 'react'

interface EmsalDetailModalProps {
  decision: any | null
  onClose: () => void
}

export default function EmsalDetailModal({ decision, onClose }: EmsalDetailModalProps) {
  const [copied, setCopied] = useState(false)

  if (!decision) return null

  const handleCopyCitation = () => {
    const citation = `${decision.daire}, E. ${decision.esas_no}, K. ${decision.karar_no}${decision.karar_tarihi ? `, T. ${decision.karar_tarihi}` : ''}`
    navigator.clipboard.writeText(citation)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/40">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-base">
                  {decision.daire}
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                  <span className="font-mono font-medium text-foreground">
                    E. {decision.esas_no} / K. {decision.karar_no}
                  </span>
                  {decision.karar_tarihi && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(decision.karar_tarihi).toLocaleDateString('tr-TR')}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCitation}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors"
                title="Dilekçeler için resmi içtihat atfını kopyalar"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Atıf Kopyalandı' : 'Resmi Atfı Kopyala'}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Konu */}
            {decision.konu && (
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Uyuşmazlık Konusu
                </span>
                <p className="text-sm font-medium text-foreground bg-muted/30 p-3 rounded-xl border border-border/50">
                  {decision.konu}
                </p>
              </div>
            )}

            {/* Hukuki Özet */}
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                İçtihat İlkesi & Hukuki Özet
              </span>
              <div className="text-sm text-foreground/90 leading-relaxed bg-primary/5 p-4 rounded-xl border border-primary/20">
                {decision.ozet}
              </div>
            </div>

            {/* Tam Karar Metni */}
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <FileText className="w-3.5 h-3.5" />
                Karar Tam Metni
              </span>
              <div className="bg-muted/20 border border-border/60 rounded-xl p-4 font-mono text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                {decision.metin || 'Bu karar için detaylı gerekçeli metin eklenmemiştir. Yukarıdaki hukuki özet ilkesi geçerlidir.'}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-border/60 bg-muted/30 flex justify-between items-center text-xs text-muted-foreground">
            <span>🛡️ Doğrulanmış Emsal Karar Kaydı</span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-xs hover:opacity-90 transition-opacity"
            >
              Kapat
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
