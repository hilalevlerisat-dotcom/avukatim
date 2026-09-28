'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import * as XLSX from 'xlsx'

interface UyapImportDialogProps {
  open: boolean
  onClose: () => void
  clients: { id: string; full_name: string }[]
  cases: { id: string; title: string; client_id: string }[]
  onImportComplete: (records: any[]) => void
}

interface ParsedRow {
  id: string
  date: string
  description: string
  amount: number
  selected: boolean
}

export default function UyapImportDialog({ open, onClose, clients, cases, onImportComplete }: UyapImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [globalClient, setGlobalClient] = useState<string>('')
  const [globalCase, setGlobalCase] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetState = () => {
    setFile(null)
    setRows([])
    setGlobalClient('')
    setGlobalCase('')
    setIsProcessing(false)
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)

    const reader = new FileReader()
    reader.onload = (evt) => {
      const data = evt.target?.result
      if (!data) return
      
      const workbook = XLSX.read(data, { type: 'binary' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
      
      const parsed: ParsedRow[] = []
      
      // Basic heuristic to find data rows
      json.forEach((row, i) => {
        if (row.length >= 2) {
          const joined = row.join(' ').toLowerCase()
          if (joined.includes('tarih') || joined.includes('tutar') || joined.includes('toplam')) return // skip headers/footers
          
          let dateStr = new Date().toISOString().split('T')[0]
          let desc = ''
          let amt = 0
          
          row.forEach(cell => {
            if (!cell) return
            const cellStr = String(cell)
            // Try to find a date like dd.mm.yyyy or dd/mm/yyyy
            if (/^\d{2}[./-]\d{2}[./-]\d{4}$/.test(cellStr)) {
              const parts = cellStr.split(/[./-]/)
              dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`
            } 
            // Try to find amount
            else if (typeof cell === 'number') {
              if (cell > 0) amt = cell
            }
            else if (cellStr.includes(',') || cellStr.includes('.')) {
              const val = parseFloat(cellStr.replace(/\./g, '').replace(',', '.'))
              if (!isNaN(val) && val > 0 && val < 1000000) {
                 amt = val
              } else {
                 if (cellStr.length > 3) desc += cellStr + ' '
              }
            } else {
              if (cellStr.length > 3) desc += cellStr + ' '
            }
          })
          
          if (amt > 0) {
            parsed.push({
              id: crypto.randomUUID(),
              date: dateStr,
              description: desc.trim() || 'UYAP Masrafı',
              amount: amt,
              selected: true
            })
          }
        }
      })
      
      setRows(parsed)
    }
    reader.readAsBinaryString(selected)
  }

  const toggleRow = (id: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r))
  }

  const handleImport = async () => {
    if (!globalClient) {
      alert("Lütfen harçların işleneceği müvekkili seçin.")
      return
    }

    setIsProcessing(true)
    const selectedRows = rows.filter(r => r.selected)
    
    const recordsToCreate = selectedRows.map(r => ({
      client_id: globalClient,
      case_id: globalCase || null,
      finance_type: 'court_fee',
      amount: r.amount,
      currency: 'TRY',
      transaction_date: r.date,
      description: r.description,
      is_collected: true,
      notes: 'UYAP Excel Aktarımı'
    }))

    onImportComplete(recordsToCreate)
    handleClose()
  }

  const clientCases = cases.filter(c => c.client_id === globalClient)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden bg-background">
        <DialogHeader className="p-6 pb-4 border-b border-border/50">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
            UYAP Excel İçeri Aktar
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1.5">
            UYAP portalından indirdiğiniz harç ve masraf dökümü (Excel) dosyasını seçin.
          </p>
        </DialogHeader>

        <div className="p-6 overflow-y-auto flex-1">
          {!file ? (
            <div 
              className="border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
              />
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6 text-emerald-500" />
              </div>
              <p className="font-medium text-foreground">Excel (.xlsx, .xls) dosyası seçin</p>
              <p className="text-xs text-muted-foreground mt-1">Dosya doğrudan tarayıcınızda işlenir.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                <div>
                  <label className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 block mb-1.5">Müvekkil *</label>
                  <select 
                    className="w-full text-sm rounded-lg border-emerald-500/30 bg-background px-3 py-2 outline-none focus:border-emerald-500"
                    value={globalClient}
                    onChange={(e) => {
                      setGlobalClient(e.target.value)
                      setGlobalCase('')
                    }}
                  >
                    <option value="">Müvekkil Seçiniz</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 block mb-1.5">Dosya (Opsiyonel)</label>
                  <select 
                    className="w-full text-sm rounded-lg border-emerald-500/30 bg-background px-3 py-2 outline-none focus:border-emerald-500 disabled:opacity-50"
                    value={globalCase}
                    onChange={(e) => setGlobalCase(e.target.value)}
                    disabled={!globalClient}
                  >
                    <option value="">Genel (Dosya Yok)</option>
                    {clientCases.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
              </div>

              {rows.length === 0 ? (
                <div className="text-center p-6 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Okunabilir bir masraf kaydı bulunamadı.</p>
                  <Button variant="link" size="sm" onClick={() => setFile(null)}>Başka dosya seç</Button>
                </div>
              ) : (
                <div className="border border-border/50 rounded-xl overflow-hidden">
                  <div className="bg-muted/50 px-4 py-2 border-b border-border/50 text-xs font-semibold text-muted-foreground flex items-center justify-between">
                    <span>{rows.length} kayıt bulundu</span>
                    <span>{rows.filter(r => r.selected).length} seçildi</span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-background sticky top-0 border-b border-border/50 z-10">
                        <tr>
                          <th className="px-3 py-2 text-left w-10"></th>
                          <th className="px-3 py-2 text-left font-medium">Tarih</th>
                          <th className="px-3 py-2 text-left font-medium">Açıklama</th>
                          <th className="px-3 py-2 text-right font-medium">Tutar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr key={row.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 cursor-pointer" onClick={() => toggleRow(row.id)}>
                            <td className="px-3 py-2.5">
                              <div className={`w-4 h-4 rounded border flex items-center justify-center ${row.selected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-input bg-background'}`}>
                                {row.selected && <CheckCircle className="w-3 h-3" />}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-muted-foreground text-xs whitespace-nowrap">{row.date.split('-').reverse().join('.')}</td>
                            <td className="px-3 py-2.5 max-w-[200px] truncate" title={row.description}>{row.description}</td>
                            <td className="px-3 py-2.5 text-right font-bold text-emerald-600">{row.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-border/50 bg-muted/20 sm:justify-between">
          <Button variant="ghost" onClick={handleClose} disabled={isProcessing}>İptal</Button>
          <Button 
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" 
            onClick={handleImport} 
            disabled={!file || rows.filter(r => r.selected).length === 0 || !globalClient || isProcessing}
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Seçilenleri Aktar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
