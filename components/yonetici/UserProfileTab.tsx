'use client'

import { useState, useEffect } from 'react'
import { 
  Building2, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  FileText, 
  Scale, 
  Save, 
  CheckCircle2, 
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Landmark
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { getLawyerProfile, saveLawyerProfile, LawyerProfile } from '@/lib/admin-store'

export default function UserProfileTab() {
  const [profile, setProfile] = useState<LawyerProfile>(getLawyerProfile())
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setProfile(getLawyerProfile())
  }, [])

  const handleChange = (key: keyof LawyerProfile, value: string) => {
    setProfile(prev => ({ ...prev, [key]: value }))
    setSavedSuccess(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 300))
    saveLawyerProfile(profile)
    setLoading(false)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 4000)
  }

  return (
    <div className="space-y-6">
      {/* ── Üst Önizleme Kartı (Avukat & Büro Kimliği) ── */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900/80 to-slate-950 border border-indigo-500/25 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 p-0.5 shadow-lg shadow-indigo-950 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-950/60 rounded-[14px] flex items-center justify-center text-white text-xl font-bold backdrop-blur-sm">
                <Scale className="w-8 h-8 text-indigo-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {profile.full_name || 'Avukat Adı'}
                </h2>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[11px] gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Yönetici
                </Badge>
              </div>
              <p className="text-sm text-indigo-200/90 font-medium mt-0.5">
                {profile.office_name || 'Hukuk Bürosu'} • <span className="text-slate-400">{profile.title}</span>
              </p>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <span>{profile.bar_association} (Sicil: #{profile.bar_number || '—'})</span>
                <span>•</span>
                <span>{profile.phone}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {savedSuccess && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Kaydedildi!
              </div>
            )}
            <Button
              form="lawyer-profile-form"
              type="submit"
              disabled={loading}
              className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950 h-10 px-5 font-semibold"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Kaydediliyor…' : 'Bilgileri Kaydet'}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Form Alanları ── */}
      <form id="lawyer-profile-form" onSubmit={handleSave} className="space-y-6">
        {/* Grup 1: Temel Mesleki ve Büro Bilgileri */}
        <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border/70 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/60">
            <User className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-foreground">Avukat & Büro Temel Bilgileri</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1.5">
                Avukat Adı Soyadı <span className="text-destructive">*</span>
              </label>
              <Input
                value={profile.full_name}
                onChange={e => handleChange('full_name', e.target.value)}
                placeholder="Örn: Av. Melih Kaya"
                className="h-10"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1.5">
                Hukuk Bürosu / Ofis Ünvanı
              </label>
              <Input
                value={profile.office_name}
                onChange={e => handleChange('office_name', e.target.value)}
                placeholder="Örn: Kaya Hukuk & Danışmanlık Bürosu"
                className="h-10"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1.5">
                Mesleki Ünvan / Pozisyon
              </label>
              <Input
                value={profile.title}
                onChange={e => handleChange('title', e.target.value)}
                placeholder="Örn: Kurucu & Yönetici Avukat"
                className="h-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1.5">
                Bağlı Olunan Baro
              </label>
              <Input
                value={profile.bar_association}
                onChange={e => handleChange('bar_association', e.target.value)}
                placeholder="Örn: İstanbul 1 No'lu Barosu"
                className="h-10"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1.5">
                Baro Sicil Numarası
              </label>
              <Input
                value={profile.bar_number}
                onChange={e => handleChange('bar_number', e.target.value)}
                placeholder="Örn: 48291"
                className="h-10"
              />
            </div>
          </div>
        </div>

        {/* Grup 2: İletişim ve Adres Bilgileri */}
        <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border/70 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/60">
            <Phone className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-foreground">İletişim & Ofis Adresi</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1.5">
                Telefon Numarası <span className="text-destructive">*</span>
              </label>
              <Input
                type="tel"
                value={profile.phone}
                onChange={e => handleChange('phone', e.target.value)}
                placeholder="Örn: +90 (532) 456 78 90"
                className="h-10"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1.5">
                E-posta Adresi <span className="text-destructive">*</span>
              </label>
              <Input
                type="email"
                value={profile.email}
                onChange={e => handleChange('email', e.target.value)}
                placeholder="Örn: avukat@hukuk.com"
                className="h-10"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground/80 block mb-1.5">
              Büro Açık Adresi (Tebligat ve Müvekkil Görüşmeleri)
            </label>
            <textarea
              value={profile.address}
              onChange={e => handleChange('address', e.target.value)}
              placeholder="Örn: Büyükdere Cad. Maya Plaza No:142 Kat:8 Levent / Beşiktaş / İstanbul"
              className="w-full min-h-[75px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              rows={2}
            />
          </div>
        </div>

        {/* Grup 3: Vergi & Finansal Bilgiler */}
        <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border/70 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/60">
            <Landmark className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-foreground">Vergi & Banka / IBAN Bilgileri</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1.5">
                T.C. Kimlik No / Vergi Kimlik No
              </label>
              <Input
                value={profile.tc_tax_number}
                onChange={e => handleChange('tc_tax_number', e.target.value)}
                placeholder="Örn: 28491029482"
                className="h-10 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground/80 block mb-1.5">
                Bağlı Olunan Vergi Dairesi
              </label>
              <Input
                value={profile.tax_office}
                onChange={e => handleChange('tax_office', e.target.value)}
                placeholder="Örn: Beyoğlu Vergi Dairesi"
                className="h-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="sm:col-span-1">
              <label className="text-xs font-semibold text-foreground/80 block mb-1.5">
                Banka Adı ve Şubesi
              </label>
              <Input
                value={profile.bank_name}
                onChange={e => handleChange('bank_name', e.target.value)}
                placeholder="Örn: Garanti BBVA - Levent Şb."
                className="h-10"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-foreground/80 block mb-1.5">
                Vekalet & Masraf Tahsilat IBAN Numarası
              </label>
              <Input
                value={profile.iban}
                onChange={e => handleChange('iban', e.target.value)}
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                className="h-10 font-mono font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground/80 block mb-1.5">
              Büro Çalışma Notları / Ek Bilgiler
            </label>
            <Input
              value={profile.notes || ''}
              onChange={e => handleChange('notes', e.target.value)}
              placeholder="Örn: Hafta içi 09:00 - 18:30 arası ofis açık, adliye günleri Salı ve Perşembe."
              className="h-10"
            />
          </div>
        </div>

        {/* Alt Butonlar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            disabled={loading}
            className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white h-11 px-7 font-bold shadow-lg shadow-indigo-950"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Kaydediliyor…' : 'Profil Bilgilerini Kaydet'}
          </Button>
        </div>
      </form>
    </div>
  )
}
