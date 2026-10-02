'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Scale, Sparkles, BookOpen, Plus, ShieldCheck } from 'lucide-react'
import EmsalSearch from '@/components/emsal/EmsalSearch'
import EmsalLibrary from '@/components/emsal/EmsalLibrary'
import EmsalAddModal from '@/components/emsal/EmsalAddModal'

type TabId = 'search' | 'library'

export default function EmsalKararlarClient() {
  const [activeTab, setActiveTab] = useState<TabId>('search')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [libraryRefreshKey, setLibraryRefreshKey] = useState(0)

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

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 shadow-sm transition-opacity self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Yeni Emsal Karar Ekle
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-2 mt-5">
          <button
            onClick={() => setActiveTab('search')}
            className={`
              relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200
              ${activeTab === 'search'
                ? 'bg-card text-foreground shadow-sm border border-border/80'
                : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
              }
            `}
          >
            <Sparkles className={`w-3.5 h-3.5 ${activeTab === 'search' ? 'text-primary' : ''}`} />
            <span>Semantik Arama & Hukuki Analiz</span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`
              relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200
              ${activeTab === 'library'
                ? 'bg-card text-foreground shadow-sm border border-border/80'
                : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
              }
            `}
          >
            <BookOpen className={`w-3.5 h-3.5 ${activeTab === 'library' ? 'text-primary' : ''}`} />
            <span>Emsal Karar Kütüphanesi</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'search' && (
              <motion.div
                key="search"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <EmsalSearch />
              </motion.div>
            )}

            {activeTab === 'library' && (
              <motion.div
                key={`library-${libraryRefreshKey}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <EmsalLibrary onOpenAddModal={() => setIsAddModalOpen(true)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Modal */}
      <EmsalAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => setLibraryRefreshKey(k => k + 1)}
      />
    </div>
  )
}
