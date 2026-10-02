'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calculator, Calendar, TrendingUp, Scale } from 'lucide-react'
import SureHesaplayici from '@/components/hesaplamalar/SureHesaplayici'
import FaizHesaplayici from '@/components/hesaplamalar/FaizHesaplayici'

type TabId = 'sure' | 'faiz'

const TABS = [
  {
    id: 'sure' as TabId,
    label: 'Süre Hesaplayıcı',
    icon: Calendar,
    description: 'HMK, CMK, İYUK sürelerini, adli tatil ve resmi tatilleri dikkate alarak hesapla',
    color: 'from-violet-500 to-purple-600',
    lightColor: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
  },
  {
    id: 'faiz' as TabId,
    label: 'Faiz Hesaplayıcı',
    icon: TrendingUp,
    description: 'Yasal faiz, ticari faiz ve reeskont oranlarına göre işlemiş faizi hesapla',
    color: 'from-emerald-500 to-teal-600',
    lightColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  },
]

export default function HesaplamalarClient() {
  const [activeTab, setActiveTab] = useState<TabId>('sure')

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      {/* Header */}
      <div className="flex-none border-b border-border/50 bg-card/30 backdrop-blur-sm px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 shadow-lg shadow-violet-500/20">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Hesaplamalar & Araçlar</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Hukuki süre ve faiz hesaplama araçları</p>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-2 mt-5">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-primary rounded-xl -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'sure' && <SureHesaplayici />}
            {activeTab === 'faiz' && <FaizHesaplayici />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
