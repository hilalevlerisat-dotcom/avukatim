'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PenTool, Download, Loader2, Sparkles, User, FileText, FileSearch, Save, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import type { Client } from '@/lib/database.types'
import JSZip from 'jszip'

const TEMPLATE_TYPES = [
  'Dava Dilekçesi',
  'Cevap Dilekçesi',
  'İstinaf Dilekçesi',
  'Temyiz Dilekçesi',
  'İcra Takibi Talebi',
  'İtiraz Dilekçesi',
  'Beyan Dilekçesi',
  'İhtiyati Haciz Talebi',
  'Tensip Zaptı Beyanı',
]

export default function DilekceEditoru() {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [templateType, setTemplateType] = useState('Dava Dilekçesi')
  const [explanations, setExplanations] = useState('')
  const [precedents, setPrecedents] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [resultText, setResultText] = useState('')

  useEffect(() => {
    const fetchClients = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('clients').select('*').order('full_name')
      if (data) setClients(data as Client[])
    }
    fetchClients()
  }, [])

  const handleGenerate = async () => {
    if (!explanations.trim()) {
      alert('Lütfen dilekçe açıklamalarını girin.')
      return
    }
    setLoading(true)
    setResultText('')
    
    try {
      const client = clients.find(c => c.id === selectedClientId)
      const res = await fetch('/api/ai/dilekce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: client || null,
          type: templateType,
          explanations,
          precedents
        })
      })
      const data = await res.json()
      if (data.success) {
        setResultText(data.text)
      } else {
        alert('Hata: ' + data.message)
      }
    } catch (err) {
      alert('Bağlantı hatası.')
    } finally {
      setLoading(false)
    }
  }

  // Basit bir XML yapısı ile UDF (UYAP Bilişim Sistemi) Zip dosyası oluştur
  const handleDownloadUDF = async () => {
    if (!resultText) return

    // UYAP Editör'ün okuyabildiği basit XML formatına dönüştür (her paragrafı ayır)
    const paragraphs = resultText.split('\n').filter(p => p.trim() !== '')
    
    // Geçerli bir UYAP XML iskeleti
    let xmlString = `<?xml version="1.0" encoding="UTF-8"?>
<document format="1.0">
  <content>
`
    paragraphs.forEach(p => {
      xmlString += `    <paragraph>
      <text><![CDATA[${p}]]></text>
    </paragraph>\n`
    })
    
    xmlString += `  </content>
</document>`

    try {
      const zip = new JSZip()
      zip.file('content.xml', xmlString)
      const blob = await zip.generateAsync({ type: 'blob' })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${templateType.replace(/\s+/g, '_')}.udf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('UDF oluşturma hatası:', error)
      alert('UDF dosyası oluşturulurken hata oluştu.')
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      {/* Header */}
      <div className="flex-none border-b border-border/50 bg-card/30 backdrop-blur-sm px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/20 text-white">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Yapay Zeka Dilekçe Editörü</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Yapay zeka ile dilekçenizi oluşturun ve doğrudan .UDF olarak indirin.</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Sol: Girdi Formu */}
          <div className="space-y-6">
            <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-semibold flex items-center gap-2 mb-4 text-foreground">
                <FileText className="w-4 h-4 text-primary" />
                Dilekçe Parametreleri
              </h2>

              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Dilekçe Türü</Label>
                  <select 
                    value={templateType}
                    onChange={(e) => setTemplateType(e.target.value)}
                    className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {TEMPLATE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Müvekkil Seçimi (Opsiyonel)</Label>
                  <select 
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">-- Boş Bırak / Sistemden Seçme --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.full_name} ({c.tc_tax_number || 'TC Yok'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Açıklamalar & Olay Örgüsü</Label>
                  <Textarea 
                    placeholder="Müvekkil işten haksız yere çıkarıldı, son maaşı ödenmedi. Kıdem ve ihbar tazminatı ile fazla mesai ücretlerinin tahsilini talep ediyoruz..."
                    value={explanations}
                    onChange={(e) => setExplanations(e.target.value)}
                    className="min-h-[120px] resize-y text-sm rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5" /> Emsal Karar Referansları (Opsiyonel)
                  </Label>
                  <Textarea 
                    placeholder="Emsal Karar sekmesinden bulduğunuz kararları buraya yapıştırabilirsiniz, AI bunları dilekçeye yedirecektir."
                    value={precedents}
                    onChange={(e) => setPrecedents(e.target.value)}
                    className="min-h-[80px] resize-y text-sm rounded-xl"
                  />
                </div>

                <Button 
                  onClick={handleGenerate} 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 transition-opacity gap-2 h-10 rounded-xl"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {loading ? 'Yapay Zeka Dilekçeyi Yazıyor...' : 'Dilekçeyi Otomatik Oluştur'}
                </Button>
              </div>
            </div>
          </div>

          {/* Sağ: Çıktı ve İndirme */}
          <div className="flex flex-col h-full bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex-none flex items-center justify-between p-4 border-b border-border/50 bg-muted/20">
              <h2 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Save className="w-4 h-4 text-emerald-500" />
                Üretilen Dilekçe Önizlemesi
              </h2>
              {resultText && (
                <Button 
                  onClick={handleDownloadUDF}
                  size="sm" 
                  className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-3"
                >
                  <Download className="w-3.5 h-3.5" />
                  .UDF İndir (UYAP)
                </Button>
              )}
            </div>
            
            <div className="flex-1 p-0 relative min-h-[400px]">
              {resultText ? (
                <Textarea 
                  value={resultText}
                  onChange={(e) => setResultText(e.target.value)}
                  className="w-full h-full min-h-[400px] border-0 focus-visible:ring-0 rounded-none resize-none p-6 text-sm font-serif leading-relaxed text-foreground/90 bg-transparent"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-muted/50 flex items-center justify-center">
                    <PenTool className="w-8 h-8 opacity-20" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Henüz dilekçe oluşturulmadı</p>
                    <p className="text-xs opacity-70 max-w-xs">Soldaki formu doldurarak yapay zekanın size saniyeler içinde özel bir dilekçe hazırlamasını sağlayın.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
