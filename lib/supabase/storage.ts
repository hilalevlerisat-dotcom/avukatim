import { createClient, isSupabaseConfigured } from './client'
import { formatFileSize } from '@/lib/constants'
import type { DocumentFileType } from '@/lib/database.types'

export { formatFileSize }
export const STORAGE_BUCKET = 'avukat-documents'

// In-memory browser cache for uploaded files (enables preview without Supabase backend)
const localBlobMap = new Map<string, { file: File; blobUrl: string }>()

// ── Yardımcı fonksiyonlar ─────────────────────────────────────────────────────

/** MIME type → storage file_type enum */
export function mimeToFileType(mime: string, filename: string): DocumentFileType {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'udf') return 'udf'
  if (ext === 'tiff' || ext === 'tif') return 'tiff'
  if (mime.startsWith('image/')) return 'image'
  if (mime === 'application/pdf') return 'pdf'
  if (mime.includes('word') || ext === 'docx' || ext === 'doc') return 'docx'
  if (mime.includes('sheet') || ext === 'xlsx' || ext === 'xls') return 'xlsx'
  return 'other'
}

/** Güvenli storage yolu oluşturur */
export function buildStoragePath(
  userId: string,
  clientId: string,
  caseId: string | null,
  originalName: string,
): string {
  const uid = crypto.randomUUID().replace(/-/g, '').slice(0, 12)
  const safe = originalName.replace(/[^a-zA-Z0-9._\-ğüşıöçĞÜŞİÖÇ]/g, '_')
  const segment = caseId ?? 'genel'
  return `${userId}/${clientId}/${segment}/${uid}_${safe}`
}

// ── Yükleme ───────────────────────────────────────────────────────────────────

export interface UploadResult {
  path: string
  error: string | null
}

/**
 * Tek bir dosyayı Supabase Storage'a (veya yerel Blob önbelleğine) yükler.
 * onProgress(0..100) — ilerleme bildirimi.
 */
export async function uploadFile(
  storagePath: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<UploadResult> {
  // Always register in local map so it can be previewed immediately in the UI
  if (typeof window !== 'undefined') {
    const blobUrl = URL.createObjectURL(file)
    localBlobMap.set(storagePath, { file, blobUrl })
  }

  onProgress?.(30)
  await new Promise(r => setTimeout(r, 120))
  onProgress?.(75)

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (!error && data) {
        onProgress?.(100)
        return { path: data.path, error: null }
      } else {
        return { path: storagePath, error: error?.message || 'Bilinmeyen Storage hatası' }
      }
    } catch (e: any) {
      console.warn('Supabase storage upload failed', e)
      return { path: storagePath, error: e.message || 'Storage bağlantı hatası' }
    }
  }
  onProgress?.(100)
  return { path: storagePath, error: null }
}

/** Çoklu dosya yükleme — her dosya için ayrı progress callback */
export async function uploadFiles(
  files: Array<{ storagePath: string; file: File }>,
  onFileProgress?: (index: number, pct: number) => void,
): Promise<UploadResult[]> {
  const results: UploadResult[] = []
  for (let i = 0; i < files.length; i++) {
    const { storagePath, file } = files[i]
    onFileProgress?.(i, 10)
    const result = await uploadFile(storagePath, file, (pct) =>
      onFileProgress?.(i, pct)
    )
    results.push(result)
  }
  return results
}

// ── İmzalı / Önizleme URL ─────────────────────────────────────────────────────

/** Önizleme için imzalı URL veya Blob URL üretir */
export async function getSignedUrl(
  storagePath: string,
  expiresIn = 3600,
): Promise<string | null> {
  // 1. Check local blob map first (for newly uploaded files)
  if (localBlobMap.has(storagePath)) {
    return localBlobMap.get(storagePath)!.blobUrl
  }

  // 2. Try Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(storagePath, expiresIn)
      if (!error && data?.signedUrl) {
        return data.signedUrl
      }
    } catch {
      // Fall through to sample mock creator
    }
  }

  // 3. Fallback for sample mock files (generates a valid previewable Blob)
  return createSampleMockFileUrl(storagePath)
}

/** İndirme için URL üretir */
export async function getDownloadUrl(storagePath: string): Promise<string | null> {
  return getSignedUrl(storagePath, 60)
}

// ── Silme ─────────────────────────────────────────────────────────────────────

export async function deleteFile(storagePath: string): Promise<boolean> {
  localBlobMap.delete(storagePath)
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient()
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([storagePath])
      return !error
    } catch {
      return true
    }
  }
  return true
}

// ── Mock Sample File Generator ───────────────────────────────────────────────

/** Generates realistic previewable blob URLs for default mock legal documents */
async function createSampleMockFileUrl(path: string): Promise<string | null> {
  if (typeof window === 'undefined') return null

  try {
    if (path.endsWith('.udf')) {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<content>
  <p align="center" style="font-size:16pt; font-weight:bold; color:#1e293b;">T.C.</p>
  <p align="center" style="font-size:14pt; font-weight:bold; color:#1e293b;">İSTANBUL 3. ASLİYE HUKUK MAHKEMESİ</p>
  <p align="center" style="font-size:13pt; font-weight:bold; color:#475569; margin-bottom:12px;">DURUŞMA TUTANAĞI</p>
  <table border="0" width="100%" style="font-size:11pt; margin-bottom:14px; border-bottom:1px solid #cbd5e1; padding-bottom:8px;">
    <tr><td><b>ESAS NO:</b> 2024/4521</td><td><b>CELSE NO:</b> 3</td></tr>
    <tr><td><b>CELSE TARİHİ:</b> 15/07/2026</td><td><b>CELSE SAATİ:</b> 11:00</td></tr>
    <tr><td><b>HÂKİM:</b> Canan YILDIZ (Sicil: 41829)</td><td><b>KÂTİP:</b> Emre ŞAHİN</td></tr>
  </table>
  <p style="margin-top:12px; line-height:1.6;">Belirli gün ve saatte celse açıldı. Davacı vekili Av. Melih Kaya geldi. Davalı Mehmet Yılmaz vekili Av. Serkan Aydın geldi. Açık duruşmaya devam olundu.</p>
  <p style="margin-top:8px; line-height:1.6;">Davacı vekili: <i>"Bilirkişi incelemesi talebimizi yineliyoruz, davalı tarafın itirazları haksızdır."</i> dedi.</p>
  <p style="margin-top:8px; line-height:1.6;">Davalı vekili: <i>"Açılan davayı kabul etmiyoruz, alacak zamanaşımına uğramıştır."</i> dedi.</p>
  <p style="margin-top:16px; font-weight:bold;">GEREĞİ DÜŞÜNÜLDÜ:</p>
  <p style="line-height:1.6;"><b>1-</b> Tarafların ticari defter ve banka kayıtları üzerinde re'sen seçilecek hesap bilirkişisi aracılığıyla inceleme yaptırılmasına,</p>
  <p style="line-height:1.6;"><b>2-</b> Bilirkişi ücreti olan 7.500 TL'nin davacı vekilince 2 haftalık kesin süre içerisinde mahkeme veznesine depo edilmesine,</p>
  <p style="line-height:1.6;"><b>3-</b> Bu nedenle duruşmanın <b>26 Eylül 2026 günü saat 10:30</b>'a bırakılmasına karar verildi. 15/07/2026</p>
  <div style="margin-top:30px; display:flex; justify-content:space-between;">
    <p><b>Kâtip</b><br/>Emre ŞAHİN</p>
    <p style="text-align:right;"><b>Hâkim</b><br/>Canan YILDIZ (41829)<br/><span style="font-size:9pt; color:#16a34a;">e-imzalıdır</span></p>
  </div>
</content>`
      zip.file('content.xml', sampleXml)
      zip.file('metadata.xml', `<metadata><court>İstanbul 3. Asliye Hukuk</court><caseNumber>2024/4521</caseNumber></metadata>`)
      const blob = await zip.generateAsync({ type: 'blob' })
      return URL.createObjectURL(blob)
    }

    if (path.endsWith('.pdf')) {
      // Create a clean demo PDF data URI / Blob
      const samplePdfText = `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000098 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF`
      const blob = new Blob([samplePdfText], { type: 'application/pdf' })
      return URL.createObjectURL(blob)
    }

    if (path.endsWith('.png') || path.endsWith('.jpg')) {
      const canvas = document.createElement('canvas')
      canvas.width = 600
      canvas.height = 400
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#f8fafc'
        ctx.fillRect(0, 0, 600, 400)
        ctx.fillStyle = '#0f172a'
        ctx.font = 'bold 20px sans-serif'
        ctx.fillText('BELGE ÖNİZLEME (SENET SURETİ)', 40, 60)
        ctx.strokeStyle = '#cbd5e1'
        ctx.strokeRect(30, 80, 540, 280)
        ctx.font = '14px sans-serif'
        ctx.fillStyle = '#475569'
        ctx.fillText('Tanzim Tarihi: 15.03.2024', 50, 120)
        ctx.fillText('Ödeme Günü: 01.08.2024', 50, 150)
        ctx.fillText('Bedel: 120.000,00 TL', 50, 180)
        ctx.fillText('Borçlu: Ad Soyad / Ünvan', 50, 210)
        ctx.fillText('Alacaklı: Ad Soyad / Ünvan', 50, 240)
        ctx.fillStyle = '#0284c7'
        ctx.fillText('✓ Banka Tahsil Şerhi Mevcuttur', 50, 280)
      }
      return canvas.toDataURL('image/png')
    }
  } catch (err) {
    console.error('Error generating mock preview file', err)
  }
  return null
}
