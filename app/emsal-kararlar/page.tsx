'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Scale, Sparkles, BookOpen, Plus, ShieldCheck } from 'lucide-react'
import EmsalSearch from '@/components/emsal/EmsalSearch'
export default function EmsalKararlarPage() {

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      {/* Header */}
      <div className="flex-none border-b border-border/50 bg-card/30 backdrop-blur-sm px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 text-white">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-foreground tracking-tight">
                  Emsal Karar Arama (AI RAG)
                </h1>
                <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  Halüsinasyonsuz
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Vektör benzerlik araması ile doğrulanmış Yargıtay ve Danıştay içtihatları
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <EmsalSearch />
        </div>
      </div>
    </div>
  )
}
