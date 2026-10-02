'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronDown,
  RotateCcw,
  Copy,
  Check,
  Calculator,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { addDays, format, isWeekend, isSunday, isSaturday, parseISO, differenceInDays, getMonth, getDate, getYear } from 'date-fns'
import { tr } from 'date-fns/locale'

// ── Türkiye Resmi Tatil Listesi (Sabit Tarihler) ─────────────────────────────
function isResmiiTatil(date: Date): { tatil: boolean; ad?: string } {
  const m = getMonth(date) + 1 // 1-12
  const d = getDate(date)
  const y = getYear(date)

  // Sabit resmi tatiller
  const sabitTatiller: Record<string, string> = {
    '1-1': 'Yılbaşı',
    '4-23': 'Ulusal Egemenlik ve Çocuk Bayramı',
    '5-1': 'Emek ve Dayanışma Günü',
    '5-19': 'Atatürk\'ü Anma, Gençlik ve Spor Bayramı',
    '7-15': 'Demokrasi ve Millî Birlik Günü',
    '8-30': 'Zafer Bayramı',
    '10-29': 'Cumhuriyet Bayramı',
  }
  const key = `${m}-${d}`
  if (sabitTatiller[key]) return { tatil: true, ad: sabitTatiller[key] }

  // Dini bayramlar (yaklaşık tarihler - güncellenmesi gerekebilir)
  // Ramazan 2024: 10-13 Nisan, 2025: 30 Mart-1 Nisan, 2026: 19-22 Mart
  // Kurban 2024: 16-20 Haziran, 2025: 5-9 Haziran, 2026: 25-29 Mayıs
  const diniTatiller: Array<{ yil: number; ay: number; gun: number; ad: string }> = [
    // Ramazan Bayramı
    { yil: 2024, ay: 4, gun: 10, ad: 'Ramazan Bayramı' },
    { yil: 2024, ay: 4, gun: 11, ad: 'Ramazan Bayramı' },
    { yil: 2024, ay: 4, gun: 12, ad: 'Ramazan Bayramı' },
    { yil: 2025, ay: 3, gun: 30, ad: 'Ramazan Bayramı' },
    { yil: 2025, ay: 3, gun: 31, ad: 'Ramazan Bayramı' },
    { yil: 2025, ay: 4, gun: 1, ad: 'Ramazan Bayramı' },
    { yil: 2026, ay: 3, gun: 19, ad: 'Ramazan Bayramı' },
    { yil: 2026, ay: 3, gun: 20, ad: 'Ramazan Bayramı' },
    { yil: 2026, ay: 3, gun: 21, ad: 'Ramazan Bayramı' },
    // Kurban Bayramı
    { yil: 2024, ay: 6, gun: 16, ad: 'Kurban Bayramı' },
    { yil: 2024, ay: 6, gun: 17, ad: 'Kurban Bayramı' },
    { yil: 2024, ay: 6, gun: 18, ad: 'Kurban Bayramı' },
    { yil: 2024, ay: 6, gun: 19, ad: 'Kurban Bayramı' },
    { yil: 2025, ay: 6, gun: 5, ad: 'Kurban Bayramı' },
    { yil: 2025, ay: 6, gun: 6, ad: 'Kurban Bayramı' },
    { yil: 2025, ay: 6, gun: 7, ad: 'Kurban Bayramı' },
    { yil: 2025, ay: 6, gun: 8, ad: 'Kurban Bayramı' },
    { yil: 2026, ay: 5, gun: 25, ad: 'Kurban Bayramı' },
    { yil: 2026, ay: 5, gun: 26, ad: 'Kurban Bayramı' },
    { yil: 2026, ay: 5, gun: 27, ad: 'Kurban Bayramı' },
    { yil: 2026, ay: 5, gun: 28, ad: 'Kurban Bayramı' },
  ]
  const dini = diniTatiller.find(t => t.yil === y && t.ay === m && t.gun === d)
  if (dini) return { tatil: true, ad: dini.ad }

  return { tatil: false }
}

// Adli tatil: 20 Temmuz - 31 Ağustos arası
function isAdliTatil(date: Date): boolean {
  const m = getMonth(date) + 1
  const d = getDate(date)
  if (m === 7 && d >= 20) return true
  if (m === 8) return true
  return false
}

function isCalismaSaati(date: Date): boolean {
  if (isWeekend(date)) return false
  if (isResmiiTatil(date).tatil) return false
  return true
}

// ── Yasal Süre Tipleri ────────────────────────────────────────────────────────
export interface SureTipi {
  id: string
  label: string
  kanun: string
  gunSayisi: number
  adliTatilDurur: boolean
  haftasonuSayilir: boolean
  aciklama: string
}

const SURE_TIPLERI: SureTipi[] = [
  { id: 'hmk_cevap', label: 'Cevap Dilekçesi (HMK)', kanun: 'HMK m.127', gunSayisi: 15, adliTatilDurur: true, haftasonuSayilir: false, aciklama: 'Dava dilekçesinin tebliğinden itibaren 15 iş günü içinde cevap dilekçesi verilmelidir.' },
  { id: 'hmk_itiraz', label: 'İtiraz Süresi (HMK)', kanun: 'HMK m.94', gunSayisi: 7, adliTatilDurur: true, haftasonuSayilir: false, aciklama: 'Mahkeme ara kararlarına itiraz için 7 iş günü.' },
  { id: 'hmk_istinaf', label: 'İstinaf (BAM - HMK)', kanun: 'HMK m.345', gunSayisi: 15, adliTatilDurur: true, haftasonuSayilir: false, aciklama: 'Kararın tebliğinden itibaren 15 gün içinde istinaf kanun yoluna başvurulabilir.' },
  { id: 'hmk_temyiz', label: 'Temyiz (Yargıtay - HMK)', kanun: 'HMK m.361', gunSayisi: 30, adliTatilDurur: true, haftasonuSayilir: false, aciklama: 'İstinaf kararının tebliğinden itibaren 30 gün içinde temyiz başvurusu yapılabilir.' },
  { id: 'cmk_itiraz', label: 'İtiraz (CMK)', kanun: 'CMK m.268', gunSayisi: 7, adliTatilDurur: false, haftasonuSayilir: true, aciklama: 'CMK\'da kural olarak hafta sonu ve tatil günleri sayılır; 7 takvim günü.' },
  { id: 'cmk_istinaf', label: 'İstinaf (CMK)', kanun: 'CMK m.273', gunSayisi: 7, adliTatilDurur: false, haftasonuSayilir: true, aciklama: 'Ceza davası istinaf süresi 7 takvim günüdür. Adli tatilde durma kuralı uygulanmaz.' },
  { id: 'cmk_temyiz', label: 'Temyiz (CMK)', kanun: 'CMK m.291', gunSayisi: 15, adliTatilDurur: false, haftasonuSayilir: true, aciklama: 'Ceza davası temyiz süresi 15 takvim günüdür.' },
  { id: 'iyuk_itiraz', label: 'İtiraz (İYUK)', kanun: 'İYUK m.45', gunSayisi: 30, adliTatilDurur: true, haftasonuSayilir: false, aciklama: 'İdare mahkemesi kararlarına itiraz süresi 30 gündür.' },
  { id: 'iyuk_temyiz', label: 'Temyiz (Danıştay - İYUK)', kanun: 'İYUK m.46', gunSayisi: 30, adliTatilDurur: true, haftasonuSayilir: false, aciklama: 'Danıştay temyiz süresi kararın tebliğinden itibaren 30 gündür.' },
  { id: 'icra_itiraz', label: 'Ödeme Emrine İtiraz (İİK)', kanun: 'İİK m.62', gunSayisi: 7, adliTatilDurur: false, haftasonuSayilir: true, aciklama: 'Ödeme emrine itiraz için 7 takvim günü (tatil günleri dahil).' },
  { id: 'icra_istirdat', label: 'İstirdat Davası (İİK)', kanun: 'İİK m.72', gunSayisi: 365, adliTatilDurur: false, haftasonuSayilir: true, aciklama: 'İcra takibinin kesinleşmesinden itibaren 1 yıl (365 takvim günü).' },
  { id: 'ozel_gun', label: 'Özel Gün Sayısı Gir', kanun: 'Manuel', gunSayisi: 0, adliTatilDurur: false, haftasonuSayilir: true, aciklama: 'Kendi belirlediğiniz gün sayısını girin.' },
]

interface HesapSonucu {
  baslangicTarihi: Date
  bitişTarihi: Date
  toplamGun: number
  atlalanGunler: Array<{ tarih: Date; sebep: string }>
  adliTatilVarMi: boolean
  sonGunHaftaSoniMi: boolean
  sonGunResmiiTatilMi: boolean
}

function hesaplaSure(baslangic: Date, sureTipi: SureTipi, ozelGun: number): HesapSonucu {
  const gunSayisi = sureTipi.id === 'ozel_gun' ? ozelGun : sureTipi.gunSayisi
  const atlalanGunler: Array<{ tarih: Date; sebep: string }> = []
  let adliTatilVarMi = false

  let current = new Date(baslangic)
  current.setDate(current.getDate() + 1) // Tebliğ günü sayılmaz

  let sayilanGun = 0

  while (sayilanGun < gunSayisi) {
    // Adli tatil kontrolü
    if (sureTipi.adliTatilDurur && isAdliTatil(current)) {
      atlalanGunler.push({ tarih: new Date(current), sebep: 'Adli Tatil' })
      adliTatilVarMi = true
      current = addDays(current, 1)
      continue
    }

    if (!sureTipi.haftasonuSayilir) {
      // İş günü hesabı: hafta sonu ve resmi tatil sayılmaz
      if (isWeekend(current)) {
        atlalanGunler.push({ tarih: new Date(current), sebep: 'Hafta Sonu' })
        current = addDays(current, 1)
        continue
      }
      const tatilKontrol = isResmiiTatil(current)
      if (tatilKontrol.tatil) {
        atlalanGunler.push({ tarih: new Date(current), sebep: tatilKontrol.ad! })
        current = addDays(current, 1)
        continue
      }
    }

    sayilanGun++
    if (sayilanGun < gunSayisi) {
      current = addDays(current, 1)
    }
  }

  // Son gün hafta sonu veya resmi tatile denk gelirse sonraki iş gününe taşı
  const sonGunHaftaSoniMi = isWeekend(current)
  const resmiiTatilKontrol = isResmiiTatil(current)
  const sonGunResmiiTatilMi = resmiiTatilKontrol.tatil

  if (sonGunHaftaSoniMi || sonGunResmiiTatilMi) {
    while (isWeekend(current) || isResmiiTatil(current).tatil || (sureTipi.adliTatilDurur && isAdliTatil(current))) {
      current = addDays(current, 1)
    }
  }

  return {
    baslangicTarihi: baslangic,
    bitişTarihi: current,
    toplamGun: gunSayisi,
    atlalanGunler,
    adliTatilVarMi,
    sonGunHaftaSoniMi,
    sonGunResmiiTatilMi,
  }
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function SureHesaplayici() {
  const [tebligTarihi, setTebligTarihi] = useState('')
  const [seciliSureTipi, setSeciliSureTipi] = useState<SureTipi>(SURE_TIPLERI[0])
  const [ozelGun, setOzelGun] = useState(30)
  const [sonuc, setSonuc] = useState<HesapSonucu | null>(null)
  const [kopyalandi, setKopyalandi] = useState(false)

  const hesapla = useCallback(() => {
    if (!tebligTarihi) return
    const baslangic = parseISO(tebligTarihi)
    const result = hesaplaSure(baslangic, seciliSureTipi, ozelGun)
    setSonuc(result)
  }, [tebligTarihi, seciliSureTipi, ozelGun])

  const sifirla = () => {
    setTebligTarihi('')
    setSonuc(null)
  }

  const kopyala = () => {
    if (!sonuc) return
    const text = `Süre Hesaplama Sonucu\n` +
      `İşlem: ${seciliSureTipi.label} (${seciliSureTipi.kanun})\n` +
      `Tebliğ/Başlangıç: ${format(sonuc.baslangicTarihi, 'dd MMMM yyyy', { locale: tr })}\n` +
      `Son Gün: ${format(sonuc.bitişTarihi, 'dd MMMM yyyy EEEE', { locale: tr })}\n` +
      `Toplam Süre: ${sonuc.toplamGun} ${seciliSureTipi.haftasonuSayilir ? 'takvim günü' : 'iş günü'}`
    navigator.clipboard.writeText(text)
    setKopyalandi(true)
    setTimeout(() => setKopyalandi(false), 2000)
  }

  const gunKalanHesapla = () => {
    if (!sonuc) return null
    const bugun = new Date()
    bugun.setHours(0, 0, 0, 0)
    const diff = differenceInDays(sonuc.bitişTarihi, bugun)
    return diff
  }

  const kalanGun = sonuc ? gunKalanHesapla() : null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Açıklama Kartı */}
      <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-4 flex gap-3">
        <Info className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-violet-300/90">
          Tebliğ tarihini ve yasal işlem türünü seçin. Sistem; HMK, CMK ve İYUK hükümlerine göre hafta sonlarını,
          resmi tatilleri ve <strong>adli tatili (20 Temmuz – 31 Ağustos)</strong> otomatik olarak hesaba katar.
        </p>
      </div>

      {/* Form */}
      <div className="bg-card/50 border border-border/50 rounded-2xl p-6 space-y-5">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Calendar className="w-4 h-4 text-violet-400" />
          Hesaplama Parametreleri
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tebliğ Tarihi */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Tebliğ / Kararın Açıklandığı Tarih
            </label>
            <input
              type="date"
              value={tebligTarihi}
              onChange={e => setTebligTarihi(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
            />
            <p className="text-[11px] text-muted-foreground">Tebliğ günü süreye dahil edilmez (HMK m.92)</p>
          </div>

          {/* Süre Tipi */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              İşlem Türü / Yasal Süre
            </label>
            <div className="relative">
              <select
                value={seciliSureTipi.id}
                onChange={e => {
                  const tip = SURE_TIPLERI.find(t => t.id === e.target.value)
                  if (tip) setSeciliSureTipi(tip)
                  setSonuc(null)
                }}
                className="w-full h-11 pl-3 pr-8 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-colors appearance-none cursor-pointer"
              >
                {SURE_TIPLERI.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Özel gün seçiliyse göster */}
        {seciliSureTipi.id === 'ozel_gun' && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Gün Sayısı
            </label>
            <input
              type="number"
              min={1}
              max={3650}
              value={ozelGun}
              onChange={e => setOzelGun(parseInt(e.target.value) || 1)}
              className="w-full h-11 px-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
            />
          </div>
        )}

        {/* Seçili işlem hakkında bilgi */}
        <div className="bg-muted/30 rounded-xl p-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{seciliSureTipi.kanun}: </span>
          {seciliSureTipi.aciklama}
          <span className="ml-2 text-violet-400">
            ({seciliSureTipi.haftasonuSayilir ? 'Takvim günü' : 'İş günü'} ·
            {seciliSureTipi.adliTatilDurur ? ' Adli tatilde durur' : ' Adli tatil geçerli değil'})
          </span>
        </div>

        {/* Butonlar */}
        <div className="flex gap-3">
          <Button
            onClick={hesapla}
            disabled={!tebligTarihi}
            className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-violet-500/20"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Süreyi Hesapla
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
            {/* Ana Sonuç Kartı */}
            <div className={cn(
              'relative overflow-hidden rounded-2xl border p-6',
              kalanGun !== null && kalanGun < 0
                ? 'bg-red-500/10 border-red-500/30'
                : kalanGun !== null && kalanGun <= 3
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-emerald-500/10 border-emerald-500/30'
            )}>
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-10"
                style={{ background: kalanGun !== null && kalanGun < 0 ? '#ef4444' : kalanGun !== null && kalanGun <= 3 ? '#f59e0b' : '#10b981' }}
              />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Son Başvuru Günü</p>
                  <p className="text-4xl font-bold text-foreground tracking-tight">
                    {format(sonuc.bitişTarihi, 'dd MMMM yyyy', { locale: tr })}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(sonuc.bitişTarihi, 'EEEE', { locale: tr })}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  {kalanGun !== null && (
                    <div className={cn(
                      'px-4 py-2 rounded-xl text-center',
                      kalanGun < 0 ? 'bg-red-500/20' : kalanGun <= 3 ? 'bg-amber-500/20' : 'bg-emerald-500/20'
                    )}>
                      <p className={cn(
                        'text-3xl font-bold',
                        kalanGun < 0 ? 'text-red-400' : kalanGun <= 3 ? 'text-amber-400' : 'text-emerald-400'
                      )}>
                        {Math.abs(kalanGun)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {kalanGun < 0 ? 'gün geçti' : 'gün kaldı'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Uyarı mesajları */}
              {kalanGun !== null && kalanGun < 0 && (
                <div className="mt-4 flex items-center gap-2 text-red-400 text-sm font-medium">
                  <AlertTriangle className="w-4 h-4" />
                  SÜRE DOLMUŞTUR! Başvuru hakkı kaybedilmiş olabilir.
                </div>
              )}
              {kalanGun !== null && kalanGun >= 0 && kalanGun <= 3 && (
                <div className="mt-4 flex items-center gap-2 text-amber-400 text-sm font-medium">
                  <AlertTriangle className="w-4 h-4" />
                  DİKKAT: Son {kalanGun + 1} gün içindesiniz!
                </div>
              )}
              {kalanGun !== null && kalanGun > 3 && (
                <div className="mt-4 flex items-center gap-2 text-emerald-400 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Süre dolmamış.
                </div>
              )}

              <button
                onClick={kopyala}
                className="mt-4 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {kopyalandi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {kopyalandi ? 'Kopyalandı!' : 'Sonucu Kopyala'}
              </button>
            </div>

            {/* Detay Kartları */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'İşlem Türü', value: seciliSureTipi.kanun },
                { label: 'Süre', value: `${sonuc.toplamGun} ${seciliSureTipi.haftasonuSayilir ? 'takvim günü' : 'iş günü'}` },
                { label: 'Atlanan Gün', value: `${sonuc.atlalanGunler.length} gün` },
                { label: 'Adli Tatil', value: sonuc.adliTatilVarMi ? 'Uygulandı ✓' : 'Yok' },
              ].map(item => (
                <div key={item.label} className="bg-card/50 border border-border/50 rounded-xl p-3 text-center">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{item.label}</p>
                  <p className="text-sm font-semibold text-foreground mt-1">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Atlanan Günler (Detay) */}
            {sonuc.atlalanGunler.length > 0 && (
              <div className="bg-card/50 border border-border/50 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Süreye Dahil Edilmeyen Günler ({sonuc.atlalanGunler.length})
                </h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {sonuc.atlalanGunler.map((g, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-border/30 last:border-0">
                      <span className="text-muted-foreground">{format(g.tarih, 'dd MMMM yyyy EEEE', { locale: tr })}</span>
                      <span className={cn(
                        'px-2 py-0.5 rounded-full font-medium',
                        g.sebep === 'Adli Tatil' ? 'bg-violet-500/20 text-violet-400' :
                          g.sebep === 'Hafta Sonu' ? 'bg-slate-500/20 text-slate-400' :
                            'bg-amber-500/20 text-amber-400'
                      )}>
                        {g.sebep}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
