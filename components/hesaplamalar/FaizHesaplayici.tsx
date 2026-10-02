'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  Info,
  RotateCcw,
  Calculator,
  Copy,
  Check,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format, parseISO, eachYearOfInterval, getYear, differenceInDays, addDays } from 'date-fns'
import { tr } from 'date-fns/locale'

// ── Faiz Oranları Tablosu ─────────────────────────────────────────────────────
// Türkiye Cumhuriyet Merkez Bankası reeskont ve yasal faiz oranları (tarihsel)
interface FaizDilimi {
  baslangic: string // YYYY-MM-DD
  bitis: string | null // null = hala geçerli
  yasalFaiz: number // yıllık %
  ticariFaiz: number // yıllık %
  reeskont: number // yıllık %
}

const FAIZ_DILIMLERI: FaizDilimi[] = [
  { baslangic: '2020-01-01', bitis: '2020-09-23', yasalFaiz: 9.00, ticariFaiz: 11.75, reeskont: 9.75 },
  { baslangic: '2020-09-24', bitis: '2021-03-18', yasalFaiz: 7.50, ticariFaiz: 9.75, reeskont: 8.25 },
  { baslangic: '2021-03-19', bitis: '2021-06-24', yasalFaiz: 13.00, ticariFaiz: 15.25, reeskont: 14.00 },
  { baslangic: '2021-06-25', bitis: '2021-12-17', yasalFaiz: 12.00, ticariFaiz: 14.25, reeskont: 13.00 },
  { baslangic: '2021-12-18', bitis: '2022-02-03', yasalFaiz: 9.00, ticariFaiz: 11.25, reeskont: 10.00 },
  { baslangic: '2022-02-04', bitis: '2022-03-17', yasalFaiz: 8.50, ticariFaiz: 10.75, reeskont: 9.50 },
  { baslangic: '2022-03-18', bitis: '2023-02-01', yasalFaiz: 9.00, ticariFaiz: 11.25, reeskont: 10.00 },
  { baslangic: '2023-02-02', bitis: '2023-06-01', yasalFaiz: 8.50, ticariFaiz: 10.75, reeskont: 9.50 },
  { baslangic: '2023-06-02', bitis: '2023-07-20', yasalFaiz: 12.25, ticariFaiz: 14.50, reeskont: 13.00 },
  { baslangic: '2023-07-21', bitis: '2023-09-21', yasalFaiz: 17.50, ticariFaiz: 19.75, reeskont: 18.25 },
  { baslangic: '2023-09-22', bitis: '2023-11-23', yasalFaiz: 25.00, ticariFaiz: 27.25, reeskont: 26.00 },
  { baslangic: '2023-11-24', bitis: '2024-01-25', yasalFaiz: 35.00, ticariFaiz: 37.25, reeskont: 36.00 },
  { baslangic: '2024-01-26', bitis: '2024-03-21', yasalFaiz: 40.00, ticariFaiz: 42.25, reeskont: 41.00 },
  { baslangic: '2024-03-22', bitis: '2025-02-27', yasalFaiz: 45.00, ticariFaiz: 47.25, reeskont: 46.00 },
  { baslangic: '2025-02-28', bitis: '2025-04-24', yasalFaiz: 42.50, ticariFaiz: 44.75, reeskont: 43.50 },
  { baslangic: '2025-04-25', bitis: '2025-06-19', yasalFaiz: 40.00, ticariFaiz: 42.25, reeskont: 41.00 },
  { baslangic: '2025-06-20', bitis: null, yasalFaiz: 35.00, ticariFaiz: 37.25, reeskont: 36.00 },
]

type FaizTuru = 'yasal' | 'ticari' | 'reeskont'

interface HesapSatiri {
  baslangic: Date
  bitis: Date
  gun: number
  oran: number
  faiz: number
}

interface FaizSonucu {
  anapara: number
  toplamFaiz: number
  toplam: number
  satirlar: HesapSatiri[]
}

function getFaizOrani(tarih: Date, tur: FaizTuru): number {
  const dateStr = format(tarih, 'yyyy-MM-dd')
  for (const dilim of FAIZ_DILIMLERI) {
    const bitisGecerli = dilim.bitis === null || dilim.bitis >= dateStr
    if (dilim.baslangic <= dateStr && bitisGecerli) {
      if (tur === 'yasal') return dilim.yasalFaiz
      if (tur === 'ticari') return dilim.ticariFaiz
      return dilim.reeskont
    }
  }
  // Fallback
  return tur === 'yasal' ? 9 : tur === 'ticari' ? 11.25 : 10
}

function hesaplaFaiz(anapara: number, baslangic: Date, bitis: Date, tur: FaizTuru): FaizSonucu {
  const satirlar: HesapSatiri[] = []
  let current = new Date(baslangic)
  let toplamFaiz = 0

  // Oran değişim noktalarını bul
  const noktalar: Date[] = [new Date(baslangic)]
  for (const dilim of FAIZ_DILIMLERI) {
    const dilimBaslangic = parseISO(dilim.baslangic)
    if (dilimBaslangic > baslangic && dilimBaslangic <= bitis) {
      noktalar.push(dilimBaslangic)
    }
  }
  noktalar.push(new Date(bitis))

  for (let i = 0; i < noktalar.length - 1; i++) {
    const araBaslangic = noktalar[i]
    const araBitis = noktalar[i + 1]
    const gun = differenceInDays(araBitis, araBaslangic)
    if (gun <= 0) continue

    const oran = getFaizOrani(araBaslangic, tur)
    // Türk hukukunda faiz hesabı: Anapara × Oran × Gün / 365 (basit faiz)
    const faiz = (anapara * oran * gun) / (100 * 365)
    toplamFaiz += faiz

    satirlar.push({
      baslangic: araBaslangic,
      bitis: araBitis,
      gun,
      oran,
      faiz,
    })
  }

  return {
    anapara,
    toplamFaiz,
    toplam: anapara + toplamFaiz,
    satirlar,
  }
}

const formatTL = (val: number) =>
  val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function FaizHesaplayici() {
  const [anapara, setAnapara] = useState('')
  const [baslangic, setBaslangic] = useState('')
  const [bitis, setBitis] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [faizTuru, setFaizTuru] = useState<FaizTuru>('yasal')
  const [sonuc, setSonuc] = useState<FaizSonucu | null>(null)
  const [kopyalandi, setKopyalandi] = useState(false)

  const hesapla = useCallback(() => {
    const para = parseFloat(anapara.replace(',', '.'))
    if (!para || !baslangic || !bitis) return
    const bs = parseISO(baslangic)
    const bt = parseISO(bitis)
    if (bs >= bt) return
    const result = hesaplaFaiz(para, bs, bt, faizTuru)
    setSonuc(result)
  }, [anapara, baslangic, bitis, faizTuru])

  const sifirla = () => {
    setAnapara('')
    setBaslangic('')
    setBitis(format(new Date(), 'yyyy-MM-dd'))
    setSonuc(null)
  }

  const kopyala = () => {
    if (!sonuc) return
    const text = `Faiz Hesaplama Sonucu\n` +
      `Faiz Türü: ${faizTuru === 'yasal' ? 'Yasal Faiz' : faizTuru === 'ticari' ? 'Ticari Faiz' : 'Reeskont Faizi'}\n` +
      `Ana Para: ${formatTL(sonuc.anapara)} TL\n` +
      `İşlemiş Faiz: ${formatTL(sonuc.toplamFaiz)} TL\n` +
      `Toplam Alacak: ${formatTL(sonuc.toplam)} TL`
    navigator.clipboard.writeText(text)
    setKopyalandi(true)
    setTimeout(() => setKopyalandi(false), 2000)
  }

  const faizTurleri = [
    { id: 'yasal' as FaizTuru, label: 'Yasal Faiz', aciklama: 'Borçlar Kanunu m.120 uyarınca TCMB politika faizine göre belirlenen oran' },
    { id: 'ticari' as FaizTuru, label: 'Ticari Faiz (Avans)', aciklama: 'Ticari işlerde uygulanan TCMB kısa vadeli reeskont oranı +2 puan' },
    { id: 'reeskont' as FaizTuru, label: 'Reeskont Faizi', aciklama: 'TCMB reeskont (kısa vadeli avans) faiz oranı' },
  ]

  const toplamGun = baslangic && bitis ? differenceInDays(parseISO(bitis), parseISO(baslangic)) : 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Açıklama */}
      <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-4 flex gap-3">
        <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-emerald-800 dark:text-emerald-300/90">
          TCMB faiz oranları değiştikçe sistem otomatik olarak farklı dönemlere uygun oranları uygular
          (değişken oranlı hesaplama). Basit faiz yöntemi kullanılır (Anapara × Oran × Gün / 365).
        </p>
      </div>

      {/* Form */}
      <div className="bg-card/50 border border-border/50 rounded-2xl p-6 space-y-5">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          Hesaplama Parametreleri
        </h2>

        {/* Faiz Türü Seçimi */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Faiz Türü</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {faizTurleri.map(ft => (
              <button
                key={ft.id}
                onClick={() => { setFaizTuru(ft.id); setSonuc(null) }}
                className={`text-left px-4 py-3 rounded-xl border text-sm transition-all duration-200 ${
                  faizTuru === ft.id
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-700 dark:text-emerald-300'
                    : 'bg-background border-border text-foreground hover:border-emerald-500/30'
                }`}
              >
                <p className="font-medium">{ft.label}</p>
                <p className="text-[11px] mt-0.5 opacity-70 leading-relaxed">{ft.aciklama}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Ana Para */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ana Para (TL)</label>
            <div className="relative">
              <input
                type="text"
                value={anapara}
                onChange={e => { setAnapara(e.target.value); setSonuc(null) }}
                placeholder="Örn: 150000"
                className="w-full h-11 pl-3 pr-10 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">₺</span>
            </div>
          </div>

          {/* Başlangıç Tarihi */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Faiz Başlangıç Tarihi</label>
            <input
              type="date"
              value={baslangic}
              onChange={e => { setBaslangic(e.target.value); setSonuc(null) }}
              className="w-full h-11 px-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Bitiş Tarihi */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hesaplama Tarihi</label>
            <input
              type="date"
              value={bitis}
              onChange={e => { setBitis(e.target.value); setSonuc(null) }}
              className="w-full h-11 px-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {toplamGun > 0 && (
          <p className="text-xs text-muted-foreground">
            Hesaplama süresi: <span className="text-foreground font-medium">{toplamGun} gün</span>
          </p>
        )}

        <div className="flex gap-3">
          <Button
            onClick={hesapla}
            disabled={!anapara || !baslangic || !bitis}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 shadow-lg shadow-emerald-500/20"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Faizi Hesapla
          </Button>
          <Button variant="outline" onClick={sifirla} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Sıfırla
          </Button>
        </div>
      </div>

      {/* Sonuç */}
      <AnimatePresence>
        {sonuc && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Ana Sonuç */}
            <div className="relative overflow-hidden rounded-2xl border bg-emerald-500/10 border-emerald-500/30 p-6">
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-10 bg-emerald-400" />

              <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Ana Para</p>
                  <p className="text-2xl font-bold text-foreground">{formatTL(sonuc.anapara)} <span className="text-sm font-normal">₺</span></p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">İşlemiş Faiz</p>
                  <p className="text-2xl font-bold text-emerald-400">{formatTL(sonuc.toplamFaiz)} <span className="text-sm font-normal">₺</span></p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Toplam Alacak</p>
                  <p className="text-3xl font-bold text-foreground">{formatTL(sonuc.toplam)} <span className="text-sm font-normal">₺</span></p>
                </div>
              </div>

              <button
                onClick={kopyala}
                className="mt-4 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {kopyalandi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {kopyalandi ? 'Kopyalandı!' : 'Sonucu Kopyala'}
              </button>
            </div>

            {/* Dönem Bazlı Tablo */}
            {sonuc.satirlar.length > 1 && (
              <div className="bg-card/50 border border-border/50 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Dönem Bazlı Faiz Hesabı ({sonuc.satirlar.length} dilim)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left text-muted-foreground font-medium pb-2">Başlangıç</th>
                        <th className="text-left text-muted-foreground font-medium pb-2">Bitiş</th>
                        <th className="text-right text-muted-foreground font-medium pb-2">Gün</th>
                        <th className="text-right text-muted-foreground font-medium pb-2">Oran (%)</th>
                        <th className="text-right text-muted-foreground font-medium pb-2">Faiz (₺)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sonuc.satirlar.map((satir, i) => (
                        <tr key={i} className="border-b border-border/20 last:border-0">
                          <td className="py-2 text-foreground/80">{format(satir.baslangic, 'dd.MM.yyyy')}</td>
                          <td className="py-2 text-foreground/80">{format(satir.bitis, 'dd.MM.yyyy')}</td>
                          <td className="py-2 text-right text-foreground/80">{satir.gun}</td>
                          <td className="py-2 text-right">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                              %{satir.oran.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-2 text-right text-foreground font-medium">{formatTL(satir.faiz)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border/50 mt-2">
                        <td colSpan={4} className="pt-3 text-muted-foreground font-medium">Toplam Faiz</td>
                        <td className="pt-3 text-right text-emerald-400 font-bold text-sm">{formatTL(sonuc.toplamFaiz)} ₺</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
