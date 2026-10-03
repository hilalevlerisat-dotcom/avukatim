'use client'

import { HardDrive } from 'lucide-react'
import LocalFileBrowser from '@/components/ui/LocalFileBrowser'

export default function DosyalarPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              Dosyalar (Yerel Arşiv)
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tüm dava dosyalarınız ve evraklarınız (Yerel Sunucu üzerinden)
            </p>
          </div>
        </div>
      </div>

      <LocalFileBrowser />
    </div>
  )
}
