'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  ShieldCheck,
  HelpCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { login } from '@/lib/auth'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!username.trim() || !password.trim()) {
      setError('Lütfen kullanıcı adı ve şifrenizi girin.')
      return
    }

    setLoading(true)
    // Small artificial delay for smooth UX transition
    await new Promise(r => setTimeout(r, 450))

    const res = await login(username, password)
    if (res.success) {
      setSuccess(true)
      await new Promise(r => setTimeout(r, 600))
      router.push('/')
      router.refresh()
    } else {
      setError(res.error || 'Giriş başarısız.')
      setLoading(false)
    }
  }



  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-950 p-4 sm:p-6 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* ── Ambient Background Lighting Effects ────────────────── */}
      <div className="absolute top-[-15%] left-[-10%] w-[550px] h-[550px] rounded-full bg-indigo-600/20 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/20 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-blue-600/10 blur-[160px] pointer-events-none" />

      {/* Decorative Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* ── Center Login Card ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-[440px] relative z-10"
      >
        <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-6 sm:p-8 shadow-2xl text-slate-100 relative overflow-hidden">
          
          {/* Subtle top card glow line */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/80 to-transparent" />

          {/* Logo & Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="relative inline-flex items-center justify-center mb-4">
              <div className="absolute inset-0 rounded-full bg-indigo-500/25 blur-2xl animate-pulse" />
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-950/70 p-2.5 flex items-center justify-center shadow-2xl shadow-indigo-950/60 border border-indigo-500/30 ring-4 ring-indigo-500/10">
                <Image
                  src="/logo.png"
                  alt="Avukat Asistanı Logo"
                  width={88}
                  height={88}
                  className="w-full h-full object-contain filter drop-shadow-[0_4px_16px_rgba(99,102,241,0.6)]"
                  priority
                />
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-1">
              <h1 className="text-2xl font-bold tracking-tight text-white">Avukat Asistanı</h1>
              <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px] px-1.5 py-0 font-semibold tracking-wide">
                PRO
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Dava, müvekkil ve finans yönetim sistemi
            </p>
          </div>


          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -6 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -6 }}
                className="mb-4 overflow-hidden"
              >
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-snug">{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>


          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Kullanıcı Adı veya E-posta
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input
                  id="username-input"
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  disabled={loading || success}
                  autoComplete="username"
                  autoFocus
                  className="pl-10 h-11 text-sm bg-slate-950/60 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">
                  Şifre
                </label>
                <button
                  type="button"
                  onClick={() => setError('Şifre sıfırlama işlemi için sistem yöneticinizle iletişime geçin.')}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Şifremi unuttum
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading || success}
                  autoComplete="current-password"
                  className="pl-10 pr-10 h-11 text-sm bg-slate-950/60 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded transition-colors"
                  title={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-400 hover:text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950/80 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 transition-colors cursor-pointer"
                />
                <span>Beni hatırla</span>
              </label>
              <span className="text-[11px] text-slate-500 font-mono">v1.0.0</span>
            </div>

            {/* Submit Button */}
            <Button
              id="login-submit-btn"
              type="submit"
              disabled={loading || success}
              className={cn(
                "w-full h-11 rounded-xl text-sm font-semibold transition-all duration-300 mt-2 shadow-lg",
                success 
                  ? "bg-emerald-600 text-white shadow-emerald-500/25" 
                  : "bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40"
              )}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Giriş yapılıyor…</span>
                </div>
              ) : success ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Giriş başarılı! Yönlendiriliyorsunuz…</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Giriş Yap</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              )}
            </Button>
          </form>

          {/* Security & KVKK Badge */}
          <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>256-Bit SSL Güvenli Bağlantı • KVKK Uyumlu</span>
          </div>

        </div>
      </motion.div>
    </div>
  )
}
